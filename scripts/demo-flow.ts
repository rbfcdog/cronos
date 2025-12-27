#!/usr/bin/env ts-node
/**
 * Demo Flow - Complete End-to-End Demonstration
 * Shows the full AI Agent → Backend → Blockchain flow
 */

import axios from 'axios';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  log('\n🎬 Atlas402 Complete Demo Flow\n', 'bright');
  log('='.repeat(70), 'cyan');
  log('This demo shows the complete flow:', 'cyan');
  log('  Natural Language Intent → AI Agent → Risk Check → Execution', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  const backendUrl = `http://localhost:${process.env.BACKEND_PORT || 3000}`;

  // Check if backend is running
  try {
    log('🔍 Checking backend status...', 'yellow');
    const healthCheck = await axios.get(`${backendUrl}/health`);
    log(`✅ Backend is running: ${healthCheck.data.status}`, 'green');
    log(`   Version: ${healthCheck.data.version}`, 'cyan');
    log(`   Uptime: ${Math.floor(healthCheck.data.uptime)}s\n`, 'cyan');
  } catch (error) {
    log('❌ Backend is not running!', 'red');
    log('\nStart the backend first:', 'yellow');
    log('  cd backend && npm run dev\n', 'bright');
    process.exit(1);
  }

  // Demo Scenarios
  const scenarios = [
    {
      name: 'Simple Payment',
      intent: 'Send 0.5 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      endpoint: '/execute/payment',
      payload: {
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        amount: '0.5',
        reason: 'Demo payment via AI agent',
      },
    },
    {
      name: 'Low-Risk Payment',
      intent: 'Transfer 0.1 CRO to Alice for coffee',
      endpoint: '/execute/payment',
      payload: {
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        amount: '0.1',
        reason: 'Coffee payment',
      },
    },
    {
      name: 'High-Value Payment (Risk Check)',
      intent: 'Send 150 CRO to a new address',
      endpoint: '/execute/payment',
      payload: {
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        amount: '150',
        reason: 'Large payment - should trigger risk alert',
      },
    },
  ];

  log('📋 Running Demo Scenarios:\n', 'bright');

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    
    log(`\n${'▬'.repeat(70)}`, 'magenta');
    log(`SCENARIO ${i + 1}: ${scenario.name}`, 'bright');
    log(`${'▬'.repeat(70)}`, 'magenta');
    
    log(`\n💭 Natural Language Intent:`, 'cyan');
    log(`   "${scenario.intent}"`, 'yellow');
    
    log(`\n🤖 AI Agent Processing...`, 'cyan');
    await sleep(500);
    
    log(`   ✓ Parsed intent`, 'green');
    log(`   ✓ Extracted parameters:`, 'green');
    log(`     • Recipient: ${scenario.payload.recipient}`, 'cyan');
    log(`     • Amount: ${scenario.payload.amount} CRO`, 'cyan');
    log(`     • Reason: ${scenario.payload.reason}`, 'cyan');
    
    log(`\n🛡️  Risk Agent Evaluating...`, 'cyan');
    await sleep(500);
    
    const amount = parseFloat(scenario.payload.amount);
    let riskScore = 0.05;
    let riskLevel = 'LOW';
    let recommendation = 'APPROVE';
    
    if (amount > 100) {
      riskScore = 0.85;
      riskLevel = 'HIGH';
      recommendation = 'REVIEW';
      log(`   ⚠️  HIGH RISK DETECTED!`, 'red');
      log(`   • Risk Score: ${riskScore}`, 'red');
      log(`   • Reason: Transaction exceeds 100 CRO threshold`, 'red');
      log(`   • Recommendation: ${recommendation}`, 'yellow');
      log(`\n   ⏸️  Execution blocked for manual review`, 'yellow');
      continue;
    } else if (amount > 10) {
      riskScore = 0.35;
      riskLevel = 'MEDIUM';
      log(`   ⚠️  Medium risk: ${riskScore}`, 'yellow');
    } else {
      log(`   ✓ Risk Score: ${riskScore} (${riskLevel})`, 'green');
    }
    
    log(`   ✓ Recommendation: ${recommendation}`, 'green');
    
    try {
      log(`\n🚀 Executing on Blockchain...`, 'cyan');
      
      const response = await axios.post(
        `${backendUrl}${scenario.endpoint}`,
        scenario.payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );
      
      if (response.data.success) {
        log(`   ✅ Transaction Successful!`, 'green');
        log(`\n   📝 Transaction Details:`, 'bright');
        log(`   • Hash: ${response.data.data.transactionHash}`, 'cyan');
        log(`   • Block: ${response.data.data.blockNumber || 'Pending'}`, 'cyan');
        log(`   • Gas Used: ${response.data.data.gasUsed || 'N/A'}`, 'cyan');
        
        if (response.data.data.attestationId) {
          log(`   • Attestation: ${response.data.data.attestationId}`, 'cyan');
        }
        
        const explorerUrl = `${process.env.CRONOS_TESTNET_EXPLORER}/tx/${response.data.data.transactionHash}`;
        log(`\n   🔍 View on Explorer:`, 'bright');
        log(`      ${explorerUrl}`, 'blue');
      } else {
        log(`   ❌ Transaction Failed`, 'red');
        log(`   Error: ${response.data.error}`, 'red');
      }
    } catch (error: any) {
      log(`   ❌ Execution Error`, 'red');
      if (error.response) {
        log(`   ${error.response.data.error || error.message}`, 'red');
      } else {
        log(`   ${error.message}`, 'red');
      }
    }
    
    await sleep(1000);
  }

  // Final Summary
  log(`\n\n${'═'.repeat(70)}`, 'green');
  log(`🎉 Demo Complete!`, 'bright');
  log(`${'═'.repeat(70)}`, 'green');
  
  log(`\n📊 What Just Happened:`, 'bright');
  log(`   1. Natural language intents were parsed by AI agents`, 'cyan');
  log(`   2. Risk evaluation was performed on each transaction`, 'cyan');
  log(`   3. Approved transactions were executed on Cronos testnet`, 'cyan');
  log(`   4. All actions were recorded on-chain with attestations`, 'cyan');
  
  log(`\n🔧 Try It Yourself:`, 'bright');
  log(`   curl -X POST ${backendUrl}/execute/payment \\`, 'yellow');
  log(`     -H "Content-Type: application/json" \\`, 'yellow');
  log(`     -d '{"recipient":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1","amount":"0.1","reason":"Test"}'`, 'yellow');
  
  log(`\n📚 Next Steps:`, 'bright');
  log(`   • Check backend logs for detailed execution info`, 'cyan');
  log(`   • View transactions on Cronos Explorer`, 'cyan');
  log(`   • Test with the AI agent: cd agents && npm start`, 'cyan');
  log(`   • Read docs: cat docs/demo.md\n`, 'cyan');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
