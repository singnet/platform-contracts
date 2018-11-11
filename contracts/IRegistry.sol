pragma solidity ^0.4.24;

/**
  * @title Open registry for management of AI services run on SingularityNET
  * @author SingularityNET
  *
  */
interface IRegistry {

    //    ___                        _          _   _                   __  __                 _
    //   / _ \ _ __ __ _  __ _ _ __ (_)______ _| |_(_) ___  _ __       |  \/  | __ _ _ __ ___ | |_
    //  | | | | '__/ _` |/ _` | '_ \| |_  / _` | __| |/ _ \| '_ \      | |\/| |/ _` | '_ ` _ \| __|
    //  | |_| | | | (_| | (_| | | | | |/ / (_| | |_| | (_) | | | |     | |  | | (_| | | | | | | |_
    //   \___/|_|  \__, |\__,_|_| |_|_/___\__,_|\__|_|\___/|_| |_|     |_|  |_|\__, |_| |_| |_|\__|
    //             |___/                                                       |___/

    event OrganizationCreated (bytes32 indexed orgName);
    event OrganizationModified(bytes32 indexed orgName);
    event OrganizationDeleted (bytes32 indexed orgName);

    /**
      * @dev Adds a new organization that hosts SingularityNET services to the registry.
      *      Reverts if the given organization name has already been registered.
      *
      * @param orgName  Name of organization to create, must be unique registry-wide.
      * @param members  Array of member addresses to seed the organization with.
      */
    function createOrganization(bytes32 orgName, address[] members) external;

    /**
      * @dev Updates the owner of the organization.
      *      Only the organization owner can invoke this method.
      *      Reverts if the given organization name is unregistered.
      *
      * @param orgName   Name of organization to update.
      * @param newOwner  Address of new owner.
      */
    function changeOrganizationOwner(bytes32 orgName, address newOwner) external;

    /**
      * @dev Updates an organization to add members.
      *      Only an organization member can invoke this method.
      *      Reverts if the given organization name is unregistered.
      *
      * @param orgName     Name of organization to update.
      * @param newMembers  Array of member addresses to add to an organization.
      */
    function addOrganizationMembers(bytes32 orgName, address[] newMembers) external;

    /**
      * @dev Updates an organization to remove members.
      *      Only an organization member can invoke this method.
      *      Reverts if the given organization name is unregistered.
      *
      * @param orgName          Name of organization to update.
      * @param existingMembers  Array of member addresses to remove from an organization.
      */
    function removeOrganizationMembers(bytes32 orgName, address[] existingMembers) external;

    /**
      * @dev Removes an organization from the registry.
      *      Only the organization owner can invoke this method.
      *      Reverts if the given organization name is unregistered
      *
      * @param orgName               Name of organization to remove.
      */
    function deleteOrganization(bytes32 orgName) external;


    //   ____                  _                __  __                 _
    //  / ___|  ___ _ ____   ___) ___ ___      |  \/  | __ _ _ __ ___ | |_
    //  \___ \ / _ \ '__\ \ / / |/ __/ _ \     | |\/| |/ _` | '_ ` _ \| __|
    //   ___) |  __/ |   \ V /| | (__  __/     | |  | | (_| | | | | | | |_
    //  |____/ \___|_|    \_/ |_|\___\___|     |_|  |_|\__, |_| |_| |_|\__|
    //                                                 |___/

    event ServiceCreated         (bytes32 indexed orgName, bytes32 indexed serviceName, bytes metadataURI);
    event ServiceMetadataModified(bytes32 indexed orgName, bytes32 indexed serviceName, bytes metadataURI);
    event ServiceTagsModified    (bytes32 indexed orgName, bytes32 indexed serviceName);
    event ServiceDeleted         (bytes32 indexed orgName, bytes32 indexed serviceName);

    /**
      * @dev Adds a new service to the registry.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization does not exist or if the given service name has already been registered.
      *
      * @param orgName       Name of SingularityNET organization that owns this service.
      * @param serviceName   Name of the service to create, must be unique organization-wide.
      * @param metadataURI   Service metadata. metadataURI should contain information for data consistency 
      *                      validation (for example hash). We support: IPFS URI.
      * @param tags          Optional array of tags for discoverability.
      */
    function createServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes metadataURI, bytes32[] tags) external;

    /**
      * @dev Updates a service registration record.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization or service does not exist.
      *
      * @param orgName       Name of SingularityNET organization that owns this service.
      * @param serviceName   Name of the service to update.
      * @param metadataURI   Service metadata URI
      */
    function updateServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes metadataURI) external;

    /**
      * @dev Adds tags to a service registration record for discoverability.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization or service does not exist.
      *
      * @param orgName       Name of SingularityNET organization that owns this service.
      * @param serviceName   Name of the service to add tags to.
      * @param tags          Array of tags to add to the service registration record.
      */
    function addTagsToServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external;

    /**
      * @dev Removes tags from a service registration record.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization or service does not exist.
      *
      * @param orgName       Name of SingularityNET organization that owns this service.
      * @param serviceName   Name of the service to remove tags from.
      * @param tags          Array of tags to remove from the service registration record.
      */
    function removeTagsFromServiceRegistration(bytes32 orgName, bytes32 serviceName, bytes32[] tags) external;

    /**
      * @dev Removes a service from the registry.
      *      Only the owner of the given organization can invoke this method.
      *      Reverts if the given organization or service does not exist.
      *
      * @param orgName       Name of SingularityNET organization that owns this service.
      * @param serviceName   Name of the service to remove.
      */
    function deleteServiceRegistration(bytes32 orgName, bytes32 serviceName) external;


    //   _____                        ____                        __  __                 _
    //  |_   _|   _ _ __   ___       |  _ \ ___ _ __   ___       |  \/  | __ _ _ __ ___ | |_
    //    | || | | | '_ \ / _ \      | |_) / _ \ '_ \ / _ \      | |\/| |/ _` | '_ ` _ \| __|
    //    | || |_| | |_) |  __/      |  _ <  __/ |_) | (_) |     | |  | | (_| | | | | | | |_
    //    |_| \__, | .__/ \___|      |_| \_\___| .__/ \___/      |_|  |_|\__, |_| |_| |_|\__|
    //        |___/|_|                         |_|                       |___/

    event TypeRepositoryCreated (bytes32 indexed orgName, bytes32 indexed typeRepositoryName);
    event TypeRepositoryModified(bytes32 indexed orgName, bytes32 indexed typeRepositoryName);
    event TypeRepositoryDeleted (bytes32 indexed orgName, bytes32 indexed typeRepositoryName);

    /**
      * @dev Adds a new type repository to the registry.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization does not exist or if the given repository name has already been registered.
      *
      * @param orgName         Name of SingularityNET organization that owns this type repository.
      * @param repositoryName  Name of the repository to create, must be unique organization-wide.
      * @param repositoryURI   Path to an offchain resource that contains type repository metadata.
      * @param tags            Optional array of tags for discoverability.
      */
    function createTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes repositoryURI, bytes32[] tags) external;

    /**
      * @dev Updates a type repository registration record.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization does not exist or if the given repository name has already been registered.
      *
      * @param orgName         Name of SingularityNET organization that owns this type repository.
      * @param repositoryName  Name of the repository to update.
      * @param repositoryURI   Path to an offchain resource that contains type repository metadata.
      */
    function updateTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes repositoryURI) external;

    /**
      * @dev Adds tags to a type repository registration record for discoverability.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization does not exist or if the given repository name has already been registered.
      *
      * @param orgName         Name of SingularityNET organization that owns this type repository.
      * @param repositoryName  Name of the repository to update.
      * @param tags            Optional array of tags for discoverability.
      */
    function addTagsToTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external;

    /**
      * @dev Removes tags from a type repository registration record.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization does not exist or if the given repository name has already been registered.
      *
      * @param orgName         Name of SingularityNET organization that owns this type repository.
      * @param repositoryName  Name of the repository to update.
      * @param tags            Optional array of tags for discoverability.
      */
    function removeTagsFromTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName, bytes32[] tags) external;

    /**
      * @dev Removes tags from a type repository registration record.
      *      Only a member of the given organization can invoke this method.
      *      Reverts if the given organization does not exist or if the given repository name has already been registered.
      *
      * @param orgName         Name of SingularityNET organization that owns this type repository.
      * @param repositoryName  Name of the repository to update.
      */
    function deleteTypeRepositoryRegistration(bytes32 orgName, bytes32 repositoryName) external;


    //    ____      _   _
    //   / ___| ___| |_| |_ ___ _ __ ___
    //  | |  _ / _ \ __| __/ _ \ '__/ __|
    //  | |_| |  __/ |_| |_  __/ |  \__ \
    //   \____|\___|\__|\__\___|_|  |___/
    //

    /**
      * @dev Returns an array of names of all registered organizations.
      *
      * @return orgNames Array of names of all registered organizations.
      */
    function listOrganizations() external view returns (bytes32[] orgNames);

    /**
      * @dev Retrieves the detailed registration information of a single organization.
      *
      * @param orgName Name of the organization to look up.
      * @return found           true if an organization with this name exists, false otherwise. If false, all other
      *                         returned fields should be ignored.
      * @return name            Name of organization, should be the same as the orgName parameter.
      * @return owner           Address of the owner of the organization.
      * @return members         Array of addresses of the members of this organization.
      * @return serviceNames    Array of names of services owned by the organization.
      * @return repositoryNames Array of name of type repositories owned by the organization.
      */
    function getOrganizationByName(bytes32 orgName) external view
            returns (bool found, bytes32 name, address owner, address[] members, bytes32[] serviceNames, bytes32[] repositoryNames);

    /**
      * @dev Returns an array of names of all services owned by a given organization.
      *
      * @param orgName Name of the organization whose services to list.
      *
      * @return found         true if an organization with this name exists, false otherwise. If false, all other
      *                       returned fields should be ignored.
      * @return serviceNames  Array of names of all services owned by this organization.
      */
    function listServicesForOrganization(bytes32 orgName) external view returns (bool found, bytes32[] serviceNames);

    /**
      * @dev Retrieves the detailed registration information of a single service.
      *
      * @param orgName     Name of the organization that owns the service to look up.
      * @param serviceName Name of the service to look up.
      *
      * @return found        true if an organization and service with these names exists, false otherwise. If false, all other
      *                      returned fields should be ignored.
      * @return name         Name of the service, should be the same as the serviceName parameter.
      * @return metadataURI  Service metadata URI
      * @return serviceTags  Optional array of tags for discoverability.
      */
    function getServiceRegistrationByName(bytes32 orgName, bytes32 serviceName) external view
            returns (bool found, bytes32 name, bytes metadataURI, bytes32[] serviceTags);

    /**
      * @dev Returns an array of names of all type repositories owned by a given organization.
      *
      * @param orgName Name of the organization whose type repositories to list.
      *
      * @return found         true if an organization with this name exists, false otherwise. If false, all other
      *                       returned fields should be ignored.
      * @return serviceNames  Array of names of all type repositories owned by this organization.
      */
    function listTypeRepositoriesForOrganization(bytes32 orgName) external view returns (bool found, bytes32[] repositoryNames);

    /**
      * @dev Retrieves the detailed registration information of a single type repository.
      *
      * @param orgName        Name of the organization that owns the repository to look up.
      * @param repositoryName Name of the repository to look up.
      *
      * @return found           true if an organization and repository with these names exists, false otherwise. If false, all other
      *                         returned fields should be ignored.
      * @return name            Name of the repository, should be the same as the repositoryName parameter.
      * @return repositoryURI   repository URI.
      * @return repositoryTags  Optional array of tags for discoverability.
      */
    function getTypeRepositoryByName(bytes32 orgName, bytes32 repositoryName) external view
            returns (bool found, bytes32 name, bytes repositoryURI, bytes32[] repositoryTags);

    /**
      * @dev Returns a list of all tags placed on any service for discoverability.
      *
      * @return serviceTags Array of service discoverability tags.
      */
    function listServiceTags() external view returns (bytes32[] serviceTags);

    /**
      * @dev Returns a list of all services with a given tag.
      *
      * @return orgNames     Array of organization names corresponding to the services in serviceNames.
      * @return serviceNames Array of service names with the given tag.
      */
    function listServicesForTag(bytes32 tag) external view returns (bytes32[] orgNames, bytes32[] serviceNames);

    /**
      * @dev Returns a list of all tags placed on any type repository for discoverability.
      *
      * @return serviceTags Array of type repository discoverability tags.
      */
    function listTypeRepositoryTags() external view returns (bytes32[] repositoryTags);

    /**
      * @dev Returns a list of all type repositories with a given tag.
      *
      * @return orgNames     Array of organization names corresponding to the type repositories in serviceNames.
      * @return repositoryNames Array of service names with the given tag.
      */
    function listTypeRepositoriesForTag(bytes32 tag) external view returns (bytes32[] orgNames, bytes32[] repositoryNames);
}
