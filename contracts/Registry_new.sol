pragma solidity ^0.4.21;

interface IRegistry {

    /*
    *   Organization Management
    */
    function createOrganization(bytes32 orgName, address[] members) external returns (bool success);
    function changeOrganizationOwner(bytes32 orgName, address newOwner) external returns (bool success);
    function addOrganizationMembers(bytes32 orgName, address[] newMembers) external returns (bool success);
    function removeOrganizationMembers(bytes32 orgName, address[] existingMembers) external returns (bool success);
    function deleteOrganization(bytes32 orgName) external returns(bool success);

    /*
    *   Service Management
    */
    function createServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 servicePath, address agentAddress, bytes32[] tags) external returns (bool success);
    function updateServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 servicePath, address agentAddress) external returns (bool success);
    function addTagsToServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external returns (bool success);
    function removeTagsFromServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external returns (bool success);
    function deleteServiceRegistration(bytes32 orgName, bytes32 serviceName) external returns (bool success);

    /*
    *   Type Repository Management
    */
    function createTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 repositoryPath, bytes repositoryURI, bytes32[] tags) external returns(bool success);
    function updateTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 repositoryPath, bytes repositoryURI) external returns (bool success);
    function addTagsToTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external returns (bool success);
    function removeTagsFromTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external returns (bool success);
    function deleteTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName) external returns (bool success);

    /*
    *   List and Retrieval Functions
    */
    function listOrganizations() external view returns (bytes32[] orgNames);
    function getOrganizationByName(bytes32 orgName) external view returns (bool found, bytes32 name, address owner, bytes32[] serviceNames, bytes32[] repositoryNames);
    function listServicesForOrganization(bytes32 orgName) external view returns (bool found, bytes32[] serviceNames);
    function getServiceRegistrationByName(bytes32 orgName, bytes32 serviceName) external view returns (bool found, bytes32 name, bytes32 servicePath, address agentAddress, bytes32[] serviceTags);
    function listTypeRepositoriesForOrganization(bytes32 orgName) external view returns(bool found, bytes32[] repositoryNames);
    function getTypeRepositoryByName(bytes32 orgName, bytes32 repositoryName) external view returns (bool found, bytes32 name, bytes32 repositoryPath, bytes32[] repositoryTags);
    function listServiceTags() external view returns(bytes32[] serviceTags);
    function listServicesForTag(bytes32 tag) external view returns(bytes32[] orgNames, bytes32[] serviceNames);
    function listTypeRepositoryTags() external view returns(bytes32[] repositoryTags);
    function listTypeRepositoriesForTag(bytes32 tag) external view returns(bytes32[] orgNames, bytes32[] repositoryNames);
}

contract RegistryImpl is IRegistry {

    struct OrganizationRegistration {
        bytes32 organizationName;
        address owner;
        mapping(address => bool) members;

        bytes32[] serviceKeys;
        bytes32[] typeRepoKeys;
        mapping(bytes32 => ServiceRegistration) servicesByName;
        mapping(bytes32 => TypeRepositoryRegistration) typeReposByName;

        uint globalOrgIndex;
    }

    struct ServiceRegistration {
        bytes32 serviceName;
        bytes32 servicePath;
        address agentAddress;

        bytes32[] tags;
        mapping(bytes32 => Tag) tagsByName;

        uint orgServiceIndex;
    }

    struct TypeRepositoryRegistration {
        bytes32 repositoryName;
        bytes32 repositoryPath;
        bytes repositoryURI;

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


    /*
    *   Organization Management
    */

    function createOrganization(bytes32 orgName, address[] members) external returns (bool success) {

        // check to see if this organization name is in use
        if(orgsByName[orgName].organizationName != bytes32(0x0)) {
            return false;
        }

        OrganizationRegistration memory organization;
        orgsByName[orgName] = organization;
        orgsByName[orgName].organizationName = orgName;
        orgsByName[orgName].owner = msg.sender;
        orgsByName[orgName].globalOrgIndex = orgKeys.length;
        orgKeys.push(orgName);

        for(uint i = 0; i < members.length; i++){
            orgsByName[orgName].members[members[i]] = true;
        }

        return true;
    }

    function changeOrganizationOwner(bytes32 orgName, address newOwner) external returns (bool success) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner
        if(msg.sender != orgsByName[orgName].owner) {
            return false;
        }

        orgsByName[orgName].owner = newOwner;
        return true;
    }

    function addOrganizationMembers(bytes32 orgName, address[] newMembers) external returns (bool success)  {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        for(uint i = 0; i < newMembers.length; i++){
            orgsByName[orgName].members[newMembers[i]] = true;
        }
        return true;
    }

    function removeOrganizationMembers(bytes32 orgName, address[] existingMembers) external returns (bool success) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        for(uint i = 0; i < existingMembers.length; i++){
            orgsByName[orgName].members[existingMembers[i]] = false;
        }
        return true;
    }

    function deleteOrganization(bytes32 orgName) external returns (bool success) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        if(msg.sender != orgsByName[orgName].owner) {
            return false;
        }

        // swap lut entries
        uint    indexToUpdate = orgsByName[orgName].globalOrgIndex;
        bytes32 orgToUpdate   = orgKeys[orgKeys.length-1];

        orgKeys[indexToUpdate] = orgToUpdate;
        orgsByName[orgToUpdate].globalOrgIndex = indexToUpdate;
        orgKeys.length--;

        // delete contents of organization registration
        delete orgsByName[orgName];

        return true;
    }


    /*
    *   Service Management
    */

    function createServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 servicePath,
        address agentAddress, bytes32[] tags) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this service name exists within the organization
        if(orgsByName[orgName].servicesByName[serviceName].serviceName != bytes32(0x0)) {
            return false;
        }

        ServiceRegistration memory service;
        orgsByName[orgName].servicesByName[serviceName] = service;
        orgsByName[orgName].servicesByName[serviceName].serviceName = serviceName;
        orgsByName[orgName].servicesByName[serviceName].servicePath = servicePath;
        orgsByName[orgName].servicesByName[serviceName].agentAddress = agentAddress;
        orgsByName[orgName].servicesByName[serviceName].orgServiceIndex = orgsByName[orgName].serviceKeys.length;
        orgsByName[orgName].serviceKeys.push(serviceName);

        for(uint i = 0; i < tags.length; i++) {
            addTagToServiceRegistration(orgName, serviceName, tags[i]);
        }
        return true;
    }

    function updateServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 servicePath,
        address agentAddress) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this service name exists within the organization
        if(orgsByName[orgName].servicesByName[serviceName].serviceName == bytes32(0x0)) {
            return false;
        }

        // update the servicePath and agentAddress
        orgsByName[orgName].servicesByName[serviceName].servicePath = servicePath;
        orgsByName[orgName].servicesByName[serviceName].agentAddress = agentAddress;

        return true;
    }

    function addTagsToServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this service name exists within the organization
        if(orgsByName[orgName].servicesByName[serviceName].serviceName == bytes32(0x0)) {
            return false;
        }

        for(uint i = 0; i < tags.length; i++) {
            addTagToServiceRegistration(orgName, serviceName, tags[i]);
        }
        return true;
    }

    function addTagToServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 tagName) internal returns (bool success) {

        // check if this service already has this tag
        if(orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].tagName != bytes32(0x0)) {
            return true;
        }

        // add the service to the org level tag index
        Tag memory tagObj;
        orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName] = tagObj;
        orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].tagName = tagName;
        orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].itemTagIndex = orgsByName[orgName].servicesByName[serviceName].tags.length;
        orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].globalTagIndex = servicesByTag[tagName].orgNames.length;
        orgsByName[orgName].servicesByName[serviceName].tags.push(tagName);

        // add the service to the global tag index creating a list object for this tag if it does not already exist
        if(!servicesByTag[tagName].valid) {
            ServiceOrTypeRepositoryList memory listObj;
            listObj.valid = true;
            servicesByTag[tagName] = listObj;
            serviceTags.push(tagName);
        }
        servicesByTag[tagName].orgNames.push(orgName);
        servicesByTag[tagName].itemNames.push(serviceName);

        return true;
    }

    function removeTagsFromServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this service name exists within the organization
        if(orgsByName[orgName].servicesByName[serviceName].serviceName == bytes32(0x0)) {
            return false;
        }

        for(uint i = 0; i < tags.length; i++) {
            removeTagFromServiceRegistration(orgName, serviceName, tags[i]);
        }
        return true;
    }

    function removeTagFromServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32 tagName) internal returns (bool success)  {

        // check if this service has this tag
        if(orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].tagName == bytes32(0x0)) {
            return true;
        }

        // swap service registration lut entries
        uint tagIndexToReplace = orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].itemTagIndex;
        bytes32 tagNameToMove = orgsByName[orgName].servicesByName[serviceName].tags[orgsByName[orgName].servicesByName[serviceName].tags.length-1];

        orgsByName[orgName].servicesByName[serviceName].tags[tagIndexToReplace] = tagNameToMove;
        orgsByName[orgName].servicesByName[serviceName].tagsByName[tagNameToMove].itemTagIndex = tagIndexToReplace;
        orgsByName[orgName].servicesByName[serviceName].tags.length--;

        // swap global tag index lut entries
        tagIndexToReplace = orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName].globalTagIndex;
        uint tagIndexToMove = servicesByTag[tagName].orgNames.length-1;

        servicesByTag[tagName].orgNames[tagIndexToReplace] = servicesByTag[tagName].orgNames[tagIndexToMove];
        servicesByTag[tagName].itemNames[tagIndexToReplace] = servicesByTag[tagName].itemNames[tagIndexToMove];

        bytes32 orgToUpdate = servicesByTag[tagName].orgNames[tagIndexToReplace];
        bytes32 itemToUpdate = servicesByTag[tagName].itemNames[tagIndexToReplace];
        orgsByName[orgToUpdate].servicesByName[itemToUpdate].tagsByName[tagName].globalTagIndex = tagIndexToReplace;

        servicesByTag[tagName].orgNames.length--;
        servicesByTag[tagName].itemNames.length--;

        // delete contents of the tag entry
        delete orgsByName[orgName].servicesByName[serviceName].tagsByName[tagName];

        return true;
    }

    function deleteServiceRegistration(bytes32 orgName, bytes32 serviceName) external returns (bool success) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this service name exists within the organization
        if(orgsByName[orgName].servicesByName[serviceName].serviceName == bytes32(0x0)) {
            return false;
        }

        // delete the tags associated with the service
        for(uint i = 0; i < orgsByName[orgName].servicesByName[serviceName].tags.length; i++) {
            removeTagFromServiceRegistration(orgName, serviceName, orgsByName[orgName].servicesByName[serviceName].tags[i]);
        }

        // swap lut entries
        uint    indexToUpdate   = orgsByName[orgName].servicesByName[serviceName].orgServiceIndex;
        bytes32 serviceToUpdate = orgsByName[orgName].serviceKeys[orgsByName[orgName].serviceKeys.length-1];

        orgsByName[orgName].serviceKeys[indexToUpdate] = serviceToUpdate;
        orgsByName[orgName].servicesByName[serviceToUpdate].orgServiceIndex = indexToUpdate;
        orgsByName[orgName].serviceKeys.length--;

        // delete contents of service registration
        delete orgsByName[orgName].servicesByName[serviceName];

        return true;
    }


    /*
    *   Type Repository Management
    */

    function createTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 repositoryPath,
        bytes repositoryURI, bytes32[] tags) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this repo name exists within the organization
        if(orgsByName[orgName].typeReposByName[repositoryName].repositoryName != bytes32(0x0)) {
            return false;
        }

        TypeRepositoryRegistration memory typeRepo;
        orgsByName[orgName].typeReposByName[repositoryName] = typeRepo;
        orgsByName[orgName].typeReposByName[repositoryName].repositoryName = repositoryName;
        orgsByName[orgName].typeReposByName[repositoryName].repositoryPath = repositoryPath;
        orgsByName[orgName].typeReposByName[repositoryName].repositoryURI = repositoryURI;
        orgsByName[orgName].typeReposByName[repositoryName].orgTypeRepoIndex = orgsByName[orgName].typeRepoKeys.length;
        orgsByName[orgName].typeRepoKeys.push(repositoryName);

        for(uint i = 0; i < tags.length; i++) {
            addTagToTypeRepositoryRegistration(orgName, repositoryName, tags[i]);
        }
        return true;
    }

    function updateTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 repositoryPath,
        bytes repositoryURI) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this repo name exists within the organization
        if(orgsByName[orgName].typeReposByName[repositoryName].repositoryName == bytes32(0x0)) {
            return false;
        }

        orgsByName[orgName].typeReposByName[repositoryName].repositoryPath = repositoryPath;
        orgsByName[orgName].typeReposByName[repositoryName].repositoryURI = repositoryURI;

        return true;
    }

    function addTagsToTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external returns(bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this repo name exists within the organization
        if(orgsByName[orgName].typeReposByName[repositoryName].repositoryName == bytes32(0x0)) {
            return false;
        }

        for(uint i = 0; i < tags.length; i++) {
            addTagToTypeRepositoryRegistration(orgName, repositoryName, tags[i]);
        }
        return true;
    }

    function addTagToTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 tagName) internal returns (bool success) {

        // check if this repo already has this tag
        if(orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].tagName != bytes32(0x0)) {
            return true;
        }

        // add the type repository to the org level tag index
        Tag memory tagObj;
        orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName] = tagObj;
        orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].tagName = tagName;
        orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].itemTagIndex = orgsByName[orgName].typeReposByName[repositoryName].tags.length;
        orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].globalTagIndex = typeReposByTag[tagName].orgNames.length;
        orgsByName[orgName].typeReposByName[repositoryName].tags.push(tagName);

        // add the type repository to the global tag index creating a list object for this tag if it does not already exist
        if(!typeReposByTag[tagName].valid) {
            ServiceOrTypeRepositoryList memory listObj;
            listObj.valid = true;
            typeReposByTag[tagName] = listObj;
            typeRepoTags.push(tagName);
        }
        typeReposByTag[tagName].orgNames.push(orgName);
        typeReposByTag[tagName].itemNames.push(repositoryName);

        return true;
    }

    function removeTagsFromTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external returns (bool success) {

        // check to see if this organization name exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this repo name exists within the organization
        if(orgsByName[orgName].typeReposByName[repositoryName].repositoryName != bytes32(0x0)) {
            return false;
        }

        for(uint i = 0; i < tags.length; i++) {
            removeTagFromTypeRepositoryRegistration(orgName, repositoryName, tags[i]);
        }
        return true;
    }

    function removeTagFromTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 tagName) internal returns (bool success) {

        // check if this repo has this tag
        if(orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].tagName == bytes32(0x0)) {
            return true;
        }

        // swap lut entries
        // swap service registration lut entries
        uint tagIndexToReplace = orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].itemTagIndex;
        bytes32 tagNameToMove = orgsByName[orgName].typeReposByName[repositoryName].tags[orgsByName[orgName].typeReposByName[repositoryName].tags.length-1];

        orgsByName[orgName].typeReposByName[repositoryName].tags[tagIndexToReplace] = tagNameToMove;
        orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagNameToMove].itemTagIndex = tagIndexToReplace;
        orgsByName[orgName].typeReposByName[repositoryName].tags.length--;

        // swap global tag index lut entries
        tagIndexToReplace = orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName].globalTagIndex;
        uint tagIndexToMove = typeReposByTag[tagName].orgNames.length-1;

        typeReposByTag[tagName].orgNames[tagIndexToReplace] = typeReposByTag[tagName].orgNames[tagIndexToMove];
        typeReposByTag[tagName].itemNames[tagIndexToReplace] = typeReposByTag[tagName].itemNames[tagIndexToMove];

        bytes32 orgToUpdate = typeReposByTag[tagName].orgNames[tagIndexToReplace];
        bytes32 itemToUpdate = typeReposByTag[tagName].itemNames[tagIndexToReplace];
        orgsByName[orgToUpdate].typeReposByName[itemToUpdate].tagsByName[tagName].globalTagIndex = tagIndexToReplace;

        typeReposByTag[tagName].orgNames.length--;
        typeReposByTag[tagName].itemNames.length--;

        // delete contents of the tag entry
        delete orgsByName[orgName].typeReposByName[repositoryName].tagsByName[tagName];

        return true;
    }

    function deleteTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName) external returns(bool success) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            return false;
        }

        // validate owner or member
        if(msg.sender != orgsByName[orgName].owner && !orgsByName[orgName].members[msg.sender]) {
            return false;
        }

        // check to see if this repo name exists within the organization
        if(orgsByName[orgName].typeReposByName[repositoryName].repositoryName == bytes32(0x0)) {
            return false;
        }

        // delete the tags associated with the type repo
        for(uint i = 0; i < orgsByName[orgName].typeReposByName[repositoryName].tags.length; i++) {
            removeTagFromTypeRepositoryRegistration(orgName, repositoryName, orgsByName[orgName].typeReposByName[repositoryName].tags[i]);
        }

        // swap lut entries
        uint    indexToUpdate    = orgsByName[orgName].typeReposByName[repositoryName].orgTypeRepoIndex;
        bytes32 typeRepoToUpdate = orgsByName[orgName].typeRepoKeys[orgsByName[orgName].typeRepoKeys.length-1];

        orgsByName[orgName].typeRepoKeys[indexToUpdate] = typeRepoToUpdate;
        orgsByName[orgName].typeReposByName[typeRepoToUpdate].orgTypeRepoIndex = indexToUpdate;
        orgsByName[orgName].typeRepoKeys.length--;

        // delete contents of repo registration
        delete orgsByName[orgName].typeReposByName[repositoryName];

        return true;
    }


    /*
    *   List and Retrieval Functions
    */

    function listOrganizations() external view returns(bytes32[] orgNames) {
        return orgKeys;
    }

    function getOrganizationByName(bytes32 orgName) external view
        returns(bool found, bytes32 name, address owner, bytes32[] serviceNames, bytes32[] repositoryNames) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        name = orgsByName[orgName].organizationName;
        owner = orgsByName[orgName].owner;
        serviceNames = orgsByName[orgName].serviceKeys;
        repositoryNames = orgsByName[orgName].typeRepoKeys;
    }

    function listServicesForOrganization(bytes32 orgName) external view returns(bool found, bytes32[] serviceNames) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        serviceNames = orgsByName[orgName].serviceKeys;
    }

    function getServiceRegistrationByName(bytes32 orgName, bytes32 serviceName) external view
        returns(bool found, bytes32 name, bytes32 path, address agentAddress, bytes32[] tags) {

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

        found = true;
        name = orgsByName[orgName].servicesByName[serviceName].serviceName;
        path = orgsByName[orgName].servicesByName[serviceName].servicePath;
        agentAddress = orgsByName[orgName].servicesByName[serviceName].agentAddress;
        tags = orgsByName[orgName].servicesByName[serviceName].tags;
    }

    function listTypeRepositoriesForOrganization(bytes32 orgName) external view returns(bool found, bytes32[] repositoryNames) {

        // check to see if this organization exists
        if(orgsByName[orgName].organizationName == bytes32(0x0)) {
            found = false;
            return;
        }

        found = true;
        repositoryNames = orgsByName[orgName].typeRepoKeys;
    }

    function getTypeRepositoryByName(bytes32 orgName, bytes32 repositoryName) external view
        returns (bool found, bytes32 name, bytes32 path, bytes32 uri, bytes32[] tags) {

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
        path = orgsByName[orgName].typeReposByName[repositoryName].repositoryPath;
        uri = orgsByName[orgName].typeReposByName[repositoryName].repositoryURI;
        tags = orgsByName[orgName].typeReposByName[repositoryName].tags;
    }

    function listServiceTags() external view returns(bytes32[] tags) {
        return serviceTags;
    }

    function listServicesForTag(bytes32 tag) external view returns(bytes32[] orgNames, bytes32[] serviceNames) {
        orgNames = servicesByTag[tag].orgNames;
        serviceNames = servicesByTag[tag].itemNames;
    }

    function listTypeRepositoryTags() external view returns(bytes32[] tags) {
        return typeRepoTags;
    }

    function listTypeRepositoriesForTag(bytes32 tag) external view returns(bytes32[] orgNames, bytes32[] repositoryNames) {
        orgNames = typeReposByTag[tag].orgNames;
        repositoryNames = typeReposByTag[tag].itemNames;
    }
}