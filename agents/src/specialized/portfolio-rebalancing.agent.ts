/**
 * Portfolio Rebalancing Agent
 * 
 * Automatically rebalances a portfolio across VVS Finance (Cronos DEX) when
 * allocations drift beyond thresholds. Shows complex decision-making:
 * - When to rebalance vs. when to wait
 * - Gas optimization (waits for low gas)
 * - Slippage protection
 * - Market volatility detection
 * - Multi-step workflow coordination
 * 
 * Perfect showcase for testing, observability, and orchestration capabilities
 */

import { BaseAgent, AgentConfig, AgentContext, AgentDecision } from "./base.agent";
import { ExecutionPlan, ExecutionAction } from "./types";

export interface PortfolioAllocation {
  token: string;
  targetPercentage: number; // 0-100
  currentPercentage?: number;
  currentValue?: number;
  rebalanceThreshold: number; // Drift percentage to trigger rebalance
}

export interface PortfolioConfig {
  allocations: PortfolioAllocation[];
  totalValue?: number;
  rebalanceFrequency?: "daily" | "weekly" | "monthly" | "on-demand";
  maxSlippage?: number; // Percentage
  maxGasPrice?: number; // Gwei
  minRebalanceValue?: number; // USD - don't rebalance if change < this
  dexRouter?: string; // VVS Finance router address
}

export interface MarketConditions {
  volatility: "low" | "medium" | "high";
  gasPrice: number; // Gwei
  liquidityDepth: Record<string, number>; // Token -> liquidity in USD
  priceImpact: Record<string, number>; // Token -> % impact per $1k
}

export class PortfolioRebalancingAgent extends BaseAgent {
  private portfolioConfig: PortfolioConfig;
  private rebalanceHistory: Array<{
    timestamp: Date;
    actions: string[];
    gasUsed: string;
    reason: string;
  }> = [];

  constructor(config: PortfolioConfig) {
    super({
      name: "PortfolioRebalancingAgent",
      description: "Automated portfolio rebalancing with gas optimization and slippage protection",
      version: "1.0.0",
      tags: ["defi", "portfolio", "vvs-finance", "rebalancing", "automation"],
    });
    this.portfolioConfig = config;
  }

  /**
   * Generate execution plan for portfolio rebalancing
   */
  async generatePlan(input: {
    balances: Record<string, string>;
    prices: Record<string, number>;
    marketConditions?: MarketConditions;
  }): Promise<ExecutionPlan> {
    // Step 1: Calculate current allocations
    const currentAllocations = this.calculateCurrentAllocations(input.balances, input.prices);
    
    // Step 2: Determine which assets need rebalancing
    const rebalanceNeeds = this.calculateRebalanceNeeds(currentAllocations);
    
    if (rebalanceNeeds.length === 0) {
      return {
        mode: "simulate",
        description: "Portfolio is balanced - no action needed",
        actions: [],
        context: { allocations: currentAllocations },
      };
    }

    const actions: ExecutionAction[] = [];

    // Step 3: Read all current balances
    for (const allocation of this.portfolioConfig.allocations) {
      actions.push({
        type: "read_balance",
        token: allocation.token,
        description: `Check ${allocation.token} balance before rebalancing`,
      });
    }

    // Step 4: Check VVS Router state
    actions.push({
      type: "read_state",
      contract: "SwapRouter",
      description: "Verify VVS Finance router is deployed",
    });

    // Step 5: Execute swaps
    for (const need of rebalanceNeeds) {
      if (need.action === "sell") {
        // Approve tokens for swap
        actions.push({
          type: "approve_token",
          token: need.token,
          amount: need.amount,
          contract: "SwapRouter",
          description: `Approve ${need.amount} ${need.token} for VVS swap`,
        });

        // Execute swap
        actions.push({
          type: "contract_call",
          contract: "SwapRouter",
          method: "swapExactTokensForTokens",
          args: [
            need.amount,
            need.minAmountOut,
            [need.token, need.targetToken],
            "WALLET_ADDRESS", // Will be replaced by runner
            Math.floor(Date.now() / 1000) + 300, // 5 min deadline
          ],
          description: `Swap ${need.amount} ${need.token} → ${need.targetToken} (slippage: ${this.portfolioConfig.maxSlippage}%)`,
        });
      }
    }

    // Step 6: Verify new balances
    for (const allocation of this.portfolioConfig.allocations) {
      actions.push({
        type: "read_balance",
        token: allocation.token,
        description: `Verify ${allocation.token} balance after rebalancing`,
      });
    }

    // Step 7: Use LLM to analyze if rebalancing was successful
    actions.push({
      type: "llm_agent",
      prompt: "Analyze if portfolio rebalancing achieved target allocations",
      context: {
        targetAllocations: this.portfolioConfig.allocations,
        rebalanceActions: rebalanceNeeds,
      },
      description: "AI analysis of rebalancing results",
    });

    return {
      mode: "execute",
      planId: `rebalance-${Date.now()}`,
      description: `Rebalance portfolio: ${rebalanceNeeds.map(n => `${n.action} ${n.token}`).join(", ")}`,
      actions,
      context: {
        currentAllocations,
        targetAllocations: this.portfolioConfig.allocations,
        rebalanceNeeds,
        estimatedGas: this.estimateGasCost(rebalanceNeeds.length, input.marketConditions?.gasPrice || 20),
      },
    };
  }

  /**
   * Decide whether to rebalance now or wait
   */
  async makeDecision(state: {
    balances: Record<string, string>;
    prices: Record<string, number>;
    marketConditions: MarketConditions;
    lastRebalanceTime?: Date;
  }): Promise<AgentDecision> {
    // Calculate current state
    const currentAllocations = this.calculateCurrentAllocations(state.balances, state.prices);
    const rebalanceNeeds = this.calculateRebalanceNeeds(currentAllocations);

    if (rebalanceNeeds.length === 0) {
      return {
        shouldExecute: false,
        reasoning: "Portfolio allocations are within acceptable thresholds",
        confidence: 1.0,
        riskScore: 0,
      };
    }

    // Check gas price
    const gasPrice = state.marketConditions.gasPrice;
    const maxGas = this.portfolioConfig.maxGasPrice || 50;
    
    if (gasPrice > maxGas) {
      return {
        shouldExecute: false,
        reasoning: `Gas price too high (${gasPrice} Gwei > ${maxGas} Gwei). Waiting for better conditions.`,
        confidence: 0.8,
        riskScore: 6,
        alternatives: [
          `Wait for gas < ${maxGas} Gwei`,
          "Execute partial rebalance (critical assets only)",
        ],
      };
    }

    // Check market volatility
    const volatility = state.marketConditions.volatility;
    if (volatility === "high") {
      return {
        shouldExecute: false,
        reasoning: "High market volatility detected. Waiting for stable conditions to avoid excessive slippage.",
        confidence: 0.7,
        riskScore: 7,
        alternatives: [
          "Wait 1-6 hours for volatility to decrease",
          "Increase slippage tolerance temporarily",
        ],
      };
    }

    // Check minimum rebalance value
    const rebalanceValue = this.calculateRebalanceValue(rebalanceNeeds, state.prices);
    const minValue = this.portfolioConfig.minRebalanceValue || 100;
    
    if (rebalanceValue < minValue) {
      return {
        shouldExecute: false,
        reasoning: `Rebalance value too small ($${rebalanceValue} < $${minValue}). Gas costs would outweigh benefits.`,
        confidence: 0.9,
        riskScore: 3,
        alternatives: [
          "Wait for larger drift",
          "Reduce minimum rebalance threshold",
        ],
      };
    }

    // Check slippage risk
    const maxSlippage = this.portfolioConfig.maxSlippage || 1.0;
    const estimatedSlippage = this.estimateSlippage(rebalanceNeeds, state.marketConditions);
    
    if (estimatedSlippage > maxSlippage) {
      return {
        shouldExecute: false,
        reasoning: `Estimated slippage (${estimatedSlippage.toFixed(2)}%) exceeds maximum (${maxSlippage}%). Insufficient liquidity.`,
        confidence: 0.85,
        riskScore: 8,
        alternatives: [
          "Split rebalance into multiple smaller transactions",
          "Wait for deeper liquidity",
          "Increase slippage tolerance",
        ],
      };
    }

    // Check frequency limit
    if (state.lastRebalanceTime) {
      const hoursSinceRebalance = (Date.now() - state.lastRebalanceTime.getTime()) / (1000 * 60 * 60);
      const minHours = this.getMinHoursBetweenRebalances();
      
      if (hoursSinceRebalance < minHours) {
        return {
          shouldExecute: false,
          reasoning: `Too soon since last rebalance (${hoursSinceRebalance.toFixed(1)}h < ${minHours}h). Avoiding over-trading.`,
          confidence: 0.95,
          riskScore: 4,
        };
      }
    }

    // All checks passed - ready to rebalance!
    const riskFactors = {
      amount: rebalanceValue / 1000, // Normalized to 0-10 scale
      complexity: rebalanceNeeds.length,
      gasPrice: gasPrice / 100,
      volatility: volatility === "low" ? 2 : volatility === "medium" ? 5 : 8,
      liquidity: 10 - (estimatedSlippage * 2), // Higher slippage = lower liquidity = higher risk
    };

    const riskScore = this.calculateRisk(riskFactors);

    return {
      shouldExecute: true,
      reasoning: [
        `Portfolio drift detected: ${rebalanceNeeds.length} asset(s) need adjustment`,
        `Gas price acceptable: ${gasPrice} Gwei`,
        `Market volatility: ${volatility}`,
        `Estimated slippage: ${estimatedSlippage.toFixed(2)}%`,
        `Rebalance value: $${rebalanceValue}`,
      ].join(". "),
      confidence: 0.92,
      riskScore,
      estimatedCost: this.estimateGasCost(rebalanceNeeds.length, gasPrice),
    };
  }

  /**
   * Calculate current portfolio allocations
   */
  private calculateCurrentAllocations(
    balances: Record<string, string>,
    prices: Record<string, number>
  ): PortfolioAllocation[] {
    const allocations = [...this.portfolioConfig.allocations];
    
    // Calculate total portfolio value
    let totalValue = 0;
    for (const allocation of allocations) {
      const balance = parseFloat(balances[allocation.token] || "0");
      const price = prices[allocation.token] || 0;
      allocation.currentValue = balance * price;
      totalValue += allocation.currentValue;
    }

    // Calculate percentages
    for (const allocation of allocations) {
      allocation.currentPercentage = totalValue > 0 
        ? (allocation.currentValue! / totalValue) * 100 
        : 0;
    }

    this.portfolioConfig.totalValue = totalValue;
    return allocations;
  }

  /**
   * Determine which assets need rebalancing
   */
  private calculateRebalanceNeeds(allocations: PortfolioAllocation[]): Array<{
    token: string;
    action: "buy" | "sell";
    amount: string;
    targetToken: string;
    minAmountOut: string;
    drift: number;
  }> {
    const needs: Array<any> = [];

    for (const allocation of allocations) {
      const current = allocation.currentPercentage || 0;
      const target = allocation.targetPercentage;
      const drift = Math.abs(current - target);

      if (drift > allocation.rebalanceThreshold) {
        const action = current > target ? "sell" : "buy";
        const driftValue = (drift / 100) * (this.portfolioConfig.totalValue || 0);
        
        // Simplified: Find most over-allocated token to swap to most under-allocated
        const targetToken = this.findTargetToken(allocations, allocation.token, action);
        
        needs.push({
          token: allocation.token,
          action,
          amount: this.formatAmount(driftValue / 2), // Sell half the drift
          targetToken,
          minAmountOut: "0", // Will be calculated with slippage in production
          drift: current - target,
        });
      }
    }

    return needs;
  }

  /**
   * Find best target token for swap
   */
  private findTargetToken(
    allocations: PortfolioAllocation[],
    excludeToken: string,
    needAction: "buy" | "sell"
  ): string {
    // If selling (over-allocated), find most under-allocated token
    // If buying (under-allocated), find most over-allocated token
    const targetCondition = needAction === "sell" 
      ? (alloc: PortfolioAllocation) => (alloc.currentPercentage || 0) < alloc.targetPercentage
      : (alloc: PortfolioAllocation) => (alloc.currentPercentage || 0) > alloc.targetPercentage;

    const candidates = allocations.filter(a => 
      a.token !== excludeToken && targetCondition(a)
    );

    if (candidates.length === 0) {
      // Fallback: use stable coin or first non-excluded token
      return allocations.find(a => a.token === "USDC")?.token || 
             allocations.find(a => a.token !== excludeToken)?.token || 
             "USDC";
    }

    // Sort by drift magnitude and return largest
    candidates.sort((a, b) => {
      const driftA = Math.abs((a.currentPercentage || 0) - a.targetPercentage);
      const driftB = Math.abs((b.currentPercentage || 0) - b.targetPercentage);
      return driftB - driftA;
    });

    return candidates[0].token;
  }

  /**
   * Calculate total value of rebalance operations
   */
  private calculateRebalanceValue(
    needs: Array<{ amount: string }>,
    prices: Record<string, number>
  ): number {
    return needs.reduce((sum, need) => {
      const amount = parseFloat(need.amount);
      return sum + amount; // Simplified: should multiply by token price
    }, 0);
  }

  /**
   * Estimate slippage for rebalance operations
   */
  private estimateSlippage(
    needs: Array<{ token: string; amount: string }>,
    conditions: MarketConditions
  ): number {
    // Simplified slippage calculation
    let maxSlippage = 0;
    
    for (const need of needs) {
      const liquidity = conditions.liquidityDepth[need.token] || 1000000;
      const tradeSize = parseFloat(need.amount);
      const priceImpact = conditions.priceImpact[need.token] || 0.001;
      
      // Slippage increases with trade size relative to liquidity
      // Formula: (tradeSize / liquidity) * baseImpact * scaling factor
      const slippage = (tradeSize / liquidity) * priceImpact * 10000; // Increased scaling
      maxSlippage = Math.max(maxSlippage, slippage);
    }

    return maxSlippage;
  }

  /**
   * Estimate gas cost for rebalancing
   */
  private estimateGasCost(numSwaps: number, gasPrice: number): string {
    // Each swap costs approximately:
    // - approve: 50k gas
    // - swap: 150k gas
    const gasPerSwap = 200000;
    const totalGas = numSwaps * gasPerSwap;
    const costInEth = (totalGas * gasPrice) / 1e9;
    return `${costInEth.toFixed(6)} ETH (~$${(costInEth * 2000).toFixed(2)})`;
  }

  /**
   * Get minimum hours between rebalances based on frequency setting
   */
  private getMinHoursBetweenRebalances(): number {
    const frequency = this.portfolioConfig.rebalanceFrequency || "daily";
    switch (frequency) {
      case "daily": return 24;
      case "weekly": return 168;
      case "monthly": return 720;
      case "on-demand": return 1; // Allow rebalancing every hour if needed
      default: return 24;
    }
  }

  /**
   * Record successful rebalance
   */
  recordRebalance(actions: string[], gasUsed: string, reason: string): void {
    this.rebalanceHistory.push({
      timestamp: new Date(),
      actions,
      gasUsed,
      reason,
    });

    // Keep only last 100 rebalances
    if (this.rebalanceHistory.length > 100) {
      this.rebalanceHistory.shift();
    }
  }

  /**
   * Get rebalance statistics
   */
  getStatistics(): {
    totalRebalances: number;
    avgGasUsed: string;
    lastRebalance?: Date;
    successRate: number;
  } {
    if (this.rebalanceHistory.length === 0) {
      return {
        totalRebalances: 0,
        avgGasUsed: "0",
        successRate: 1.0,
      };
    }

    const totalGas = this.rebalanceHistory.reduce((sum, rb) => {
      return sum + parseFloat(rb.gasUsed || "0");
    }, 0);

    return {
      totalRebalances: this.rebalanceHistory.length,
      avgGasUsed: (totalGas / this.rebalanceHistory.length).toFixed(0),
      lastRebalance: this.rebalanceHistory[this.rebalanceHistory.length - 1]?.timestamp,
      successRate: 1.0, // TODO: track failures
    };
  }

  /**
   * Get current portfolio health score (0-100)
   */
  getPortfolioHealth(allocations: PortfolioAllocation[]): number {
    let totalDrift = 0;
    
    for (const allocation of allocations) {
      const current = allocation.currentPercentage || 0;
      const target = allocation.targetPercentage;
      totalDrift += Math.abs(current - target);
    }

    // Perfect balance = 100, high drift = lower score
    const health = Math.max(0, 100 - (totalDrift * 2));
    return Math.round(health);
  }
}
