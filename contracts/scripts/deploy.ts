import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  console.log("🚀 Starting deployment to Cronos Testnet...\n");

  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    console.error("❌ No deployer account found!");
    console.error("Make sure DEPLOYER_PRIVATE_KEY is set in .env");
    process.exit(1);
  }
  
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CRO\n");
  
  if (balance < ethers.parseEther("1")) {
    console.warn("⚠️  Warning: Low balance! Get testnet CRO from https://cronos.org/faucet\n");
  }

  // Deploy ExecutionRouter
  console.log("📜 Deploying ExecutionRouter...");
  const ExecutionRouter = await ethers.getContractFactory("ExecutionRouter");
  const executionRouter = await ExecutionRouter.deploy();
  await executionRouter.waitForDeployment();
  const executionRouterAddress = await executionRouter.getAddress();
  console.log("✅ ExecutionRouter deployed to:", executionRouterAddress);

  // Deploy TreasuryVault
  console.log("\n💰 Deploying TreasuryVault...");
  const TreasuryVault = await ethers.getContractFactory("TreasuryVault");
  const treasuryVault = await TreasuryVault.deploy();
  await treasuryVault.waitForDeployment();
  const treasuryVaultAddress = await treasuryVault.getAddress();
  console.log("✅ TreasuryVault deployed to:", treasuryVaultAddress);

  // Deploy AttestationRegistry
  console.log("\n📋 Deploying AttestationRegistry...");
  const AttestationRegistry = await ethers.getContractFactory("AttestationRegistry");
  const attestationRegistry = await AttestationRegistry.deploy();
  await attestationRegistry.waitForDeployment();
  const attestationRegistryAddress = await attestationRegistry.getAddress();
  console.log("✅ AttestationRegistry deployed to:", attestationRegistryAddress);

  // Setup permissions
  console.log("\n🔧 Setting up permissions...");
  
  // Authorize deployer as executor
  console.log("Authorizing deployer as executor...");
  await executionRouter.authorizeExecutor(deployer.address);
  
  // Set allowance for ExecutionRouter in TreasuryVault
  console.log("Setting treasury allowance for ExecutionRouter...");
  const allowanceAmount = ethers.parseEther("100"); // 100 CRO
  await treasuryVault.setAllowance(executionRouterAddress, allowanceAmount);
  
  // Add deployer as trusted attester
  console.log("Adding deployer as trusted attester...");
  await attestationRegistry.addTrustedAttester(deployer.address);

  console.log("\n✅ All permissions configured!");

  // Save deployment info
  const deploymentInfo = {
    network: "cronosTestnet",
    chainId: 338,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ExecutionRouter: executionRouterAddress,
      TreasuryVault: treasuryVaultAddress,
      AttestationRegistry: attestationRegistryAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, "testnet-deployment.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", deploymentFile);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   ExecutionRouter:", executionRouterAddress);
  console.log("   TreasuryVault:", treasuryVaultAddress);
  console.log("   AttestationRegistry:", attestationRegistryAddress);
  console.log("\n🔗 Verify on Explorer:");
  console.log(`   https://explorer.cronos.org/testnet/address/${executionRouterAddress}`);
  console.log("\n💡 Next Steps:");
  console.log("   1. Update .env with these contract addresses");
  console.log("   2. Verify contracts: npm run verify");
  console.log("   3. Fund TreasuryVault with test CRO");
  console.log("   4. Test execution flow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
