# 🧪 Complete Testing Guide

## Quick Start - Test Everything Now!

### Prerequisites Check
```bash
# 1. Check your .env is configured
cat .env | grep -E "DEPLOYER_PRIVATE_KEY|EXECUTOR_PRIVATE_KEY|OPENAI_API_KEY"

# 2. Check you have testnet CRO
cd scripts
npm run fund-wallet
```

---

## 🚀 3-Step Testing Process

### **STEP 1: Deploy Contracts** (5 minutes)

```bash
# Install dependencies
cd contracts
npm install

# Compile contracts
npm run compile

# Deploy to Cronos testnet
npm run deploy:testnet
```

**Expected Output:**
```
🚀 Deploying Atlas402 contracts to Cronos Testnet...
✅ ExecutionRouter deployed to: 0x...
✅ TreasuryVault deployed to: 0x...
✅ AttestationRegistry deployed to: 0x...
✅ All contracts deployed successfully!
```

The deployment info will be saved to `contracts/deployments/testnet-deployment.json`

---

### **STEP 2: Test Contracts Directly** (2 minutes)

```bash
# Go to scripts folder
cd ../scripts

# Install dependencies if not done
npm install

# Run interactive contract tests
npm run test
```

**This will test:**
- ✅ Executor authorization
- ✅ Treasury deposits
- ✅ Setting allowances
- ✅ Executing payments
- ✅ Withdrawing funds
- ✅ Recording attestations
- ✅ Pause/unpause functionality

**Expected Output:**
```
🧪 Atlas402 Interactive Test Suite
============================================================
TEST 1: Check Executor Authorization
  ✅ Executor is authorized

TEST 2: Deposit to TreasuryVault
  📡 Transaction: 0x...
  💰 Vault Balance: 0.0 → 0.1 tCRO
  ✅ Deposit successful!

...

📊 Test Results
============================================================
✅ Passed: 7
❌ Failed: 0
📈 Total:  7

🎉 ALL TESTS PASSED! Your contracts are working! 🎉
```

---

### **STEP 3: Test Complete AI Flow** (3 minutes)

```bash
# Start the backend server (in a new terminal)
cd backend
npm install
npm run dev
```

**Backend should start:**
```
🚀 Atlas402 Backend Server
Environment: development
Server running on: http://localhost:3000
```

**Then run the demo (in another terminal):**
```bash
cd scripts
npm run demo
```

**This will demonstrate:**
- 🤖 AI agent parsing natural language intents
- 🛡️ Risk evaluation and scoring
- 🚀 Execution on blockchain
- 📝 On-chain attestations

**Expected Output:**
```
🎬 Atlas402 Complete Demo Flow
============================================================

SCENARIO 1: Simple Payment
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

💭 Natural Language Intent:
   "Send 0.5 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"

🤖 AI Agent Processing...
   ✓ Parsed intent
   ✓ Extracted parameters

🛡️ Risk Agent Evaluating...
   ✓ Risk Score: 0.05 (LOW)
   ✓ Recommendation: APPROVE

🚀 Executing on Blockchain...
   ✅ Transaction Successful!
   📝 Transaction Details:
   • Hash: 0x...
   • Block: 12345
   
   🔍 View on Explorer:
      https://explorer.cronos.org/testnet/tx/0x...
```

---

## 🎯 Manual Testing Options

### Test 1: Direct Contract Call
```bash
cd contracts
npm run compile
npx hardhat test
```

### Test 2: Backend API
```bash
# Make sure backend is running
curl http://localhost:3000/health

# Test payment endpoint
curl -X POST http://localhost:3000/execute/payment \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "amount": "0.1",
    "reason": "Manual test payment"
  }'
```

### Test 3: AI Agent Standalone
```bash
cd agents
npm install
npm start
```

This will run the agent pipeline with example intents.

---

## 📊 What Each Test Validates

### Contract Tests (`npm run test`)
- ✅ Smart contract deployment
- ✅ Access control (who can execute)
- ✅ Payment routing
- ✅ Treasury management
- ✅ Attestation recording
- ✅ Emergency controls (pause/unpause)

### Demo Flow (`npm run demo`)
- ✅ Natural language processing
- ✅ AI agent coordination
- ✅ Risk evaluation system
- ✅ Backend orchestration
- ✅ Blockchain execution
- ✅ End-to-end flow

### Backend API Tests
- ✅ REST endpoints
- ✅ Request validation
- ✅ Error handling
- ✅ Transaction signing
- ✅ Response formatting

---

## 🔍 View Results on Blockchain

### Cronos Testnet Explorer
https://explorer.cronos.org/testnet

**Search for:**
- Your contract addresses (from `contracts/deployments/testnet-deployment.json`)
- Your wallet addresses
- Transaction hashes from test outputs

**You can see:**
- Transaction details
- Gas used
- Contract interactions
- Event logs
- Token transfers

---

## 🐛 Troubleshooting

### "Contracts not deployed yet"
```bash
cd contracts
npm run deploy:testnet
```

### "Backend is not running"
```bash
cd backend
npm run dev
```

### "Insufficient funds"
Get testnet CRO from: https://cronos.org/faucet

### "Transaction failed"
Check:
1. Wallet has enough tCRO
2. Contracts are deployed
3. Executor is authorized
4. Backend is running

### View detailed logs
```bash
# Backend logs
cd backend && npm run dev

# Contract logs
cd contracts && npx hardhat node --show-stack-traces
```

---

## 🎬 Recording a Demo

### 1. Terminal Recording
```bash
# Install asciinema (optional)
sudo apt install asciinema  # or: brew install asciinema

# Record your test session
asciinema rec demo-session.cast

# Run tests
cd scripts && npm run demo

# Stop recording (Ctrl+D)
```

### 2. What to Show
1. **Deploy contracts**: `cd contracts && npm run deploy:testnet`
2. **Run contract tests**: `cd scripts && npm run test`
3. **Start backend**: `cd backend && npm run dev`
4. **Run demo flow**: `cd scripts && npm run demo`
5. **Show explorer**: Open transaction in browser

### 3. Key Points to Highlight
- ✅ AI agents parse natural language
- ✅ Risk evaluation prevents dangerous transactions
- ✅ All actions recorded on-chain
- ✅ Transparent and auditable
- ✅ Works on real Cronos testnet

---

## 📈 Success Metrics

After testing, you should see:

- ✅ **7/7 contract tests passing**
- ✅ **3/3 demo scenarios working**
- ✅ **Transactions on Cronos Explorer**
- ✅ **Attestations recorded on-chain**
- ✅ **Risk evaluation functioning**
- ✅ **Backend API responding**

---

## 🎯 Next Steps After Testing

1. **Customize Agents**: Edit `agents/src/*.agent.ts` to add your logic
2. **Add More Tests**: Create new scenarios in `scripts/demo-flow.ts`
3. **Build Frontend**: Implement the React UI in `frontend/`
4. **Deploy Production**: Use mainnet configuration (with real CRO!)
5. **Document Results**: Record demo video for hackathon submission

---

## 📞 Quick Reference

```bash
# Deploy everything
cd contracts && npm run deploy:testnet

# Test contracts
cd scripts && npm run test

# Test full flow
cd scripts && npm run demo

# Start backend
cd backend && npm run dev

# Run agents
cd agents && npm start

# Check balances
cd scripts && npm run fund-wallet
```

---

## 🏆 Ready for Hackathon?

After successful testing, you have:
- ✅ Working smart contracts on Cronos testnet
- ✅ Functional AI agent system
- ✅ Complete backend API
- ✅ Comprehensive test coverage
- ✅ Real blockchain transactions
- ✅ On-chain audit trail

**You're ready to submit!** 🎉

For questions, check:
- `README.md` - Project overview
- `INSTRUCTIONS.md` - Setup steps
- `docs/demo.md` - Demo scenarios
- `GET_STARTED.md` - Complete guide
