/**
 * Treasury Management Agent
 * 
 * Manages protocol or DAO treasury by automatically:
 * - Moving idle funds to yield (staking, lending via Tectonic)
 * - Monitoring runway and alerting on low balances
 * - Auto-converting incoming tokens to stablecoins
 * - Executing scheduled payments to contributors
 * - Multi-agent approval workflows for safety
 * 
 * Perfect showcase for institutional-grade automation with safety features
 */

import { BaseAgent, AgentConfig, AgentContext, AgentDecision } from "./base.agent";
import { ExecutionPlan, ExecutionAction } from "./types";

export interface TreasuryWallet {
  address: string;
  type: "main" | "operating" | "reserve" | "yield";
  balances: Record<string, number>;
  minimumBalance?: Record<string, number>;
}

export interface YieldStrategy {
  protocol: "Tectonic" | "VVS" | "Staking";
  token: string;
  apy: number;
  minDeployAmount: number;
  maxAllocation: number; // Percentage of total
  riskLevel: "low" | "medium" | "high";
}

export interface ScheduledPayment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  dueDate: Date;
  category: "salary" | "vendor" | "grant" | "other";
  status: "pending" | "approved" | "executed" | "failed";
  approvers?: string[];
  requiredApprovals?: number;
}

export interface TreasuryConfig {
  wallets: TreasuryWallet[];
  yieldStrategies: YieldStrategy[];
  scheduledPayments: ScheduledPayment[];
  runwayTargetDays: number; // Alert if runway below this
  monthlyBurnRate: Record<string, number>; // Token -> monthly spend
  idleThreshold: number; // Percentage of funds that should earn yield
  autoConvertToStable?: boolean;
  approvalThreshold?: number; // USD value requiring approvals
}

export class TreasuryManagementAgent extends BaseAgent {
  private treasuryConfig: TreasuryConfig;
  private actionHistory: Array<{
    timestamp: Date;
    action: string;
    value: number;
    outcome: string;
  }> = [];

  constructor(config: TreasuryConfig) {
    super({
      name: "TreasuryManagementAgent",
      description: "Institutional-grade treasury management with yield optimization and runway monitoring",
      version: "1.0.0",
      tags: ["treasury", "dao", "yield", "payments", "institutional"],
    });
    this.treasuryConfig = config;
  }

  /**
   * Generate comprehensive treasury management plan
   */
  async generatePlan(input: {
    currentPrices: Record<string, number>;
    yieldRates?: Record<string, number>;
    currentDate?: Date;
  }): Promise<ExecutionPlan> {
    const actions: ExecutionAction[] = [];
    const currentDate = input.currentDate || new Date();

    // Step 1: Read all treasury wallet balances
    for (const wallet of this.treasuryConfig.wallets) {
      for (const token of Object.keys(wallet.balances)) {
        actions.push({
          type: "read_balance",
          token,
          address: wallet.address,
          description: `Check ${token} in ${wallet.type} wallet`,
        });
      }
    }

    // Step 2: Calculate total treasury value and runway
    const totalValue = this.calculateTotalValue(input.currentPrices);
    const runway = this.calculateRunway(input.currentPrices);
    
    // Step 3: Check for low runway alert
    if (runway < this.treasuryConfig.runwayTargetDays) {
      actions.push({
        type: "llm_agent",
        prompt: `Treasury runway critically low: ${runway} days remaining (target: ${this.treasuryConfig.runwayTargetDays} days). Analyze and recommend actions.`,
        context: {
          totalValue,
          runway,
          burnRate: this.treasuryConfig.monthlyBurnRate,
        },
        description: "AI analysis of treasury crisis",
      });
    }

    // Step 4: Process scheduled payments that are due
    const duePayments = this.getDuePayments(currentDate);
    for (const payment of duePayments) {
      if (payment.status === "approved") {
        actions.push({
          type: "x402_payment",
          to: payment.recipient,
          amount: payment.amount.toString(),
          token: payment.token,
          description: `${payment.category} payment to ${payment.recipient.slice(0, 8)}...`,
        });

        this.recordAction("payment", payment.amount, `Paid ${payment.recipient}`);
      }
    }

    // Step 5: Identify idle funds and deploy to yield
    const idleFunds = this.identifyIdleFunds(input.currentPrices);
    for (const idle of idleFunds) {
      const strategy = this.selectYieldStrategy(idle.token, idle.amount);
      
      if (strategy) {
        // Approve tokens for yield protocol
        actions.push({
          type: "approve_token",
          token: idle.token,
          amount: idle.amount.toString(),
          contract: this.getProtocolContract(strategy.protocol),
          description: `Approve ${idle.amount} ${idle.token} for ${strategy.protocol}`,
        });

        // Deploy to yield
        actions.push({
          type: "contract_call",
          contract: this.getProtocolContract(strategy.protocol),
          method: strategy.protocol === "Tectonic" ? "supply" : "deposit",
          args: [idle.token, idle.amount],
          description: `Deploy ${idle.amount} ${idle.token} to ${strategy.protocol} (APY: ${strategy.apy}%)`,
        });

        this.recordAction("yield_deployment", idle.amount, `${strategy.protocol} @ ${strategy.apy}%`);
      }
    }

    // Step 6: Auto-convert volatile tokens to stablecoins
    if (this.treasuryConfig.autoConvertToStable) {
      const conversions = this.identifyVolatileHoldings(input.currentPrices);
      for (const conversion of conversions) {
        actions.push({
          type: "approve_token",
          token: conversion.fromToken,
          amount: conversion.amount.toString(),
          contract: "SwapRouter",
          description: `Approve ${conversion.fromToken} for swap`,
        });

        actions.push({
          type: "contract_call",
          contract: "SwapRouter",
          method: "swapExactTokensForTokens",
          args: [
            conversion.amount,
            conversion.minAmountOut,
            [conversion.fromToken, conversion.toToken],
            "TREASURY_ADDRESS",
            Math.floor(Date.now() / 1000) + 300,
          ],
          description: `Convert ${conversion.amount} ${conversion.fromToken} → ${conversion.toToken}`,
        });

        this.recordAction("conversion", conversion.amount, `${conversion.fromToken} → ${conversion.toToken}`);
      }
    }

    // Step 7: Final balance verification
    for (const wallet of this.treasuryConfig.wallets) {
      actions.push({
        type: "read_balance",
        token: "USDC", // Primary stable
        address: wallet.address,
        description: `Verify USDC balance in ${wallet.type} wallet`,
      });
    }

    return {
      mode: "execute",
      planId: `treasury-${Date.now()}`,
      description: `Treasury management: ${actions.length} actions (payments: ${duePayments.length}, yield: ${idleFunds.length})`,
      actions,
      context: {
        totalValue,
        runway,
        duePayments: duePayments.length,
        idleFunds: idleFunds.length,
      },
    };
  }

  /**
   * Decide whether to execute treasury operations
   */
  async makeDecision(state: {
    currentPrices: Record<string, number>;
    gasPrice: number;
    marketVolatility: "low" | "medium" | "high";
    currentDate?: Date;
  }): Promise<AgentDecision> {
    const currentDate = state.currentDate || new Date();
    
    // Calculate treasury health
    const totalValue = this.calculateTotalValue(state.currentPrices);
    const runway = this.calculateRunway(state.currentPrices);
    const duePayments = this.getDuePayments(currentDate);
    const idleFunds = this.identifyIdleFunds(state.currentPrices);

    // Critical: Low runway
    if (runway < this.treasuryConfig.runwayTargetDays / 2) {
      return {
        shouldExecute: true,
        reasoning: `CRITICAL: Treasury runway at ${runway} days (target: ${this.treasuryConfig.runwayTargetDays}). Immediate action required.`,
        confidence: 1.0,
        riskScore: 9,
        alternatives: [
          "Execute emergency funding",
          "Pause non-critical expenses",
          "Liquidate yield positions",
        ],
      };
    }

    // High priority: Payments due
    if (duePayments.length > 0) {
      const totalPayments = duePayments.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        shouldExecute: true,
        reasoning: `${duePayments.length} payment(s) due totaling $${totalPayments}. Runway: ${runway} days.`,
        confidence: 0.95,
        riskScore: this.calculateRisk({
          amount: totalPayments / 10000,
          complexity: duePayments.length,
          gasPrice: state.gasPrice / 100,
          volatility: 0,
          liquidity: 10,
        }),
      };
    }

    // Medium priority: Idle funds to deploy
    if (idleFunds.length > 0) {
      const totalIdle = idleFunds.reduce((sum, f) => sum + f.value, 0);
      const idlePercentage = (totalIdle / totalValue) * 100;

      if (idlePercentage > this.treasuryConfig.idleThreshold) {
        return {
          shouldExecute: true,
          reasoning: `${idlePercentage.toFixed(1)}% of treasury idle ($${totalIdle}). Deploying to yield strategies.`,
          confidence: 0.85,
          riskScore: this.calculateRisk({
            amount: totalIdle / 10000,
            complexity: idleFunds.length,
            gasPrice: state.gasPrice / 100,
            volatility: state.marketVolatility === "low" ? 2 : state.marketVolatility === "medium" ? 5 : 8,
            liquidity: 8,
          }),
          estimatedCost: `~${(state.gasPrice * idleFunds.length * 200000 / 1e9).toFixed(4)} ETH`,
        };
      }
    }

    // Low priority: Auto-convert volatile assets
    if (this.treasuryConfig.autoConvertToStable && state.marketVolatility === "low") {
      const conversions = this.identifyVolatileHoldings(state.currentPrices);
      
      if (conversions.length > 0) {
        return {
          shouldExecute: true,
          reasoning: `Convert ${conversions.length} volatile asset(s) to stablecoins. Market conditions favorable.`,
          confidence: 0.75,
          riskScore: 4,
        };
      }
    }

    // All quiet
    return {
      shouldExecute: false,
      reasoning: `Treasury healthy: $${totalValue} value, ${runway} days runway, no pending actions.`,
      confidence: 0.9,
      riskScore: 1,
    };
  }

  /**
   * Calculate total treasury value in USD
   */
  private calculateTotalValue(prices: Record<string, number>): number {
    let total = 0;
    
    for (const wallet of this.treasuryConfig.wallets) {
      for (const [token, balance] of Object.entries(wallet.balances)) {
        const price = prices[token] || 0;
        total += balance * price;
      }
    }

    return total;
  }

  /**
   * Calculate runway in days
   */
  private calculateRunway(prices: Record<string, number>): number {
    const totalValue = this.calculateTotalValue(prices);
    
    // Calculate monthly burn in USD
    let monthlyBurnUSD = 0;
    for (const [token, amount] of Object.entries(this.treasuryConfig.monthlyBurnRate)) {
      const price = prices[token] || 0;
      monthlyBurnUSD += amount * price;
    }

    if (monthlyBurnUSD === 0) return Infinity;

    const dailyBurn = monthlyBurnUSD / 30;
    return totalValue / dailyBurn;
  }

  /**
   * Get payments that are due
   */
  private getDuePayments(currentDate: Date): ScheduledPayment[] {
    return this.treasuryConfig.scheduledPayments.filter(
      payment => payment.dueDate <= currentDate && payment.status === "approved"
    );
  }

  /**
   * Identify funds sitting idle (not earning yield)
   */
  private identifyIdleFunds(prices: Record<string, number>): Array<{
    wallet: string;
    token: string;
    amount: number;
    value: number;
  }> {
    const idle: Array<any> = [];

    for (const wallet of this.treasuryConfig.wallets) {
      // Only check main and reserve wallets (operating needs liquidity)
      if (wallet.type === "operating") continue;

      for (const [token, balance] of Object.entries(wallet.balances)) {
        const minBalance = wallet.minimumBalance?.[token] || 0;
        const availableBalance = balance - minBalance;

        if (availableBalance > 0) {
          const strategy = this.selectYieldStrategy(token, availableBalance);
          
          if (strategy && availableBalance >= strategy.minDeployAmount) {
            const value = availableBalance * (prices[token] || 0);
            
            idle.push({
              wallet: wallet.address,
              token,
              amount: availableBalance,
              value,
            });
          }
        }
      }
    }

    return idle;
  }

  /**
   * Select best yield strategy for token
   */
  private selectYieldStrategy(token: string, amount: number): YieldStrategy | null {
    const strategies = this.treasuryConfig.yieldStrategies.filter(
      s => s.token === token && amount >= s.minDeployAmount
    );

    if (strategies.length === 0) return null;

    // Sort by APY (highest first) and return best low/medium risk strategy
    strategies.sort((a, b) => {
      if (a.riskLevel === b.riskLevel) return b.apy - a.apy;
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

    return strategies[0];
  }

  /**
   * Identify volatile holdings that should be converted to stables
   */
  private identifyVolatileHoldings(prices: Record<string, number>): Array<{
    fromToken: string;
    toToken: string;
    amount: number;
    minAmountOut: number;
  }> {
    const conversions: Array<any> = [];
    const volatileTokens = ["CRO", "VVS", "ETH"]; // Non-stablecoins

    for (const wallet of this.treasuryConfig.wallets) {
      if (wallet.type !== "main") continue;

      for (const [token, balance] of Object.entries(wallet.balances)) {
        if (volatileTokens.includes(token) && balance > 0) {
          // Convert 50% of volatile holdings to USDC
          const convertAmount = balance * 0.5;
          const price = prices[token] || 0;
          const minOut = convertAmount * price * 0.99; // 1% slippage

          conversions.push({
            fromToken: token,
            toToken: "USDC",
            amount: convertAmount,
            minAmountOut: minOut,
          });
        }
      }
    }

    return conversions;
  }

  /**
   * Get protocol contract name
   */
  private getProtocolContract(protocol: string): string {
    const contracts: Record<string, string> = {
      "Tectonic": "TectonicLending",
      "VVS": "VVSStaking",
      "Staking": "CronosStaking",
    };
    return contracts[protocol] || protocol;
  }

  /**
   * Record action in history
   */
  private recordAction(action: string, value: number, outcome: string): void {
    this.actionHistory.push({
      timestamp: new Date(),
      action,
      value,
      outcome,
    });

    // Keep last 1000 actions
    if (this.actionHistory.length > 1000) {
      this.actionHistory.shift();
    }
  }

  /**
   * Get treasury statistics
   */
  getStatistics(prices: Record<string, number>): {
    totalValue: number;
    runway: number;
    idlePercentage: number;
    yieldEarned: number;
    paymentsExecuted: number;
  } {
    const totalValue = this.calculateTotalValue(prices);
    const runway = this.calculateRunway(prices);
    const idle = this.identifyIdleFunds(prices);
    const totalIdle = idle.reduce((sum, f) => sum + f.value, 0);
    const idlePercentage = totalValue > 0 ? (totalIdle / totalValue) * 100 : 0;

    const paymentsExecuted = this.actionHistory.filter(a => a.action === "payment").length;
    const yieldEarned = this.actionHistory
      .filter(a => a.action === "yield_deployment")
      .reduce((sum, a) => sum + a.value, 0);

    return {
      totalValue,
      runway,
      idlePercentage,
      yieldEarned,
      paymentsExecuted,
    };
  }

  /**
   * Add scheduled payment
   */
  addPayment(payment: ScheduledPayment): void {
    this.treasuryConfig.scheduledPayments.push(payment);
  }

  /**
   * Approve payment (multi-sig simulation)
   */
  approvePayment(paymentId: string, approver: string): boolean {
    const payment = this.treasuryConfig.scheduledPayments.find(p => p.id === paymentId);
    if (!payment) return false;

    payment.approvers = payment.approvers || [];
    if (!payment.approvers.includes(approver)) {
      payment.approvers.push(approver);
    }

    const requiredApprovals = payment.requiredApprovals || 1;
    if (payment.approvers.length >= requiredApprovals) {
      payment.status = "approved";
    }

    return payment.status === "approved";
  }

  /**
   * Get pending payments requiring approval
   */
  getPendingApprovals(): ScheduledPayment[] {
    return this.treasuryConfig.scheduledPayments.filter(p => p.status === "pending");
  }
}
