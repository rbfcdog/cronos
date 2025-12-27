/**
 * Recurring Payment Agent - Test Suite
 * 
 * Comprehensive tests covering:
 * - Payment scheduling
 * - Balance checks
 * - Failure handling
 * - Retry logic
 * - Success tracking
 */

import { RecurringPaymentAgent, PaymentSchedule, RecurringPaymentConfig } from "./recurring-payment.agent";

// Test utilities
function createTestSchedule(overrides: Partial<PaymentSchedule> = {}): PaymentSchedule {
  return {
    id: `schedule-${Math.random().toString(36).slice(2)}`,
    recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    amount: "100",
    token: "USDC",
    frequency: "monthly",
    nextPaymentDate: new Date(),
    retryCount: 0,
    maxRetries: 3,
    status: "active",
    ...overrides,
  };
}

function createTestAgent(schedules: PaymentSchedule[] = []): RecurringPaymentAgent {
  const config: RecurringPaymentConfig = {
    schedules,
    minBalance: "1000",
    autoRetry: true,
    retryDelay: 60,
  };
  return new RecurringPaymentAgent(config);
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<boolean> {
  try {
    await testFn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error}`);
    return false;
  }
}

// Test suite
export async function testRecurringPaymentAgent(): Promise<void> {
  console.log("\n🧪 Testing Recurring Payment Agent\n");

  const results: boolean[] = [];

  // Test 1: Single payment due now
  results.push(await runTest("Single payment due now", async () => {
    const schedule = createTestSchedule({
      nextPaymentDate: new Date(Date.now() - 1000), // 1 second ago
    });
    const agent = createTestAgent([schedule]);
    
    const plan = await agent.generatePlan({ currentDate: new Date() });
    
    if (plan.actions.length === 0) {
      throw new Error("Expected actions for due payment");
    }
    if (!plan.actions.some(a => a.type === "x402_payment")) {
      throw new Error("Expected x402_payment action");
    }
  }));

  // Test 2: No payments due
  results.push(await runTest("No payments due", async () => {
    const schedule = createTestSchedule({
      nextPaymentDate: new Date(Date.now() + 86400000), // Tomorrow
    });
    const agent = createTestAgent([schedule]);
    
    const plan = await agent.generatePlan({ currentDate: new Date() });
    
    if (plan.actions.length !== 0) {
      throw new Error("Expected no actions for future payment");
    }
  }));

  // Test 3: Multiple payments due
  results.push(await runTest("Multiple payments due", async () => {
    const schedules = [
      createTestSchedule({ id: "pay1", amount: "100", token: "USDC" }),
      createTestSchedule({ id: "pay2", amount: "200", token: "TCRO" }),
      createTestSchedule({ id: "pay3", amount: "50", token: "USDC" }),
    ];
    const agent = createTestAgent(schedules);
    
    const plan = await agent.generatePlan({ currentDate: new Date() });
    
    const payments = plan.actions.filter(a => a.type === "x402_payment");
    if (payments.length !== 3) {
      throw new Error(`Expected 3 payments, got ${payments.length}`);
    }
  }));

  // Test 4: Insufficient balance - should not execute
  results.push(await runTest("Insufficient balance check", async () => {
    const schedule = createTestSchedule({ amount: "1000", token: "USDC" });
    const agent = createTestAgent([schedule]);
    
    const decision = await agent.makeDecision({
      currentDate: new Date(),
      balances: { USDC: "500" }, // Only have 500, need 1000
    });
    
    if (decision.shouldExecute) {
      throw new Error("Should not execute with insufficient balance");
    }
    if (!decision.reasoning.includes("Insufficient")) {
      throw new Error("Reasoning should mention insufficient balance");
    }
  }));

  // Test 5: Sufficient balance - should execute
  results.push(await runTest("Sufficient balance check", async () => {
    const schedule = createTestSchedule({ amount: "100", token: "USDC" });
    const agent = createTestAgent([schedule]);
    
    const decision = await agent.makeDecision({
      currentDate: new Date(),
      balances: { USDC: "1000" }, // Have 1000, need 100
      gasPrice: "20",
    });
    
    if (!decision.shouldExecute) {
      throw new Error("Should execute with sufficient balance");
    }
  }));

  // Test 6: High gas price - should wait
  results.push(await runTest("High gas price delay", async () => {
    const schedule = createTestSchedule({ amount: "100", token: "USDC" });
    const agent = createTestAgent([schedule]);
    
    const decision = await agent.makeDecision({
      currentDate: new Date(),
      balances: { USDC: "1000" },
      gasPrice: "100", // Very high gas
    });
    
    if (decision.shouldExecute) {
      throw new Error("Should not execute with high gas price");
    }
    if (!decision.reasoning.includes("Gas price")) {
      throw new Error("Reasoning should mention gas price");
    }
  }));

  // Test 7: Payment failure handling
  results.push(await runTest("Payment failure handling", async () => {
    const schedule = createTestSchedule({ id: "fail-test", retryCount: 0, maxRetries: 3 });
    const agent = createTestAgent([schedule]);
    
    await agent.handleFailure("fail-test", "Insufficient gas");
    
    const schedules = agent.getActiveSchedules();
    const failedSchedule = schedules.find(s => s.id === "fail-test");
    
    if (!failedSchedule) {
      throw new Error("Schedule should still exist");
    }
    if (failedSchedule.retryCount !== 1) {
      throw new Error(`Expected retryCount = 1, got ${failedSchedule.retryCount}`);
    }
  }));

  // Test 8: Max retries exceeded
  results.push(await runTest("Max retries exceeded", async () => {
    const schedule = createTestSchedule({ id: "max-retry", retryCount: 2, maxRetries: 3 });
    const agent = createTestAgent([schedule]);
    
    // This should be the 3rd failure (retryCount goes from 2 to 3)
    await agent.handleFailure("max-retry", "Still failing");
    
    // Check it's NOT in active schedules
    const activeSchedules = agent.getActiveSchedules();
    const stillActive = activeSchedules.find(s => s.id === "max-retry");
    
    if (stillActive) {
      throw new Error("Failed schedule should not be in active list");
    }
    
    // But it should exist in the config with failed status
    // Access via the agent's getMetadata or a new method
    // For now, just verify it's not active
  }));

  // Test 9: Payment success handling
  results.push(await runTest("Payment success handling", async () => {
    const schedule = createTestSchedule({ id: "success-test" });
    const agent = createTestAgent([schedule]);
    
    await agent.handleSuccess("success-test", "0x123abc");
    
    const history = agent.getPaymentHistory("success-test");
    
    if (history.length !== 1) {
      throw new Error("Expected 1 history entry");
    }
    if (history[0].txHash !== "0x123abc") {
      throw new Error("Wrong txHash in history");
    }
  }));

  // Test 10: Multiple token balances
  results.push(await runTest("Multiple token balance check", async () => {
    const schedules = [
      createTestSchedule({ amount: "100", token: "USDC" }),
      createTestSchedule({ amount: "50", token: "TCRO" }),
      createTestSchedule({ amount: "0.1", token: "ETH" }),
    ];
    const agent = createTestAgent(schedules);
    
    const decision = await agent.makeDecision({
      currentDate: new Date(),
      balances: {
        USDC: "200",
        TCRO: "100",
        ETH: "1",
      },
      gasPrice: "20",
    });
    
    if (!decision.shouldExecute) {
      throw new Error("Should execute with all balances sufficient");
    }
  }));

  // Test 11: Partial insufficient balance
  results.push(await runTest("Partial insufficient balance", async () => {
    const schedules = [
      createTestSchedule({ amount: "100", token: "USDC" }),
      createTestSchedule({ amount: "50", token: "TCRO" }),
    ];
    const agent = createTestAgent(schedules);
    
    const decision = await agent.makeDecision({
      currentDate: new Date(),
      balances: {
        USDC: "200", // Sufficient
        TCRO: "10",  // Insufficient (need 50)
      },
      gasPrice: "20",
    });
    
    if (decision.shouldExecute) {
      throw new Error("Should not execute with partial insufficient balance");
    }
    if (!decision.reasoning.includes("TCRO")) {
      throw new Error("Reasoning should mention TCRO balance issue");
    }
  }));

  // Test 12: Weekly frequency
  results.push(await runTest("Weekly payment frequency", async () => {
    const schedule = createTestSchedule({ frequency: "weekly" });
    const agent = createTestAgent([schedule]);
    
    const beforeDate = new Date();
    await agent.handleSuccess(schedule.id, "0xweekly");
    
    const schedules = agent.getActiveSchedules();
    const updatedSchedule = schedules.find(s => s.id === schedule.id);
    
    if (!updatedSchedule) {
      throw new Error("Schedule not found");
    }
    
    const daysDiff = (updatedSchedule.nextPaymentDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.abs(daysDiff - 7) > 1) { // Allow 1 day tolerance
      throw new Error(`Expected ~7 days until next payment, got ${daysDiff}`);
    }
  }));

  // Test 13: Daily frequency
  results.push(await runTest("Daily payment frequency", async () => {
    const schedule = createTestSchedule({ frequency: "daily" });
    const agent = createTestAgent([schedule]);
    
    const beforeDate = new Date();
    await agent.handleSuccess(schedule.id, "0xdaily");
    
    const schedules = agent.getActiveSchedules();
    const updatedSchedule = schedules.find(s => s.id === schedule.id);
    
    if (!updatedSchedule) {
      throw new Error("Schedule not found");
    }
    
    const hoursDiff = (updatedSchedule.nextPaymentDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 23 || hoursDiff > 25) { // 24 hours ± 1 hour
      throw new Error(`Expected ~24 hours until next payment, got ${hoursDiff}`);
    }
  }));

  // Test 14: Paused schedule should not execute
  results.push(await runTest("Paused schedule ignored", async () => {
    const schedule = createTestSchedule({ status: "paused" });
    const agent = createTestAgent([schedule]);
    
    const plan = await agent.generatePlan({ currentDate: new Date() });
    
    if (plan.actions.length > 0) {
      throw new Error("Paused schedule should not generate actions");
    }
  }));

  // Test 15: Force specific payment
  results.push(await runTest("Force specific payment", async () => {
    const schedules = [
      createTestSchedule({ id: "pay1", nextPaymentDate: new Date(Date.now() + 86400000) }),
      createTestSchedule({ id: "pay2", nextPaymentDate: new Date(Date.now() + 86400000) }),
    ];
    const agent = createTestAgent(schedules);
    
    const plan = await agent.generatePlan({
      currentDate: new Date(),
      forcePaymentId: "pay2",
    });
    
    const payments = plan.actions.filter(a => a.type === "x402_payment");
    if (payments.length !== 1) {
      throw new Error("Expected exactly 1 forced payment");
    }
  }));

  // Test 16: Risk calculation
  results.push(await runTest("Risk score calculation", async () => {
    const schedule = createTestSchedule({ amount: "10000", token: "USDC" });
    const agent = createTestAgent([schedule]);
    
    const decision = await agent.makeDecision({
      currentDate: new Date(),
      balances: { USDC: "20000" },
      gasPrice: "20",
    });
    
    if (decision.riskScore < 0 || decision.riskScore > 10) {
      throw new Error(`Risk score should be 0-10, got ${decision.riskScore}`);
    }
  }));

  // Test 17: Add schedule dynamically
  results.push(await runTest("Add schedule dynamically", async () => {
    const agent = createTestAgent([]);
    const newSchedule = createTestSchedule({ id: "dynamic" });
    
    agent.addSchedule(newSchedule);
    
    const schedules = agent.getActiveSchedules();
    if (schedules.length !== 1) {
      throw new Error("Expected 1 schedule after adding");
    }
    if (schedules[0].id !== "dynamic") {
      throw new Error("Wrong schedule added");
    }
  }));

  // Test 18: Update schedule status
  results.push(await runTest("Update schedule status", async () => {
    const schedule = createTestSchedule({ id: "status-test", status: "active" });
    const agent = createTestAgent([schedule]);
    
    agent.updateScheduleStatus("status-test", "paused");
    
    const schedules = agent.getActiveSchedules();
    if (schedules.find(s => s.id === "status-test")) {
      throw new Error("Paused schedule should not be in active list");
    }
  }));

  // Test 19: Balance read actions included
  results.push(await runTest("Balance read actions included", async () => {
    const schedules = [
      createTestSchedule({ token: "USDC" }),
      createTestSchedule({ token: "TCRO" }),
    ];
    const agent = createTestAgent(schedules);
    
    const plan = await agent.generatePlan({ currentDate: new Date() });
    
    const readActions = plan.actions.filter(a => a.type === "read_balance");
    if (readActions.length < 2) { // Should read USDC and TCRO
      throw new Error("Expected balance read actions for each token");
    }
  }));

  // Test 20: Payment verification actions
  results.push(await runTest("Payment verification actions", async () => {
    const schedule = createTestSchedule();
    const agent = createTestAgent([schedule]);
    
    const plan = await agent.generatePlan({ currentDate: new Date() });
    
    const paymentIndex = plan.actions.findIndex(a => a.type === "x402_payment");
    if (paymentIndex === -1) {
      throw new Error("Expected payment action");
    }
    
    const afterPayment = plan.actions.slice(paymentIndex + 1);
    const verification = afterPayment.find(a => a.type === "read_balance");
    if (!verification) {
      throw new Error("Expected balance verification after payment");
    }
  }));

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`\n📊 Test Results: ${passed}/${total} passed (${percentage}%)\n`);

  if (passed === total) {
    console.log("🎉 All tests passed!\n");
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  testRecurringPaymentAgent();
}
