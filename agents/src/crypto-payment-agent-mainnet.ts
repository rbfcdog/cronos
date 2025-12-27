/**
 * PRODUCTION CRYPTO PAYMENT AGENT
 * 
 * Uses: @crypto.com/ai-agent-client
 * Purpose: Execute real payments on Cronos Mainnet
 * Testing: Live mainnet transactions with real CRO
 * 
 * This is ONE agent that ACTUALLY WORKS on mainnet.
 */

import { createClient } from '@crypto.com/ai-agent-client';
import type { CdcAiAgentClient } from '@crypto.com/ai-agent-client/dist/lib/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ==================== CONFIGURATION ====================

const CRONOS_MAINNET_RPC = 'https://evm.cronos.org';
const CRONOS_MAINNET_CHAIN_ID = 25;

interface PaymentRequest {
  recipient: string;
  amount: string; // in CRO
  reason?: string;
}

interface PaymentResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

// ==================== CRYPTO PAYMENT AGENT ====================

export class CryptoPaymentAgent {
  private client: CdcAiAgentClient;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    // Initialize Crypto.com AI Agent Client
    this.client = createClient({
      openAI: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
      },
      chainId: CRONOS_MAINNET_CHAIN_ID,
      explorerKeys: {
        cronosMainnetKey: process.env.CRONOS_MAINNET_API_KEY,
      },
      customRPC: CRONOS_MAINNET_RPC,
    });

    // Initialize ethers provider for Cronos Mainnet
    this.provider = new ethers.JsonRpcProvider(CRONOS_MAINNET_RPC);
    
    // Initialize wallet (executor)
    const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('EXECUTOR_PRIVATE_KEY not found in environment');
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Get current wallet info
   */
  async getWalletInfo(): Promise<{
    address: string;
    balance: string;
    network: string;
    chainId: number;
  }> {
    const balance = await this.provider.getBalance(this.wallet.address);
    const network = await this.provider.getNetwork();

    return {
      address: this.wallet.address,
      balance: ethers.formatEther(balance),
      network: 'Cronos Mainnet',
      chainId: Number(network.chainId),
    };
  }

  /**
   * Validate payment request with AI agent
   */
  async validatePayment(request: PaymentRequest): Promise<{
    valid: boolean;
    reasoning: string;
    risks: string[];
  }> {
    console.log('\n🤖 AI Agent: Analyzing payment request...');

    // Use Crypto.com Agent SDK to validate the request
    const query = `Analyze this payment for risks: Send ${request.amount} CRO to ${request.recipient}. Reason: ${request.reason || 'Not specified'}. Is this safe? Check address validity and amount reasonableness. Respond with VALID or INVALID.`;

    try {
      const response = await this.client.agent.generateQuery(query);

      console.log(`   Status: ${response.status}`);
      
      if (response.hasErrors) {
        console.log(`   ⚠️  AI returned errors: ${response.message}`);
        return this.basicValidation(request);
      }

      const analysis = response.results?.[0]?.message || response.message || '';
      const valid = analysis.toLowerCase().includes('valid') && !analysis.toLowerCase().includes('invalid');

      console.log(`   Analysis: ${analysis.substring(0, 200)}...`);

      return {
        valid,
        reasoning: analysis,
        risks: this.extractRisks(analysis),
      };
    } catch (error: any) {
      console.error(`   ⚠️  AI validation failed: ${error.message}`);
      return this.basicValidation(request);
    }
  }

  /**
   * Execute payment on mainnet
   */
  async executePayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('\n💰 Executing Payment on CRONOS MAINNET');
      console.log(`   From: ${this.wallet.address}`);
      console.log(`   To: ${request.recipient}`);
      console.log(`   Amount: ${request.amount} CRO`);

      // 1. Check balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const amountWei = ethers.parseEther(request.amount);

      if (balance < amountWei) {
        throw new Error(`Insufficient balance. Have: ${ethers.formatEther(balance)} CRO, Need: ${request.amount} CRO`);
      }

      // 2. Validate recipient address
      const recipientAddress = ethers.getAddress(request.recipient);

      // 3. Estimate gas
      const gasPrice = await this.provider.getFeeData();
      const estimatedGas = 21000n; // Standard transfer

      console.log(`   ⛽ Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')} gwei`);

      // 4. Create and send transaction
      const tx = await this.wallet.sendTransaction({
        to: recipientAddress,
        value: amountWei,
        gasLimit: estimatedGas,
      });

      console.log(`   📤 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      // 5. Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
      console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: any) {
      console.error(`   ❌ Payment failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Full payment flow with AI validation
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 CRYPTO PAYMENT AGENT - MAINNET EXECUTION');
    console.log('='.repeat(60));

    // Step 1: Validate with AI
    const validation = await this.validatePayment(request);

    if (!validation.valid) {
      console.log('\n❌ Payment rejected by AI agent');
      console.log(`   Reason: ${validation.reasoning}`);
      return {
        success: false,
        error: `AI validation failed: ${validation.reasoning}`,
      };
    }

    if (validation.risks.length > 0) {
      console.log('\n⚠️  Risks detected:');
      validation.risks.forEach((risk) => console.log(`   - ${risk}`));
      console.log('   Proceeding with caution...');
    }

    // Step 2: Execute payment
    return await this.executePayment(request);
  }

  // ==================== HELPER METHODS ====================

  private extractRisks(analysis: string): string[] {
    const risks: string[] = [];
    const riskKeywords = ['risk', 'warning', 'suspicious', 'large', 'unusual'];

    riskKeywords.forEach((keyword) => {
      if (analysis.toLowerCase().includes(keyword)) {
        risks.push(`Potential ${keyword} detected in analysis`);
      }
    });

    return risks;
  }

  private basicValidation(request: PaymentRequest): {
    valid: boolean;
    reasoning: string;
    risks: string[];
  } {
    const risks: string[] = [];

    // Check address format
    try {
      ethers.getAddress(request.recipient);
    } catch {
      return {
        valid: false,
        reasoning: 'Invalid recipient address format',
        risks: ['Invalid address'],
      };
    }

    // Check amount
    const amount = parseFloat(request.amount);
    if (amount <= 0) {
      return {
        valid: false,
        reasoning: 'Amount must be greater than 0',
        risks: ['Invalid amount'],
      };
    }

    if (amount > 100) {
      risks.push('Large payment amount (>100 CRO)');
    }

    return {
      valid: true,
      reasoning: 'Basic validation passed',
      risks,
    };
  }
}

// ==================== MAINNET TEST RUNNER ====================

async function testMainnetPayment() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING CRYPTO PAYMENT AGENT ON MAINNET');
  console.log('='.repeat(60));

  try {
    const agent = new CryptoPaymentAgent();

    // Show wallet info
    console.log('\n📊 Wallet Information:');
    const walletInfo = await agent.getWalletInfo();
    console.log(`   Address: ${walletInfo.address}`);
    console.log(`   Balance: ${walletInfo.balance} CRO`);
    console.log(`   Network: ${walletInfo.network} (Chain ID: ${walletInfo.chainId})`);

    if (parseFloat(walletInfo.balance) < 0.1) {
      console.log('\n⚠️  WARNING: Low balance. Need at least 0.1 CRO for mainnet test');
      console.log('   Skipping payment execution');
      process.exit(0);
    }

    // Test payment (SMALL amount for safety)
    const testPayment: PaymentRequest = {
      recipient: process.env.DEPLOYER_ADDRESS || '0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7',
      amount: '0.01', // Small test amount
      reason: 'Mainnet test payment from Crypto Agent',
    };

    const result = await agent.processPayment(testPayment);

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULT:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ MAINNET PAYMENT SUCCESS!');
      console.log(`   Transaction: https://cronoscan.com/tx/${result.txHash}`);
    } else {
      console.log('\n❌ MAINNET PAYMENT FAILED');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error: any) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// ==================== EXPORT ====================

export default CryptoPaymentAgent;

// Run test if executed directly
if (require.main === module) {
  testMainnetPayment().catch(console.error);
}
