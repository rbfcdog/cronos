# Demo Scenarios

This document describes demo scenarios for Atlas402.

## Prerequisites

1. Backend server running
2. Contracts deployed to Cronos testnet
3. Executor wallet funded with test CRO
4. AI provider configured (OpenAI or Anthropic)

## Scenario 1: Simple Payment

### User Story
"I want to send 5 CRO to my friend Bob"

### Flow

1. **User submits intent:**
   ```bash
   curl -X POST http://localhost:3000/execute/payment \
     -H "Content-Type: application/json" \
     -d '{
       "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
       "amount": "5.0",
       "reason": "Payment to Bob"
     }'
   ```

2. **Backend processes:**
   - Validates recipient address
   - Checks executor balance
   - Executes via ExecutionRouter (or direct)

3. **Response:**
   ```json
   {
     "success": true,
     "executionId": "payment-1234567890",
     "transactionHash": "0xabc...",
     "recipient": "0x742d35...",
     "amount": "5.0",
     "explorerUrl": "https://explorer.cronos.org/testnet/tx/0xabc..."
   }
   ```

4. **Verification:**
   - Check transaction on explorer
   - Verify recipient received funds
   - Check execution event in ExecutionRouter

---

## Scenario 2: AI-Driven Payment

### User Story
"Send 10 CRO to 0x123... for the hackathon bounty"

### Flow

1. **Natural language input to agent:**
   ```typescript
   const intent = "Send 10 CRO to 0x123... for the hackathon bounty";
   const plan = await plannerAgent.generatePlan(intent);
   ```

2. **Agent generates plan:**
   ```json
   {
     "executionId": "ai-pay-123",
     "type": "payment",
     "steps": [{
       "action": "payment",
       "target": "0x123...",
       "amount": "10.0"
     }],
     "estimatedGas": "21000",
     "reasoning": "Simple CRO payment for hackathon bounty"
   }
   ```

3. **Risk assessment:**
   ```typescript
   const assessment = await riskAgent.evaluatePlan(plan);
   // Result: LOW risk, APPROVE
   ```

4. **Backend executes:**
   - Validates plan
   - Executes payment
   - Records attestation

5. **Attestation recorded on-chain:**
   - Links execution to AI agent decision
   - Stores intent hash
   - Creates audit trail

---

## Scenario 3: High-Value Transaction with Risk Flagging

### User Story
"Send 150 CRO to new wallet"

### Flow

1. **Agent generates plan:**
   ```json
   {
     "executionId": "high-value-123",
     "type": "payment",
     "steps": [{
       "action": "payment",
       "target": "0xnew...",
       "amount": "150.0"
     }],
     "estimatedGas": "21000"
   }
   ```

2. **Risk agent flags:**
   ```json
   {
     "riskScore": 0.6,
     "riskLevel": "HIGH",
     "risks": [
       "High value payment: 150 CRO"
     ],
     "warnings": [],
     "recommendation": "REVIEW"
   }
   ```

3. **Backend response:**
   ```json
   {
     "success": false,
     "error": "Transaction requires manual review",
     "riskAssessment": { ... },
     "message": "High-value transaction flagged. Please confirm."
   }
   ```

4. **Manual approval flow:**
   - User reviews risk assessment
   - Confirms intent
   - Backend executes with override flag

---

## Scenario 4: Multi-Step Execution

### User Story
"Send 5 CRO to Alice and 5 CRO to Bob"

### Flow

1. **Agent generates multi-step plan:**
   ```json
   {
     "executionId": "multi-123",
     "type": "multi-step",
     "steps": [
       {
         "action": "payment",
         "target": "0xAlice...",
         "amount": "5.0"
       },
       {
         "action": "payment",
         "target": "0xBob...",
         "amount": "5.0"
       }
     ],
     "estimatedGas": "42000"
   }
   ```

2. **Backend executes sequentially:**
   - Execute payment to Alice
   - Wait for confirmation
   - Execute payment to Bob
   - Wait for confirmation

3. **Executor agent monitors:**
   - Tracks both transactions
   - Reports status updates
   - Handles any failures

---

## Scenario 5: Contract Interaction

### User Story
"Interact with TreasuryVault to check allowance"

### Flow

1. **Prepare call data:**
   ```typescript
   const iface = new ethers.Interface([
     "function allowances(address) view returns (uint256)"
   ]);
   const callData = iface.encodeFunctionData("allowances", [executorAddress]);
   ```

2. **Execute via backend:**
   ```bash
   curl -X POST http://localhost:3000/execute/contract \
     -H "Content-Type: application/json" \
     -d '{
       "targetContract": "0xTreasuryVault...",
       "callData": "0x...",
       "intentType": "allowance-check",
       "value": "0"
     }'
   ```

3. **Response includes transaction:**
   ```json
   {
     "success": true,
     "executionId": "contract-123",
     "transactionHash": "0xdef...",
     "explorerUrl": "..."
   }
   ```

---

## Demo Script

Complete demo walkthrough:

```bash
#!/bin/bash

# 1. Check system status
curl http://localhost:3000/status | jq

# 2. Check balance
curl http://localhost:3000/balance/0xYourAddress | jq

# 3. Execute test payment
curl -X POST http://localhost:3000/execute/payment \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0xTestRecipient",
    "amount": "1.0",
    "reason": "Demo payment"
  }' | jq

# 4. Record attestation
curl -X POST http://localhost:3000/execute/attest \
  -H "Content-Type: application/json" \
  -d '{
    "executionId": "demo-123",
    "agentName": "planner-agent",
    "intentHash": "0xintent..."
  }' | jq

echo "Demo complete! Check Cronos explorer for transactions."
```

---

## Video Demo Structure

1. **Introduction (1 min)**
   - Show architecture diagram
   - Explain agent → backend → blockchain flow

2. **Setup (1 min)**
   - Show deployed contracts on explorer
   - Show backend status endpoint
   - Show funded wallets

3. **Demo 1: Simple Payment (2 min)**
   - Natural language intent
   - Agent generates plan
   - Execute via backend
   - Show transaction on explorer

4. **Demo 2: Risk Assessment (2 min)**
   - High-value transaction
   - Risk agent flags it
   - Show risk score and recommendation
   - Explain safety features

5. **Demo 3: Attestation (1 min)**
   - Show on-chain attestation
   - Link execution to agent decision
   - Explain audit trail

6. **Conclusion (1 min)**
   - Recap key features
   - Mention future enhancements
   - Show GitHub repo

Total: ~8 minutes

---

## Testing Checklist

- [ ] Backend starts successfully
- [ ] All endpoints respond
- [ ] Can query balances
- [ ] Can execute payments
- [ ] Transactions appear on explorer
- [ ] ExecutionRouter emits events
- [ ] Attestations recorded
- [ ] AI agents work (if configured)
- [ ] Risk assessment works
- [ ] Error handling works

---

## Common Issues

### "Insufficient funds"
- Fund executor wallet from faucet
- Check balance before executing

### "ExecutionRouter not configured"
- Deploy contracts first
- Update .env with addresses

### "AI provider error"
- Check API keys in .env
- Verify credits available
- Use fallback mode if needed

### "Transaction failed"
- Check gas price
- Verify recipient address
- Check network status

---

**Last Updated:** December 25, 2025
