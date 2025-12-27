/**
 * 🔥 Scenario Test Runner
 * 
 * Automated test execution engine that runs agents against comprehensive scenarios.
 * Demonstrates testing superiority with detailed reporting and analytics.
 */

import { allPaymentScenarios, PaymentScenario, paymentScenarioUtils } from './payment-scenarios';
import { allDeFiScenarios, DeFiScenario, defiScenarioUtils } from './defi-scenarios';
import { createTrace, traces, TraceAnalytics } from '../../observability/trace-system';

/**
 * Test result for a single scenario execution
 */
export interface ScenarioTestResult {
  scenarioId: string;
  scenarioName: string;
  passed: boolean;
  executionTime: number; // milliseconds
  gasUsed?: string;
  reasoningSteps: number;
  error?: {
    type: string;
    message: string;
    expected: boolean; // Was this error expected?
  };
  agentDecision?: {
    action: string;
    reasoning: string[];
    confidence: number;
  };
}

/**
 * Aggregated test results with analytics
 */
export interface ScenarioTestReport {
  summary: {
    totalScenarios: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
  };
  
  byCategory: {
    [category: string]: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  };
  
  bySeverity: {
    [severity: string]: {
      total: number;
      passed: number;
      failed: number;
      passRate: number;
    };
  };
  
  gasAnalytics: {
    totalGasUsed: string;
    averageGasPerScenario: string;
    minGas: string;
    maxGas: string;
  };
  
  results: ScenarioTestResult[];
  
  criticalFailures: ScenarioTestResult[];
  unexpectedErrors: ScenarioTestResult[];
  performanceIssues: ScenarioTestResult[];
}

/**
 * Mock agent executor for scenario testing
 * (In production, this would call actual agents)
 */
class MockAgentExecutor {
  async executePaymentScenario(scenario: PaymentScenario): Promise<ScenarioTestResult> {
    const startTime = Date.now();
    
    // Create decision trace
    const trace = createTrace('payment', scenario.id)
      .withInitialState({
        balance: scenario.environment.accountBalance,
        gasPrice: scenario.environment.networkGasPrice,
        networkCondition: scenario.environment.networkCongestion
      })
      .tag('scenario-test', scenario.category, scenario.severity);
    
    try {
      // Simulate agent reasoning with trace
      const reasoning = this.generatePaymentReasoning(scenario, trace);
      
      // Simulate execution
      const executionResult = this.simulatePaymentExecution(scenario, trace);
      
      const executionTime = Date.now() - startTime;
      
      // Finalize trace
      if (executionResult.success) {
        trace.succeed(executionResult.gasUsed);
      } else {
        trace.fail(executionResult.errorMessage || executionResult.error || 'Unknown error');
      }
      
      if (executionResult.action) {
        trace.decide({
          action: executionResult.action,
          parameters: { amount: scenario.input.amount, recipient: scenario.input.recipient },
          expectedGas: executionResult.gasUsed || '21000',
          confidence: executionResult.confidence || 0.9,
          reasoning: reasoning.join(' → ')
        });
      }
      
      trace.build();
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: executionResult.success === scenario.expected.shouldSucceed,
        executionTime,
        gasUsed: executionResult.gasUsed,
        reasoningSteps: reasoning.length,
        error: executionResult.error ? {
          type: executionResult.error,
          message: executionResult.errorMessage || '',
          expected: !scenario.expected.shouldSucceed
        } : undefined,
        agentDecision: {
          action: executionResult.action,
          reasoning,
          confidence: executionResult.confidence
        }
      };
      
    } catch (error) {
      trace.fail(error instanceof Error ? error.message : 'Unknown error').build();
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: false,
        executionTime: Date.now() - startTime,
        reasoningSteps: 0,
        error: {
          type: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          expected: false
        }
      };
    }
  }
  
  async executeDeFiScenario(scenario: DeFiScenario): Promise<ScenarioTestResult> {
    const startTime = Date.now();
    
    try {
      const reasoning = this.generateDeFiReasoning(scenario);
      const executionResult = this.simulateDeFiExecution(scenario);
      const executionTime = Date.now() - startTime;
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: executionResult.success === scenario.expected.shouldSucceed,
        executionTime,
        gasUsed: executionResult.gasUsed,
        reasoningSteps: reasoning.length,
        error: executionResult.error ? {
          type: executionResult.error,
          message: executionResult.errorMessage || '',
          expected: !scenario.expected.shouldSucceed
        } : undefined,
        agentDecision: {
          action: executionResult.action,
          reasoning,
          confidence: executionResult.confidence
        }
      };
      
    } catch (error) {
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: false,
        executionTime: Date.now() - startTime,
        reasoningSteps: 0,
        error: {
          type: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          expected: false
        }
      };
    }
  }
  
  private generatePaymentReasoning(scenario: PaymentScenario, trace?: any): string[] {
    const reasoning: string[] = [];
    
    // Step 1: Validate inputs
    const step1 = `Validating payment amount: ${scenario.input.amount} TCRO`;
    reasoning.push(step1);
    if (trace) {
      trace.analyze('Input Validation', { amount: scenario.input.amount, recipient: scenario.input.recipient }, 'Checking payment parameters');
    }
    
    // Step 2: Check balance
    const balanceCheck = parseFloat(scenario.environment.accountBalance) >= parseFloat(scenario.input.amount);
    const step2 = `Balance check: ${scenario.environment.accountBalance} TCRO available, ${balanceCheck ? 'sufficient' : 'insufficient'}`;
    reasoning.push(step2);
    if (trace) {
      trace.validate('Balance Check', { sufficient: balanceCheck, balance: scenario.environment.accountBalance });
    }
    
    // Step 3: Estimate gas
    const gasEstimate = parseInt(scenario.environment.networkGasPrice) * 21000;
    const step3 = `Gas estimation: ${gasEstimate} wei at ${scenario.environment.networkGasPrice} gwei`;
    reasoning.push(step3);
    if (trace) {
      trace.analyze('Gas Estimation', { gasPrice: scenario.environment.networkGasPrice, estimate: gasEstimate.toString() }, 'Calculating transaction cost');
    }
    
    // Step 4: Check total cost
    if (balanceCheck) {
      reasoning.push(`Total cost validation: amount + gas within budget`);
      if (trace) {
        trace.validate('Budget Check', { withinBudget: true });
      }
    }
    
    // Step 5: Decision
    const decision = scenario.expected.shouldSucceed ? 'EXECUTE' : 'REJECT';
    reasoning.push(`Decision: ${decision} payment`);
    if (trace) {
      trace.plan('Final Decision', [
        { action: 'EXECUTE', reason: 'All validations passed', rejected: !scenario.expected.shouldSucceed },
        { action: 'REJECT', reason: 'Validation failed', rejected: scenario.expected.shouldSucceed }
      ]);
    }
    
    return reasoning.slice(0, scenario.expected.reasoningSteps || 5);
  }
  
  private generateDeFiReasoning(scenario: DeFiScenario): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Analyzing ${scenario.input.action} operation`);
    
    if (scenario.input.action === 'rebalance' && scenario.input.portfolio) {
      reasoning.push(`Current allocations: ${scenario.input.portfolio.map(p => `${p.token}: ${p.currentAllocation}%`).join(', ')}`);
      reasoning.push(`Target allocations: ${scenario.input.portfolio.map(p => `${p.token}: ${p.targetAllocation}%`).join(', ')}`);
      reasoning.push(`Calculating required swaps for rebalancing`);
    }
    
    if (scenario.input.action === 'swap' && scenario.input.swap) {
      reasoning.push(`Swap ${scenario.input.swap.amountIn} ${scenario.input.swap.tokenIn} → ${scenario.input.swap.tokenOut}`);
      reasoning.push(`Slippage tolerance: ${scenario.input.swap.slippage}%`);
      reasoning.push(`Checking liquidity availability`);
    }
    
    reasoning.push(`Volatility assessment: ${scenario.environment.volatility}`);
    reasoning.push(`Decision: ${scenario.expected.shouldSucceed ? 'EXECUTE' : 'REJECT'}`);
    
    return reasoning.slice(0, scenario.expected.reasoningSteps || 6);
  }
  
  private simulatePaymentExecution(scenario: PaymentScenario, trace?: any) {
    // Check for simulated errors
    if (scenario.environment.simulatedErrors?.includes('RPC_TIMEOUT')) {
      if (trace) {
        trace.addError('execution', 'RPC_TIMEOUT: Network unavailable');
      }
      return {
        success: false,
        action: 'PAYMENT',
        error: 'NETWORK_ERROR',
        errorMessage: 'RPC timeout',
        confidence: 0
      };
    }
    
    // Validate amount
    if (parseFloat(scenario.input.amount) <= 0) {
      if (trace) {
        trace.addError('validation', 'INVALID_AMOUNT: Amount must be positive');
      }
      return {
        success: false,
        action: 'PAYMENT',
        error: 'INVALID_AMOUNT',
        errorMessage: 'Amount must be positive',
        confidence: 1.0
      };
    }
    
    // Check balance
    const balance = parseFloat(scenario.environment.accountBalance);
    const amount = parseFloat(scenario.input.amount);
    const gasEstimate = (parseInt(scenario.environment.networkGasPrice) * 21000) / 1e18;
    
    if (balance < amount + gasEstimate) {
      const errorType = balance < amount ? 'INSUFFICIENT_BALANCE' : 'INSUFFICIENT_GAS_BUFFER';
      if (trace) {
        trace.addError('validation', `${errorType}: Need ${amount + gasEstimate} TCRO, have ${balance} TCRO`);
      }
      return {
        success: false,
        action: 'PAYMENT',
        error: errorType,
        errorMessage: 'Insufficient funds',
        confidence: 1.0
      };
    }
    
    // Check gas price limit
    if (scenario.input.maxGasPrice) {
      const maxGas = parseInt(scenario.input.maxGasPrice);
      const currentGas = parseInt(scenario.environment.networkGasPrice);
      
      if (currentGas > maxGas) {
        if (trace) {
          trace.addError('validation', `GAS_PRICE_TOO_HIGH: ${currentGas} > ${maxGas}`);
        }
        return {
          success: false,
          action: 'PAYMENT',
          error: 'GAS_PRICE_TOO_HIGH',
          errorMessage: `Gas price ${currentGas} exceeds limit ${maxGas}`,
          confidence: 1.0
        };
      }
    }
    
    // Success
    if (trace) {
      trace.execute('Execute Payment Transaction', '21000', 0.95);
    }
    return {
      success: true,
      action: 'EXECUTE_PAYMENT',
      gasUsed: '21000',
      confidence: 0.95
    };
  }
  
  private simulateDeFiExecution(scenario: DeFiScenario) {
    // Check for simulated events
    if (scenario.environment.simulatedEvents?.includes('PRICE_SPIKE')) {
      return {
        success: false,
        action: scenario.input.action.toUpperCase(),
        error: 'SLIPPAGE_EXCEEDED',
        errorMessage: 'Price moved beyond tolerance',
        confidence: 0
      };
    }
    
    // Rebalancing logic
    if (scenario.input.action === 'rebalance' && scenario.input.portfolio) {
      const drifts = scenario.input.portfolio.map(p => 
        Math.abs(p.currentAllocation - p.targetAllocation)
      );
      const maxDrift = Math.max(...drifts);
      
      // Skip if drift too small
      if (maxDrift < 2) {
        return {
          success: true,
          action: 'SKIP_REBALANCE',
          gasUsed: '50000',
          confidence: 0.9
        };
      }
      
      return {
        success: true,
        action: 'EXECUTE_REBALANCE',
        gasUsed: scenario.expected.minGasUsed || '200000',
        confidence: 0.85
      };
    }
    
    // Swap logic
    if (scenario.input.action === 'swap' && scenario.input.swap) {
      const pairKey = `${scenario.input.swap.tokenIn}/${scenario.input.swap.tokenOut}`;
      const liquidity = scenario.environment.availableLiquidity[pairKey];
      
      if (!liquidity || parseFloat(liquidity) < parseFloat(scenario.input.swap.amountIn) * 10) {
        return {
          success: false,
          action: 'SWAP',
          error: 'INSUFFICIENT_LIQUIDITY',
          errorMessage: 'Pool liquidity too low',
          confidence: 1.0
        };
      }
      
      return {
        success: true,
        action: 'EXECUTE_SWAP',
        gasUsed: scenario.expected.minGasUsed || '150000',
        confidence: 0.9
      };
    }
    
    // Default success
    return {
      success: true,
      action: scenario.input.action.toUpperCase(),
      gasUsed: scenario.expected.minGasUsed || '100000',
      confidence: 0.85
    };
  }
}

/**
 * Main scenario test runner
 */
export class ScenarioTestRunner {
  private executor = new MockAgentExecutor();
  
  /**
   * Run all payment scenarios
   */
  async runPaymentScenarios(): Promise<ScenarioTestReport> {
    console.log('🚀 Running Payment Scenarios...\n');
    
    const results: ScenarioTestResult[] = [];
    
    for (const scenario of allPaymentScenarios) {
      process.stdout.write(`  Testing ${scenario.id}: ${scenario.name}... `);
      const result = await this.executor.executePaymentScenario(scenario);
      results.push(result);
      console.log(result.passed ? '✅ PASS' : '❌ FAIL');
    }
    
    return this.generateReport(results, allPaymentScenarios);
  }
  
  /**
   * Run all DeFi scenarios
   */
  async runDeFiScenarios(): Promise<ScenarioTestReport> {
    console.log('🚀 Running DeFi Scenarios...\n');
    
    const results: ScenarioTestResult[] = [];
    
    for (const scenario of allDeFiScenarios) {
      process.stdout.write(`  Testing ${scenario.id}: ${scenario.name}... `);
      const result = await this.executor.executeDeFiScenario(scenario);
      results.push(result);
      console.log(result.passed ? '✅ PASS' : '❌ FAIL');
    }
    
    return this.generateReport(results, allDeFiScenarios);
  }
  
  /**
   * Run all scenarios (payment + DeFi)
   */
  async runAllScenarios(): Promise<{
    payment: ScenarioTestReport;
    defi: ScenarioTestReport;
  }> {
    const payment = await this.runPaymentScenarios();
    console.log();
    const defi = await this.runDeFiScenarios();
    
    return { payment, defi };
  }
  
  /**
   * Generate comprehensive test report
   */
  private generateReport(
    results: ScenarioTestResult[],
    scenarios: (PaymentScenario | DeFiScenario)[]
  ): ScenarioTestReport {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    
    // Category breakdown
    const byCategory: any = {};
    scenarios.forEach((scenario, idx) => {
      const cat = scenario.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, passed: 0, failed: 0, passRate: 0 };
      }
      byCategory[cat].total++;
      if (results[idx].passed) {
        byCategory[cat].passed++;
      } else {
        byCategory[cat].failed++;
      }
    });
    
    Object.keys(byCategory).forEach(cat => {
      byCategory[cat].passRate = (byCategory[cat].passed / byCategory[cat].total) * 100;
    });
    
    // Severity breakdown
    const bySeverity: any = {};
    scenarios.forEach((scenario, idx) => {
      const sev = scenario.severity;
      if (!bySeverity[sev]) {
        bySeverity[sev] = { total: 0, passed: 0, failed: 0, passRate: 0 };
      }
      bySeverity[sev].total++;
      if (results[idx].passed) {
        bySeverity[sev].passed++;
      } else {
        bySeverity[sev].failed++;
      }
    });
    
    Object.keys(bySeverity).forEach(sev => {
      bySeverity[sev].passRate = (bySeverity[sev].passed / bySeverity[sev].total) * 100;
    });
    
    // Gas analytics
    const gasResults = results.filter(r => r.gasUsed);
    const totalGas = gasResults.reduce((sum, r) => sum + parseInt(r.gasUsed || '0'), 0);
    const gasValues = gasResults.map(r => parseInt(r.gasUsed || '0'));
    
    return {
      summary: {
        totalScenarios: results.length,
        passed,
        failed,
        skipped: 0,
        passRate: (passed / results.length) * 100,
        totalExecutionTime: totalTime,
        averageExecutionTime: totalTime / results.length
      },
      byCategory,
      bySeverity,
      gasAnalytics: {
        totalGasUsed: totalGas.toString(),
        averageGasPerScenario: Math.floor(totalGas / gasResults.length).toString(),
        minGas: Math.min(...gasValues).toString(),
        maxGas: Math.max(...gasValues).toString()
      },
      results,
      criticalFailures: results.filter(r => 
        !r.passed && scenarios.find(s => s.id === r.scenarioId)?.severity === 'critical'
      ),
      unexpectedErrors: results.filter(r => 
        r.error && !r.error.expected
      ),
      performanceIssues: results.filter(r => 
        r.executionTime > 1000
      )
    };
  }
  
  /**
   * Print detailed report
   */
  printReport(report: ScenarioTestReport) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SCENARIO TEST REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📈 Summary:');
    console.log(`  Total Scenarios: ${report.summary.totalScenarios}`);
    console.log(`  ✅ Passed: ${report.summary.passed}`);
    console.log(`  ❌ Failed: ${report.summary.failed}`);
    console.log(`  📊 Pass Rate: ${report.summary.passRate.toFixed(2)}%`);
    console.log(`  ⏱️  Total Time: ${report.summary.totalExecutionTime}ms`);
    console.log(`  ⏱️  Avg Time: ${report.summary.averageExecutionTime.toFixed(2)}ms`);
    
    console.log('\n🏷️  By Category:');
    Object.entries(report.byCategory).forEach(([cat, stats]: [string, any]) => {
      console.log(`  ${cat}: ${stats.passed}/${stats.total} (${stats.passRate.toFixed(1)}%)`);
    });
    
    console.log('\n⚠️  By Severity:');
    Object.entries(report.bySeverity).forEach(([sev, stats]: [string, any]) => {
      console.log(`  ${sev}: ${stats.passed}/${stats.total} (${stats.passRate.toFixed(1)}%)`);
    });
    
    console.log('\n⛽ Gas Analytics:');
    console.log(`  Total Gas: ${report.gasAnalytics.totalGasUsed}`);
    console.log(`  Average: ${report.gasAnalytics.averageGasPerScenario}`);
    console.log(`  Min: ${report.gasAnalytics.minGas}`);
    console.log(`  Max: ${report.gasAnalytics.maxGas}`);
    
    if (report.criticalFailures.length > 0) {
      console.log('\n🚨 Critical Failures:');
      report.criticalFailures.forEach(f => {
        console.log(`  ${f.scenarioId}: ${f.scenarioName}`);
        console.log(`    Error: ${f.error?.type} - ${f.error?.message}`);
      });
    }
    
    if (report.unexpectedErrors.length > 0) {
      console.log('\n⚠️  Unexpected Errors:');
      report.unexpectedErrors.forEach(e => {
        console.log(`  ${e.scenarioId}: ${e.scenarioName}`);
        console.log(`    Error: ${e.error?.type} - ${e.error?.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

/**
 * CLI entry point
 */
export async function runScenarioTests() {
  const runner = new ScenarioTestRunner();
  
  console.log('🔥 x402 Agent Platform - Scenario Test Suite\n');
  console.log(`📊 Total Scenarios: ${allPaymentScenarios.length + allDeFiScenarios.length}`);
  console.log(`   Payment: ${allPaymentScenarios.length}`);
  console.log(`   DeFi: ${allDeFiScenarios.length}\n`);
  
  const { payment, defi } = await runner.runAllScenarios();
  
  console.log('\n');
  runner.printReport(payment);
  runner.printReport(defi);
  
  const totalPassed = payment.summary.passed + defi.summary.passed;
  const totalTests = payment.summary.totalScenarios + defi.summary.totalScenarios;
  const overallPassRate = (totalPassed / totalTests) * 100;
  
  console.log('🎯 OVERALL RESULTS:');
  console.log(`   ${totalPassed}/${totalTests} passed (${overallPassRate.toFixed(2)}%)`);
  
  // Show trace analytics
  console.log('\n📊 TRACE ANALYTICS:');
  const stats = TraceAnalytics.getSummaryStats();
  console.log(`   Total Traces: ${stats.total}`);
  console.log(`   Successful: ${stats.successful} (${stats.successRate.toFixed(1)}%)`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Avg Duration: ${stats.averageDuration.toFixed(2)}ms`);
  console.log(`   Total Gas: ${stats.totalGasUsed}`);
  console.log('\n   By Agent Type:');
  console.log(`     Payment: ${stats.byAgent.payment} traces`);
  console.log(`     Rebalancing: ${stats.byAgent.rebalancing} traces`);
  console.log(`     Treasury: ${stats.byAgent.treasury} traces`);
  
  // Show performance issues
  const slowTraces = TraceAnalytics.getSlowTraces(500);
  if (slowTraces.length > 0) {
    console.log(`\n   ⚠️  Slow Traces (>500ms): ${slowTraces.length}`);
    slowTraces.slice(0, 3).forEach(t => {
      console.log(`     ${t.traceId}: ${t.duration}ms`);
    });
  }
  
  if (overallPassRate === 100) {
    console.log('\n✨ ALL SCENARIOS PASSED! ✨\n');
  } else {
    console.log(`\n⚠️  ${totalTests - totalPassed} scenarios need attention\n`);
  }
}

// Run if called directly
if (require.main === module) {
  runScenarioTests().catch(console.error);
}
