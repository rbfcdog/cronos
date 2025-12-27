import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  // Network Configuration
  cronos: {
    testnet: {
      rpcUrl: process.env.CRONOS_TESTNET_RPC_URL || "https://evm-t3.cronos.org",
      chainId: parseInt(process.env.CRONOS_TESTNET_CHAIN_ID || "338"),
      explorer: process.env.CRONOS_TESTNET_EXPLORER || "https://explorer.cronos.org/testnet",
    },
  },

  // Private Keys
  keys: {
    deployer: process.env.DEPLOYER_PRIVATE_KEY || "",
    executor: process.env.EXECUTOR_PRIVATE_KEY || "",
  },

  // Wallet Addresses
  addresses: {
    deployer: process.env.DEPLOYER_ADDRESS || "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
    executor: process.env.EXECUTOR_ADDRESS || "0x36aE091C6264Cb30b2353806EEf2F969Dc2893f8",
  },

  // Contract Addresses
  contracts: {
    executionRouter: process.env.EXECUTION_ROUTER_ADDRESS || "",
    treasuryVault: process.env.TREASURY_VAULT_ADDRESS || "",
    attestationRegistry: process.env.ATTESTATION_REGISTRY_ADDRESS || "",
  },

  // x402 Configuration
  x402: {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://facilitator.x402.dev",
    apiKey: process.env.X402_API_KEY || "",
  },

  // AI Configuration
  ai: {
    openaiKey: process.env.OPENAI_API_KEY || "",
    anthropicKey: process.env.ANTHROPIC_API_KEY || "",
    provider: process.env.AI_PROVIDER || "openai", // or "anthropic"
  },

  // Backend Configuration
  backend: {
    port: parseInt(process.env.BACKEND_PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // Validation
  validate() {
    const required = [
      { key: "CRONOS_TESTNET_RPC_URL", value: this.cronos.testnet.rpcUrl },
      { key: "EXECUTOR_PRIVATE_KEY", value: this.keys.executor },
    ];

    const missing = required.filter((item) => !item.value);
    
    if (missing.length > 0) {
      console.warn("⚠️  Missing required configuration:");
      missing.forEach((item) => console.warn(`   - ${item.key}`));
      console.warn("\nPlease check your .env file.");
    }

    return missing.length === 0;
  },
};

export default config;
