#!/usr/bin/env node

/**
 * x402 Agent Playground - Demo Script
 * 
 * Demonstrates the complete flow: Agent → Plan → Simulate → Execute
 */

const fetch = require("node-fetch");

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const PLAYGROUND_API = `${API_BASE}/api/playground`;

// Color output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function section(title) {
  console.log("\n" + "=".repeat(70));
  log(colors.bright + colors.cyan, title);
  console.log("=".repeat(70) + "\n");
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Demo 1: Simple Payment Simulation
 */
async function demoSimplePayment() {
  section("DEMO 1: Simple Payment Simulation");

  const plan = {
    mode: "simulate",
    planId: "demo_simple_payment",
    description: "Simulate sending 0.5 CRO to Alice",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check initial balance",
      },
      {
        type: "x402_payment",
        to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        amount: "0.5",
        token: "TCRO",
        description: "Send 0.5 TCRO to Alice",
      },
    ],
  };

  log(colors.blue, "📋 Execution Plan:");
  console.log(JSON.stringify(plan, null, 2));
  console.log();

  log(colors.yellow, "🔄 Simulating execution...\n");

  try {
    const response = await fetch(`${PLAYGROUND_API}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });

    const result = await response.json();

    if (result.success) {
      log(colors.green, "✅ Simulation successful!");
      console.log();
      log(colors.cyan, "📊 Summary:");
      console.log(`   Total Steps: ${result.data.summary.totalSteps}`);
      console.log(`   Successful: ${result.data.summary.successfulSteps}`);
      console.log(`   Failed: ${result.data.summary.failedSteps}`);
      console.log(`   Gas Estimate: ${result.data.summary.totalGasEstimate}`);
      console.log();
      
      log(colors.cyan, "💰 Virtual State (After):");
      const state = result.data.trace.virtualState;
      console.log(`   Wallet: ${state.wallet.address.slice(0, 10)}...`);
      console.log(`   TCRO Balance: ${state.wallet.balances.TCRO} TCRO`);
      console.log(`   USDC Balance: ${state.wallet.balances.USDC} USDC`);
      console.log();

      log(colors.cyan, "📝 Trace:");
      result.data.trace.steps.forEach((step, i) => {
        console.log(`   Step ${i + 1}: ${step.action.type} - ${step.status}`);
        if (step.gasEstimate) {
          console.log(`           Gas: ${step.gasEstimate}`);
        }
      });

      return result.data.runId;
    } else {
      log(colors.red, "❌ Simulation failed:", result.error);
    }
  } catch (error) {
    log(colors.red, "❌ Error:", error.message);
  }
}

/**
 * Demo 2: Multi-Step Simulation
 */
async function demoMultiStep() {
  section("DEMO 2: Multi-Step Transaction Simulation");

  const plan = {
    mode: "simulate",
    planId: "demo_multi_step",
    description: "Complex multi-step execution",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check TCRO balance",
      },
      {
        type: "read_state",
        contract: "ExecutionRouter",
        description: "Verify ExecutionRouter is deployed",
      },
      {
        type: "x402_payment",
        to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        amount: "1.0",
        token: "TCRO",
        description: "Send 1 TCRO via x402",
      },
      {
        type: "contract_call",
        contract: "ExecutionRouter",
        method: "executePayment",
        args: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", "1000000000000000000", "Demo payment"],
        description: "Execute via ExecutionRouter contract",
      },
    ],
  };

  log(colors.blue, "📋 Multi-Step Plan:");
  console.log(`   Total Actions: ${plan.actions.length}`);
  plan.actions.forEach((action, i) => {
    console.log(`   ${i + 1}. ${action.type} - ${action.description}`);
  });
  console.log();

  log(colors.yellow, "🔄 Simulating...\n");

  try {
    const response = await fetch(`${PLAYGROUND_API}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });

    const result = await response.json();

    if (result.success) {
      log(colors.green, "✅ All steps completed successfully!");
      console.log();
      
      log(colors.cyan, "📊 Execution Summary:");
      console.log(`   Run ID: ${result.data.runId}`);
      console.log(`   Duration: ${result.data.trace.metadata.duration}ms`);
      console.log(`   Total Gas: ${result.data.summary.totalGasEstimate}`);
      
      if (result.data.trace.warnings.length > 0) {
        console.log();
        log(colors.yellow, "⚠️  Warnings:");
        result.data.trace.warnings.forEach(w => console.log(`   - ${w}`));
      }

      return result.data.runId;
    } else {
      log(colors.red, "❌ Simulation failed:", result.error);
    }
  } catch (error) {
    log(colors.red, "❌ Error:", error.message);
  }
}

/**
 * Demo 3: Plan Validation
 */
async function demoValidation() {
  section("DEMO 3: Plan Validation (Invalid Plan)");

  const invalidPlan = {
    mode: "simulate",
    actions: [
      {
        type: "x402_payment",
        // Missing 'to' and 'amount' fields
        token: "TCRO",
        description: "Invalid payment (missing required fields)",
      },
    ],
  };

  log(colors.blue, "📋 Invalid Plan (missing 'to' and 'amount'):");
  console.log(JSON.stringify(invalidPlan, null, 2));
  console.log();

  log(colors.yellow, "🔍 Validating...\n");

  try {
    const response = await fetch(`${PLAYGROUND_API}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPlan),
    });

    const result = await response.json();

    if (!result.data.valid) {
      log(colors.yellow, "⚠️  Validation detected errors:");
      result.data.errors.forEach(e => console.log(`   ❌ ${e}`));
      
      if (result.data.warnings.length > 0) {
        console.log();
        log(colors.yellow, "⚠️  Warnings:");
        result.data.warnings.forEach(w => console.log(`   - ${w}`));
      }
    }
  } catch (error) {
    log(colors.red, "❌ Error:", error.message);
  }
}

/**
 * Demo 4: Retrieve Run Details
 */
async function demoRetrieveRun(runId) {
  if (!runId) {
    console.log("\n(Skipping retrieve demo - no runId available)\n");
    return;
  }

  section("DEMO 4: Retrieve Run Details");

  log(colors.blue, `📖 Fetching run: ${runId}`);
  console.log();

  try {
    const response = await fetch(`${PLAYGROUND_API}/runs/${runId}`);
    const result = await response.json();

    if (result.success) {
      log(colors.green, "✅ Run retrieved successfully!");
      console.log();
      
      log(colors.cyan, "📊 Run Summary:");
      const summary = result.data.summary;
      console.log(`   Run ID: ${summary.runId}`);
      console.log(`   Status: ${summary.status}`);
      console.log(`   Steps: ${summary.steps.length}`);
      
      console.log();
      log(colors.cyan, "🔍 Step Details:");
      summary.steps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step.action}: ${step.status}`);
        if (step.gas) console.log(`      Gas: ${step.gas}`);
      });
    } else {
      log(colors.red, "❌ Failed to retrieve run:", result.error);
    }
  } catch (error) {
    log(colors.red, "❌ Error:", error.message);
  }
}

/**
 * Demo 5: List All Runs
 */
async function demoListRuns() {
  section("DEMO 5: List All Execution Runs");

  log(colors.blue, "📚 Fetching all runs...");
  console.log();

  try {
    const response = await fetch(`${PLAYGROUND_API}/runs`);
    const result = await response.json();

    if (result.success) {
      log(colors.green, `✅ Found ${result.data.total} runs`);
      console.log();

      if (result.data.total > 0) {
        log(colors.cyan, "📋 Recent Runs:");
        result.data.runs.slice(0, 5).forEach((run, i) => {
          console.log(`   ${i + 1}. ${run.runId}`);
          console.log(`      Mode: ${run.mode}`);
          console.log(`      Status: ${run.status}`);
          console.log(`      Steps: ${run.stepsCount}`);
          console.log(`      Time: ${run.startTime}`);
          console.log();
        });
      } else {
        console.log("   (No runs yet - run simulations first)");
      }
    }
  } catch (error) {
    log(colors.red, "❌ Error:", error.message);
  }
}

/**
 * Main demo runner
 */
async function main() {
  console.log("\n");
  log(colors.bright + colors.cyan, "╔═══════════════════════════════════════════════════════════════════╗");
  log(colors.bright + colors.cyan, "║                                                                   ║");
  log(colors.bright + colors.cyan, "║           x402 Agent Playground - Interactive Demo               ║");
  log(colors.bright + colors.cyan, "║                                                                   ║");
  log(colors.bright + colors.cyan, "╚═══════════════════════════════════════════════════════════════════╝");
  console.log();

  // Check if backend is running
  try {
    log(colors.yellow, "🔍 Checking backend connectivity...");
    const healthResponse = await fetch(`${PLAYGROUND_API}/health`);
    const health = await healthResponse.json();
    
    if (health.success) {
      log(colors.green, "✅ Backend is operational");
      console.log();
    }
  } catch (error) {
    log(colors.red, "❌ Cannot connect to backend!");
    log(colors.yellow, "\nMake sure the backend is running:");
    console.log("   cd backend && npm run dev");
    console.log();
    process.exit(1);
  }

  // Run demos
  let runId1, runId2;

  // Demo 1: Simple payment
  runId1 = await demoSimplePayment();
  await sleep(2000);

  // Demo 2: Multi-step
  runId2 = await demoMultiStep();
  await sleep(2000);

  // Demo 3: Validation
  await demoValidation();
  await sleep(2000);

  // Demo 4: Retrieve run
  await demoRetrieveRun(runId1);
  await sleep(2000);

  // Demo 5: List all runs
  await demoListRuns();

  // Final summary
  section("✅ DEMO COMPLETE");
  log(colors.green, "The x402 Agent Playground is ready for use!");
  console.log();
  log(colors.cyan, "Next steps:");
  console.log("   1. Integrate with AI agents (see agents/src/test-agents.ts)");
  console.log("   2. Try real execution with /api/playground/execute");
  console.log("   3. Build custom agents using the structured APIs");
  console.log("   4. Check the docs at docs/x402-playground.md");
  console.log();
  log(colors.yellow, "API Endpoints:");
  console.log(`   Simulate: POST ${PLAYGROUND_API}/simulate`);
  console.log(`   Execute:  POST ${PLAYGROUND_API}/execute`);
  console.log(`   Validate: POST ${PLAYGROUND_API}/validate`);
  console.log(`   Runs:     GET  ${PLAYGROUND_API}/runs`);
  console.log();
}

// Run the demo
main().catch((error) => {
  log(colors.red, "❌ Demo failed:", error.message);
  process.exit(1);
});
