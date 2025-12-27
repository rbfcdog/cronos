/**
 * Comprehensive Agent Test Suite
 * 
 * Runs all tests for the three high-value agents:
 * 1. Recurring Payment Agent (20 tests)
 * 2. Portfolio Rebalancing Agent (15 tests)
 * 3. Treasury Management Agent (15 tests)
 * 
 * Total: 50 tests across all agents
 */

import { testRecurringPaymentAgent } from "./recurring-payment.test";
import { testPortfolioRebalancingAgent } from "./portfolio-rebalancing.test";
import { testTreasuryManagementAgent } from "./treasury-management.test";

async function runAllTests(): Promise<void> {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CRONOS X402 PLATFORM - AGENT TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n");

  const startTime = Date.now();
  let allPassed = true;

  try {
    // Test 1: Recurring Payment Agent
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ TIER 3: Recurring Payment Agent (x402 Pure Use Case)   │");
    console.log("└─────────────────────────────────────────────────────────┘");
    await testRecurringPaymentAgent();
  } catch (error) {
    console.error("❌ Recurring Payment Agent tests failed");
    allPassed = false;
  }

  try {
    // Test 2: Portfolio Rebalancing Agent
    console.log("\n┌─────────────────────────────────────────────────────────┐");
    console.log("│ TIER 1: Portfolio Rebalancing Agent (Technical Showcase)│");
    console.log("└─────────────────────────────────────────────────────────┘");
    await testPortfolioRebalancingAgent();
  } catch (error) {
    console.error("❌ Portfolio Rebalancing Agent tests failed");
    allPassed = false;
  }

  try {
    // Test 3: Treasury Management Agent
    console.log("\n┌─────────────────────────────────────────────────────────┐");
    console.log("│ TIER 2: Treasury Management Agent (Institutional Appeal)│");
    console.log("└─────────────────────────────────────────────────────────┘");
    await testTreasuryManagementAgent();
  } catch (error) {
    console.error("❌ Treasury Management Agent tests failed");
    allPassed = false;
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log("\n═══════════════════════════════════════════════════════════");
  if (allPassed) {
    console.log("  ✅ ALL AGENT TESTS PASSED");
    console.log(`  Total Duration: ${duration}s`);
    console.log("  Ready for production deployment!");
  } else {
    console.log("  ❌ SOME TESTS FAILED");
    console.log(`  Duration: ${duration}s`);
    console.log("  Review errors above and fix before deployment");
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  if (!allPassed) {
    process.exit(1);
  }
}

// Run all tests
runAllTests();
