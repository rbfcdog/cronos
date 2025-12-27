import OpenAI from "openai";
import * as dotenv from "dotenv";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { ExecutionPlan } from "./planner.agent";

dotenv.config({ path: "../.env" });

const RiskFactorSchema = z.object({
  factor: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
});

const RiskAssessmentSchema = z.object({
  overallRisk: z.enum(["low", "medium", "high", "critical"]),
  riskScore: z.number().min(0).max(1),
  recommendation: z.enum(["approve", "review", "reject"]),
  factors: z.array(RiskFactorSchema),
  reasoning: z.string(),
  warnings: z.array(z.string()).optional(),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export class RiskAgent {
  private openai?: OpenAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("✅ Risk Agent: OpenAI initialized");
    } else {
      console.warn("⚠️  Risk Agent: Rule-based mode");
    }
  }

  async assessRisk(plan: ExecutionPlan): Promise<RiskAssessment> {
    console.log(`\n🛡️  Risk Agent: ${plan.executionId}`);

    try {
      if (this.openai) {
        return await this.assessWithAI(plan);
      } else {
        return this.ruleBasedAssessment(plan);
      }
    } catch (error: any) {
      console.error("❌", error.message);
      return this.ruleBasedAssessment(plan);
    }
  }

  private async assessWithAI(plan: ExecutionPlan): Promise<RiskAssessment> {
    if (!this.openai) throw new Error("No OpenAI");

    console.log("🔄 Analyzing risk with AI...");

    const systemPrompt = `Blockchain security expert evaluating Cronos EVM transactions.

Assess risks:
- Value (>100 CRO = high, >10 CRO = medium)
- Unknown addresses
- Suspicious patterns
- Gas anomalies

Provide risk score (0-1) and recommend: approve, review, or reject.`;

    const completion = await this.openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Plan:\n${JSON.stringify(plan, null, 2)}` },
      ],
      response_format: zodResponseFormat(RiskAssessmentSchema, "risk"),
      temperature: 0.1,
    });

    const assessment = completion.choices[0].message.parsed;
    if (!assessment) throw new Error("No assessment");

    console.log(`✅ Risk: ${assessment.overallRisk}, Score: ${(assessment.riskScore * 100).toFixed(0)}%, ${assessment.recommendation.toUpperCase()}`);
    return assessment;
  }

  private ruleBasedAssessment(plan: ExecutionPlan): RiskAssessment {
    console.log("🔧 Rule-based assessment...");

    const factors = [];
    let riskScore = 0.05;

    const totalValue = parseFloat(plan.totalValue || "0");

    if (totalValue > 100) {
      factors.push({
        factor: "High Value",
        severity: "critical" as const,
        description: `${totalValue} CRO exceeds 100 CRO limit`,
      });
      riskScore += 0.7;
    } else if (totalValue > 10) {
      factors.push({
        factor: "Medium Value",
        severity: "medium" as const,
        description: `${totalValue} CRO exceeds 10 CRO`,
      });
      riskScore += 0.3;
    }

    if (plan.steps.length > 1) {
      factors.push({
        factor: "Multi-step",
        severity: "medium" as const,
        description: `${plan.steps.length} steps`,
      });
      riskScore += 0.15;
    }

    riskScore = Math.min(riskScore, 1.0);

    let overallRisk: "low" | "medium" | "high" | "critical";
    let recommendation: "approve" | "review" | "reject";

    if (riskScore >= 0.8) {
      overallRisk = "critical";
      recommendation = "reject";
    } else if (riskScore >= 0.5) {
      overallRisk = "high";
      recommendation = "review";
    } else if (riskScore >= 0.2) {
      overallRisk = "medium";
      recommendation = "review";
    } else {
      overallRisk = "low";
      recommendation = "approve";
    }

    const assessment: RiskAssessment = {
      overallRisk,
      riskScore,
      recommendation,
      factors,
      reasoning: `${factors.length} risk factors, score: ${riskScore.toFixed(2)}`,
      warnings: totalValue > 10 ? [`Value exceeds ${totalValue > 100 ? "100" : "10"} CRO`] : undefined,
    };

    console.log(`✅ Risk: ${overallRisk}, ${recommendation.toUpperCase()}`);
    return assessment;
  }

  isConfigured(): boolean {
    return !!this.openai;
  }
}

export const riskAgent = new RiskAgent();
