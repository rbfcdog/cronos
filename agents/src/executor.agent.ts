import { ExecutionPlan } from "./planner.agent";
import { RiskAssessment } from "./risk.agent";

export interface ExecutionResult {
  executionId: string;
  success: boolean;
  transactionHash?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Executor Agent
 * Monitors execution and handles retries/error recovery
 */
export class ExecutorAgent {
  /**
   * Monitor execution progress
   */
  async monitorExecution(
    executionId: string,
    onUpdate?: (status: string) => void
  ): Promise<ExecutionResult> {
    console.log(`\n👀 Executor Agent monitoring: ${executionId}`);

    // In a real implementation, this would:
    // 1. Poll transaction status
    // 2. Check for confirmations
    // 3. Detect failures
    // 4. Trigger retries if needed

    return {
      executionId,
      success: true,
      timestamp: new Date(),
    };
  }

  /**
   * Validate execution prerequisites
   */
  async validatePrerequisites(
    plan: ExecutionPlan,
    assessment: RiskAssessment
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check risk assessment
    if (assessment.recommendation === "REJECT") {
      errors.push("Plan rejected by risk assessment");
    }

    // Check plan validity
    if (!plan.steps || plan.steps.length === 0) {
      errors.push("No execution steps in plan");
    }

    for (const step of plan.steps) {
      if (step.action === "payment" && !step.target) {
        errors.push("Payment step missing target address");
      }
      if (step.action === "payment" && !step.amount) {
        errors.push("Payment step missing amount");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Suggest retry strategy for failed execution
   */
  suggestRetryStrategy(error: string): {
    shouldRetry: boolean;
    delayMs?: number;
    modifications?: any;
  } {
    // Insufficient funds - don't retry
    if (error.includes("insufficient funds")) {
      return { shouldRetry: false };
    }

    // Gas price too low - retry with higher gas
    if (error.includes("gas price")) {
      return {
        shouldRetry: true,
        delayMs: 5000,
        modifications: { increaseGasPrice: 1.2 },
      };
    }

    // Network error - retry with delay
    if (error.includes("network") || error.includes("timeout")) {
      return {
        shouldRetry: true,
        delayMs: 10000,
      };
    }

    // Default: retry once with delay
    return {
      shouldRetry: true,
      delayMs: 5000,
    };
  }
}

export default new ExecutorAgent();
