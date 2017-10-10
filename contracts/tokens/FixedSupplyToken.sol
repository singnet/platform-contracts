pragma solidity ^0.4.15;

import "./ERC20.sol";
import "../ownership/ownable.sol";

contract FixedSupplyToken is ERC20, ownable {
    uint8 public constant decimals = 18;
    uint256 _totalSupply = 1000000;
    address public owner;
  
    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;


    function FixedSupplyToken() {
        balances[owner] = _totalSupply;
    }

    function totalSupply() constant returns (uint) {
        return _totalSupply;
    }

    function balanceOf(address _owner) constant returns (uint) {
        return balances[_owner];
    }

    function transfer(address _to, uint _amount) returns (bool) {
        if (balances[msg.sender] < _amount && _amount < 0 && balances[_to] + _amount < balances[_to]) {
            return false;
        }

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        Transfer(msg.sender, _to, _amount);
        return true;
    }

  function transferFrom(address _from, address _to, uint256 _amount) returns (bool success) {
      if (balances[_from] < _amount && allowed[_from][msg.sender] < _amount && _amount < 0 && balances[_to] + _amount < balances[_to]) {
          return false;
      }

      balances[_from] -= _amount;
      allowed[_from][msg.sender] -= _amount;
      balances[_to] += _amount;
      Transfer(_from, _to, _amount);
      return true;
  }

  function approve(address _spender, uint _amount) returns (bool) {
      allowed[msg.sender][_spender] = _amount;
      Approval(msg.sender, _spender, _amount);

      return true;
  }

  function allowance(address _owner, address _spender) constant returns (uint) {
      return allowed[_owner][_spender];
  }
}