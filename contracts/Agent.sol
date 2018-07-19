pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./Job.sol";

contract Agent {
    enum AgentState {
        ENABLED,
        DISABLED
    }

    AgentState public state;
    address public owner;
    ERC20 public token;
    mapping(address => bool) public createdJobs;
    uint public currentPrice;
    string public endpoint;
    string public metadataURI;

    event JobCreated(address job, address consumer, uint jobPrice);
    event JobFunded(address job);
    event JobCompleted(address job);

    constructor(address _token, uint _currentPrice, string _endpoint, string _metadataURI) public {
        state = AgentState.ENABLED;
        owner = tx.origin;
        token = ERC20(_token);
        currentPrice = _currentPrice;
        endpoint = _endpoint;
        metadataURI = _metadataURI;
    }

    function setPrice(uint _currentPrice) public {
        require(tx.origin == owner);
        currentPrice = _currentPrice;
    }

    function setEndpoint(string _endpoint) public {
        require(tx.origin == owner);
        endpoint = _endpoint;
    }

    function setMetadataURI(string _metadataURI) public {
      require(tx.origin == owner);
      metadataURI = _metadataURI;
    }

    function disable() public {
        require(state == AgentState.ENABLED);
        require(tx.origin == owner);
        state = AgentState.DISABLED;
    }

    function enable() public {
        require(state == AgentState.DISABLED);
        require(tx.origin == owner);
        state = AgentState.ENABLED;
    }

    function createJob() public returns (address, uint) {
        require(state == AgentState.ENABLED);
        address job = new Job(address(token), currentPrice);
        createdJobs[job] = true;
        emit JobCreated(job, Job(job).consumer(), currentPrice);
        return (job, currentPrice);
    }

    function fundJob() public {
        address job = msg.sender;
        require(createdJobs[job]);
        require(Job(job).state() == Job.JobState.PENDING);
        emit JobFunded(job);
    }


    /*
        With:
        prefix = "\x19Ethereum Signed Message:\n"
        payload = "%x".format(job_address)    || This is the 0x-prefixed hex-encoded
                                              || string representation of the 20-byte
                                              || job address

        The signature payload is:
        keccak256(prefix + str(len(payload)) + payload) || len(payload) is always 42
                                                        || because addresses are 20
                                                        || bytes (40 hex characters)
                                                        || plus the 0x prefix
    */
    function validateJobInvocation(address job, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {

        // Convert 20-byte job address into 42-byte 0x-prefixed hex-encoded string.
        // For each byte, the high nibble (uint8(byte) / 16) determines the target
        // row in the conversion table (which contains the 16 2-char hex strings in
        // the corresponding hexdecade), and the low nibble * 2 (uint8(byte) % 16 * 2)
        // determines the offset of byte's 2-character hex representation
        // within the row (* 2 because each byte is 2 characters long)
        bytes32[16] memory conv = [
            bytes32("000102030405060708090a0b0c0d0e0f"),
            bytes32("101112131415161718191a1b1c1d1e1f"),
            bytes32("202122232425262728292a2b2c2d2e2f"),
            bytes32("303132333435363738393a3b3c3d3e3f"),
            bytes32("404142434445464748494a4b4c4d4e4f"),
            bytes32("505152535455565758595a5b5c5d5e5f"),
            bytes32("606162636465666768696a6b6c6d6e6f"),
            bytes32("707172737475767778797a7b7c7d7e7f"),
            bytes32("808182838485868788898a8b8c8d8e8f"),
            bytes32("909192939495969798999a9b9c9d9e9f"),
            bytes32("a0a1a2a3a4a5a6a7a8a9aaabacadaeaf"),
            bytes32("b0b1b2b3b4b5b6b7b8b9babbbcbdbebf"),
            bytes32("c0c1c2c3c4c5c6c7c8c9cacbcccdcecf"),
            bytes32("d0d1d2d3d4d5d6d7d8d9dadbdcdddedf"),
            bytes32("e0e1e2e3e4e5e6e7e8e9eaebecedeeef"),
            bytes32("f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff")
        ];

        bytes memory jobAddressHexAsciiBytes = new bytes(42);

        // Address isn't convertible straight to bytes32, but is once converted to uint256
        bytes32 jobAddressBytes = bytes32(uint256(job));

        for (uint i = 0; i < 20; i++) {

            // jobAddressBytes contains 0x00 in bytes 0-12 since address has 20-byte length
            uint8 curr = uint8(jobAddressBytes[i + 12]);
            uint8 first = curr / 16;
            uint8 second = curr % 16 * 2;
            jobAddressHexAsciiBytes[2 + (i * 2)] = conv[first][second];
            jobAddressHexAsciiBytes[3 + (i * 2)] = conv[first][second + 1];
        }

        // Set prefix to "0x"
        jobAddressHexAsciiBytes[0] = byte(48);
        jobAddressHexAsciiBytes[1] = byte(120);

        if (createdJobs[job] && Job(job).state() == Job.JobState.FUNDED && ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n42", jobAddressHexAsciiBytes)), v, r, s) == Job(job).consumer()) {
            return true;
        }
        return false;
    }

    function completeJob(address job, uint8 v, bytes32 r, bytes32 s) public {
        require(createdJobs[job]);
        require(Job(job).completeJob(v, r, s));
        require(token.transferFrom(job, owner, Job(job).jobPrice()));
        emit JobCompleted(job);
    }
}
