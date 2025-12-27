import * as dotenv from "dotenv";
import { plannerAgent } from "./planner.agent";
import { riskAgent } from "./risk.agent";

dotenv.config({ path: "../.env" });

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║      Atlas402 AI Agent Integration Test            ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`Planner: ${plannerAgent.isConfigured() ? "✅ AI" : "⚠️  Fallback"}`);
  console.log(`Risk: ${riskAgent.isConfigured() ? "✅ AI" : "⚠️  Rules"}`);
  console.log();

  const scenarios = [
    {
      name: "Simple Payment",
      intent: "Send 0.5 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    },
    {
      name: "Medium Value",
      intent: "Transfer 15 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    },
    {
      name: "High Value (Reject)",
      intent: "Send 150 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    },
  ];

  for (const scenario of scenarios) {
    console.log("\n" + "═".repeat(60));
    console.log(scenario.name);
    console.log("═".repeat(60));

    try {
      const plan = await plannerAgent.generatePlan(scenario.intent);
      const risk = await riskAgent.assessRisk(plan);

      console.log("\n📋 PLAN:", JSON.stringify(plan, null, 2));
      console.log("\n🛡️  RISK:", JSON.stringify(risk, null, 2));

      console.log("\n🎯 DECISION:", 
        risk.recommendation === "approve" ? "✅ APPROVED" :
        risk.recommendation === "review" ? "⚠️  REVIEW" :
        "❌ REJECTED"
      );

      await new Promise(r => setTimeout(r, 1000));
    } catch (error: any) {
      console.error("❌", error.message);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("🎉 Test Complete!");
  console.log("═".repeat(60));
}

main().catch(console.error);
