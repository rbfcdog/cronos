# 🚀 Quick Start Guide - x402 Agent Playground

Get the x402 Agent Playground up and running in 10 minutes.

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Git
- ✅ Cronos Testnet TCRO (get from faucet)
- ✅ OpenAI API key (for AI agents)

---

## Step 1: Clone & Install (2 min)

```bash
# Clone repository
git clone <repo-url>
cd cronos

# Install all dependencies
npm install
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd agents && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Step 2: Configure Environment (3 min)

```bash
# Create .env file
cp .env.example .env

# Edit .env with your details
nano .env  # or your favorite editor
```

**Required variables:**
```env
# Cronos Testnet
CRONOS_RPC=https://evm-t3.cronos.org
CHAIN_ID=338

# Your executor wallet (has testnet TCRO)
EXECUTOR_PRIVATE_KEY=0x...

# Already deployed contracts (or deploy your own)
EXECUTION_ROUTER_ADDRESS=0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6
TREASURY_VAULT_ADDRESS=0x169439e816B63D3836e1E4e9C407c7936505C202
ATTESTATION_REGISTRY_ADDRESS=0xb183502116bcc1b41Bb42C704F4868e5Dc812Ce2

# OpenAI (for AI agents)
OPENAI_API_KEY=sk-proj-...

# x402 (optional, for advanced features)
X402_API_KEY=your_x402_api_key
X402_API_URL=https://api.x402.com

# Backend
BACKEND_PORT=3001
```

**Get Testnet TCRO:**
```
1. Create wallet or use existing
2. Visit: https://cronos.org/faucet
3. Request testnet TCRO
4. Wait ~30 seconds
```

---

## Step 3: Deploy Contracts (Optional, 2 min)

**If using provided contracts, SKIP this step.**

If you want your own contracts:

```bash
cd contracts

# Compile
npx hardhat compile

# Deploy to Cronos Testnet
npx hardhat run scripts/deploy.ts --network cronosTestnet

# Copy deployed addresses to .env
# Update EXECUTION_ROUTER_ADDRESS, TREASURY_VAULT_ADDRESS, etc.
```

---

## Step 4: Start Backend (1 min)

```bash
cd backend
npm run dev

# You should see:
# ✅ Backend server running at http://localhost:3001
# ✅ Executor: 0x5Be9C13C279c88...
# ✅ Balance: 10 TCRO
```

**Keep this terminal open!**

---

## Step 5: Test AI Agents (1 min)

Open a **new terminal**:

```bash
cd agents
npm run test

# Expected output:
# ✅ Planner Agent: OpenAI initialized
# ✅ Risk Agent: OpenAI initialized
# 
# 🤖 Planner Agent: "Send 0.5 CRO to 0x742d35..."
# ✅ Plan: payment, 1 steps, 0.5 CRO
# 
# 🛡️  Risk Agent: txn-001
# ✅ Risk: low, Score: 10%, APPROVE
```

---

## Step 6: Run Playground Demo (1 min)

Open **another new terminal**:

```bash
node scripts/demo-playground.js

# Expected output:
# ╔═══════════════════════════════════════════════╗
# ║   x402 Agent Playground - Interactive Demo    ║
# ╚═══════════════════════════════════════════════╝
# 
# ✅ Backend is operational
# 
# DEMO 1: Simple Payment Simulation
# ✅ Simulation successful!
# 📊 Summary:
#    Total Steps: 2
#    Successful: 2
#    Gas Estimate: 210000
```

---

## Step 7: Test Complete Integration

```bash
cd agents
npm run playground

# This runs the full flow:
# Intent → PlannerAgent → RiskAgent → Playground → Result
```

---

## 🎉 Success! What's Working

After completing these steps, you have:

✅ **Smart Contracts** deployed on Cronos Testnet
✅ **Backend API** running on port 3001
✅ **AI Agents** generating plans and assessing risk
✅ **Playground** simulating and executing transactions

---

## 🔍 Verify Everything Works

### Test 1: Backend Health

```bash
curl http://localhost:3001/health

# Expected:
# {
#   "status": "healthy",
#   "timestamp": "2024-12-25T12:00:00.000Z",
#   "version": "1.0.0"
# }
```

### Test 2: Playground Health

```bash
curl http://localhost:3001/api/playground/health

# Expected:
# {
#   "success": true,
#   "data": {
#     "status": "operational",
#     "features": {
#       "simulation": true,
#       "execution": true
#     }
#   }
# }
```

### Test 3: Simulate a Payment

```bash
curl -X POST http://localhost:3001/api/playground/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "simulate",
    "actions": [{
      "type": "read_balance",
      "token": "TCRO"
    }]
  }'

# Expected:
# {
#   "success": true,
#   "data": {
#     "runId": "run_...",
#     "success": true,
#     "summary": {
#       "totalSteps": 1,
#       "successfulSteps": 1
#     }
#   }
# }
```

---

## 🎮 What to Try Next

### 1. Simulate a Payment

```bash
curl -X POST http://localhost:3001/api/playground/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "simulate",
    "actions": [{
      "type": "x402_payment",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "amount": "0.5",
      "token": "TCRO"
    }]
  }'
```

### 2. Execute a Real Payment (⚠️ Uses Real Testnet TCRO)

```bash
curl -X POST http://localhost:3001/api/playground/execute \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "execute",
    "actions": [{
      "type": "x402_payment",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "amount": "0.1",
      "token": "TCRO"
    }]
  }'

# Response will include:
# - Transaction hash
# - Explorer URL
# - Gas used
```

### 3. Use AI Agents

```bash
cd agents

# Test agents
npm run test

# Run integration demo
npm run playground
```

### 4. List All Execution Runs

```bash
curl http://localhost:3001/api/playground/runs

# Shows all simulations and executions
```

---

## 📚 Next Steps

1. **Read Documentation**: `docs/x402-playground.md`
2. **Explore Code**: Start with `backend/src/playground/runner.ts`
3. **Build Custom Agents**: See `agents/src/` for examples
4. **Integrate with Your App**: Use the REST APIs
5. **Deploy Your Own Contracts**: Customize smart contracts

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Cannot connect to Cronos RPC`
- Check `CRONOS_RPC` in `.env`
- Try: `https://evm-t3.cronos.org`

**Error:** `Invalid private key`
- Check `EXECUTOR_PRIVATE_KEY` format (must start with `0x`)
- Ensure it's a valid 64-character hex string

**Error:** `Contract not found`
- Either use provided addresses or deploy your own
- Run: `cd contracts && npx hardhat run scripts/deploy.ts --network cronosTestnet`

### AI Agents fail

**Error:** `OpenAI API key invalid`
- Check `OPENAI_API_KEY` in `.env`
- Get key from: https://platform.openai.com/api-keys

**Error:** `Rate limit exceeded`
- Wait 60 seconds
- Or use fallback mode (agents work without API key)

### Playground returns errors

**Error:** `Insufficient balance`
- Get more testnet TCRO from faucet
- Or reduce payment amounts in tests

**Error:** `Run not found`
- Check the `runId` from simulation response
- Try: `curl http://localhost:3001/api/playground/runs`

---

## 📞 Support

- **Documentation**: See `docs/` folder
- **Examples**: Check `scripts/` for demos
- **API Reference**: `docs/x402-playground.md`
- **Code**: Well-commented TypeScript

---

## ✅ Checklist

Before claiming "it works":

- [ ] Backend starts without errors
- [ ] AI agents run successfully (`npm run test`)
- [ ] Playground demo completes (`node scripts/demo-playground.js`)
- [ ] Can simulate transactions via API
- [ ] Can retrieve run details
- [ ] (Optional) Executed real transaction and verified on explorer

---

## 🎯 You're Ready!

The x402 Agent Playground is now fully operational. You can:

- ✅ Simulate blockchain transactions safely
- ✅ Generate execution plans with AI
- ✅ Assess risk automatically
- ✅ Execute real transactions on Cronos
- ✅ Observe detailed traces and states
- ✅ Build your own AI agents

**Happy building!** 🚀

---

**Time to complete:** ~10 minutes
**Difficulty:** Easy (copy-paste commands)
**Prerequisites:** Node.js, testnet TCRO, OpenAI key
