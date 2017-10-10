pragma solidity ^0.4.15;

import './tokens/SingularityNetToken.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import "zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol";
import 'zeppelin-solidity/contracts/token/MintableToken.sol';


/**
 * @title SampleCrowdsaleToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a crowdsale contract.
 */
contract AgiToken is MintableToken {

    string public constant NAME = "Artificial General Intelligence token";
    string public constant SYMBOL = "AGI";
    uint8 public constant DECIMALS = 18;

}

contract AgiCrowdsale is CappedCrowdsale, RefundableCrowdsale {

    function AgiCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _goal, uint256 _cap, address _wallet)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    RefundableCrowdsale(_goal)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        //As goal needs to be met for a successful crowdsale
        //the value needs to less or equal than a cap which is limit for accepted funds
        require(_goal <= _cap);
    }
    
    function createTokenContract() internal returns (MintableToken) {
        return new AgiToken();
    }

}
