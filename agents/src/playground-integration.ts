/**
 * Agent-to-Playground Integration
 * 
 * Demonstrates how AI agents (PlannerAgent, RiskAgent) can generate
 * and submit execution plans to the x402 Playground.
 */

import { plannerAgent } from "./planner.agent";
import { riskAgent } from "./risk.agent";

const PLAYGROUND_API = process.env.PLAYGROUND_API || "http://localhost:3001/api/playground";

/**
 * Convert PlannerAgent ExecutionPlan to Playground format
 */
function convertToPlaygroundPlan(agentPlan: any, mode: "simulate" | "execute" = "simulate") {
  return {
    mode,
    planId: agentPlan.executionId,
    description: agentPlan.reasoning,
    actions: agentPlan.steps.map((step: any) => {
      switch (step.action) {
        case "payment":
          return {
            type: "x402_payment" as const,
            to: step.target,
            amount: step.amount || "0",
            token: "TCRO",
            description: step.description,
          };
        
        case "contract_call":
          return {
            type: "contract_call" as const,
            contract: "ExecutionRouter",
            method: "executePayment",
            args: [step.target, step.amount, step.description],
            description: step.description,
          };
        
        default:
          return {
            type: "read_balance" as const,
            token: "TCRO",
            description: step.description,
          };
      }
    }),
  };
}

/**
 * Execute natural language intent through the full pipeline:
 * Intent → PlannerAgent → RiskAgent → Playground → Result
 */
export async function executeIntent(
  intent: string,
  mode: "simulate" | "execute" = "simulate"
): Promise<any> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🎯 Intent: "${intent}"`);
  console.log(`${"=".repeat(70)}\n`);

  // Step 1: Generate execution plan with AI
  console.log("🤖 Step 1: PlannerAgent generating execution plan...");
  const agentPlan = await plannerAgent.generatePlan(intent);
  console.log(`   ✅ Plan generated: ${agentPlan.type}, ${agentPlan.steps.length} steps`);
  console.log(`   💰 Total value: ${agentPlan.totalValue} CRO`);
  console.log();

  // Step 2: Evaluate risk with AI
  console.log("🛡️  Step 2: RiskAgent evaluating plan...");
  const riskAssessment = await riskAgent.assessRisk(agentPlan);
  console.log(`   ✅ Risk: ${riskAssessment.overallRisk} (score: ${(riskAssessment.riskScore * 100).toFixed(0)}%)`);
  console.log(`   📋 Recommendation: ${riskAssessment.recommendation.toUpperCase()}`);
  console.log();

  // Step 3: Convert to playground format
  console.log("🔄 Step 3: Converting to Playground format...");
  const playgroundPlan = convertToPlaygroundPlan(agentPlan, mode);
  console.log(`   ✅ Playground plan ready (${playgroundPlan.actions.length} actions)`);
  console.log();

  // Step 4: Submit to playground
  const endpoint = mode === "simulate" ? "simulate" : "execute";
  console.log(`📡 Step 4: Submitting to Playground (${mode} mode)...`);
  
  try {
    const response = await fetch(`${PLAYGROUND_API}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playgroundPlan),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`   ✅ ${mode === "simulate" ? "Simulation" : "Execution"} successful!`);
      console.log(`   🔖 Run ID: ${result.data.runId}`);
      console.log();

      // Step 5: Display results
      console.log("📊 Step 5: Results:");
      console.log(`   Total Steps: ${result.data.summary.totalSteps}`);
      console.log(`   Successful: ${result.data.summary.successfulSteps}`);
      console.log(`   Failed: ${result.data.summary.failedSteps}`);
      
      if (mode === "simulate") {
        console.log(`   Gas Estimate: ${result.data.summary.totalGasEstimate}`);
      } else {
        console.log(`   Gas Used: ${result.data.summary.totalGasUsed}`);
        if (result.data.transactions?.length > 0) {
          console.log();
          console.log("   🔗 Transactions:");
          result.data.transactions.forEach((tx: any, i: number) => {
            console.log(`      ${i + 1}. ${tx.explorerUrl}`);
          });
        }
      }

      console.log();
      console.log("   💰 Final State:");
      const state = result.data.trace.virtualState;
      console.log(`      TCRO Balance: ${state.wallet.balances.TCRO} TCRO`);
      console.log(`      USDC Balance: ${state.wallet.balances.USDC} USDC`);

      return result;
    } else {
      console.log(`   ❌ ${mode === "simulate" ? "Simulation" : "Execution"} failed:`);
      console.log(`      ${result.error}`);
      return result;
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Demo: End-to-end integration
 */
async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                   ║");
  console.log("║       Agent → Playground Integration Demo                        ║");
  console.log("║                                                                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

  // Test scenarios
  const scenarios = [
    {
      name: "Small Payment (Should Approve)",
      intent: "Send 0.5 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      mode: "simulate" as const,
    },
    {
      name: "Medium Payment (Should Review)",
      intent: "Transfer 15 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      mode: "simulate" as const,
    },
    {
      name: "Large Payment (Should Reject)",
      intent: "Send 150 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      mode: "simulate" as const,
    },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    
    console.log(`\n${"━".repeat(70)}`);
    console.log(`📝 SCENARIO ${i + 1}: ${scenario.name}`);
    console.log(`${"━".repeat(70)}`);

    try {
      await executeIntent(scenario.intent, scenario.mode);
      
      if (i < scenarios.length - 1) {
        console.log("\n⏳ Waiting 2 seconds before next scenario...\n");
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error: any) {
      console.error(`❌ Scenario failed: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 Integration Demo Complete!");
  console.log("=".repeat(70));
  console.log();
  console.log("✅ This demonstrates the complete flow:");
  console.log("   1. Natural language intent");
  console.log("   2. AI agent generates execution plan");
  console.log("   3. AI agent evaluates risk");
  console.log("   4. Plan converted to playground format");
  console.log("   5. Submitted to playground for execution");
  console.log("   6. Results with traces and state");
  console.log();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { convertToPlaygroundPlan };
