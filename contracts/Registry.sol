pragma solidity ^0.6.0;

import "@openzeppelin/contracts/introspection/ERC165.sol";
import "./IRegistry.sol";

contract Registry is IRegistry, ERC165 {

    struct OrganizationRegistration {
        bytes32 organizationId;
        bytes orgMetadataURI;
        address owner;

        // member indexing note:
        // case (members[someAddress]) of
        //   0 -> not a member of this org
        //   n -> member of this org, and memberKeys[n-1] == someAddress
        address[] memberKeys;
        mapping(address => uint) members;

        bytes32[] serviceKeys;
        mapping(bytes32 => ServiceRegistration) servicesById;

        uint globalOrgIndex;
    }

    struct ServiceRegistration {
        bytes32 serviceId;
        bytes   metadataURI;   //Service metadata. metadataURI should contain information for data consistency 
                               //validation (for example hash). We support: IPFS URI.

        uint orgServiceIndex;
    }

    bytes32[] orgKeys;
    mapping(bytes32 => OrganizationRegistration) orgsById;

    constructor ()
    public
    {
        //ERC165: https://eips.ethereum.org/EIPS/eip-165
        _registerInterface(0x3f2242ea);

    }


    /**
      * @dev Guard function that forces a revert if the tx sender is unauthorized.
      *      Always authorizes org owner. Can also authorize org members.
      *
      * @param membersAllowed if true, revert when sender is non-owner and non-member, else revert when sender is non-owner
      */
    function requireAuthorization(bytes32 orgId, bool membersAllowed) internal view {
        require(msg.sender == orgsById[orgId].owner || (membersAllowed && orgsById[orgId].members[msg.sender] > 0)
            , "unauthorized invocation");
    }

    /**
      * @dev Guard function that forces a revert if the referenced org does not meet an existence criteria.
      *
      * @param exists if true, revert when org does not exist, else revert when org exists
      */
    function requireOrgExistenceConstraint(bytes32 orgId, bool exists) internal view {
        if (exists) {
            require(orgsById[orgId].organizationId != bytes32(0x0), "org does not exist");
        } else {
            require(orgsById[orgId].organizationId == bytes32(0x0), "org already exists");
        }
    }

    /**
      * @dev Guard function that forces a revert if the referenced service does not meet an existence criteria.
      *
      * @param exists if true, revert when service does not exist, else revert when service exists
      */
    function requireServiceExistenceConstraint(bytes32 orgId, bytes32 serviceId, bool exists) internal view {
        if (exists) {
            require(orgsById[orgId].servicesById[serviceId].serviceId != bytes32(0x0), "service does not exist");
        } else {
            require(orgsById[orgId].servicesById[serviceId].serviceId == bytes32(0x0), "service already exists");
        }
    }

    //    ___                        _          _   _                   __  __                 _
    //   / _ \ _ __ __ _  __ _ _ __ (_)______ _| |_(_) ___  _ __       |  \/  | __ _ _ __ ___ | |_
    //  | | | | '__/ _` |/ _` | '_ \| |_  / _` | __| |/ _ \| '_ \      | |\/| |/ _` | '_ ` _ \| __|
    //  | |_| | | | (_| | (_| | | | | |/ / (_| | |_| | (_) | | | |     | |  | | (_| | | | | | | |_
    //   \___/|_|  \__, |\__,_|_| |_|_/___\__,_|\__|_|\___/|_| |_|     |_|  |_|\__, |_| |_| |_|\__|
    //             |___/                                                       |___/

    function createOrganization(bytes32 orgId, bytes calldata orgMetadataURI, address[] calldata members) external override {

        requireOrgExistenceConstraint(orgId, false);

        OrganizationRegistration memory organization;
        orgsById[orgId] = organization;
        orgsById[orgId].organizationId = orgId;
        orgsById[orgId].orgMetadataURI = orgMetadataURI;
        orgsById[orgId].owner = msg.sender;
        orgsById[orgId].globalOrgIndex = orgKeys.length;
        orgKeys.push(orgId);

        addOrganizationMembersInternal(orgId, members);

        emit OrganizationCreated(orgId);
    }

    function changeOrganizationOwner(bytes32 orgId, address newOwner) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, false);

        orgsById[orgId].owner = newOwner;

        emit OrganizationModified(orgId);
    }

    function changeOrganizationMetadataURI(bytes32 orgId, bytes calldata orgMetadataURI) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, false);

        orgsById[orgId].orgMetadataURI = orgMetadataURI;

        emit OrganizationModified(orgId);
    }

    function addOrganizationMembers(bytes32 orgId, address[] calldata newMembers) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);

        addOrganizationMembersInternal(orgId, newMembers);

        emit OrganizationModified(orgId);
    }

    function addOrganizationMembersInternal(bytes32 orgId, address[] memory newMembers) internal {
        for (uint i = 0; i < newMembers.length; i++) {
            if (orgsById[orgId].members[newMembers[i]] == 0) {
                orgsById[orgId].memberKeys.push(newMembers[i]);
                orgsById[orgId].members[newMembers[i]] = orgsById[orgId].memberKeys.length;
            }
        }
    }

    function removeOrganizationMembers(bytes32 orgId, address[] calldata existingMembers) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);

        for (uint i = 0; i < existingMembers.length; i++) {
            removeOrganizationMemberInternal(orgId, existingMembers[i]);
        }

        emit OrganizationModified(orgId);
    }

    function removeOrganizationMemberInternal(bytes32 orgId, address existingMember) internal {
        // see "member indexing note"
        if (orgsById[orgId].members[existingMember] != 0) {
            uint storedIndexToRemove = orgsById[orgId].members[existingMember];
            address memberToMove = orgsById[orgId].memberKeys[orgsById[orgId].memberKeys.length - 1];

            // no-op if we are deleting the last entry
            if (orgsById[orgId].memberKeys[storedIndexToRemove - 1] != memberToMove) {
                // swap lut entries
                orgsById[orgId].memberKeys[storedIndexToRemove - 1] = memberToMove;
                orgsById[orgId].members[memberToMove] = storedIndexToRemove;
            }

            // shorten keys array
            orgsById[orgId].memberKeys.pop();

            // delete the mapping entry
            delete orgsById[orgId].members[existingMember];
        }
    }

    function deleteOrganization(bytes32 orgId) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, false);

        for (uint serviceIndex = orgsById[orgId].serviceKeys.length; serviceIndex > 0; serviceIndex--) {
            deleteServiceRegistrationInternal(orgId, orgsById[orgId].serviceKeys[serviceIndex-1]);
        }

        for (uint memberIndex = orgsById[orgId].memberKeys.length; memberIndex > 0; memberIndex--) {
            removeOrganizationMemberInternal(orgId, orgsById[orgId].memberKeys[memberIndex-1]);
        }

        // swap lut entries
        uint    indexToUpdate = orgsById[orgId].globalOrgIndex;
        bytes32 orgToUpdate   = orgKeys[orgKeys.length-1];

        if (orgKeys[indexToUpdate] != orgToUpdate) {
            orgKeys[indexToUpdate] = orgToUpdate;
            orgsById[orgToUpdate].globalOrgIndex = indexToUpdate;
        }

        // shorten keys array
        orgKeys.pop();

        // delete contents of organization registration
        delete orgsById[orgId];

        emit OrganizationDeleted(orgId);
    }

    //   ____                  _                __  __                 _
    //  / ___|  ___ _ ____   ___) ___ ___      |  \/  | __ _ _ __ ___ | |_
    //  \___ \ / _ \ '__\ \ / / |/ __/ _ \     | |\/| |/ _` | '_ ` _ \| __|
    //   ___) |  __/ |   \ V /| | (__  __/     | |  | | (_| | | | | | | |_
    //  |____/ \___|_|    \_/ |_|\___\___|     |_|  |_|\__, |_| |_| |_|\__|
    //                                                 |___/

    function createServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes calldata metadataURI) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, false);

        ServiceRegistration memory service;
        service.serviceId     = serviceId;
        service.metadataURI     = metadataURI;
        service.orgServiceIndex = orgsById[orgId].serviceKeys.length;
        orgsById[orgId].servicesById[serviceId] = service;
        orgsById[orgId].serviceKeys.push(serviceId);

        emit ServiceCreated(orgId, serviceId, metadataURI);
    }

    function updateServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes calldata metadataURI) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, true);

        orgsById[orgId].servicesById[serviceId].metadataURI = metadataURI;

        emit ServiceMetadataModified(orgId, serviceId, metadataURI);
    }

    function deleteServiceRegistration(bytes32 orgId, bytes32 serviceId) external override {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, true);

        deleteServiceRegistrationInternal(orgId, serviceId);

        emit ServiceDeleted(orgId, serviceId);
    }

    function deleteServiceRegistrationInternal(bytes32 orgId, bytes32 serviceId) internal {

        // swap lut entries
        uint    indexToUpdate   = orgsById[orgId].servicesById[serviceId].orgServiceIndex;
        bytes32 serviceToUpdate = orgsById[orgId].serviceKeys[orgsById[orgId].serviceKeys.length-1];

        if (orgsById[orgId].serviceKeys[indexToUpdate] != serviceToUpdate) {
            orgsById[orgId].serviceKeys[indexToUpdate] = serviceToUpdate;
            orgsById[orgId].servicesById[serviceToUpdate].orgServiceIndex = indexToUpdate;
        }

        orgsById[orgId].serviceKeys.pop();

        // delete contents of service registration
        delete orgsById[orgId].servicesById[serviceId];
    }

    //    ____      _   _
    //   / ___| ___| |_| |_ ___ _ __ ___
    //  | |  _ / _ \ __| __/ _ \ '__/ __|
    //  | |_| |  __/ |_| |_  __/ |  \__ \
    //   \____|\___|\__|\__\___|_|  |___/
    //

    function listOrganizations() external override view returns (bytes32[] memory orgIds) {
        return orgKeys;
    }

    function getOrganizationById(bytes32 orgId) external override view
            returns(bool found, bytes32 id, bytes memory orgMetadataURI, address owner, address[] memory members, bytes32[] memory serviceIds) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
        } 
        else {
            found = true;
            id = orgsById[orgId].organizationId;
            orgMetadataURI = orgsById[orgId].orgMetadataURI;
            owner = orgsById[orgId].owner;
            members = orgsById[orgId].memberKeys;
            serviceIds = orgsById[orgId].serviceKeys;
        }


    }

    function listServicesForOrganization(bytes32 orgId) external override view returns (bool found, bytes32[] memory serviceIds) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
        }
        else {
            found = true;
            serviceIds = orgsById[orgId].serviceKeys;
        }
    }

    function getServiceRegistrationById(bytes32 orgId, bytes32 serviceId) external override view
            returns (bool found, bytes32 id, bytes memory metadataURI) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
        } 
        else if(orgsById[orgId].servicesById[serviceId].serviceId == bytes32(0x0)) {
            // check to see if this repo exists
            found = false;
        }
        else {
            found        = true;
            id           = orgsById[orgId].servicesById[serviceId].serviceId;
            metadataURI  = orgsById[orgId].servicesById[serviceId].metadataURI;
        }

    }

    // ERC165: https://eips.ethereum.org/EIPS/eip-165
    //function supportsInterface(bytes4 interfaceID) external view returns (bool) {
    //    return
    //        interfaceID == this.supportsInterface.selector || // ERC165
    //        interfaceID == 0x3f2242ea; // IRegistry
    //}
}
