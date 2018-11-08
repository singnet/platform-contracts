pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";


/**
 * Tests that our interfaces support our published interface IDs from solidity, using the functions published in the
 * erc165 spec.
 *
 * TODO: Use openzeppelin-solidity doesContractImplementInterface function if they ever merge our PR for this.
 *       https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1086
 */
contract TestERC165 {
    bytes4 constant InvalidID   = 0xffffffff;
    bytes4 constant ERC165ID    = 0x01ffc9a7;
    bytes4 constant RegistryID  = 0x256b3545;

    // adapted from https://eips.ethereum.org/EIPS/eip-165
    function doesContractImplementInterface(address _contract, bytes4 _interfaceId) internal view returns (bool) {
        uint256 success;
        uint256 result;

        (success, result) = noThrowCall(_contract, ERC165ID);
        if ((success==0)||(result==0)) {
            return false;
        }

        (success, result) = noThrowCall(_contract, InvalidID);
        if ((success==0)||(result!=0)) {
            return false;
        }

        (success, result) = noThrowCall(_contract, _interfaceId);
        if ((success==1)&&(result==1)) {
            return true;
        }
        return false;
    }

    // adapted from https://eips.ethereum.org/EIPS/eip-165
    function noThrowCall(address _contract, bytes4 _interfaceId) internal view returns (uint256 success, uint256 result) {
        bytes4 erc165ID = ERC165ID;

        assembly {
            let x := mload(0x40)               // Find empty storage location using "free memory pointer"
            mstore(x, erc165ID)                // Place signature at begining of empty storage
            mstore(add(x, 0x04), _interfaceId) // Place first argument directly next to signature

            success := staticcall(
                30000,         // 30k gas
                _contract,     // To addr
                x,             // Inputs are stored at location x
                0x20,          // Inputs are 32 bytes long
                x,             // Store output over input (saves space)
                0x20           // Outputs are 32 bytes long
            )

            result := mload(x)                 // Load the result
        }
    }

    function testRegistrySupportsERC165AndIRegistry() public {
        bool registrySupportsRegistryID = doesContractImplementInterface(DeployedAddresses.Registry(), RegistryID);
        
        Assert.equal(registrySupportsRegistryID, true , "Registry should support ERC165 and implement RegistryID");
    }
}
