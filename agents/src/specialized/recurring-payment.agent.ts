/**
 * Recurring Payment Agent
 * 
 * Enables subscription/salary payments on-chain with:
 * - Monthly/weekly/daily payment schedules
 * - Retry logic for failed payments
 * - Balance checks before execution
 * - Payment history tracking
 * - Failure notifications
 * 
 * Perfect showcase for x402 payment protocol
 */

import { BaseAgent, AgentConfig, AgentContext, AgentDecision } from "./base.agent";
import { ExecutionPlan, ExecutionAction } from "./types";

export interface PaymentSchedule {
  id: string;
  recipient: string;
  amount: string;
  token: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextPaymentDate: Date;
  lastPaymentDate?: Date;
  retryCount: number;
  maxRetries: number;
  status: "active" | "paused" | "failed" | "completed";
}

export interface RecurringPaymentConfig {
  schedules: PaymentSchedule[];
  minBalance?: string; // Minimum balance to maintain
  notificationWebhook?: string;
  autoRetry?: boolean;
  retryDelay?: number; // Minutes between retries
}

export class RecurringPaymentAgent extends BaseAgent {
  private paymentConfig: RecurringPaymentConfig;
  private paymentHistory: Map<string, any[]> = new Map();

  constructor(config: RecurringPaymentConfig) {
    super({
      name: "RecurringPaymentAgent",
      description: "Automated recurring payment management with retry logic",
      version: "1.0.0",
      tags: ["payments", "x402", "automation", "subscriptions"],
    });
    this.paymentConfig = config;
  }

  /**
   * Generate execution plan for pending payments
   */
  async generatePlan(input: { currentDate?: Date; forcePaymentId?: string }): Promise<ExecutionPlan> {
    const currentDate = input.currentDate || new Date();
    const pendingSchedules = this.getPendingPayments(currentDate, input.forcePaymentId);

    if (pendingSchedules.length === 0) {
      return {
        mode: "simulate",
        description: "No pending payments at this time",
        actions: [],
      };
    }

    const actions: ExecutionAction[] = [];

    // Step 1: Check balances for all tokens we need
    const tokensNeeded = new Set(pendingSchedules.map(s => s.token));
    for (const token of tokensNeeded) {
      actions.push({
        type: "read_balance",
        token,
        description: `Check ${token} balance before payments`,
      });
    }

    // Step 2: Execute payments
    for (const schedule of pendingSchedules) {
      actions.push({
        type: "x402_payment",
        to: schedule.recipient,
        amount: schedule.amount,
        token: schedule.token,
        description: `${schedule.frequency} payment to ${schedule.recipient.slice(0, 8)}... (${schedule.amount} ${schedule.token})`,
      });

      // Step 3: Verify payment went through
      actions.push({
        type: "read_balance",
        token: schedule.token,
        description: `Verify balance after payment ${schedule.id}`,
      });
    }

    return {
      mode: "execute",
      planId: `recurring-payment-${Date.now()}`,
      description: `Execute ${pendingSchedules.length} recurring payment(s)`,
      actions,
      context: {
        schedules: pendingSchedules.map(s => s.id),
        totalAmount: this.calculateTotalAmount(pendingSchedules),
        executionDate: currentDate.toISOString(),
      },
    };
  }

  /**
   * Decide whether to execute payments now or wait
   */
  async makeDecision(state: {
    currentDate?: Date;
    balances: Record<string, string>;
    gasPrice?: string;
    networkStatus?: string;
  }): Promise<AgentDecision> {
    const currentDate = state.currentDate || new Date();
    const pendingSchedules = this.getPendingPayments(currentDate);

    if (pendingSchedules.length === 0) {
      return {
        shouldExecute: false,
        reasoning: "No payments are due at this time",
        confidence: 1.0,
        riskScore: 0,
      };
    }

    // Check if we have sufficient balance
    const insufficientBalances: string[] = [];
    const tokenAmounts = this.calculateTokenAmounts(pendingSchedules);

    for (const [token, requiredAmount] of Object.entries(tokenAmounts)) {
      const balance = parseFloat(state.balances[token] || "0");
      const required = parseFloat(requiredAmount);

      if (balance < required) {
        insufficientBalances.push(`${token}: need ${required}, have ${balance}`);
      }
    }

    if (insufficientBalances.length > 0) {
      return {
        shouldExecute: false,
        reasoning: `Insufficient balance for payments: ${insufficientBalances.join(", ")}`,
        confidence: 1.0,
        riskScore: 8,
        alternatives: [
          "Wait for balance to be replenished",
          "Execute partial payments (highest priority first)",
          "Trigger funding workflow",
        ],
      };
    }

    // Check network conditions
    const gasPrice = parseFloat(state.gasPrice || "0");
    const highGas = gasPrice > 50; // Gwei threshold

    if (highGas) {
      return {
        shouldExecute: false,
        reasoning: `Gas price too high (${gasPrice} Gwei). Waiting for better conditions.`,
        confidence: 0.7,
        riskScore: 5,
        alternatives: [
          "Wait for gas price to drop below 50 Gwei",
          "Execute critical payments only",
        ],
      };
    }

    // All checks passed
    const riskScore = this.calculateRisk({
      amount: this.getTotalValue(tokenAmounts),
      complexity: pendingSchedules.length,
      gasPrice: gasPrice / 100,
      volatility: 0,
      liquidity: 10,
    });

    return {
      shouldExecute: true,
      reasoning: `${pendingSchedules.length} payment(s) due. Balance sufficient. Gas price acceptable (${gasPrice} Gwei).`,
      confidence: 0.95,
      riskScore,
      estimatedCost: `~${(gasPrice * pendingSchedules.length * 21000 / 1e9).toFixed(4)} ETH in gas`,
    };
  }

  /**
   * Handle payment failure and schedule retry
   */
  async handleFailure(scheduleId: string, error: string): Promise<void> {
    const schedule = this.paymentConfig.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    schedule.retryCount++;

    if (schedule.retryCount >= schedule.maxRetries) {
      schedule.status = "failed";
      await this.notifyFailure(schedule, `Max retries (${schedule.maxRetries}) exceeded: ${error}`);
    } else {
      // Schedule retry
      const retryDelay = this.paymentConfig.retryDelay || 60; // Default 1 hour
      schedule.nextPaymentDate = new Date(Date.now() + retryDelay * 60 * 1000);
      await this.notifyRetry(schedule, error);
    }
  }

  /**
   * Mark payment as successful and schedule next one
   */
  async handleSuccess(scheduleId: string, txHash: string): Promise<void> {
    const schedule = this.paymentConfig.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    schedule.lastPaymentDate = new Date();
    schedule.retryCount = 0;
    schedule.nextPaymentDate = this.calculateNextPaymentDate(schedule);

    // Record in history
    const history = this.paymentHistory.get(scheduleId) || [];
    history.push({
      date: new Date(),
      amount: schedule.amount,
      token: schedule.token,
      recipient: schedule.recipient,
      txHash,
      status: "success",
    });
    this.paymentHistory.set(scheduleId, history);
  }

  /**
   * Get payments that are due
   */
  private getPendingPayments(currentDate: Date, forceId?: string): PaymentSchedule[] {
    return this.paymentConfig.schedules.filter(schedule => {
      if (forceId) return schedule.id === forceId;
      return (
        schedule.status === "active" &&
        schedule.nextPaymentDate <= currentDate
      );
    });
  }

  /**
   * Calculate total amounts needed per token
   */
  private calculateTokenAmounts(schedules: PaymentSchedule[]): Record<string, string> {
    const amounts: Record<string, number> = {};
    
    for (const schedule of schedules) {
      const token = schedule.token;
      amounts[token] = (amounts[token] || 0) + parseFloat(schedule.amount);
    }

    return Object.entries(amounts).reduce((acc, [token, amount]) => {
      acc[token] = amount.toString();
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Calculate total USD value (assuming prices)
   */
  private getTotalValue(amounts: Record<string, string>): number {
    // Simplified: In production, fetch real prices
    const prices: Record<string, number> = {
      "TCRO": 0.10,
      "USDC": 1.00,
      "ETH": 2000,
    };

    let total = 0;
    for (const [token, amount] of Object.entries(amounts)) {
      const price = prices[token] || 1;
      total += parseFloat(amount) * price;
    }
    return total;
  }

  /**
   * Calculate next payment date based on frequency
   */
  private calculateNextPaymentDate(schedule: PaymentSchedule): Date {
    const base = schedule.lastPaymentDate || new Date();
    const next = new Date(base);

    switch (schedule.frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Calculate total amount for all schedules
   */
  private calculateTotalAmount(schedules: PaymentSchedule[]): string {
    const amounts = this.calculateTokenAmounts(schedules);
    const tokens = Object.entries(amounts).map(([token, amount]) => `${amount} ${token}`);
    return tokens.join(", ");
  }

  /**
   * Send failure notification
   */
  private async notifyFailure(schedule: PaymentSchedule, reason: string): Promise<void> {
    if (!this.paymentConfig.notificationWebhook) return;

    const notification = {
      type: "payment_failed",
      schedule: {
        id: schedule.id,
        recipient: schedule.recipient,
        amount: schedule.amount,
        token: schedule.token,
        frequency: schedule.frequency,
      },
      reason,
      timestamp: new Date().toISOString(),
    };

    console.log("📧 Payment Failure Notification:", notification);
    // In production: send to webhook
  }

  /**
   * Send retry notification
   */
  private async notifyRetry(schedule: PaymentSchedule, reason: string): Promise<void> {
    if (!this.paymentConfig.notificationWebhook) return;

    const notification = {
      type: "payment_retry_scheduled",
      schedule: {
        id: schedule.id,
        retryCount: schedule.retryCount,
        maxRetries: schedule.maxRetries,
        nextAttempt: schedule.nextPaymentDate,
      },
      reason,
      timestamp: new Date().toISOString(),
    };

    console.log("🔄 Payment Retry Notification:", notification);
    // In production: send to webhook
  }

  /**
   * Get payment history for a schedule
   */
  getPaymentHistory(scheduleId: string): any[] {
    return this.paymentHistory.get(scheduleId) || [];
  }

  /**
   * Get all active schedules
   */
  getActiveSchedules(): PaymentSchedule[] {
    return this.paymentConfig.schedules.filter((s: PaymentSchedule) => s.status === "active");
  }

  /**
   * Get all schedules (any status)
   */
  getAllSchedules(): PaymentSchedule[] {
    return [...this.paymentConfig.schedules];
  }

  /**
   * Add a new payment schedule
   */
  addSchedule(schedule: PaymentSchedule): void {
    this.paymentConfig.schedules.push(schedule);
  }

  /**
   * Update schedule status
   */
  updateScheduleStatus(scheduleId: string, status: PaymentSchedule["status"]): void {
    const schedule = this.paymentConfig.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.status = status;
    }
  }
}
