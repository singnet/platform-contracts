pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/introspection/ERC165.sol";
import "./IRegistry.sol";

contract Registry is IRegistry, ERC165 {

    struct OrganizationRegistration {
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
        mapping(bytes32 => ServiceRegistration) servicesByName;
        mapping(bytes32 => TypeRepositoryRegistration) typeReposByName;

        uint globalOrgIndex;
    }

    struct ServiceRegistration {
        bytes32 serviceName;
        bytes   metadataURI;   //Service metadata. metadataURI should contain information for data consistency 
                               //validation (for example hash). We support: IPFS URI.
        bytes32[] tags;
        mapping(bytes32 => Tag) tagsByName;

        uint orgServiceIndex;
    }

    struct TypeRepositoryRegistration {
        bytes32 repositoryName;
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
        bytes32[] orgNames;
        bytes32[] itemNames;
    }

    bytes32[] orgKeys;
    mapping(bytes32 => OrganizationRegistration) orgsByName;

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
    function requireAuthorization(bytes32 orgName, bool membersAllowed) internal view {
        require(msg.sender == orgsByName[orgName].owner || (membersAllowed && orgsByName[orgName].members[msg.sender] > 0)
            , "unauthorized invocation");
    }

    /**
      * @dev Guard function that forces a revert if the referenced org does not meet an existence criteria.
      *
      * @param exists if true, revert when org does not exist, else revert when org exists
      */
    function requireOrgExistenceConstraint(bytes32 orgName, bool exists) internal view {
        if (exists) {
            require(orgsByName[orgName].organizationName != bytes32(0x0), "org does not exist");
        } else {
            require(orgsByName[orgName].organizationName == bytes32(0x0), "org already exists");
        }
    }

    /**
      * @dev Guard function that forces a revert if the referenced service does not meet an existence criteria.
      *
      * @param exists if true, revert when service does not exist, else revert when service exists
      */
    function requireServiceExistenceConstraint(bytes32 orgName, bytes32 serviceName, bool exists) internal view {
        if (exists) {
            require(orgsByName[orgName].servicesByName[serviceName].serviceName != bytes32(0x0), "service does not exist");
        } else {
            require(orgsByName[orgName].servicesByName[serviceName].serviceName == bytes32(0x0), "service already exists");
        }
    }

    /**
      * @dev Guard function that forces a revert if the referenced type repository does not meet an existence criteria.
      *
      * @param exists if true, revert when type repo does not exist, else revert when type repo exists
      */
    function requireTypeRepositoryExistenceConstraint(bytes32 orgName, bytes32 repositoryName, bool exists) internal view {
        if (exists) {
            require(orgsByName[orgName].typeReposByName[repositoryName].repositoryName != bytes32(0x0), "type repo does not exist");
        } else {
            require(orgsByName[orgName].typeReposByName[repositoryName].repositoryName == bytes32(0x0), "type repo already exists");
        }
    }

    //    ___                        _          _   _                   __  __                 _
    //   / _ \ _ __ __ _  __ _ _ __ (_)______ _| |_(_) ___  _ __       |  \/  | __ _ _ __ ___ | |_
    //  | | | | '__/ _` |/ _` | '_ \| |_  / _` | __| |/ _ \| '_ \      | |\/| |/ _` | '_ ` _ \| __|
    //  | |_| | | | (_| | (_| | | | | |/ / (_| | |_| | (_) | | | |     | |  | | (_| | | | | | | |_
    //   \___/|_|  \__, |\__,_|_| |_|_/___\__,_|\__|_|\___/|_| |_|     |_|  |_|\__, |_| |_| |_|\__|
    //             |___/                                                       |___/

    function createOrganization(bytes32 orgName, address[] members) external {

        requireOrgExistenceConstraint(orgName, false);

        OrganizationRegistration memory organization;
        orgsByName[orgName] = organization;
        orgsByName[orgName].organizationName = orgName;
        orgsByName[orgName].owner = msg.sender;
        orgsByName[orgName].globalOrgIndex = orgKeys.length;
        orgKeys.push(orgName);

        addOrganizationMembersInternal(orgName, members);

        emit OrganizationCreated(orgName);
    }

    function changeOrganizationOwner(bytes32 orgName, address newOwner) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, false);

        orgsByName[orgName].owner = newOwner;

        emit OrganizationModified(orgName);
    }

    function addOrganizationMembers(bytes32 orgName, address[] newMembers) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);

        addOrganizationMembersInternal(orgName, newMembers);

        emit OrganizationModified(orgName);
    }

    function addOrganizationMembersInternal(bytes32 orgName, address[] newMembers) internal {
        for (uint i = 0; i < newMembers.length; i++) {
            if (orgsByName[orgName].members[newMembers[i]] == 0) {
                orgsByName[orgName].memberKeys.push(newMembers[i]);
                orgsByName[orgName].members[newMembers[i]] = orgsByName[orgName].memberKeys.length;
            }
        }
    }

    function removeOrganizationMembers(bytes32 orgName, address[] existingMembers) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);

        for (uint i = 0; i < existingMembers.length; i++) {
            removeOrganizationMemberInternal(orgName, existingMembers[i]);
        }

        emit OrganizationModified(orgName);
    }

    function removeOrganizationMemberInternal(bytes32 orgName, address existingMember) internal {
        // see "member indexing note"
        if (orgsByName[orgName].members[existingMember] != 0) {
            uint storedIndexToRemove = orgsByName[orgName].members[existingMember];
            address memberToMove = orgsByName[orgName].memberKeys[orgsByName[orgName].memberKeys.length - 1];

            // no-op if we are deleting the last entry
            if (orgsByName[orgName].memberKeys[storedIndexToRemove - 1] != memberToMove) {
                // swap lut entries
                orgsByName[orgName].memberKeys[storedIndexToRemove - 1] = memberToMove;
                orgsByName[orgName].members[memberToMove] = storedIndexToRemove;
            }

            // shorten keys array
            orgsByName[orgName].memberKeys.length--;

            // delete the mapping entry
            delete orgsByName[orgName].members[existingMember];
        }
    }

    function deleteOrganization(bytes32 orgName) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, false);

        for (uint serviceIndex = orgsByName[orgName].serviceKeys.length; serviceIndex > 0; serviceIndex--) {
            deleteServiceRegistrationInternal(orgName, orgsByName[orgName].serviceKeys[serviceIndex-1]);
        }

        for (uint repoIndex = orgsByName[orgName].typeRepoKeys.length; repoIndex > 0; repoIndex--) {
            deleteTypeRepositoryRegistrationInternal(orgName, orgsByName[orgName].typeRepoKeys[repoIndex-1]);
        }

        for (uint memberIndex = orgsByName[orgName].memberKeys.length; memberIndex > 0; memberIndex--) {
            removeOrganizationMemberInternal(orgName, orgsByName[orgName].memberKeys[memberIndex-1]);
        }

        // swap lut entries
        uint    indexToUpdate = orgsByName[orgName].globalOrgIndex;
        bytes32 orgToUpdate   = orgKeys[orgKeys.length-1];

        if (orgKeys[indexToUpdate] != orgToUpdate) {
            orgKeys[indexToUpdate] = orgToUpdate;
            orgsByName[orgToUpdate].globalOrgIndex = indexToUpdate;
        }

        // shorten keys array
        orgKeys.length--;

        // delete contents of organization registration
        delete orgsByName[orgName];

        emit OrganizationDeleted(orgName);
    }

    //   ____                  _                __  __                 _
    //  / ___|  ___ _ ____   ___) ___ ___      |  \/  | __ _ _ __ ___ | |_
    //  \___ \ / _ \ '__\ \ / / |/ __/ _ \     | |\/| |/ _` | '_ ` _ \| __|
    //   ___) |  __/ |   \ V /| | (__  __/     | |  | | (_| | | | | | | |_
    //  |____/ \___|_|    \_/ |_|\___\___|     |_|  |_|\__, |_| |_| |_|\__|
    //                                                 |___/

    function createServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes metadataURI, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireServiceExistenceConstraint(orgName, serviceName, false);

        ServiceRegistration memory service;
        service.serviceName     = serviceName;
        service.metadataURI     = metadataURI;
        service.orgServiceIndex = orgsByName[orgName].serviceKeys.length;
        orgsByName[orgName].servicesByName[serviceName] = service;
        orgsByName[orgName].serviceKeys.push(serviceName);

        for (uint i = 0; i < tags.length; i++) {
            addTagToServiceRegistration(orgName, serviceName, tags[i]);
        }

        emit ServiceCreated(orgName, serviceName, metadataURI);
    }

    function updateServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes metadataURI) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireServiceExistenceConstraint(orgName, serviceName, true);

        orgsByName[orgName].servicesByName[serviceName].metadataURI = metadataURI;

        emit ServiceMetadataModified(orgName, serviceName, metadataURI);
    }

    function addTagsToServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireServiceExistenceConstraint(orgName, serviceName, true);

        for (uint i = 0; i < tags.length; i++) {
            addTagToServiceRegistration(orgName, serviceName, tags[i]);
        }

        emit ServiceTagsModified(orgName, serviceName);
    }

    function addTagToServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 tagName) internal {

        // no-op if tag already exists
        if (orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].tagName == bytes32(0x0)) {
            // add the tag to the service level tag index
            Tag memory tagObj;
            orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName] = tagObj;
            orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].tagName = tagName;
            orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].itemTagIndex = orgsByName[orgName].servicesByName[serviceName].tags.length;
            orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].globalTagIndex = servicesByTag[tagName].orgNames.length;
            orgsByName[orgName].servicesByName[serviceName].tags.push(tagName);

            // add the service to the global tag index creating a list object for this tag if it does not already exist
            if (!servicesByTag[tagName].valid) {
                ServiceOrTypeRepositoryList memory listObj;
                listObj.valid = true;
                servicesByTag[tagName] = listObj;
                serviceTags.push(tagName);
            }

            servicesByTag[tagName].orgNames.push(orgName);
            servicesByTag[tagName].itemNames.push(serviceName);
        }
    }

    function removeTagsFromServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireServiceExistenceConstraint(orgName, serviceName, true);

        for (uint i = 0; i < tags.length; i++) {
            removeTagFromServiceRegistration(orgName, serviceName, tags[i]);
        }

        emit ServiceTagsModified(orgName, serviceName);
    }

    function removeTagFromServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 tagName) internal {

        // no-op if tag does not exist
        if (orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].tagName != bytes32(0x0)) {

            // swap service registration lut entries
            uint tagIndexToReplace = orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].itemTagIndex;
            bytes32 tagNameToMove = orgsByName[orgName].servicesByName[serviceName].tags[orgsByName[orgName].servicesByName[serviceName].tags.length-1];

            // no-op if we are deleting the last item
            if (tagIndexToReplace != orgsByName[orgName].servicesByName[serviceName].tags.length-1) {
                orgsByName[orgName].servicesByName[serviceName].tags[tagIndexToReplace] = tagNameToMove;
                orgsByName[orgName].servicesByName[serviceName].tagsByName[tagNameToMove].itemTagIndex = tagIndexToReplace;
            }

            orgsByName[orgName].servicesByName[serviceName].tags.length--;

            // swap global tag index lut entries
            tagIndexToReplace = orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].globalTagIndex;
            uint tagIndexToMove = servicesByTag[tagName].orgNames.length-1;

            // no-op if we are deleting the last item
            if (tagIndexToMove != tagIndexToReplace) {
                bytes32 orgNameToMove  = servicesByTag[tagName].orgNames[tagIndexToMove];
                bytes32 itemNameToMove = servicesByTag[tagName].itemNames[tagIndexToMove];

                servicesByTag[tagName].orgNames[tagIndexToReplace] = orgNameToMove;
                servicesByTag[tagName].itemNames[tagIndexToReplace] = itemNameToMove;

                orgsByName[orgNameToMove].servicesByName[itemNameToMove].tagsByName[tagName].globalTagIndex = tagIndexToReplace;
            }

            servicesByTag[tagName].orgNames.length--;
            servicesByTag[tagName].itemNames.length--;

            // delete contents of the tag entry
            delete orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName];
        }
    }

    function deleteServiceRegistration(bytes32 orgName, bytes32 serviceName) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireServiceExistenceConstraint(orgName, serviceName, true);

        deleteServiceRegistrationInternal(orgName, serviceName);

        emit ServiceDeleted(orgName, serviceName);
    }

    function deleteServiceRegistrationInternal(bytes32 orgName, bytes32 serviceName) internal {
        // delete the tags associated with the service
        for (uint i = orgsByName[orgName].servicesByName[serviceName].tags.length; i > 0; i--) {
            removeTagFromServiceRegistration(orgName, serviceName, orgsByName[orgName].servicesByName[serviceName].tags[i-1]);
        }

        // swap lut entries
        uint    indexToUpdate   = orgsByName[orgName].servicesByName[serviceName].orgServiceIndex;
        bytes32 serviceToUpdate = orgsByName[orgName].serviceKeys[orgsByName[orgName].serviceKeys.length-1];

        if (orgsByName[orgName].serviceKeys[indexToUpdate] != serviceToUpdate) {
            orgsByName[orgName].serviceKeys[indexToUpdate] = serviceToUpdate;
            orgsByName[orgName].servicesByName[serviceToUpdate].orgServiceIndex = indexToUpdate;
        }

        orgsByName[orgName].serviceKeys.length--;

        // delete contents of service registration
        delete orgsByName[orgName].servicesByName[serviceName];
    }

    //   _____                        ____                        __  __                 _
    //  |_   _|   _ _ __   ___       |  _ \ ___ _ __   ___       |  \/  | __ _ _ __ ___ | |_
    //    | || | | | '_ \ / _ \      | |_) / _ \ '_ \ / _ \      | |\/| |/ _` | '_ ` _ \| __|
    //    | || |_| | |_) |  __/      |  _ <  __/ |_) | (_) |     | |  | | (_| | | | | | | |_
    //    |_| \__, | .__/ \___|      |_| \_\___| .__/ \___/      |_|  |_|\__, |_| |_| |_|\__|
    //        |___/|_|                         |_|                       |___/

    function createTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName,
            bytes repositoryURI, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireTypeRepositoryExistenceConstraint(orgName, repositoryName, false);

        TypeRepositoryRegistration memory typeRepo;
        orgsByName[orgName].typeReposByName[repositoryName] = typeRepo;
        orgsByName[orgName].typeReposByName[repositoryName].repositoryName = repositoryName;
        orgsByName[orgName].typeReposByName[repositoryName].repositoryURI = repositoryURI;
        orgsByName[orgName].typeReposByName[repositoryName].orgTypeRepoIndex = orgsByName[orgName].typeRepoKeys.length;
        orgsByName[orgName].typeRepoKeys.push(repositoryName);

        for (uint i = 0; i < tags.length; i++) {
            addTagToTypeRepositoryRegistration(orgName, repositoryName, tags[i]);
        }

        emit TypeRepositoryCreated(orgName, repositoryName);
    }

    function updateTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName,
        bytes repositoryURI) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireTypeRepositoryExistenceConstraint(orgName, repositoryName, true);

        orgsByName[orgName].typeReposByName[repositoryName].repositoryURI = repositoryURI;

        emit TypeRepositoryModified(orgName, repositoryName);
    }

    function addTagsToTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireTypeRepositoryExistenceConstraint(orgName, repositoryName, true);

        for (uint i = 0; i < tags.length; i++) {
            addTagToTypeRepositoryRegistration(orgName, repositoryName, tags[i]);
        }

        emit TypeRepositoryModified(orgName, repositoryName);
    }

    function addTagToTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 tagName) internal {

        // no-op if tag already exists
        if (orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].tagName == bytes32(0x0)) {
            // add the tag to the type repository level tag index
            Tag memory tagObj;
            orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName] = tagObj;
            orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].tagName = tagName;
            orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].itemTagIndex = orgsByName[orgName].typeReposByName[repositoryName].tags.length;
            orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].globalTagIndex = typeReposByTag[tagName].orgNames.length;
            orgsByName[orgName].typeReposByName[repositoryName].tags.push(tagName);

            // add the type repository to the global tag index creating a list object for this tag if it does not already exist
            if (!typeReposByTag[tagName].valid) {
                ServiceOrTypeRepositoryList memory listObj;
                listObj.valid = true;
                typeReposByTag[tagName] = listObj;
                typeRepoTags.push(tagName);
            }
            typeReposByTag[tagName].orgNames.push(orgName);
            typeReposByTag[tagName].itemNames.push(repositoryName);
        }
    }

    function removeTagsFromTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireTypeRepositoryExistenceConstraint(orgName, repositoryName, true);

        for (uint i = 0; i < tags.length; i++) {
            removeTagFromTypeRepositoryRegistration(orgName, repositoryName, tags[i]);
        }

        emit TypeRepositoryModified(orgName, repositoryName);
    }

    function removeTagFromTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 tagName) internal {

        // no-op if tag doesnt exist
        if (orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].tagName != bytes32(0x0)) {

            // swap type repository registration lut entries
            uint tagIndexToReplace = orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].itemTagIndex;
            bytes32 tagNameToMove = orgsByName[orgName].typeReposByName[repositoryName].tags[orgsByName[orgName].typeReposByName[repositoryName].tags.length-1];

            // no-op if we are deleting the last item
            if (tagIndexToReplace != orgsByName[orgName].typeReposByName[repositoryName].tags.length-1) {

                orgsByName[orgName].typeReposByName[repositoryName].tags[tagIndexToReplace] = tagNameToMove;
                orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagNameToMove].itemTagIndex = tagIndexToReplace;
            }

            orgsByName[orgName].typeReposByName[repositoryName].tags.length--;

            // swap global tag index lut entries
            tagIndexToReplace = orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].globalTagIndex;
            uint tagIndexToMove = typeReposByTag[tagName].orgNames.length-1;

            // no-op if we are deleting the last item
            if (tagIndexToMove != tagIndexToReplace) {
                bytes32 orgNameToMove  = typeReposByTag[tagName].orgNames[tagIndexToMove];
                bytes32 repoNameToMove = typeReposByTag[tagName].itemNames[tagIndexToMove];

                typeReposByTag[tagName].orgNames[tagIndexToReplace]  = orgNameToMove;
                typeReposByTag[tagName].itemNames[tagIndexToReplace] = repoNameToMove;

                orgsByName[orgNameToMove].typeReposByName[repoNameToMove].tagsByName[tagName].globalTagIndex = tagIndexToReplace;
            }

            typeReposByTag[tagName].orgNames.length--;
            typeReposByTag[tagName].itemNames.length--;

            // delete contents of the tag entry
            delete orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName];
        }
    }

    function deleteTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName) external {

        requireOrgExistenceConstraint(orgName, true);
        requireAuthorization(orgName, true);
        requireTypeRepositoryExistenceConstraint(orgName, repositoryName, true);

        deleteTypeRepositoryRegistrationInternal(orgName, repositoryName);

        emit TypeRepositoryDeleted(orgName, repositoryName);
    }

    function deleteTypeRepositoryRegistrationInternal(bytes32 orgName, bytes32 repositoryName) internal {

        // delete the tags associated with the type repo
        for (uint i = orgsByName[orgName].typeReposByName[repositoryName].tags.length; i > 0; i--) {
            removeTagFromTypeRepositoryRegistration(orgName, repositoryName, orgsByName[orgName].typeReposByName[repositoryName].tags[i-1]);
        }

        // swap lut entries
        uint    indexToUpdate    = orgsByName[orgName].typeReposByName[repositoryName].orgTypeRepoIndex;
        bytes32 typeRepoToUpdate = orgsByName[orgName].typeRepoKeys[orgsByName[orgName].typeRepoKeys.length-1];

        // no-op if we are deleting the last item
        if (orgsByName[orgName].typeRepoKeys[indexToUpdate] != typeRepoToUpdate) {
            orgsByName[orgName].typeRepoKeys[indexToUpdate] = typeRepoToUpdate;
            orgsByName[orgName].typeReposByName[typeRepoToUpdate].orgTypeRepoIndex = indexToUpdate;
        }

        orgsByName[orgName].typeRepoKeys.length--;

        // delete contents of repo registration
        delete orgsByName[orgName].typeReposByName[repositoryName];
    }

    //    ____      _   _
    //   / ___| ___| |_| |_ ___ _ __ ___
    //  | |  _ / _ \ __| __/ _ \ '__/ __|
    //  | |_| |  __/ |_| |_  __/ |  \__ \
    //   \____|\___|\__|\__\___|_|  |___/
    //

    function listOrganizations() external view returns (bytes32[] orgNames) {
        return orgKeys;
    }

    function getOrganizationByName(bytes32 orgName) external view
            returns(bool found, bytes32 name, address owner, address[] members, bytes32[] serviceNames, bytes32[] repositoryNames) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        name = orgsByName[orgName].organizationName;
        owner = orgsByName[orgName].owner;
        members = orgsByName[orgName].memberKeys;
        serviceNames = orgsByName[orgName].serviceKeys;
        repositoryNames = orgsByName[orgName].typeRepoKeys;
    }

    function listServicesForOrganization(bytes32 orgName) external view returns (bool found, bytes32[] serviceNames) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        serviceNames = orgsByName[orgName].serviceKeys;
    }

    function getServiceRegistrationByName(bytes32 orgName, bytes32 serviceName) external view
            returns (bool found, bytes32 name, bytes metadataURI, bytes32[] tags) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        // check to see if this repo exists
        if(orgsByName[orgName].servicesByName[serviceName].serviceName == bytes32(0x0)) {
            found = false;
            return;
        }

        found        = true;
        name         = orgsByName[orgName].servicesByName[serviceName].serviceName;
        metadataURI  = orgsByName[orgName].servicesByName[serviceName].metadataURI;
        tags         = orgsByName[orgName].servicesByName[serviceName].tags;
    }

    function listTypeRepositoriesForOrganization(bytes32 orgName) external view returns (bool found, bytes32[] repositoryNames) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        repositoryNames = orgsByName[orgName].typeRepoKeys;
    }

    function getTypeRepositoryByName(bytes32 orgName, bytes32 repositoryName) external view
            returns (bool found, bytes32 name, bytes repositoryURI, bytes32[] tags) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        // check to see if this repo exists
        if(orgsByName[orgName].typeReposByName[repositoryName].repositoryName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        name = repositoryName;
        repositoryURI = orgsByName[orgName].typeReposByName[repositoryName].repositoryURI;
        tags = orgsByName[orgName].typeReposByName[repositoryName].tags;
    }

    function listServiceTags() external view returns (bytes32[] tags) {
        return serviceTags;
    }

    function listServicesForTag(bytes32 tag) external view returns (bytes32[] orgNames, bytes32[] serviceNames) {
        orgNames = servicesByTag[tag].orgNames;
        serviceNames = servicesByTag[tag].itemNames;
    }

    function listTypeRepositoryTags() external view returns (bytes32[] tags) {
        return typeRepoTags;
    }

    function listTypeRepositoriesForTag(bytes32 tag) external view returns (bytes32[] orgNames, bytes32[] repositoryNames) {
        orgNames = typeReposByTag[tag].orgNames;
        repositoryNames = typeReposByTag[tag].itemNames;
    }

    // ERC165: https://eips.ethereum.org/EIPS/eip-165
    function supportsInterface(bytes4 interfaceID) external view returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // ERC165
            interfaceID == 0x256b3545; // IRegistry
    }
}
