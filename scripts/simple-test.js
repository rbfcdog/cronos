#!/usr/bin/env node
/**
 * Simple Test Script - View and Test Deployed Contracts
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🧪 Atlas402 Contract Testing\n', 'bright');
  log('='.repeat(70), 'cyan');

  // Check if deployment exists
  const deploymentPath = path.join(__dirname, '../contracts/deployments/testnet-deployment.json');
  
  if (!fs.existsSync(deploymentPath)) {
    log('\n❌ Contracts not deployed yet!', 'red');
    log('\nDeploy first with:', 'yellow');
    log('  cd contracts && npm run deploy:testnet\n', 'bright');
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));

  // Setup provider and wallets
  const provider = new ethers.JsonRpcProvider(process.env.CRONOS_TESTNET_RPC_URL);
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const executor = new ethers.Wallet(process.env.EXECUTOR_PRIVATE_KEY, provider);

  log(`\n📍 Network: Cronos Testnet`, 'cyan');
  log(`📍 RPC: ${process.env.CRONOS_TESTNET_RPC_URL}`, 'cyan');

  // Display contract addresses
  log('\n📋 Deployed Contracts:', 'bright');
  log(`  ExecutionRouter:      ${deployment.contracts.ExecutionRouter}`, 'cyan');
  log(`  TreasuryVault:        ${deployment.contracts.TreasuryVault}`, 'cyan');
  log(`  AttestationRegistry:  ${deployment.contracts.AttestationRegistry}`, 'cyan');

  // Check wallet balances
  log('\n💰 Wallet Balances:', 'bright');
  const deployerBalance = await provider.getBalance(deployer.address);
  const executorBalance = await provider.getBalance(executor.address);
  
  log(`  Deployer (${deployer.address}):`, 'cyan');
  log(`    ${ethers.formatEther(deployerBalance)} tCRO`, 'green');
  log(`  Executor (${executor.address}):`, 'cyan');
    log(`    ${ethers.formatEther(executorBalance)} tCRO`, 'green');

  if (deployerBalance < ethers.parseEther('1')) {
    log(`\n⚠️  Warning: Low deployer balance!`, 'yellow');
    log(`    Get testnet CRO from: https://cronos.org/faucet`, 'yellow');
  }

  // Initialize contracts with minimal ABIs
  const executionRouterABI = [
    'function executePayment(address recipient, uint256 amount) external payable',
    'function isAuthorizedExecutor(address executor) external view returns (bool)',
    'function authorizeExecutor(address executor) external',
    'event PaymentExecuted(address indexed executor, address indexed recipient, uint256 amount)',
  ];

  const treasuryVaultABI = [
    'function deposit() external payable',
    'function getBalance() external view returns (uint256)',
    'function setAllowance(address spender, uint256 amount) external',
    'function getAllowance(address spender) external view returns (uint256)',
    'function withdraw(uint256 amount) external',
    'event Deposited(address indexed depositor, uint256 amount)',
  ];

  const attestationRegistryABI = [
    'function attest(address executor, string agentName, bytes32 intentHash, string metadata) external',
    'function isTrustedAttester(address attester) external view returns (bool)',
    'function addTrustedAttester(address attester) external',
    'event AttestationRecorded(bytes32 indexed attestationId, address indexed executor, string agentName)',
  ];

  const executionRouter = new ethers.Contract(
    deployment.contracts.ExecutionRouter,
    executionRouterABI,
    deployer
  );

  const treasuryVault = new ethers.Contract(
    deployment.contracts.TreasuryVault,
    treasuryVaultABI,
    deployer
  );

  const attestationRegistry = new ethers.Contract(
    deployment.contracts.AttestationRegistry,
    attestationRegistryABI,
    deployer
  );

  log('\n' + '='.repeat(70), 'cyan');
  log('🧪 Running Tests...', 'bright');
  log('='.repeat(70) + '\n', 'cyan');

  let passed = 0;
  let failed = 0;

  // TEST 1: Check authorization
  try {
    log('TEST 1: Check Executor Authorization', 'yellow');
    const isAuthorized = await executionRouter.isAuthorizedExecutor(executor.address);
    
    if (isAuthorized) {
      log('  ✅ Executor is authorized', 'green');
      passed++;
    } else {
      log('  ⚠️  Executor not authorized - authorizing now...', 'yellow');
      const tx = await executionRouter.authorizeExecutor(executor.address);
      log(`  📡 TX: ${tx.hash}`, 'cyan');
      await tx.wait();
      log('  ✅ Executor authorized!', 'green');
      passed++;
    }
  } catch (error) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    failed++;
  }

  // TEST 2: Check vault balance
  try {
    log('\nTEST 2: Check TreasuryVault Balance', 'yellow');
    const vaultBalance = await treasuryVault.getBalance();
    log(`  💰 Current vault balance: ${ethers.formatEther(vaultBalance)} tCRO`, 'green');
    log('  ✅ Vault accessible', 'green');
    passed++;
  } catch (error) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    failed++;
  }

  // TEST 3: Deposit to vault
  try {
    log('\nTEST 3: Deposit to TreasuryVault', 'yellow');
    const depositAmount = ethers.parseEther('1'); // 1 tCRO
    
    const balanceBefore = await treasuryVault.getBalance();
    const tx = await treasuryVault.deposit({ value: depositAmount });
    log(`  📡 TX: ${tx.hash}`, 'cyan');
    await tx.wait();
    
    const balanceAfter = await treasuryVault.getBalance();
    log(`  💰 Vault: ${ethers.formatEther(balanceBefore)} → ${ethers.formatEther(balanceAfter)} tCRO`, 'green');
    log('  ✅ Deposit successful!', 'green');
    passed++;
  } catch (error) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    failed++;
  }

  // TEST 4: Execute payment
  try {
    log('\nTEST 4: Execute Payment via ExecutionRouter', 'yellow');
    const recipient = ethers.getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1');
    const paymentAmount = ethers.parseEther('0.01'); // 0.01 tCRO
    
    const recipientBefore = await provider.getBalance(recipient);
    
    const routerWithExecutor = executionRouter.connect(executor);
    const tx = await routerWithExecutor.executePayment(recipient, paymentAmount, {
      value: paymentAmount,
    });
    
    log(`  📡 TX: ${tx.hash}`, 'cyan');
    const receipt = await tx.wait();
    
    const recipientAfter = await provider.getBalance(recipient);
    log(`  💸 Sent ${ethers.formatEther(paymentAmount)} tCRO to ${recipient}`, 'green');
    log(`  💰 Recipient: ${ethers.formatEther(recipientBefore)} → ${ethers.formatEther(recipientAfter)} tCRO`, 'green');
    log(`  ⛽ Gas used: ${receipt.gasUsed.toString()}`, 'cyan');
    log('  ✅ Payment successful!', 'green');
    passed++;
  } catch (error) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    failed++;
  }

  // TEST 5: Record attestation
  try {
    log('\nTEST 5: Record Attestation', 'yellow');
    
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
    
    log(`  📡 TX: ${tx.hash}`, 'cyan');
    await tx.wait();
    
    log(`  🤖 Agent: ${agentName}`, 'cyan');
    log('  ✅ Attestation recorded!', 'green');
    passed++;
  } catch (error) {
    log(`  ❌ FAILED: ${error.message}`, 'red');
    failed++;
  }

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('📊 Test Results', 'bright');
  log('='.repeat(70), 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'cyan');
  log(`📈 Total:  ${passed + failed}`, 'cyan');
  
  if (failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Your contracts are working! 🎉\n', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.\n', 'yellow');
  }

  // Explorer links
  log('🔍 View on Cronos Explorer:', 'bright');
  log(`  ${process.env.CRONOS_TESTNET_EXPLORER}/address/${deployment.contracts.ExecutionRouter}`, 'blue');
  log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
