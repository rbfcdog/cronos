import OpenAI from "openai";
import * as dotenv from "dotenv";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

dotenv.config({ path: "../.env" });

const ExecutionStepSchema = z.object({
  action: z.enum(["payment", "contract_call"]),
  target: z.string(),
  amount: z.string().optional(),
  description: z.string(),
});

const ExecutionPlanSchema = z.object({
  executionId: z.string(),
  type: z.enum(["payment", "contract-interaction", "multi-step"]),
  steps: z.array(ExecutionStepSchema),
  estimatedGas: z.string(),
  totalValue: z.string(),
  reasoning: z.string(),
  risks: z.array(z.string()).optional(),
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>;

export class PlannerAgent {
  private openai?: OpenAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("✅ Planner Agent: OpenAI initialized");
    } else {
      console.warn("⚠️  No OpenAI API key, using fallback");
    }
  }

  async generatePlan(intent: string, context?: any): Promise<ExecutionPlan> {
    console.log(`\n🤖 Planner Agent: "${intent}"`);

    const systemPrompt = `Convert user intents to blockchain transaction plans on Cronos EVM.

Actions: payment (send CRO), contract_call (interact with contracts)

Extract addresses (0x...), amounts, and generate safe executable plans.

Example: "Send 5 CRO to 0x..." → payment plan with target, amount, gas estimate.`;

    const userPrompt = `Intent: ${intent}\nContext: ${JSON.stringify(context || {})}`;

    try {
      if (this.openai) {
        console.log("🔄 Calling OpenAI...");
        const completion = await this.openai.beta.chat.completions.parse({
          model: "gpt-4o-2024-08-06",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: zodResponseFormat(ExecutionPlanSchema, "plan"),
          temperature: 0.2,
        });

        const plan = completion.choices[0].message.parsed;
        if (!plan) throw new Error("No plan generated");

        console.log(`✅ Plan: ${plan.type}, ${plan.steps.length} steps, ${plan.totalValue} CRO`);
        return plan;
      } else {
        return this.fallbackParser(intent);
      }
    } catch (error: any) {
      console.error("❌", error.message);
      return this.fallbackParser(intent);
    }
  }

  private fallbackParser(intent: string): ExecutionPlan {
    console.log("🔧 Fallback parser...");
    
    const paymentPattern = /send\s+([\d.]+)\s+CRO\s+to\s+(0x[a-fA-F0-9]{40})/i;
    const match = intent.match(paymentPattern);

    if (match) {
      const amount = match[1];
      const target = match[2];
      return {
        executionId: `exec-${Date.now()}`,
        type: "payment",
        steps: [{
          action: "payment",
          target,
          amount,
          description: `Send ${amount} CRO to ${target}`,
        }],
        estimatedGas: "21000",
        totalValue: amount,
        reasoning: `Payment: ${amount} CRO`,
        risks: parseFloat(amount) > 10 ? ["High value"] : [],
      };
    }

    throw new Error(`Cannot parse: "${intent}". Use "send X CRO to 0x..."`);
  }

  isConfigured(): boolean {
    return !!this.openai;
  }

  getProvider(): string {
    return this.openai ? "openai" : "fallback";
  }
}

export const plannerAgent = new PlannerAgent();
