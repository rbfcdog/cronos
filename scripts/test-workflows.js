#!/usr/bin/env node

/**
 * Test all workflow examples in the playground
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test workflow execution
async function testWorkflow(workflowName, workflow) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${workflowName}`);
  console.log('='.repeat(60));
  
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/playground/simulate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, workflow);
    
    if (result.status === 200) {
      console.log(`✅ ${workflowName} - SUCCESS`);
      console.log(`\nExecution Summary:`);
      console.log(`  Total Steps: ${result.body.trace?.steps?.length || 0}`);
      
      if (result.body.trace?.steps) {
        result.body.trace.steps.forEach((step, i) => {
          const statusIcon = step.status === 'success' || step.status === 'simulated' ? '✓' : '✗';
          console.log(`  ${statusIcon} Step ${i + 1}: ${step.action.type} (${step.status})`);
          if (step.output) {
            const outputStr = JSON.stringify(step.output, null, 2);
            console.log(`     Output: ${outputStr.substring(0, 150)}${outputStr.length > 150 ? '...' : ''}`);
          }
        });
      } else {
        console.log('  ⚠️  No trace data returned');
        console.log(`  Raw response: ${JSON.stringify(result.body).substring(0, 200)}...`);
      }
      
      return true;
    } else {
      console.log(`❌ ${workflowName} - FAILED (HTTP ${result.status})`);
      console.log(`   Error: ${JSON.stringify(result.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${workflowName} - ERROR`);
    console.log(`   ${error.message}`);
    return false;
  }
}

// Workflow 1: Basic Payment
const basicWorkflow = {
  mode: "simulate",
  planId: "test_basic",
  description: "Basic Payment Workflow",
  actions: [
    {
      type: "read_balance",
      stepId: "step_0",
      token: "TCRO"
    },
    {
      type: "x402_payment",
      stepId: "step_1",
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      amount: "0.5",
      token: "TCRO"
    }
  ],
  context: { chainId: 338, timestamp: Date.now() }
};

// Workflow 2: DeFi Token Swap
const defiWorkflow = {
  mode: "simulate",
  planId: "test_defi",
  description: "DeFi Token Swap Workflow",
  actions: [
    {
      type: "read_balance",
      stepId: "step_0",
      token: "TCRO"
    },
    {
      type: "read_state",
      stepId: "step_1",
      contract: "ExecutionRouter"
    },
    {
      type: "approve_token",
      stepId: "step_2",
      token: "TCRO",
      spender: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      amount: "1.0"
    },
    {
      type: "contract_call",
      stepId: "step_3",
      contract: "ExecutionRouter",
      method: "swap",
      args: ["TCRO", "USDC", "1.0", "0.95"]
    },
    {
      type: "read_balance",
      stepId: "step_4",
      token: "USDC"
    }
  ],
  context: { chainId: 338, timestamp: Date.now() }
};

// Workflow 3: Conditional Execution
const conditionalWorkflow = {
  mode: "simulate",
  planId: "test_conditional",
  description: "Conditional Execution Workflow",
  actions: [
    {
      type: "read_balance",
      stepId: "step_0",
      token: "TCRO"
    },
    {
      type: "x402_payment",
      stepId: "step_1",
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      amount: "1.0",
      token: "TCRO"
    },
    {
      type: "x402_payment",
      stepId: "step_2",
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      amount: "0.1",
      token: "TCRO"
    }
  ],
  context: { chainId: 338, timestamp: Date.now() }
};

// Workflow 4: AI Risk Analysis
const aiWorkflow = {
  mode: "simulate",
  planId: "test_ai",
  description: "AI Risk Analysis Workflow",
  actions: [
    {
      type: "read_balance",
      stepId: "step_0",
      token: "TCRO"
    },
    {
      type: "read_state",
      stepId: "step_1",
      contract: "ExecutionRouter"
    },
    {
      type: "llm_agent",
      stepId: "step_2",
      prompt: "Analyze the wallet balance and contract state. Calculate the optimal payment amount considering: 1) Keep at least 30% as safety buffer, 2) Gas costs (~0.01 TCRO), 3) Contract deployment status. Respond with JSON: {amount: number, shouldExecute: boolean, reason: string}",
      context: '{"balance": "step_0.balance", "contractState": "step_1.state", "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}',
      model: "gpt-4",
      temperature: 0.3
    },
    {
      type: "x402_payment",
      stepId: "step_3",
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      amount: "0.5",
      token: "TCRO"
    }
  ],
  context: { chainId: 338, timestamp: Date.now() }
};

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Workflow Tests');
  console.log('Testing 4 different workflow patterns...\n');
  
  const results = [];
  
  results.push(await testWorkflow('1. Basic Payment', basicWorkflow));
  results.push(await testWorkflow('2. DeFi Token Swap', defiWorkflow));
  results.push(await testWorkflow('3. Conditional Execution', conditionalWorkflow));
  results.push(await testWorkflow('4. AI Risk Analysis', aiWorkflow));
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All workflows tested successfully!');
  } else {
    console.log('\n⚠️  Some workflows failed. Check logs above.');
  }
}

// Execute tests
runAllTests().catch(console.error);
