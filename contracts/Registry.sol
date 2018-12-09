pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/introspection/ERC165.sol";
import "./IRegistry.sol";

contract Registry is IRegistry, ERC165 {

    struct OrganizationRegistration {
        bytes32 organizationId;
        bytes32 organizationName;
        address owner;

        // member indexing note:
        // case (members[someAddress]) of
        //   0 -> not a member of this org
        //   n -> member of this org, and memberKeys[n-1] == someAddress
        address[] memberKeys;
        mapping(address => uint) members;

        bytes32[] serviceKeys;
        bytes32[] typeRepoKeys;
        mapping(bytes32 => ServiceRegistration) servicesById;
        mapping(bytes32 => TypeRepositoryRegistration) typeReposById;

        uint globalOrgIndex;
    }

    struct ServiceRegistration {
        bytes32 serviceId;
        bytes   metadataURI;   //Service metadata. metadataURI should contain information for data consistency 
                               //validation (for example hash). We support: IPFS URI.
        bytes32[] tags;
        mapping(bytes32 => Tag) tagsByName;

        uint orgServiceIndex;
    }

    struct TypeRepositoryRegistration {
        bytes32 repositoryId;
        bytes   repositoryURI;

        bytes32[] tags;
        mapping(bytes32 => Tag) tagsByName;

        uint orgTypeRepoIndex;
    }

    struct Tag {
        bytes32 tagName;
        uint itemTagIndex;
        uint globalTagIndex;
    }

    struct ServiceOrTypeRepositoryList {
        bool valid;
        bytes32[] orgIds;
        bytes32[] itemNames;
    }

    bytes32[] orgKeys;
    mapping(bytes32 => OrganizationRegistration) orgsById;

    bytes32[] serviceTags;
    bytes32[] typeRepoTags;
    mapping(bytes32 => ServiceOrTypeRepositoryList) servicesByTag;
    mapping(bytes32 => ServiceOrTypeRepositoryList) typeReposByTag;

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

    /**
      * @dev Guard function that forces a revert if the referenced type repository does not meet an existence criteria.
      *
      * @param exists if true, revert when type repo does not exist, else revert when type repo exists
      */
    function requireTypeRepositoryExistenceConstraint(bytes32 orgId, bytes32 repositoryId, bool exists) internal view {
        if (exists) {
            require(orgsById[orgId].typeReposById[repositoryId].repositoryId != bytes32(0x0), "type repo does not exist");
        } else {
            require(orgsById[orgId].typeReposById[repositoryId].repositoryId == bytes32(0x0), "type repo already exists");
        }
    }

    //    ___                        _          _   _                   __  __                 _
    //   / _ \ _ __ __ _  __ _ _ __ (_)______ _| |_(_) ___  _ __       |  \/  | __ _ _ __ ___ | |_
    //  | | | | '__/ _` |/ _` | '_ \| |_  / _` | __| |/ _ \| '_ \      | |\/| |/ _` | '_ ` _ \| __|
    //  | |_| | | | (_| | (_| | | | | |/ / (_| | |_| | (_) | | | |     | |  | | (_| | | | | | | |_
    //   \___/|_|  \__, |\__,_|_| |_|_/___\__,_|\__|_|\___/|_| |_|     |_|  |_|\__, |_| |_| |_|\__|
    //             |___/                                                       |___/

    function createOrganization(bytes32 orgId, bytes32 orgName, address[] members) external {

        requireOrgExistenceConstraint(orgId, false);

        OrganizationRegistration memory organization;
        orgsById[orgId] = organization;
        orgsById[orgId].organizationId = orgId;
        orgsById[orgId].organizationName = orgName;
        orgsById[orgId].owner = msg.sender;
        orgsById[orgId].globalOrgIndex = orgKeys.length;
        orgKeys.push(orgId);

        addOrganizationMembersInternal(orgId, members);

        emit OrganizationCreated(orgId);
    }

    function changeOrganizationOwner(bytes32 orgId, address newOwner) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, false);

        orgsById[orgId].owner = newOwner;

        emit OrganizationModified(orgId);
    }

    function changeOrganizationName(bytes32 orgId, bytes32 orgName) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, false);

        orgsById[orgId].organizationName = orgName;

        emit OrganizationModified(orgId);
    }

    function addOrganizationMembers(bytes32 orgId, address[] newMembers) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);

        addOrganizationMembersInternal(orgId, newMembers);

        emit OrganizationModified(orgId);
    }

    function addOrganizationMembersInternal(bytes32 orgId, address[] newMembers) internal {
        for (uint i = 0; i < newMembers.length; i++) {
            if (orgsById[orgId].members[newMembers[i]] == 0) {
                orgsById[orgId].memberKeys.push(newMembers[i]);
                orgsById[orgId].members[newMembers[i]] = orgsById[orgId].memberKeys.length;
            }
        }
    }

    function removeOrganizationMembers(bytes32 orgId, address[] existingMembers) external {

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
            orgsById[orgId].memberKeys.length--;

            // delete the mapping entry
            delete orgsById[orgId].members[existingMember];
        }
    }

    function deleteOrganization(bytes32 orgId) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, false);

        for (uint serviceIndex = orgsById[orgId].serviceKeys.length; serviceIndex > 0; serviceIndex--) {
            deleteServiceRegistrationInternal(orgId, orgsById[orgId].serviceKeys[serviceIndex-1]);
        }

        for (uint repoIndex = orgsById[orgId].typeRepoKeys.length; repoIndex > 0; repoIndex--) {
            deleteTypeRepositoryRegistrationInternal(orgId, orgsById[orgId].typeRepoKeys[repoIndex-1]);
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
        orgKeys.length--;

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

    function createServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes metadataURI, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, false);

        ServiceRegistration memory service;
        service.serviceId     = serviceId;
        service.metadataURI     = metadataURI;
        service.orgServiceIndex = orgsById[orgId].serviceKeys.length;
        orgsById[orgId].servicesById[serviceId] = service;
        orgsById[orgId].serviceKeys.push(serviceId);

        for (uint i = 0; i < tags.length; i++) {
            addTagToServiceRegistration(orgId, serviceId, tags[i]);
        }

        emit ServiceCreated(orgId, serviceId, metadataURI);
    }

    function updateServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes metadataURI) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, true);

        orgsById[orgId].servicesById[serviceId].metadataURI = metadataURI;

        emit ServiceMetadataModified(orgId, serviceId, metadataURI);
    }

    function addTagsToServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, true);

        for (uint i = 0; i < tags.length; i++) {
            addTagToServiceRegistration(orgId, serviceId, tags[i]);
        }

        emit ServiceTagsModified(orgId, serviceId);
    }

    function addTagToServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes32 tagName) internal {

        // no-op if tag already exists
        if (orgsById[orgId].servicesById[serviceId].tagsByName[tagName].tagName == bytes32(0x0)) {
            // add the tag to the service level tag index
            Tag memory tagObj;
            orgsById[orgId].servicesById[serviceId].tagsByName[tagName] = tagObj;
            orgsById[orgId].servicesById[serviceId].tagsByName[tagName].tagName = tagName;
            orgsById[orgId].servicesById[serviceId].tagsByName[tagName].itemTagIndex = orgsById[orgId].servicesById[serviceId].tags.length;
            orgsById[orgId].servicesById[serviceId].tagsByName[tagName].globalTagIndex = servicesByTag[tagName].orgIds.length;
            orgsById[orgId].servicesById[serviceId].tags.push(tagName);

            // add the service to the global tag index creating a list object for this tag if it does not already exist
            if (!servicesByTag[tagName].valid) {
                ServiceOrTypeRepositoryList memory listObj;
                listObj.valid = true;
                servicesByTag[tagName] = listObj;
                serviceTags.push(tagName);
            }

            servicesByTag[tagName].orgIds.push(orgId);
            servicesByTag[tagName].itemNames.push(serviceId);
        }
    }

    function removeTagsFromServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, true);

        for (uint i = 0; i < tags.length; i++) {
            removeTagFromServiceRegistration(orgId, serviceId, tags[i]);
        }

        emit ServiceTagsModified(orgId, serviceId);
    }

    function removeTagFromServiceRegistration(bytes32 orgId, bytes32 serviceId, bytes32 tagName) internal {

        // no-op if tag does not exist
        if (orgsById[orgId].servicesById[serviceId].tagsByName[tagName].tagName != bytes32(0x0)) {

            // swap service registration lut entries
            uint tagIndexToReplace = orgsById[orgId].servicesById[serviceId].tagsByName[tagName].itemTagIndex;
            bytes32 tagNameToMove = orgsById[orgId].servicesById[serviceId].tags[orgsById[orgId].servicesById[serviceId].tags.length-1];

            // no-op if we are deleting the last item
            if (tagIndexToReplace != orgsById[orgId].servicesById[serviceId].tags.length-1) {
                orgsById[orgId].servicesById[serviceId].tags[tagIndexToReplace] = tagNameToMove;
                orgsById[orgId].servicesById[serviceId].tagsByName[tagNameToMove].itemTagIndex = tagIndexToReplace;
            }

            orgsById[orgId].servicesById[serviceId].tags.length--;

            // swap global tag index lut entries
            tagIndexToReplace = orgsById[orgId].servicesById[serviceId].tagsByName[tagName].globalTagIndex;
            uint tagIndexToMove = servicesByTag[tagName].orgIds.length-1;

            // no-op if we are deleting the last item
            if (tagIndexToMove != tagIndexToReplace) {
                bytes32 orgIdToMove  = servicesByTag[tagName].orgIds[tagIndexToMove];
                bytes32 itemNameToMove = servicesByTag[tagName].itemNames[tagIndexToMove];

                servicesByTag[tagName].orgIds[tagIndexToReplace] = orgIdToMove;
                servicesByTag[tagName].itemNames[tagIndexToReplace] = itemNameToMove;

                orgsById[orgIdToMove].servicesById[itemNameToMove].tagsByName[tagName].globalTagIndex = tagIndexToReplace;
            }

            servicesByTag[tagName].orgIds.length--;
            servicesByTag[tagName].itemNames.length--;

            // delete contents of the tag entry
            delete orgsById[orgId].servicesById[serviceId].tagsByName[tagName];
        }
    }

    function deleteServiceRegistration(bytes32 orgId, bytes32 serviceId) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireServiceExistenceConstraint(orgId, serviceId, true);

        deleteServiceRegistrationInternal(orgId, serviceId);

        emit ServiceDeleted(orgId, serviceId);
    }

    function deleteServiceRegistrationInternal(bytes32 orgId, bytes32 serviceId) internal {
        // delete the tags associated with the service
        for (uint i = orgsById[orgId].servicesById[serviceId].tags.length; i > 0; i--) {
            removeTagFromServiceRegistration(orgId, serviceId, orgsById[orgId].servicesById[serviceId].tags[i-1]);
        }

        // swap lut entries
        uint    indexToUpdate   = orgsById[orgId].servicesById[serviceId].orgServiceIndex;
        bytes32 serviceToUpdate = orgsById[orgId].serviceKeys[orgsById[orgId].serviceKeys.length-1];

        if (orgsById[orgId].serviceKeys[indexToUpdate] != serviceToUpdate) {
            orgsById[orgId].serviceKeys[indexToUpdate] = serviceToUpdate;
            orgsById[orgId].servicesById[serviceToUpdate].orgServiceIndex = indexToUpdate;
        }

        orgsById[orgId].serviceKeys.length--;

        // delete contents of service registration
        delete orgsById[orgId].servicesById[serviceId];
    }

    //   _____                        ____                        __  __                 _
    //  |_   _|   _ _ __   ___       |  _ \ ___ _ __   ___       |  \/  | __ _ _ __ ___ | |_
    //    | || | | | '_ \ / _ \      | |_) / _ \ '_ \ / _ \      | |\/| |/ _` | '_ ` _ \| __|
    //    | || |_| | |_) |  __/      |  _ <  __/ |_) | (_) |     | |  | | (_| | | | | | | |_
    //    |_| \__, | .__/ \___|      |_| \_\___| .__/ \___/      |_|  |_|\__, |_| |_| |_|\__|
    //        |___/|_|                         |_|                       |___/

    function createTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId,
            bytes repositoryURI, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireTypeRepositoryExistenceConstraint(orgId, repositoryId, false);

        TypeRepositoryRegistration memory typeRepo;
        orgsById[orgId].typeReposById[repositoryId] = typeRepo;
        orgsById[orgId].typeReposById[repositoryId].repositoryId = repositoryId;
        orgsById[orgId].typeReposById[repositoryId].repositoryURI = repositoryURI;
        orgsById[orgId].typeReposById[repositoryId].orgTypeRepoIndex = orgsById[orgId].typeRepoKeys.length;
        orgsById[orgId].typeRepoKeys.push(repositoryId);

        for (uint i = 0; i < tags.length; i++) {
            addTagToTypeRepositoryRegistration(orgId, repositoryId, tags[i]);
        }

        emit TypeRepositoryCreated(orgId, repositoryId);
    }

    function updateTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId,
        bytes repositoryURI) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireTypeRepositoryExistenceConstraint(orgId, repositoryId, true);

        orgsById[orgId].typeReposById[repositoryId].repositoryURI = repositoryURI;

        emit TypeRepositoryModified(orgId, repositoryId);
    }

    function addTagsToTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireTypeRepositoryExistenceConstraint(orgId, repositoryId, true);

        for (uint i = 0; i < tags.length; i++) {
            addTagToTypeRepositoryRegistration(orgId, repositoryId, tags[i]);
        }

        emit TypeRepositoryModified(orgId, repositoryId);
    }

    function addTagToTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId, bytes32 tagName) internal {

        // no-op if tag already exists
        if (orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].tagName == bytes32(0x0)) {
            // add the tag to the type repository level tag index
            Tag memory tagObj;
            orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName] = tagObj;
            orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].tagName = tagName;
            orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].itemTagIndex = orgsById[orgId].typeReposById[repositoryId].tags.length;
            orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].globalTagIndex = typeReposByTag[tagName].orgIds.length;
            orgsById[orgId].typeReposById[repositoryId].tags.push(tagName);

            // add the type repository to the global tag index creating a list object for this tag if it does not already exist
            if (!typeReposByTag[tagName].valid) {
                ServiceOrTypeRepositoryList memory listObj;
                listObj.valid = true;
                typeReposByTag[tagName] = listObj;
                typeRepoTags.push(tagName);
            }
            typeReposByTag[tagName].orgIds.push(orgId);
            typeReposByTag[tagName].itemNames.push(repositoryId);
        }
    }

    function removeTagsFromTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireTypeRepositoryExistenceConstraint(orgId, repositoryId, true);

        for (uint i = 0; i < tags.length; i++) {
            removeTagFromTypeRepositoryRegistration(orgId, repositoryId, tags[i]);
        }

        emit TypeRepositoryModified(orgId, repositoryId);
    }

    function removeTagFromTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId, bytes32 tagName) internal {

        // no-op if tag doesnt exist
        if (orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].tagName != bytes32(0x0)) {

            // swap type repository registration lut entries
            uint tagIndexToReplace = orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].itemTagIndex;
            bytes32 tagNameToMove = orgsById[orgId].typeReposById[repositoryId].tags[orgsById[orgId].typeReposById[repositoryId].tags.length-1];

            // no-op if we are deleting the last item
            if (tagIndexToReplace != orgsById[orgId].typeReposById[repositoryId].tags.length-1) {

                orgsById[orgId].typeReposById[repositoryId].tags[tagIndexToReplace] = tagNameToMove;
                orgsById[orgId].typeReposById[repositoryId].tagsByName[tagNameToMove].itemTagIndex = tagIndexToReplace;
            }

            orgsById[orgId].typeReposById[repositoryId].tags.length--;

            // swap global tag index lut entries
            tagIndexToReplace = orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName].globalTagIndex;
            uint tagIndexToMove = typeReposByTag[tagName].orgIds.length-1;

            // no-op if we are deleting the last item
            if (tagIndexToMove != tagIndexToReplace) {
                bytes32 orgIdToMove  = typeReposByTag[tagName].orgIds[tagIndexToMove];
                bytes32 repoNameToMove = typeReposByTag[tagName].itemNames[tagIndexToMove];

                typeReposByTag[tagName].orgIds[tagIndexToReplace]  = orgIdToMove;
                typeReposByTag[tagName].itemNames[tagIndexToReplace] = repoNameToMove;

                orgsById[orgIdToMove].typeReposById[repoNameToMove].tagsByName[tagName].globalTagIndex = tagIndexToReplace;
            }

            typeReposByTag[tagName].orgIds.length--;
            typeReposByTag[tagName].itemNames.length--;

            // delete contents of the tag entry
            delete orgsById[orgId].typeReposById[repositoryId].tagsByName[tagName];
        }
    }

    function deleteTypeRepositoryRegistration(bytes32 orgId, bytes32 repositoryId) external {

        requireOrgExistenceConstraint(orgId, true);
        requireAuthorization(orgId, true);
        requireTypeRepositoryExistenceConstraint(orgId, repositoryId, true);

        deleteTypeRepositoryRegistrationInternal(orgId, repositoryId);

        emit TypeRepositoryDeleted(orgId, repositoryId);
    }

    function deleteTypeRepositoryRegistrationInternal(bytes32 orgId, bytes32 repositoryId) internal {

        // delete the tags associated with the type repo
        for (uint i = orgsById[orgId].typeReposById[repositoryId].tags.length; i > 0; i--) {
            removeTagFromTypeRepositoryRegistration(orgId, repositoryId, orgsById[orgId].typeReposById[repositoryId].tags[i-1]);
        }

        // swap lut entries
        uint    indexToUpdate    = orgsById[orgId].typeReposById[repositoryId].orgTypeRepoIndex;
        bytes32 typeRepoToUpdate = orgsById[orgId].typeRepoKeys[orgsById[orgId].typeRepoKeys.length-1];

        // no-op if we are deleting the last item
        if (orgsById[orgId].typeRepoKeys[indexToUpdate] != typeRepoToUpdate) {
            orgsById[orgId].typeRepoKeys[indexToUpdate] = typeRepoToUpdate;
            orgsById[orgId].typeReposById[typeRepoToUpdate].orgTypeRepoIndex = indexToUpdate;
        }

        orgsById[orgId].typeRepoKeys.length--;

        // delete contents of repo registration
        delete orgsById[orgId].typeReposById[repositoryId];
    }

    //    ____      _   _
    //   / ___| ___| |_| |_ ___ _ __ ___
    //  | |  _ / _ \ __| __/ _ \ '__/ __|
    //  | |_| |  __/ |_| |_  __/ |  \__ \
    //   \____|\___|\__|\__\___|_|  |___/
    //

    function listOrganizations() external view returns (bytes32[] orgIds) {
        return orgKeys;
    }

    function getOrganizationById(bytes32 orgId) external view
            returns(bool found, bytes32 id, bytes32 name, address owner, address[] members, bytes32[] serviceIds, bytes32[] repositoryIds) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        id = orgsById[orgId].organizationId;
        name = orgsById[orgId].organizationName;
        owner = orgsById[orgId].owner;
        members = orgsById[orgId].memberKeys;
        serviceIds = orgsById[orgId].serviceKeys;
        repositoryIds = orgsById[orgId].typeRepoKeys;
    }

    function listServicesForOrganization(bytes32 orgId) external view returns (bool found, bytes32[] serviceIds) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        serviceIds = orgsById[orgId].serviceKeys;
    }

    function getServiceRegistrationById(bytes32 orgId, bytes32 serviceId) external view
            returns (bool found, bytes32 id, bytes metadataURI, bytes32[] tags) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
            return;
        }

        // check to see if this repo exists
        if(orgsById[orgId].servicesById[serviceId].serviceId == bytes32(0x0)) {
            found = false;
            return;
        }

        found        = true;
        id           = orgsById[orgId].servicesById[serviceId].serviceId;
        metadataURI  = orgsById[orgId].servicesById[serviceId].metadataURI;
        tags         = orgsById[orgId].servicesById[serviceId].tags;
    }

    function listTypeRepositoriesForOrganization(bytes32 orgId) external view returns (bool found, bytes32[] repositoryIds) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        repositoryIds = orgsById[orgId].typeRepoKeys;
    }

    function getTypeRepositoryById(bytes32 orgId, bytes32 repositoryId) external view
            returns (bool found, bytes32 id, bytes repositoryURI, bytes32[] tags) {

        // check to see if this organization exists
        if(orgsById[orgId].organizationId == bytes32(0x0)) {
            found = false;
            return;
        }

        // check to see if this repo exists
        if(orgsById[orgId].typeReposById[repositoryId].repositoryId == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        id = repositoryId;
        repositoryURI = orgsById[orgId].typeReposById[repositoryId].repositoryURI;
        tags = orgsById[orgId].typeReposById[repositoryId].tags;
    }

    function listServiceTags() external view returns (bytes32[] tags) {
        return serviceTags;
    }

    function listServicesForTag(bytes32 tag) external view returns (bytes32[] orgIds, bytes32[] serviceIds) {
        orgIds = servicesByTag[tag].orgIds;
        serviceIds = servicesByTag[tag].itemNames;
    }

    function listTypeRepositoryTags() external view returns (bytes32[] tags) {
        return typeRepoTags;
    }

    function listTypeRepositoriesForTag(bytes32 tag) external view returns (bytes32[] orgIds, bytes32[] repositoryIds) {
        orgIds = typeReposByTag[tag].orgIds;
        repositoryIds = typeReposByTag[tag].itemNames;
    }

    // ERC165: https://eips.ethereum.org/EIPS/eip-165
    function supportsInterface(bytes4 interfaceID) external view returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // ERC165
            interfaceID == 0x7bb95e18; // IRegistry
    }
}
