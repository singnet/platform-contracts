pragma solidity ^0.4.18;

import "../../contracts/tokens/SingularityNetToken.sol";

contract SingularityNetTokenMock is SingularityNetToken {

    function SingularityNetTokenMock( address owner, uint256 supply) {  
        balances[owner] = supply;
    }

}