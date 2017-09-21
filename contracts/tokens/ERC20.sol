
pragma solidity ^0.4.11;

contract ERC20 {
	function totalSupply() constant returns (uint);
	function balanceOf(address _owner) constant returns (uint);
	function allowance(address _owner, address _spender) constant returns (uint);
	function transfer(address _to, uint _amount) returns (bool);
	function transferFrom(address _from, address _to, uint _amount) returns (bool);
	function approve(address _spender, uint _amount) returns (bool);

	event Approval(address indexed owner, address indexed spender, uint amount);
	event Transfer(address indexed from, address indexed to, uint amount);
}