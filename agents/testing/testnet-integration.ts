/**
 * 🔥 Testnet Integration Tests
 * 
 * LIVE TESTING on Cronos Testnet
 * Tests real blockchain interactions, actual gas costs, real transaction execution.
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createTrace } from '../observability/trace-system';

// Load testnet configuration
dotenv.config({ path: path.join(__dirname, '../.env.testnet') });
dotenv.config(); // Fallback to root .env

// Cronos Testnet Configuration
const TESTNET_RPC = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
const TESTNET_CHAIN_ID = 338;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Test recipient address (valid checksummed address)
const TEST_RECIPIENT = '0x742d35CC6634c0532925a3B844bC9e7595F0BeB4' as const;

interface TestResult {
  testName: string;
  passed: boolean;
  txHash?: string;
  gasUsed?: string;
  gasCostTCRO?: string;
  blockNumber?: number;
  duration: number;
  error?: string;
}

class TestnetTester {
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private results: TestResult[] = [];
  
  constructor() {
    // Create provider with custom network config (disable ENS)
    const network = new ethers.Network('cronos-testnet', TESTNET_CHAIN_ID);
    this.provider = new ethers.JsonRpcProvider(TESTNET_RPC, network, {
      staticNetwork: network
    });
  }
  
  async initialize(): Promise<boolean> {
    try {
      // Check network
      const network = await this.provider.getNetwork();
      console.log(`\n🌐 Connected to Cronos Testnet`);
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Network: ${network.name || 'cronos-testnet'}\n`);
      
      if (!PRIVATE_KEY) {
        console.error('❌ PRIVATE_KEY not found in .env');
        console.log('   Please set PRIVATE_KEY in your .env file');
        return false;
      }
      
      // Initialize wallet
      this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
      const balance = await this.provider.getBalance(this.wallet.address);
      
      console.log(`💰 Test Wallet:`);
      console.log(`   Address: ${this.wallet.address}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} TCRO\n`);
      
      if (balance === 0n) {
        console.error('❌ Test wallet has no TCRO');
        console.log('   Get testnet TCRO from: https://cronos.org/faucet');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      return false;
    }
  }
  
  /**
   * Test 1: Simple TCRO Transfer
   */
  async testSimpleTransfer(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Simple TCRO Transfer';
    
    console.log(`\n🧪 Test 1: ${testName}`);
    console.log(`   Sending 0.001 TCRO to ${TEST_RECIPIENT}`);
    
    const trace = createTrace('payment', 'TESTNET-001')
      .withInitialState({
        balance: ethers.formatEther(await this.provider.getBalance(this.wallet!.address)),
        gasPrice: (await this.provider.getFeeData()).gasPrice?.toString() || '0',
        networkCondition: 'low'
      })
      .tag('testnet', 'live', 'simple-transfer');
    
    try {
      trace.analyze('Prepare Transaction', {
        to: TEST_RECIPIENT,
        value: '0.001',
        from: this.wallet!.address
      }, 'Creating simple TCRO transfer');
      
      // Use getAddress to ensure proper checksum and bypass ENS
      const recipientAddress = ethers.getAddress(TEST_RECIPIENT);
      
      const tx = await this.wallet!.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther('0.001')
      });
      
      trace.execute('Submit Transaction', '21000', 0.95);
      console.log(`   📤 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      const gasCostWei = receipt.gasUsed * (receipt.gasPrice || 0n);
      const gasCostTCRO = ethers.formatEther(gasCostWei);
      
      trace.succeed(receipt.gasUsed.toString()).build();
      
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
      console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   💰 Gas cost: ${gasCostTCRO} TCRO`);
      
      return {
        testName,
        passed: true,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        gasCostTCRO,
        blockNumber: receipt.blockNumber,
        duration: Date.now() - startTime
      };
      
    } catch (error: any) {
      trace.fail(error.message).build();
      console.error(`   ❌ Failed:`, error.message);
      
      return {
        testName,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Test 2: Gas Estimation Accuracy
   */
  async testGasEstimation(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Gas Estimation Accuracy';
    
    console.log(`\n🧪 Test 2: ${testName}`);
    
    const trace = createTrace('payment', 'TESTNET-002')
      .tag('testnet', 'gas-estimation');
    
    try {
      // Estimate gas
      const recipientAddress = ethers.getAddress(TEST_RECIPIENT);
      const estimatedGas = await this.wallet!.estimateGas({
        to: recipientAddress,
        value: ethers.parseEther('0.001')
      });
      
      trace.analyze('Gas Estimation', {
        estimated: estimatedGas.toString()
      }, 'Comparing estimated vs actual gas usage');
      
      console.log(`   📊 Estimated gas: ${estimatedGas.toString()}`);
      
      // Execute transaction (reuse recipientAddress)
      const tx = await this.wallet!.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther('0.001'),
        gasLimit: estimatedGas
      });
      
      console.log(`   📤 Transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      const actualGas = receipt.gasUsed;
      const accuracy = Number(estimatedGas) / Number(actualGas) * 100;
      
      trace.addStep({
        phase: 'validation',
        description: 'Accuracy Check',
        outputs: {
          estimated: estimatedGas.toString(),
          actual: actualGas.toString(),
          accuracy: `${accuracy.toFixed(2)}%`
        }
      });
      
      console.log(`   ⛽ Actual gas: ${actualGas.toString()}`);
      console.log(`   📈 Accuracy: ${accuracy.toFixed(2)}%`);
      
      trace.succeed(actualGas.toString()).build();
      
      const passed = accuracy >= 80 && accuracy <= 120; // Within 20%
      
      if (passed) {
        console.log(`   ✅ Gas estimation accurate!`);
      } else {
        console.log(`   ⚠️  Gas estimation off by ${Math.abs(100 - accuracy).toFixed(2)}%`);
      }
      
      return {
        testName,
        passed,
        txHash: receipt.hash,
        gasUsed: actualGas.toString(),
        gasCostTCRO: ethers.formatEther(actualGas * (receipt.gasPrice || 0n)),
        blockNumber: receipt.blockNumber,
        duration: Date.now() - startTime
      };
      
    } catch (error: any) {
      trace.fail(error.message).build();
      console.error(`   ❌ Failed:`, error.message);
      
      return {
        testName,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Test 3: Balance Validation
   */
  async testBalanceValidation(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Balance Validation';
    
    console.log(`\n🧪 Test 3: ${testName}`);
    
    const trace = createTrace('payment', 'TESTNET-003')
      .tag('testnet', 'validation');
    
    try {
      const balanceBefore = await this.provider.getBalance(this.wallet!.address);
      console.log(`   💰 Balance before: ${ethers.formatEther(balanceBefore)} TCRO`);
      
      trace.analyze('Pre-Transaction State', {
        balance: ethers.formatEther(balanceBefore)
      }, 'Recording initial balance');
      
      const sendAmount = ethers.parseEther('0.001');
      
      // Check if we have enough
      if (balanceBefore < sendAmount) {
        throw new Error('Insufficient balance for test');
      }
      
      trace.validate('Balance Check', {
        sufficient: true,
        hasEnough: balanceBefore >= sendAmount
      });
      
      const recipientAddress = ethers.getAddress(TEST_RECIPIENT);
      
      const tx = await this.wallet!.sendTransaction({
        to: recipientAddress,
        value: sendAmount
      });
      
      console.log(`   📤 Sending 0.001 TCRO...`);
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      const balanceAfter = await this.provider.getBalance(this.wallet!.address);
      const gasCost = receipt.gasUsed * (receipt.gasPrice || 0n);
      const expectedBalance = balanceBefore - sendAmount - gasCost;
      
      console.log(`   💰 Balance after: ${ethers.formatEther(balanceAfter)} TCRO`);
      console.log(`   ⛽ Gas cost: ${ethers.formatEther(gasCost)} TCRO`);
      console.log(`   📊 Expected: ${ethers.formatEther(expectedBalance)} TCRO`);
      
      trace.validate('Balance After Transaction', {
        balanceMatches: balanceAfter === expectedBalance,
        correctDeduction: true
      });
      
      const passed = balanceAfter === expectedBalance;
      
      if (passed) {
        console.log(`   ✅ Balance updated correctly!`);
      } else {
        console.log(`   ⚠️  Balance mismatch`);
      }
      
      trace.succeed(receipt.gasUsed.toString()).build();
      
      return {
        testName,
        passed,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        gasCostTCRO: ethers.formatEther(gasCost),
        blockNumber: receipt.blockNumber,
        duration: Date.now() - startTime
      };
      
    } catch (error: any) {
      trace.fail(error.message).build();
      console.error(`   ❌ Failed:`, error.message);
      
      return {
        testName,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Test 4: Network Conditions
   */
  async testNetworkConditions(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Network Conditions Check';
    
    console.log(`\n🧪 Test 4: ${testName}`);
    
    const trace = createTrace('payment', 'TESTNET-004')
      .tag('testnet', 'network');
    
    try {
      const feeData = await this.provider.getFeeData();
      const blockNumber = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(blockNumber);
      
      console.log(`   🌐 Network Status:`);
      console.log(`   - Block: ${blockNumber}`);
      console.log(`   - Gas Price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'N/A'} gwei`);
      console.log(`   - Max Fee: ${feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'N/A'} gwei`);
      console.log(`   - Timestamp: ${block ? new Date(block.timestamp * 1000).toISOString() : 'N/A'}`);
      
      trace.analyze('Network Analysis', {
        blockNumber: blockNumber.toString(),
        gasPrice: feeData.gasPrice?.toString() || '0',
        timestamp: block?.timestamp || 0
      }, 'Checking network conditions');
      
      const recipientAddress = ethers.getAddress(TEST_RECIPIENT);
      
      // Test transaction submission under current conditions
      const tx = await this.wallet!.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther('0.001'),
        gasPrice: feeData.gasPrice
      });
      
      console.log(`   📤 Testing under current conditions...`);
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }
      
      console.log(`   ✅ Transaction successful under current network conditions`);
      
      trace.succeed(receipt.gasUsed.toString()).build();
      
      return {
        testName,
        passed: true,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        gasCostTCRO: ethers.formatEther(receipt.gasUsed * (receipt.gasPrice || 0n)),
        blockNumber: receipt.blockNumber,
        duration: Date.now() - startTime
      };
      
    } catch (error: any) {
      trace.fail(error.message).build();
      console.error(`   ❌ Failed:`, error.message);
      
      return {
        testName,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Test 5: Multiple Sequential Transactions
   */
  async testSequentialTransactions(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Sequential Transactions (Nonce Management)';
    
    console.log(`\n🧪 Test 5: ${testName}`);
    console.log(`   Sending 3 transactions sequentially...`);
    
    const trace = createTrace('payment', 'TESTNET-005')
      .tag('testnet', 'sequential', 'nonce');
    
    try {
      const txHashes: string[] = [];
      const amounts = ['0.0001', '0.0002', '0.0003'];
      const recipientAddress = ethers.getAddress(TEST_RECIPIENT);
      
      for (let i = 0; i < amounts.length; i++) {
        const amount = amounts[i];
        console.log(`\n   Transaction ${i + 1}/3: ${amount} TCRO`);
        
        trace.analyze(`Transaction ${i + 1}`, {
          amount,
          sequence: i + 1
        }, `Sending sequential transaction`);
        
        const tx = await this.wallet!.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount)
        });
        
        txHashes.push(tx.hash);
        console.log(`   📤 Hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (!receipt) {
          throw new Error(`Receipt not found for tx ${i + 1}`);
        }
        
        console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
      }
      
      console.log(`\n   ✅ All 3 transactions successful!`);
      trace.succeed('63000').build(); // Approximate total
      
      return {
        testName,
        passed: true,
        txHash: txHashes.join(', '),
        duration: Date.now() - startTime
      };
      
    } catch (error: any) {
      trace.fail(error.message).build();
      console.error(`   ❌ Failed:`, error.message);
      
      return {
        testName,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('='.repeat(80));
    console.log('🔥 CRONOS TESTNET INTEGRATION TESTS');
    console.log('='.repeat(80));
    
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('\n❌ Initialization failed. Cannot proceed with tests.\n');
      return;
    }
    
    // Run tests
    this.results.push(await this.testSimpleTransfer());
    this.results.push(await this.testGasEstimation());
    this.results.push(await this.testBalanceValidation());
    this.results.push(await this.testNetworkConditions());
    this.results.push(await this.testSequentialTransactions());
    
    // Print summary
    this.printSummary();
  }
  
  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const totalGas = this.results
      .filter(r => r.gasUsed)
      .reduce((sum, r) => sum + parseInt(r.gasUsed || '0'), 0);
    
    console.log(`\n📈 Results:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Pass Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   ⛽ Total Gas Used: ${totalGas}`);
    
    console.log(`\n📋 Detailed Results:`);
    this.results.forEach((result, idx) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`\n   ${idx + 1}. ${status} ${result.testName}`);
      if (result.txHash) {
        console.log(`      Tx: ${result.txHash}`);
      }
      if (result.gasUsed) {
        console.log(`      Gas: ${result.gasUsed} (${result.gasCostTCRO} TCRO)`);
      }
      if (result.blockNumber) {
        console.log(`      Block: ${result.blockNumber}`);
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      console.log(`      Duration: ${(result.duration / 1000).toFixed(2)}s`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (passed === this.results.length) {
      console.log('✨ ALL TESTNET TESTS PASSED! ✨');
    } else {
      console.log(`⚠️  ${failed} test(s) need attention`);
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

// Run tests
async function main() {
  const tester = new TestnetTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { TestnetTester };
