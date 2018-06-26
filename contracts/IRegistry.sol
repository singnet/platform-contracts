pragma solidity ^0.4.21;

interface IRegistry {
    /*
    *   Organization Management
    */
    function createOrganization(bytes32 orgName, address[] members) external returns (bool success);
    function changeOrganizationOwner(bytes32 orgName, address newOwner) external returns (bool success);
    function addOrganizationMembers(bytes32 orgName, address[] newMembers) external returns (bool success);
    function removeOrganizationMembers(bytes32 orgName, address[] existingMembers) external returns (bool success);
    function deleteOrganization(bytes32 orgName) external returns (bool success);

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
    function createTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32 repositoryPath, bytes repositoryURI, bytes32[] tags) external returns (bool success);
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
    function listTypeRepositoriesForOrganization(bytes32 orgName) external view returns (bool found, bytes32[] repositoryNames);
    function getTypeRepositoryByName(bytes32 orgName, bytes32 repositoryName) external view returns (bool found, bytes32 name, bytes32 repositoryPath, bytes repositoryURI, bytes32[] repositoryTags);
    function listServiceTags() external view returns (bytes32[] serviceTags);
    function listServicesForTag(bytes32 tag) external view returns (bytes32[] orgNames, bytes32[] serviceNames);
    function listTypeRepositoryTags() external view returns (bytes32[] repositoryTags);
    function listTypeRepositoriesForTag(bytes32 tag) external view returns (bytes32[] orgNames, bytes32[] repositoryNames);
}