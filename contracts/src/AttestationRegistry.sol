// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AttestationRegistry
 * @notice Records agent execution attestations for auditability
 */
contract AttestationRegistry is Ownable {
    
    struct Attestation {
        bytes32 executionId;
        address attester;
        string agentName;
        string intentHash; // Hash of original intent
        uint256 timestamp;
        bool verified;
    }
    
    mapping(bytes32 => Attestation) public attestations;
    mapping(address => bool) public trustedAttesters;
    
    event AttestationRecorded(
        bytes32 indexed executionId,
        address indexed attester,
        string agentName,
        uint256 timestamp
    );
    
    event AttesterTrusted(address indexed attester);
    event AttesterRevoked(address indexed attester);
    
    constructor() Ownable(msg.sender) {
        trustedAttesters[msg.sender] = true;
    }
    
    /**
     * @notice Record an attestation
     */
    function attest(
        bytes32 executionId,
        string memory agentName,
        string memory intentHash
    ) external {
        require(trustedAttesters[msg.sender], "Not a trusted attester");
        require(attestations[executionId].timestamp == 0, "Already attested");
        
        attestations[executionId] = Attestation({
            executionId: executionId,
            attester: msg.sender,
            agentName: agentName,
            intentHash: intentHash,
            timestamp: block.timestamp,
            verified: true
        });
        
        emit AttestationRecorded(executionId, msg.sender, agentName, block.timestamp);
    }
    
    /**
     * @notice Add trusted attester
     */
    function addTrustedAttester(address attester) external onlyOwner {
        trustedAttesters[attester] = true;
        emit AttesterTrusted(attester);
    }
    
    /**
     * @notice Revoke attester
     */
    function revokeTrustedAttester(address attester) external onlyOwner {
        trustedAttesters[attester] = false;
        emit AttesterRevoked(attester);
    }
    
    /**
     * @notice Get attestation details
     */
    function getAttestation(bytes32 executionId) 
        external 
        view 
        returns (Attestation memory) 
    {
        return attestations[executionId];
    }
}
