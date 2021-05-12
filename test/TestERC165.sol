pragma solidity >=0.4.22 <0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

// Picked ERC165Checker Library from OpenZeppelin Code
import "./ERC165Checker.sol";

contract TestERC165 {
    bytes4 constant InvalidID   = 0xffffffff;
    bytes4 constant ERC165ID    = 0x01ffc9a7;
    bytes4 constant RegistryID  = 0x3f2242ea;

    using ERC165Checker for *;

    function testRegistrySupportsERC165AndIRegistry() public {

        bool registrySupportsRegistryID = ERC165Checker.supportsInterface(DeployedAddresses.Registry(), RegistryID);
        
        Assert.equal(registrySupportsRegistryID, true , "Registry should support ERC165 and implement RegistryID");
    }
}
