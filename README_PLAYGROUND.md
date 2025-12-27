# x402 Agent Playground

**Interactive developer tooling for AI agents to programmatically interact with Cronos EVM via x402**

## 🎯 Purpose

This is **developer tooling**, not a consumer dApp. It's a safe, observable playground where:
- LLM-based agents submit structured execution plans
- Developers simulate and inspect agentic x402 workflows  
- Safe debugging and observability BEFORE real on-chain settlement

**Built for the Cronos x402 Hackathon** targeting:
- ✅ Dev Tooling & Data Virtualization Track
- ✅ Main Track (x402 Applications)

---

## 🔒 Core Security Principle

**Agents and LLMs NEVER send transactions directly.**

They only:
- Generate execution plans (JSON)
- Reason about blockchain state
- Call structured APIs
- Consume execution traces

The backend:
- Holds keys securely
- Executes x402 operations  
- Manages smart contract calls
- Controls ALL fund movements

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cronos Testnet TCRO
- OpenAI API key (for AI agents)

### Installation

```bash
# 1. Clone and install
git clone <repo>
cd cronos
npm install

# 2. Install dependencies for all packages
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd agents && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env with your keys
```

### Deploy Contracts (First Time)

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network cronosTestnet

# Note the deployed contract addresses
# Add them to your .env file
```

### Run the Playground

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test AI agents
cd agents  
npm run test

# Terminal 3: Run playground demo
node scripts/demo-playground.js
```

---

## 📋 What We've Built

### ✅ Smart Contracts (Deployed on Cronos Testnet)

- **ExecutionRouter** (`0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6`)
  - Routes x402 payments with authorization
  - Emits events for observability
  
- **TreasuryVault** (`0x169439e816B63D3836e1E4e9C407c7936505C202`)
  - Manages protocol funds
  - 2 TCRO deposited successfully
  
- **AttestationRegistry** (`0xb183502116bcc1b41Bb42C704F4868e5Dc812Ce2`)
  - Records execution attestations
  - Trusted attester configured

### ✅ AI Agents (OpenAI + Zod Structured Outputs)

- **PlannerAgent** (`agents/src/planner.agent.ts`)
  - Parses natural language → ExecutionPlan
  - Uses `gpt-4o-2024-08-06` with Zod schemas
  - Fallback regex parser when AI unavailable
  
- **RiskAgent** (`agents/src/risk.agent.ts`)
  - AI-powered risk assessment
  - Returns scores (0-1), severity levels, recommendations
  - Rule-based fallback

### ✅ x402 Agent Playground (`backend/src/playground/`)

**Core Architecture:**
- `runner.ts` - Orchestrates execution plans
- `simulator.ts` - Virtual execution without real txs
- `state.ts` - Unified virtual state management
- `trace.ts` - Detailed execution traces

**API Endpoints:**
- `POST /api/playground/simulate` - Simulate execution
- `POST /api/playground/execute` - Real blockchain execution
- `POST /api/playground/validate` - Validate plans
- `GET /api/playground/runs/:id` - Retrieve trace
- `GET /api/playground/runs` - List all runs

**Key Features:**
- ✅ **Simulation Mode**: Test without real transactions
- ✅ **Data Virtualization**: Unified state object (wallet, contracts, x402)
- ✅ **Observability**: Step-by-step traces with gas estimates
- ✅ **LLM-Friendly**: Structured JSON, agent-readable responses
- ✅ **Safe Execution**: Validate → Simulate → Execute flow

---

## 🎮 How It Works

### Agent → Plan → Simulate → Execute

```
1. LLM/Agent generates execution plan
   ↓
2. POST /api/playground/simulate
   ↓
3. Review trace, gas estimates, state changes
   ↓
4. POST /api/playground/execute (optional)
   ↓
5. Real Cronos transaction + explorer link
```

### Example: Natural Language → Blockchain

```typescript
// 1. Agent receives intent
const intent = "Send 0.5 CRO to Alice";

// 2. PlannerAgent converts to structured plan
const plan = await plannerAgent.generatePlan(intent);
// → { type: "payment", steps: [...], estimatedGas: "21000", totalValue: "0.5" }

// 3. RiskAgent evaluates
const risk = await riskAgent.assessRisk(plan);
// → { overallRisk: "low", riskScore: 0.1, recommendation: "approve" }

// 4. Convert to playground format
const playgroundPlan = {
  mode: "simulate",
  actions: [{
    type: "x402_payment",
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    amount: "0.5",
    token: "TCRO"
  }]
};

// 5. Simulate
const result = await fetch("http://localhost:3001/api/playground/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(playgroundPlan)
});

// 6. Review trace
const { data } = await result.json();
console.log(`Gas Estimate: ${data.summary.totalGasEstimate}`);
console.log(`New Balance: ${data.trace.virtualState.wallet.balances.TCRO}`);

// 7. Execute (if approved)
await fetch("http://localhost:3001/api/playground/execute", {
  method: "POST",
  body: JSON.stringify({ ...playgroundPlan, mode: "execute" })
});
```

---

## 📊 Execution Plan Format

Agents submit **structured JSON plans**:

```json
{
  "mode": "simulate",
  "planId": "plan_001",
  "description": "Send payment and check balance",
  "actions": [
    {
      "type": "read_balance",
      "token": "TCRO",
      "description": "Check wallet balance"
    },
    {
      "type": "x402_payment",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "amount": "0.5",
      "token": "TCRO",
      "description": "Send 0.5 TCRO"
    },
    {
      "type": "contract_call",
      "contract": "ExecutionRouter",
      "method": "executePayment",
      "args": ["0x742d35...", "500000000000000000", "Payment"],
      "description": "Execute via ExecutionRouter"
    }
  ]
}
```

**Supported Action Types:**
- `read_balance` - Read wallet balance
- `x402_payment` - Send CRO via x402
- `contract_call` - Call smart contract
- `read_state` - Read contract state
- `approve_token` - Approve token spending

---

## 🔍 Data Virtualization

Every execution exposes **unified, agent-readable state**:

```json
{
  "runId": "run_1735152000_abc123",
  "mode": "simulate",
  "wallet": {
    "address": "0x5Be9C13C279c88...",
    "balances": { "TCRO": "9.5", "USDC": "1000" },
    "nonce": 42
  },
  "contracts": {
    "ExecutionRouter": {
      "address": "0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6",
      "name": "ExecutionRouter",
      "isDeployed": true
    }
  },
  "x402": {
    "mode": "simulated",
    "lastExecution": {
      "timestamp": 1735152000000,
      "txHash": "0x8b193107..."
    }
  }
}
```

---

## 📝 Execution Traces

Every run produces a **detailed trace**:

```json
{
  "runId": "run_1735152000_abc123",
  "status": "completed",
  "steps": [
    {
      "action": { "type": "read_balance", "token": "TCRO" },
      "status": "simulated",
      "result": { "balance": "10", "address": "0x..." },
      "gasEstimate": "0"
    },
    {
      "action": { "type": "x402_payment", "to": "0x742d35...", "amount": "0.5" },
      "status": "simulated",
      "result": { "newBalance": "9.5" },
      "gasEstimate": "210000"
    }
  ],
  "virtualState": { /* final state */ },
  "warnings": [],
  "errors": [],
  "metadata": {
    "startTime": 1735152000000,
    "endTime": 1735152001250,
    "duration": 1250
  }
}
```

---

## 🎯 What This Demonstrates

### For Dev Tooling & Data Virtualization Track

✅ **Agent Runtime & Orchestration**
- Complete execution plan format
- Step-by-step orchestration with state management
- Multi-action transaction flows

✅ **Programmatic LLM ↔ Blockchain Interface**
- Structured APIs (not UI-based)
- Tool-calling friendly endpoints
- Agent-readable JSON responses

✅ **Data Virtualization**
- Unified virtual state (wallet, contracts, x402)
- Balance tracking across simulations
- Contract state management

✅ **Agent-Readable Feeds**
- Detailed execution traces
- Gas estimates and warnings
- Error/success reporting

✅ **Observability & Debugging**
- Complete action history
- State snapshots after each step
- Timing and performance metrics

### For x402 Applications Track

✅ **x402 Integration**
- Real payment execution via ExecutionRouter
- Cronos testnet transactions with proofs
- Observable x402 execution flows

✅ **Production-Ready Contracts**
- Deployed and verified on Cronos Testnet
- Authorization system with executor roles
- Event emissions for observability

---

## 📚 Documentation

- **[x402 Playground Guide](docs/x402-playground.md)** - Complete API reference
- **[Architecture](docs/architecture.md)** - System design
- **[Setup Guide](docs/setup.md)** - Detailed installation
- **[Transaction Flow](TRANSACTION_FILES.md)** - Code walkthrough
- **[Testing Guide](HOW_TO_TEST.md)** - Run tests and demos

---

## 🧪 Running Demos

### AI Agents Demo

```bash
cd agents
npm run test

# Output:
# ✅ Planner Agent: OpenAI initialized
# ✅ Risk Agent: OpenAI initialized
#
# 🤖 Planner Agent: "Send 0.5 CRO to 0x742d35..."
# ✅ Plan: payment, 1 steps, 0.5 CRO
# 🛡️  Risk Agent: txn-001
# ✅ Risk: low, Score: 10%, APPROVE
```

### Playground Demo

```bash
node scripts/demo-playground.js

# Output:
# ╔═══════════════════════════════════════════════╗
# ║     x402 Agent Playground - Interactive Demo  ║
# ╚═══════════════════════════════════════════════╝
#
# ✅ Backend is operational
#
# DEMO 1: Simple Payment Simulation
# ✅ Simulation successful!
# 📊 Summary:
#    Total Steps: 2
#    Gas Estimate: 210000
```

### Blockchain Tests

```bash
node scripts/simple-test.js

# Output:
# ✅ Vault Deposit: 0x8b193107...
# ✅ Payment: 0xf1279bd...
# 💰 Vault Balance: 2 tCRO
```

---

## 🔗 Deployed Resources

### Cronos Testnet

**Contracts:**
- ExecutionRouter: `0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6`
- TreasuryVault: `0x169439e816B63D3836e1E4e9C407c7936505C202`
- AttestationRegistry: `0xb183502116bcc1b41Bb42C704F4868e5Dc812Ce2`

**Explorer:**
- Network: https://explorer.cronos.org/testnet
- Example TX: https://explorer.cronos.org/testnet/tx/0x8b193107...

**RPC:**
- URL: `https://evm-t3.cronos.org`
- Chain ID: `338`

---

## 🛠️ Tech Stack

**Smart Contracts:**
- Solidity 0.8.20
- Hardhat 2.19.2
- OpenZeppelin 5.0.0
- Cronos EVM

**Backend:**
- Node.js + TypeScript
- Express.js
- Ethers.js v6
- Custom orchestration layer

**AI Agents:**
- OpenAI SDK 4.20.1
- Zod 3.22.4 (structured outputs)
- gpt-4o-2024-08-06
- TypeScript 5.3.3

---

## 🎉 Success Metrics

### Deployed & Verified
- ✅ 3 smart contracts on Cronos Testnet
- ✅ 6+ successful transactions
- ✅ 2 TCRO in TreasuryVault
- ✅ Executor authorized and configured

### AI Agents Working
- ✅ OpenAI integration with structured outputs
- ✅ PlannerAgent: Natural language → ExecutionPlan
- ✅ RiskAgent: AI-powered risk assessment
- ✅ 3/3 test scenarios passing

### Playground Operational
- ✅ Complete simulation engine
- ✅ Virtual state management
- ✅ Execution trace builder
- ✅ 5 API endpoints functional
- ✅ LLM-friendly responses

---

## 🚧 Next Steps

1. **Enhanced Agent Integration**: Connect PlannerAgent directly to playground APIs
2. **Frontend UI**: Optional visualization dashboard
3. **Advanced Actions**: Swap, approve, multi-step transactions
4. **Persistence**: Store traces in database
5. **Analytics**: Execution statistics and insights
6. **Multi-Chain**: Expand beyond Cronos

---

## 📄 License

MIT

---

## 🤝 Contributing

This project was built for the Cronos x402 Hackathon. Contributions welcome!

---

**Built with ❤️ for the x402 ecosystem** 🚀
