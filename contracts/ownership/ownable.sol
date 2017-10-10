pragma solidity ^0.4.15;

contract ownable {

    address public owner;

    modifier onlyOwner {
        require(isOwner(msg.sender));
        _;
    }

    function ownable() {
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) onlyOwner {
        owner = _newOwner;
    }

    function isOwner(address _address) public constant returns (bool) {
        return owner == _address;
    }
}
