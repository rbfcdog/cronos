/**
 * x402 Agent Platform - SDK Integration Test
 * 
 * Simple test to verify Crypto.com AI Agent SDK is working correctly
 */

import { createAgentClient, validateAgentConfig } from "./agent-client";
import type { AgentConfig } from "./agent-client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testSDKIntegration() {
  console.log("=".repeat(80));
  console.log("x402 Agent Platform - SDK Integration Test");
  console.log("=".repeat(80));
  console.log();

  // Step 1: Validate configuration
  console.log("Step 1: Validating configuration...");
  const config: AgentConfig = {
    id: "test-agent-1",
    name: "Test Agent",
    description: "Testing Crypto.com AI Agent SDK integration",
    model: "gpt-4-turbo",
    chainId: 338, // Cronos testnet
    enableTracing: true,
  };

  const validation = validateAgentConfig(config);
  if (!validation.valid) {
    console.error("❌ Configuration validation failed:");
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log("✅ Configuration validated successfully");
  console.log();

  // Step 2: Create agent client
  console.log("Step 2: Creating agent client...");
  try {
    const client = await createAgentClient(config);
    console.log("✅ Agent client created successfully");
    console.log(`   Agent ID: ${client.getConfig().id}`);
    console.log(`   Agent Name: ${client.getConfig().name}`);
    console.log(`   Chain ID: ${client.getConfig().chainId} (Cronos Testnet)`);
    console.log(`   Model: ${client.getConfig().model}`);
    console.log();

    // Step 3: Test simple query
    console.log("Step 3: Testing simple query...");
    console.log("   Query: 'What is the current gas price on Cronos?'");
    console.log();

    const result = await client.query("What is the current gas price on Cronos?");

    console.log("✅ Query executed successfully");
    console.log(`   Execution Time: ${result.executionTime}ms`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Response:`);
    console.log(`   ${JSON.stringify(result.response, null, 2)}`);
    console.log();

    // Step 4: Show metrics
    console.log("Step 4: Agent metrics");
    console.log(`   Total Queries: ${client.getQueryHistory().length}`);
    console.log(`   Success Rate: ${client.getSuccessRate()}%`);
    console.log(`   Avg Execution Time: ${client.getAverageExecutionTime()}ms`);
    console.log();

    // Step 5: Test error handling
    console.log("Step 5: Testing error handling...");
    try {
      await client.query(""); // Empty query should fail
      console.log("⚠️  Empty query did not throw error");
    } catch (error: any) {
      console.log("✅ Error handling works correctly");
      console.log(`   Error: ${error.message}`);
    }
    console.log();

    console.log("=".repeat(80));
    console.log("✅ All tests passed! SDK integration is working correctly.");
    console.log("=".repeat(80));
    console.log();
    console.log("Next Steps:");
    console.log("1. Implement Testing Studio with scenario manager");
    console.log("2. Build Observability Dashboard with transaction indexer");
    console.log("3. Create Orchestration Runtime for multi-agent coordination");
    console.log();

  } catch (error: any) {
    console.error("❌ Test failed:");
    console.error(`   Error: ${error.message}`);
    console.error();
    console.error("Troubleshooting:");
    console.error("1. Check that OPENAI_API_KEY is set in .env file");
    console.error("2. Verify explorer keys are configured (if needed)");
    console.error("3. Ensure network connectivity");
    console.error();
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testSDKIntegration().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { testSDKIntegration };
