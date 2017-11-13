pragma solidity ^0.4.15;

import '../tokens/SingularityNetToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ReentrancyGuard.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/crowdsale/RefundVault.sol';


/**
 * @title AgiCrowdsale
 * @dev AgiCrowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract AgiCrowdsale is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public cap;
    uint256 public goal;
    uint256 public rate;

    address public wallet;
    RefundVault public vault;
    SingularityNetToken public token;

    uint256 public startTime;
    uint256 public endTime;

    bool public isFinalized = false;
    uint256 public weiRaised;

    struct Contributor {
        bool status;
        uint256 tier;
        uint256 contributedAmount;
    }

    mapping(address => Contributor) public whitelist;
    
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event TokenRelease(address indexed beneficiary, uint256 amount);
    event TokenRefund(address indexed refundee, uint256 amount);

    event Finalized();

    function AgiCrowdsale(
        address _token, 
        address _wallet,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        uint256 _cap,
        uint256 _goal
    ) {
        require(_startTime >= getBlockTimestamp());
        require(_endTime >= _startTime);
        require(_rate > 0);
        require(_goal > 0);
        require(_cap > 0);
        require(_wallet != 0x0);

        vault = new RefundVault(_wallet);
        token = SingularityNetToken(_token);
        wallet = _wallet;
        startTime = _startTime;
        endTime = _endTime;
        rate = _rate;
        goal = _goal;
        cap = _cap;
    }

    // fallback function can be used to buy tokens
    function () payable {
        buyTokens(msg.sender);
    }

    //low level function to buy tokens
    function buyTokens(address beneficiary) payable {
        require(beneficiary != 0x0);
        require(whitelist[beneficiary].status);
        require(validPurchase());

        //derive amount in wei to buy 
        uint256 weiAmount = msg.value;
        //check if there is enough funds 
        uint256 remainingToFund = cap.sub(weiRaised);
        if (weiAmount > remainingToFund) {
            weiAmount = remainingToFund;
        }
        uint256 weiToReturn = msg.value.sub(weiAmount);
        //derive how many tokens
        uint256 tokens = weiAmount.mul(rate);
        //update the state of weiRaised
        weiRaised = weiRaised.add(weiAmount);

       //Forward funs to the vault 
        forwardFunds();
        //refund if the contribution exceed the cap
        if (weiToReturn > 0) {
            beneficiary.transfer(weiToReturn);
            TokenRefund(beneficiary,weiToReturn);
        }

        //update whitelist contributed amount
        whitelist[beneficiary].contributedAmount += weiAmount;
        
        //Trigger the event of TokenPurchase
        TokenPurchase(
            msg.sender,
            beneficiary,
            weiAmount,
            tokens
        ); 
        token.transferTokens(beneficiary,tokens);
        
    }

    // contributors can claim refund if the goal is not reached
    function claimRefund() nonReentrant external {
        require(isFinalized);
        require(!goalReached());
        vault.refund(msg.sender);
    }

    //in case of endTime before the reach of the cap, the owner can claim the unsold tokens
    function claimUnsold() onlyOwner {
        require(endTime <= getBlockTimestamp());
        uint256 unsold = token.balanceOf(this);

        if (unsold > 0) {
            require(token.transfer(msg.sender, unsold));
        }
    }

    // add to whitelist array of addresses
    function updateWhitelist( address[] addresses, uint256 tier, bool status ) public onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            address contributorAddress = addresses[i];
            require(whitelist[contributorAddress].contributedAmount == 0);
            whitelist[contributorAddress] = Contributor(status,tier,0);
        }
    }

    function finalize() onlyOwner {
        require(!isFinalized);
        require(hasEnded());

        if (goalReached()) {
            //Close the vault
            vault.close();
            //Unpause the token 
            token.unpause();
        } else {
            //else enable refunds
            vault.enableRefunds();
        }
        //update the sate of isFinalized
        isFinalized = true;
        //trigger and emit the event of finalization
        Finalized();
    } 

    // send ether to the fund collection wallet, the vault in this case
    function forwardFunds() internal {
        vault.deposit.value(msg.value)(msg.sender);
    }

    // @return true if crowdsale event has ended or cap reached
    function hasEnded() public constant returns (bool) {
        bool capReached = weiRaised >= cap;
        bool passedEndTime = getBlockTimestamp() > endTime;
        return passedEndTime || capReached;
    }

    function goalReached() public constant returns (bool) {
        return weiRaised >= goal;
    }

    function isWhitelisted(address contributor) public constant returns (bool) {
        return whitelist[contributor].status;
    }

    // @return true if the transaction can buy tokens
    function validPurchase() internal constant returns (bool) {
        bool withinPeriod = getBlockTimestamp() >= startTime && getBlockTimestamp() <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        bool withinCap = weiRaised.add(msg.value) <= cap;
        return withinPeriod && withinCap && nonZeroPurchase;
    }

    function getBlockTimestamp() internal constant returns (uint256) {
        return block.timestamp;
    }
}