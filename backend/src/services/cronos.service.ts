import { ethers } from "ethers";
import config from "../config";

/**
 * Cronos blockchain service
 * Handles all direct blockchain interactions
 */
export class CronosService {
  private provider: ethers.JsonRpcProvider;
  private executorWallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.cronos.testnet.rpcUrl);
    
    if (!config.keys.executor) {
      throw new Error("EXECUTOR_PRIVATE_KEY not configured");
    }
    
    this.executorWallet = new ethers.Wallet(config.keys.executor, this.provider);
  }

  /**
   * Get current network info
   */
  async getNetworkInfo() {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    const gasPrice = await this.provider.getFeeData();

    return {
      chainId: Number(network.chainId),
      blockNumber,
      gasPrice: gasPrice.gasPrice?.toString(),
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get executor address
   */
  getExecutorAddress(): string {
    return this.executorWallet.address;
  }

  /**
   * Send simple payment transaction
   */
  async sendPayment(to: string, amountInEther: string): Promise<string> {
    // Validate address format to prevent ENS resolution attempts
    if (!ethers.isAddress(to)) {
      throw new Error(`Invalid recipient address format: ${to}. Must be a valid Ethereum address (0x...)`);
    }

    const tx = await this.executorWallet.sendTransaction({
      to,
      value: ethers.parseEther(amountInEther),
    });

    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  /**
   * Execute contract call via ExecutionRouter
   */
  async executeViaRouter(
    executionId: string,
    intentType: string,
    targetContract: string,
    callData: string,
    valueInEther: string = "0"
  ): Promise<{ hash: string; success: boolean }> {
    if (!config.contracts.executionRouter) {
      throw new Error("ExecutionRouter address not configured");
    }

    const executionRouter = new ethers.Contract(
      config.contracts.executionRouter,
      [
        "function execute(bytes32 executionId, string intentType, address targetContract, bytes callData) payable returns (bool, bytes)",
      ],
      this.executorWallet
    );

    const executionIdBytes = ethers.id(executionId);
    const value = ethers.parseEther(valueInEther);

    const tx = await executionRouter.execute(
      executionIdBytes,
      intentType,
      targetContract,
      callData,
      { value }
    );

    const receipt = await tx.wait();
    
    return {
      hash: receipt.hash,
      success: receipt.status === 1,
    };
  }

  /**
   * Execute payment via ExecutionRouter
   */
  async executePaymentViaRouter(
    executionId: string,
    recipient: string,
    amountInEther: string,
    reason: string
  ): Promise<{ hash: string; success: boolean }> {
    if (!config.contracts.executionRouter) {
      throw new Error("ExecutionRouter address not configured");
    }

    // Validate recipient address format to prevent ENS resolution attempts
    if (!ethers.isAddress(recipient)) {
      throw new Error(`Invalid recipient address format: ${recipient}. Must be a valid Ethereum address (0x...)`);
    }

    const executionRouter = new ethers.Contract(
      config.contracts.executionRouter,
      [
        "function executePayment(bytes32 executionId, address recipient, uint256 amount, string reason) payable",
      ],
      this.executorWallet
    );

    const executionIdBytes = ethers.id(executionId);
    const amount = ethers.parseEther(amountInEther);

    const tx = await executionRouter.executePayment(
      executionIdBytes,
      recipient,
      amount,
      reason,
      { value: amount }
    );

    const receipt = await tx.wait();
    
    return {
      hash: receipt.hash,
      success: receipt.status === 1,
    };
  }

  /**
   * Record attestation
   */
  async recordAttestation(
    executionId: string,
    agentName: string,
    intentHash: string
  ): Promise<string> {
    if (!config.contracts.attestationRegistry) {
      throw new Error("AttestationRegistry address not configured");
    }

    const attestationRegistry = new ethers.Contract(
      config.contracts.attestationRegistry,
      [
        "function attest(bytes32 executionId, string agentName, string intentHash)",
      ],
      this.executorWallet
    );

    const executionIdBytes = ethers.id(executionId);
    const tx = await attestationRegistry.attest(executionIdBytes, agentName, intentHash);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1) {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: ethers.TransactionRequest): Promise<string> {
    const estimate = await this.provider.estimateGas(transaction);
    return estimate.toString();
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice?.toString() || "0";
  }
}

export default new CronosService();
