#!/usr/bin/env node
/**
 * Setup Script - Authorize executor and configure contracts
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log('\n🔧 Setting up contract permissions...\n');

  const deploymentPath = path.join(__dirname, '../contracts/deployments/testnet-deployment.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));

  const provider = new ethers.JsonRpcProvider(process.env.CRONOS_TESTNET_RPC_URL);
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const executor = new ethers.Wallet(process.env.EXECUTOR_PRIVATE_KEY, provider);

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Executor: ${executor.address}\n`);

  // Authorize executor
  const routerABI = [
    'function authorizeExecutor(address executor) external',
    'function isAuthorizedExecutor(address executor) external view returns (bool)',
  ];

  const router = new ethers.Contract(
    deployment.contracts.ExecutionRouter,
    routerABI,
    deployer
  );

  console.log('Authorizing executor...');
  const tx1 = await router.authorizeExecutor(executor.address);
  console.log(`TX: ${tx1.hash}`);
  await tx1.wait();
  console.log('✅ Executor authorized\n');

  // Add trusted attester
  const registryABI = [
    'function addTrustedAttester(address attester) external',
    'function isTrustedAttester(address attester) external view returns (bool)',
  ];

  const registry = new ethers.Contract(
    deployment.contracts.AttestationRegistry,
    registryABI,
    deployer
  );

  console.log('Adding executor as trusted attester...');
  const tx2 = await registry.addTrustedAttester(executor.address);
  console.log(`TX: ${tx2.hash}`);
  await tx2.wait();
  console.log('✅ Executor added as trusted attester\n');

  console.log('🎉 Setup complete!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
