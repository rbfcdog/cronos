/**
 * Base Agent Class
 * 
 * Provides common functionality for all specialized agents:
 * - Configuration management
 * - State tracking
 * - Result formatting
 * - Error handling
 */

import { ExecutionPlan, ExecutionAction } from "./types";

export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  tags: string[];
}

export interface AgentContext {
  runId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AgentDecision {
  shouldExecute: boolean;
  reasoning: string;
  confidence: number;
  riskScore: number;
  estimatedCost?: string;
  alternatives?: string[];
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected context: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = {};
  }

  /**
   * Set execution context
   */
  setContext(context: AgentContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Generate an execution plan
   */
  abstract generatePlan(input: any): Promise<ExecutionPlan>;

  /**
   * Make a decision based on current state
   */
  abstract makeDecision(state: any): Promise<AgentDecision>;

  /**
   * Validate inputs before execution
   */
  protected validateInputs(required: string[], provided: any): void {
    const missing = required.filter(key => !(key in provided));
    if (missing.length > 0) {
      throw new Error(`Missing required inputs: ${missing.join(", ")}`);
    }
  }

  /**
   * Calculate risk score (0-10)
   */
  protected calculateRisk(factors: Record<string, number>): number {
    const weights = {
      amount: 0.3,
      complexity: 0.2,
      gasPrice: 0.2,
      volatility: 0.15,
      liquidity: 0.15,
    };

    let totalRisk = 0;
    let totalWeight = 0;

    for (const [key, value] of Object.entries(factors)) {
      const weight = weights[key as keyof typeof weights] || 0.1;
      totalRisk += value * weight;
      totalWeight += weight;
    }

    return Math.min(10, totalRisk / totalWeight);
  }

  /**
   * Format currency amounts
   */
  protected formatAmount(amount: string | number, decimals: number = 2): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toFixed(decimals);
  }

  /**
   * Get agent metadata
   */
  getMetadata(): AgentConfig {
    return { ...this.config };
  }
}
