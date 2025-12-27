// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ExecutionRouter
 * @notice Routes x402-triggered execution commands to appropriate handlers
 * @dev Core contract for Atlas402 agent execution
 */
contract ExecutionRouter is Ownable, ReentrancyGuard, Pausable {
    
    // Events
    event ExecutionRequested(
        bytes32 indexed executionId,
        address indexed requester,
        string intentType,
        uint256 timestamp
    );
    
    event ExecutionCompleted(
        bytes32 indexed executionId,
        bool success,
        bytes result
    );
    
    event ExecutorAuthorized(address indexed executor);
    event ExecutorRevoked(address indexed executor);
    
    // State
    mapping(address => bool) public authorizedExecutors;
    mapping(bytes32 => ExecutionRecord) public executions;
    
    struct ExecutionRecord {
        address requester;
        string intentType;
        uint256 timestamp;
        bool completed;
        bool success;
    }
    
    modifier onlyAuthorized() {
        require(authorizedExecutors[msg.sender], "Not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        authorizedExecutors[msg.sender] = true;
    }
    
    /**
     * @notice Execute an agent command
     * @param executionId Unique execution identifier
     * @param intentType Type of intent being executed
     * @param targetContract Address to call
     * @param callData Data to send
     */
    function execute(
        bytes32 executionId,
        string memory intentType,
        address targetContract,
        bytes memory callData
    ) external payable onlyAuthorized whenNotPaused nonReentrant returns (bool, bytes memory) {
        require(!executions[executionId].completed, "Already executed");
        
        // Record execution request
        executions[executionId] = ExecutionRecord({
            requester: msg.sender,
            intentType: intentType,
            timestamp: block.timestamp,
            completed: false,
            success: false
        });
        
        emit ExecutionRequested(executionId, msg.sender, intentType, block.timestamp);
        
        // Execute call
        (bool success, bytes memory result) = targetContract.call{value: msg.value}(callData);
        
        // Update record
        executions[executionId].completed = true;
        executions[executionId].success = success;
        
        emit ExecutionCompleted(executionId, success, result);
        
        return (success, result);
    }
    
    /**
     * @notice Simple payment routing
     */
    function executePayment(
        bytes32 executionId,
        address payable recipient,
        uint256 amount,
        string memory reason
    ) external payable onlyAuthorized whenNotPaused nonReentrant {
        require(msg.value >= amount, "Insufficient value");
        require(!executions[executionId].completed, "Already executed");
        
        executions[executionId] = ExecutionRecord({
            requester: msg.sender,
            intentType: "payment",
            timestamp: block.timestamp,
            completed: true,
            success: true
        });
        
        emit ExecutionRequested(executionId, msg.sender, "payment", block.timestamp);
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Payment failed");
        
        emit ExecutionCompleted(executionId, true, "");
    }
    
    /**
     * @notice Authorize an executor (x402 backend)
     */
    function authorizeExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = true;
        emit ExecutorAuthorized(executor);
    }
    
    /**
     * @notice Revoke executor
     */
    function revokeExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = false;
        emit ExecutorRevoked(executor);
    }
    
    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw funds (owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
