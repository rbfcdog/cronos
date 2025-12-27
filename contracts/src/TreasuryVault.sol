// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TreasuryVault
 * @notice Manages funds for agent-triggered payments
 */
contract TreasuryVault is Ownable, ReentrancyGuard {
    
    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount, string reason);
    event AllowanceSet(address indexed spender, uint256 amount);
    
    mapping(address => uint256) public allowances;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Deposit funds
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Set spending allowance for an address (e.g., ExecutionRouter)
     */
    function setAllowance(address spender, uint256 amount) external onlyOwner {
        allowances[spender] = amount;
        emit AllowanceSet(spender, amount);
    }
    
    /**
     * @notice Withdraw with allowance check
     */
    function withdraw(
        address payable recipient,
        uint256 amount,
        string memory reason
    ) external nonReentrant {
        require(allowances[msg.sender] >= amount, "Allowance exceeded");
        require(address(this).balance >= amount, "Insufficient balance");
        
        allowances[msg.sender] -= amount;
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(recipient, amount, reason);
    }
    
    /**
     * @notice Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }
}
