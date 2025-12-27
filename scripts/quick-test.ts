#!/usr/bin/env ts-node
/**
 * Quick Interactive Test Script
 * Tests all contracts with real transactions on Cronos testnet
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface DeploymentInfo {
  executionRouter: string;
  treasuryVault: string;
  attestationRegistry: string;
  deployer: string;
  executor: string;
  timestamp: string;
}

// ABIs (simplified for testing)
const ExecutionRouterABI = [
  'function execute(address target, bytes calldata data) external payable returns (bytes memory)',
  'function executePayment(address recipient, uint256 amount) external payable',
  'function authorizeExecutor(address executor) external',
  'function isAuthorizedExecutor(address executor) external view returns (bool)',
  'function pause() external',
  'function unpause() external',
  'function paused() external view returns (bool)',
  'event ExecutionSuccessful(address indexed executor, address indexed target, uint256 value)',
  'event PaymentExecuted(address indexed executor, address indexed recipient, uint256 amount)',
];

const TreasuryVaultABI = [
  'function deposit() external payable',
  'function setAllowance(address spender, uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function getAllowance(address spender) external view returns (uint256)',
  'function getBalance() external view returns (uint256)',
  'event Deposited(address indexed depositor, uint256 amount)',
  'event AllowanceSet(address indexed spender, uint256 amount)',
  'event Withdrawn(address indexed spender, uint256 amount)',
];

const AttestationRegistryABI = [
  'function attest(address executor, string calldata agentName, bytes32 intentHash, string calldata metadata) external',
  'function addTrustedAttester(address attester) external',
  'function isTrustedAttester(address attester) external view returns (bool)',
  'function getAttestation(bytes32 attestationId) external view returns (tuple(address executor, string agentName, bytes32 intentHash, string metadata, uint256 timestamp, address attester))',
  'event AttestationRecorded(bytes32 indexed attestationId, address indexed executor, string agentName)',
];

async function main() {
  log('\n🧪 Atlas402 Interactive Test Suite\n', 'bright');
  log('='.repeat(60), 'cyan');

  // Setup provider and wallets
  const provider = new ethers.JsonRpcProvider(process.env.CRONOS_TESTNET_RPC_URL);
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
  const executor = new ethers.Wallet(process.env.EXECUTOR_PRIVATE_KEY!, provider);

  log(`\n📍 Network: Cronos Testnet (Chain ID: ${process.env.CRONOS_TESTNET_CHAIN_ID})`, 'cyan');
  log(`📍 RPC: ${process.env.CRONOS_TESTNET_RPC_URL}`, 'cyan');

  // Check if contracts are deployed
  const deploymentPath = path.join(__dirname, '../contracts/deployments/testnet-deployment.json');
  let deployment: DeploymentInfo | null = null;

  if (fs.existsSync(deploymentPath)) {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    log(`\n✅ Found deployed contracts!`, 'green');
  } else {
    log(`\n⚠️  Contracts not deployed yet!`, 'yellow');
    log(`\nRun this first:`, 'yellow');
    log(`  cd contracts && npm run deploy:testnet\n`, 'bright');
    process.exit(1);
  }

  // Display addresses
  log('\n📋 Contract Addresses:', 'bright');
  log(`  ExecutionRouter:      ${deployment.executionRouter}`, 'cyan');
  log(`  TreasuryVault:        ${deployment.treasuryVault}`, 'cyan');
  log(`  AttestationRegistry:  ${deployment.attestationRegistry}`, 'cyan');

  // Check balances
  log('\n💰 Wallet Balances:', 'bright');
  const deployerBalance = await provider.getBalance(deployer.address);
  const executorBalance = await provider.getBalance(executor.address);
  log(`  Deployer (${deployer.address}):`, 'cyan');
  log(`    ${ethers.formatEther(deployerBalance)} tCRO`, 'green');
  log(`  Executor (${executor.address}):`, 'cyan');
  log(`    ${ethers.formatEther(executorBalance)} tCRO`, 'green');

  if (deployerBalance < ethers.parseEther('1')) {
    log(`\n⚠️  Warning: Low deployer balance! Get testnet tCRO from:`, 'yellow');
    log(`    https://cronos.org/faucet\n`, 'bright');
  }

  // Initialize contracts
  const executionRouter = new ethers.Contract(
    deployment.executionRouter,
    ExecutionRouterABI,
    deployer
  );
  const treasuryVault = new ethers.Contract(
    deployment.treasuryVault,
    TreasuryVaultABI,
    deployer
  );
  const attestationRegistry = new ethers.Contract(
    deployment.attestationRegistry,
    AttestationRegistryABI,
    deployer
  );

  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 Starting Tests...', 'bright');
  log('='.repeat(60) + '\n', 'cyan');

  let testsPassed = 0;
  let testsFailed = 0;

  // TEST 1: Check ExecutionRouter authorization
  try {
    log('TEST 1: Check Executor Authorization', 'yellow');
    const isAuthorized = await executionRouter.isAuthorizedExecutor(executor.address);
    if (isAuthorized) {
      log('  ✅ Executor is authorized', 'green');
      testsPassed++;
    } else {
      log('  ❌ Executor is NOT authorized - authorizing now...', 'yellow');
      const tx = await executionRouter.authorizeExecutor(executor.address);
      log(`  📡 Transaction: ${tx.hash}`, 'cyan');
      await tx.wait();
      log('  ✅ Executor authorized!', 'green');
      testsPassed++;
    }
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // TEST 2: Deposit to TreasuryVault
  try {
    log('\nTEST 2: Deposit to TreasuryVault', 'yellow');
    const depositAmount = ethers.parseEther('0.1'); // 0.1 tCRO
    const balanceBefore = await treasuryVault.getBalance();
    
    const tx = await treasuryVault.deposit({ value: depositAmount });
    log(`  📡 Transaction: ${tx.hash}`, 'cyan');
    await tx.wait();
    
    const balanceAfter = await treasuryVault.getBalance();
    log(`  💰 Vault Balance: ${ethers.formatEther(balanceBefore)} → ${ethers.formatEther(balanceAfter)} tCRO`, 'green');
    log('  ✅ Deposit successful!', 'green');
    testsPassed++;
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // TEST 3: Set allowance for executor
  try {
    log('\nTEST 3: Set Allowance for Executor', 'yellow');
    const allowanceAmount = ethers.parseEther('0.05'); // 0.05 tCRO
    
    const tx = await treasuryVault.setAllowance(executor.address, allowanceAmount);
    log(`  📡 Transaction: ${tx.hash}`, 'cyan');
    await tx.wait();
    
    const allowance = await treasuryVault.getAllowance(executor.address);
    log(`  💳 Allowance set: ${ethers.formatEther(allowance)} tCRO`, 'green');
    log('  ✅ Allowance set successfully!', 'green');
    testsPassed++;
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // TEST 4: Execute payment via ExecutionRouter
  try {
    log('\nTEST 4: Execute Payment via ExecutionRouter', 'yellow');
    const recipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'; // Test address
    const paymentAmount = ethers.parseEther('0.01'); // 0.01 tCRO
    
    const recipientBalanceBefore = await provider.getBalance(recipient);
    
    const routerWithExecutor = executionRouter.connect(executor);
    const tx = await routerWithExecutor.executePayment(recipient, paymentAmount, {
      value: paymentAmount,
    });
    log(`  📡 Transaction: ${tx.hash}`, 'cyan');
    const receipt = await tx.wait();
    
    const recipientBalanceAfter = await provider.getBalance(recipient);
    log(`  💸 Payment: ${ethers.formatEther(paymentAmount)} tCRO → ${recipient}`, 'green');
    log(`  💰 Recipient Balance: ${ethers.formatEther(recipientBalanceBefore)} → ${ethers.formatEther(recipientBalanceAfter)} tCRO`, 'green');
    log(`  ⛽ Gas Used: ${receipt.gasUsed.toString()}`, 'cyan');
    log('  ✅ Payment executed successfully!', 'green');
    testsPassed++;
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // TEST 5: Withdraw from TreasuryVault
  try {
    log('\nTEST 5: Withdraw from TreasuryVault', 'yellow');
    const withdrawAmount = ethers.parseEther('0.02'); // 0.02 tCRO
    
    const vaultBalanceBefore = await treasuryVault.getBalance();
    const executorBalanceBefore = await provider.getBalance(executor.address);
    
    const vaultWithExecutor = treasuryVault.connect(executor);
    const tx = await vaultWithExecutor.withdraw(withdrawAmount);
    log(`  📡 Transaction: ${tx.hash}`, 'cyan');
    await tx.wait();
    
    const vaultBalanceAfter = await treasuryVault.getBalance();
    const executorBalanceAfter = await provider.getBalance(executor.address);
    
    log(`  💰 Vault: ${ethers.formatEther(vaultBalanceBefore)} → ${ethers.formatEther(vaultBalanceAfter)} tCRO`, 'green');
    log(`  💰 Executor: ${ethers.formatEther(executorBalanceBefore)} → ${ethers.formatEther(executorBalanceAfter)} tCRO`, 'green');
    log('  ✅ Withdrawal successful!', 'green');
    testsPassed++;
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // TEST 6: Record attestation
  try {
    log('\nTEST 6: Record Attestation', 'yellow');
    
    // First, add executor as trusted attester
    const isTrusted = await attestationRegistry.isTrustedAttester(executor.address);
    if (!isTrusted) {
      log('  🔐 Adding executor as trusted attester...', 'cyan');
      const authTx = await attestationRegistry.addTrustedAttester(executor.address);
      await authTx.wait();
      log('  ✅ Executor added as trusted attester', 'green');
    }
    
    const agentName = 'PlannerAgent';
    const intentHash = ethers.keccak256(ethers.toUtf8Bytes('Send 1 CRO to Alice'));
    const metadata = JSON.stringify({
      intent: 'Send 1 CRO to Alice',
      risk_score: 0.15,
      timestamp: new Date().toISOString(),
    });
    
    const registryWithExecutor = attestationRegistry.connect(executor);
    const tx = await registryWithExecutor.attest(
      executor.address,
      agentName,
      intentHash,
      metadata
    );
    log(`  📡 Transaction: ${tx.hash}`, 'cyan');
    const receipt = await tx.wait();
    
    // Get attestation ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        return attestationRegistry.interface.parseLog(log)?.name === 'AttestationRecorded';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsedEvent = attestationRegistry.interface.parseLog(event);
      log(`  📝 Attestation ID: ${parsedEvent?.args[0]}`, 'cyan');
      log(`  🤖 Agent: ${agentName}`, 'cyan');
    }
    
    log('  ✅ Attestation recorded successfully!', 'green');
    testsPassed++;
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // TEST 7: Pause and unpause ExecutionRouter
  try {
    log('\nTEST 7: Pause and Unpause ExecutionRouter', 'yellow');
    
    // Pause
    log('  ⏸️  Pausing router...', 'cyan');
    const pauseTx = await executionRouter.pause();
    await pauseTx.wait();
    let isPaused = await executionRouter.paused();
    log(`  ✅ Router paused: ${isPaused}`, 'green');
    
    // Unpause
    log('  ▶️  Unpausing router...', 'cyan');
    const unpauseTx = await executionRouter.unpause();
    await unpauseTx.wait();
    isPaused = await executionRouter.paused();
    log(`  ✅ Router unpaused: ${!isPaused}`, 'green');
    
    testsPassed++;
  } catch (error: any) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    testsFailed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Test Results', 'bright');
  log('='.repeat(60), 'cyan');
  log(`✅ Passed: ${testsPassed}`, 'green');
  log(`❌ Failed: ${testsFailed}`, 'red');
  log(`📈 Total:  ${testsPassed + testsFailed}`, 'cyan');
  
  if (testsFailed === 0) {
    log('\n🎉 ALL TESTS PASSED! Your contracts are working! 🎉\n', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.\n', 'yellow');
  }

  // View on explorer
  log('🔍 View on Cronos Explorer:', 'bright');
  log(`  ExecutionRouter:     ${process.env.CRONOS_TESTNET_EXPLORER}/address/${deployment.executionRouter}`, 'cyan');
  log(`  TreasuryVault:       ${process.env.CRONOS_TESTNET_EXPLORER}/address/${deployment.treasuryVault}`, 'cyan');
  log(`  AttestationRegistry: ${process.env.CRONOS_TESTNET_EXPLORER}/address/${deployment.attestationRegistry}`, 'cyan');
  log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
