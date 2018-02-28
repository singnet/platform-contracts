pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../tokens/SingularityNetToken.sol";


contract Market {
    using SafeMath
    for uint256;

    SingularityNetToken public token;
    address public owner;
    // amount of AGI at stake
    uint256 public pool = 0;
    // supply of MintedToken 
    uint256 public totalSupply = 0;
    // next price multiplier in AGI for minting next token
    uint256 public nextPrice = 1 * (10 ** 8);

    //Balances of MintedToken
    mapping(address => uint256) public balances;

    function Market(address _token) public {
        owner = msg.sender;
        token = SingularityNetToken(_token);
    }

    function ask() public {
        // We want to add 1 AGI. Use cogs instead?
        require(token.transferFrom(msg.sender, address(this), nextPrice));
        pool = pool.add(nextPrice);
        //Minting 
        uint256 mintedToken = 1;
        balances[msg.sender] = mintedToken;
        totalSupply = totalSupply.add(mintedToken);
        //Update the rate 
        nextPrice = nextPrice.add(1 * (10 ** 8));
    }

    function claimFunds() {
        require(owner == msg.sender);
        token.transfer(owner, token.balanceOf(address(this)));
    }

}