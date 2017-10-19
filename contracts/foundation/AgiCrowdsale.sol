pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ReentrancyGuard.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/RefundVault.sol';

/**
 * @title AgiCrowdsale
 * @dev Built on top OpenZeppelin
 */
contract AgiCrowdsale is Ownable, ReentrancyGuard {
	using SafeMath for uint256;

	mapping (address => uint256) public allocations;
	mapping (address => bool) public whitelist;

	uint256 public cap;
	uint256 public goal;
	uint256 public rate;
	
	StandardToken public token;
	
	RefundVault public vault;

	uint256 public startTime;
	uint256 public endTime;

	address public wallet;
	
	bool public isFinalized = false;
	uint256 public weiRaised;


	event TokenBuy(address indexed buyer, address indexed beneficiary, uint256 value, uint256 amount);
	event TokenRelease(address indexed beneficiary, uint256 amount);

	event Finalized();

	function AgiCrowdsale(address _token, uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _cap, uint256 _goal, address _wallet) {
		require(_startTime >= getBlockTimestamp());
		require(_endTime >= _startTime);
		require(_rate > 0);
		require(_cap > 0);
		require(_wallet != 0x0);
		require(_goal > 0);

		vault = new RefundVault(_wallet);
		wallet = _wallet;
		token = StandardToken(_token);
		startTime = _startTime;
		endTime = _endTime;
		rate = _rate;
		cap = _cap;
		goal = _goal;
	}

	// fallback function 
	function() payable {
		purchaseTokens(msg.sender);
	}

	// low level token purchase function
	// caution: tokens must be redeemed by beneficiary address
	function purchaseTokens(address beneficiary) payable {
		require(whitelist[beneficiary]);
		require(beneficiary != 0x0);
		require(validPurchase());
		// calculate token amount to be purchased
		uint256 weiAmount = msg.value;
		uint256 tokens = weiAmount.mul(rate);


		// update state
		weiRaised = weiRaised.add(weiAmount);

		// allocate tokens to buyer
		allocations[beneficiary] = tokens;

		TokenBuy(msg.sender, beneficiary, weiAmount, tokens);

		forwardFunds();
	}

	// redeem tokens
	function claimTokens() {
		require(isFinalized);
		require(goalReached());

		// confirm there are tokens remaining
		uint256 amount = token.balanceOf(this);
		require(amount > 0);

		// send tokens to buyer
		uint256 tokens = allocations[msg.sender];
		allocations[msg.sender] = 0;
		require(token.transfer(msg.sender, tokens));

		TokenRelease(msg.sender, tokens);
	}

	// redeem tokens (admin fallback)
	function sendTokens(address beneficiary) onlyOwner {
		require(isFinalized);
		require(goalReached());

		// confirm there are tokens remaining
		uint256 amount = token.balanceOf(this);
		require(amount > 0);

		// send tokens to buyer
		uint256 tokens = allocations[beneficiary];
		allocations[beneficiary] = 0;
		require(token.transfer(beneficiary, tokens));

		TokenRelease(beneficiary, tokens);
	}


	// add to whitelist array of addresses
	function addWhitelist(address[] _addresses) public onlyOwner {
		for (uint256 i = 0; i < _addresses.length; i++) {
			address contributorAddress = _addresses[i];
			whitelist[contributorAddress] = true;
		}
	}

	// remove from whitelist array of addresses 
	function removeWhitelist(address[] _addresses) public onlyOwner {
		for (uint256 i = 0; i < _addresses.length; i++) {
			address contributorAddress = _addresses[i];
			whitelist[contributorAddress] = false;
		}
	}

	// send ether to vault until the sale ends
	function forwardFunds() internal {
		vault.deposit.value(msg.value)(msg.sender);
	}

	// @return true if the transaction can buy tokens
	function validPurchase() internal constant returns (bool) {
		bool withinCap = weiRaised.add(msg.value) <= cap;
		bool withinPeriod = getBlockTimestamp() >= startTime && getBlockTimestamp() <= endTime;
		bool nonZeroPurchase = msg.value != 0;
		return withinPeriod && nonZeroPurchase && withinCap;
	}

	// @return true if crowdsale event has ended or cap reached
	function hasEnded() public constant returns (bool) {
		bool capReached = weiRaised >= cap;
		bool passedEndTime = getBlockTimestamp() > endTime;
		return passedEndTime || capReached;
	}

	function getBlockTimestamp() internal constant returns (uint256) {
		return block.timestamp;
	}

	// if crowdsale is unsuccessful, contributors can claim refunds here
	function claimRefund() nonReentrant external {
		require(isFinalized);
		require(!goalReached());

		vault.refund(msg.sender);
	}

	function goalReached() public constant returns (bool) {
		return weiRaised >= goal;
	}

	// @dev does not require that crowdsale `hasEnded()` to leave safegaurd
	// in place if ETH rises in price too much during crowdsale.
	// Allows team to close early if cap is exceeded in USD in this event.
	function finalize() onlyOwner {
		require(!isFinalized);

		if (goalReached()) {
			vault.close();
		} else {
			vault.enableRefunds();
		}

		Finalized();

		isFinalized = true;
	}

	function unsoldCleanUp() onlyOwner {
		uint256 amount = token.balanceOf(this);
		
		if (amount > 0) {
			require(token.transfer(msg.sender, amount));
		}

	}
}
