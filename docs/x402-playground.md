# x402 Agent Playground

## Overview

The **x402 Agent Playground** is a developer tooling layer that enables **LLM-based agents to programmatically interact with Cronos EVM via x402**.

This is **NOT a consumer dApp**. It's a safe, observable, debuggable environment for building and testing agentic blockchain applications.

## Core Principles

### 🔒 Security First

**Agents and LLMs NEVER hold private keys or send transactions directly.**

They only:
- Generate execution plans (JSON)
- Reason about blockchain state
- Call structured APIs
- Consume execution traces

The backend:
- Holds keys securely
- Executes x402 operations
- Manages smart contract calls
- Controls all fund movements

### 🎯 Programmatic Interface

LLMs interact through:
- **Tool calls** (function calling)
- **Structured APIs** (REST endpoints)
- **JSON execution plans** (standardized format)
- **Agent-readable traces** (detailed observability)

### 🔬 Simulation First

Always simulate before executing:
1. Agent generates plan
2. **Simulate** → get gas estimates, check balances, validate
3. Review trace and state changes
4. **Execute** → send real transactions (optional)

---

## Architecture

```
┌─────────────┐
│  LLM/Agent  │
└──────┬──────┘
       │ Tool call / API
       │
┌──────▼─────────────────────────────────────────┐
│       Playground Backend                       │
│                                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐   │
│  │  Runner  │──│ Simulator │  │  Tracer  │   │
│  └──────────┘  └───────────┘  └──────────┘   │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │       Virtual State Manager              │ │
│  └──────────────────────────────────────────┘ │
└───────────────┬────────────────────────────────┘
                │
                │ (execute mode only)
                │
        ┌───────▼─────────┐
        │  Cronos Testnet │
        │    (x402 EVM)   │
        └─────────────────┘
```

---

## Execution Plan Format

Agents submit **structured JSON plans** to the playground:

```json
{
  "mode": "simulate",
  "planId": "plan_001",
  "description": "Send payment and check balance",
  "actions": [
    {
      "type": "read_balance",
      "token": "TCRO",
      "description": "Check current wallet balance"
    },
    {
      "type": "x402_payment",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "amount": "0.5",
      "token": "TCRO",
      "description": "Send 0.5 TCRO payment"
    },
    {
      "type": "contract_call",
      "contract": "ExecutionRouter",
      "method": "executePayment",
      "args": ["0x742d35Cc...", "500000000000000000", "Payment via playground"],
      "description": "Execute via ExecutionRouter"
    }
  ],
  "context": {
    "agentId": "planner-001",
    "intent": "Send 0.5 CRO to Alice"
  }
}
```

### Action Types

| Action Type | Description | Required Fields |
|-------------|-------------|-----------------|
| `read_balance` | Read wallet balance | `token` (optional, defaults to TCRO) |
| `x402_payment` | Send CRO via x402 | `to`, `amount`, `token` |
| `contract_call` | Call smart contract | `contract`, `method`, `args` |
| `read_state` | Read contract state | `contract` |
| `approve_token` | Approve token spending | `token`, `contract`, `amount` |

---

## API Endpoints

### POST `/api/playground/simulate`

**Simulate execution without sending real transactions.**

**Request:**
```json
{
  "mode": "simulate",
  "actions": [
    {
      "type": "x402_payment",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "amount": "0.5"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "run_1234567890_abc123",
    "success": true,
    "trace": {
      "runId": "run_1234567890_abc123",
      "mode": "simulate",
      "status": "completed",
      "steps": [
        {
          "action": { "type": "x402_payment", "to": "0x742d35...", "amount": "0.5" },
          "status": "simulated",
          "result": { "from": "0x...", "to": "0x...", "amount": "0.5", "token": "TCRO" },
          "gasEstimate": "210000",
          "timestamp": 1735152000000
        }
      ],
      "virtualState": {
        "runId": "run_1234567890_abc123",
        "wallet": {
          "address": "0x...",
          "balances": { "TCRO": "9.5", "USDC": "1000" }
        },
        "contracts": { "ExecutionRouter": { "address": "0x0B10060f...", "isDeployed": true } },
        "x402": { "mode": "simulated" }
      },
      "warnings": [],
      "errors": []
    },
    "summary": {
      "totalSteps": 1,
      "successfulSteps": 1,
      "failedSteps": 0,
      "totalGasEstimate": "210000"
    }
  },
  "timestamp": 1735152000000
}
```

---

### POST `/api/playground/execute`

**Execute plan with REAL blockchain transactions.**

⚠️ **WARNING:** This sends actual transactions on Cronos Testnet.

**Request:**
```json
{
  "mode": "execute",
  "actions": [
    {
      "type": "x402_payment",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "amount": "0.1"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "run_1735152000_xyz789",
    "success": true,
    "trace": { /* full execution trace */ },
    "transactions": [
      {
        "hash": "0x8b1931074ab5edf8c4e7dd...",
        "explorerUrl": "https://explorer.cronos.org/testnet/tx/0x8b19..."
      }
    ],
    "summary": {
      "totalSteps": 1,
      "successfulSteps": 1,
      "failedSteps": 0,
      "totalGasUsed": "212340"
    }
  },
  "timestamp": 1735152000000
}
```

---

### GET `/api/playground/runs/:runId`

**Retrieve trace and state for a specific run.**

**Response:**
```json
{
  "success": true,
  "data": {
    "trace": { /* full trace */ },
    "state": { /* virtual state */ },
    "summary": {
      "runId": "run_1234567890_abc123",
      "status": "completed",
      "steps": [ /* step results */ ]
    }
  }
}
```

---

### GET `/api/playground/runs`

**List all execution runs.**

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "runs": [
      {
        "runId": "run_1234567890_abc123",
        "planId": "plan_001",
        "mode": "simulate",
        "status": "completed",
        "stepsCount": 3,
        "errors": 0,
        "warnings": 1,
        "startTime": "2024-12-25T12:00:00.000Z",
        "duration": "1250ms"
      }
    ]
  }
}
```

---

### POST `/api/playground/validate`

**Validate execution plan without running it.**

**Request:**
```json
{
  "mode": "simulate",
  "actions": [
    {
      "type": "x402_payment",
      "amount": "0.5"
    }
  ]
}
```

**Response:**
```json
{
  "success": false,
  "data": {
    "valid": false,
    "errors": ["Action 0: missing 'to' address"],
    "warnings": [],
    "actionsCount": 1
  }
}
```

---

## Data Virtualization

The playground exposes **unified, agent-readable state**:

```json
{
  "runId": "run_1234567890_abc123",
  "mode": "simulate",
  "wallet": {
    "address": "0x5Be9C13C279c88...",
    "balances": {
      "TCRO": "9.5",
      "USDC": "1000"
    },
    "nonce": 42
  },
  "contracts": {
    "ExecutionRouter": {
      "address": "0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6",
      "name": "ExecutionRouter",
      "isDeployed": true
    },
    "TreasuryVault": {
      "address": "0x169439e816B63D3836e1E4e9C407c7936505C202",
      "name": "TreasuryVault",
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

This state is:
- **LLM-readable**: Clean JSON with clear labels
- **Self-describing**: Includes names and status
- **Stateful**: Updates after each action
- **Inspectable**: Available via API

---

## Observability & Tracing

Every execution produces a **detailed trace**:

```json
{
  "runId": "run_1234567890_abc123",
  "planId": "plan_001",
  "mode": "simulate",
  "status": "completed",
  "steps": [
    {
      "action": { "type": "read_balance", "token": "TCRO" },
      "status": "simulated",
      "result": { "token": "TCRO", "balance": "10", "address": "0x..." },
      "gasEstimate": "0",
      "timestamp": 1735152000000
    },
    {
      "action": { "type": "x402_payment", "to": "0x742d35...", "amount": "0.5" },
      "status": "simulated",
      "result": { "from": "0x...", "to": "0x742d35...", "amount": "0.5", "newBalance": "9.5" },
      "gasEstimate": "210000",
      "timestamp": 1735152001000
    }
  ],
  "virtualState": { /* final state */ },
  "warnings": ["Balance approaching minimum threshold"],
  "errors": [],
  "metadata": {
    "startTime": 1735152000000,
    "endTime": 1735152001250,
    "duration": 1250
  }
}
```

### Trace Features:
- ✅ **Step-by-step execution**: See exactly what happened
- ✅ **Gas tracking**: Estimates (simulate) or actual usage (execute)
- ✅ **Error capture**: Detailed error messages
- ✅ **Warnings**: Non-blocking issues (low balance, etc.)
- ✅ **Timestamps**: Precise timing information
- ✅ **State snapshots**: Virtual state after each step

---

## Agent Integration

### Using with LLM Tool Calling

**Example: OpenAI Function Calling**

```typescript
import OpenAI from "openai";

const tools = [
  {
    type: "function",
    function: {
      name: "simulate_x402_execution",
      description: "Simulate blockchain execution plan without sending real transactions",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["read_balance", "x402_payment", "contract_call"] },
                to: { type: "string" },
                amount: { type: "string" },
                token: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
];

// LLM generates plan, agent calls playground
async function executeTool(toolName: string, args: any) {
  if (toolName === "simulate_x402_execution") {
    const response = await fetch("http://localhost:3001/api/playground/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "simulate", actions: args.actions })
    });
    return response.json();
  }
}
```

### Using with Existing Agents

The **PlannerAgent** can generate playground-compatible plans:

```typescript
import { plannerAgent } from "./agents/planner.agent";

// Agent generates intent
const intent = "Send 0.5 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const plan = await plannerAgent.generatePlan(intent);

// Convert to playground format
const playgroundPlan = {
  mode: "simulate",
  actions: plan.steps.map(step => ({
    type: step.action === "payment" ? "x402_payment" : "contract_call",
    to: step.target,
    amount: step.amount,
    description: step.description
  }))
};

// Simulate
const result = await fetch("http://localhost:3001/api/playground/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(playgroundPlan)
});
```

---

## Deployment

### Start the Playground

```bash
# Backend (with playground)
cd backend
npm install
npm run dev

# Playground is available at:
# http://localhost:3001/api/playground
```

### Environment Variables

```env
# Cronos
CRONOS_RPC=https://evm-t3.cronos.org
CHAIN_ID=338
EXECUTOR_PRIVATE_KEY=0x...

# Contracts
EXECUTION_ROUTER_ADDRESS=0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6
TREASURY_VAULT_ADDRESS=0x169439e816B63D3836e1E4e9C407c7936505C202
ATTESTATION_REGISTRY_ADDRESS=0xb183502116bcc1b41Bb42C704F4868e5Dc812Ce2

# AI (for agents)
OPENAI_API_KEY=sk-proj-...
```

---

## Demo Flow

### 1. Agent Generates Plan

```typescript
const intent = "Send 0.5 CRO to Alice";
const plan = await plannerAgent.generatePlan(intent);
```

### 2. Simulate First

```bash
curl -X POST http://localhost:3001/api/playground/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "simulate",
    "actions": [
      {
        "type": "x402_payment",
        "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        "amount": "0.5"
      }
    ]
  }'
```

### 3. Review Trace

```json
{
  "success": true,
  "data": {
    "runId": "run_1735152000_abc123",
    "trace": { /* detailed trace */ },
    "summary": {
      "totalGasEstimate": "210000",
      "successfulSteps": 1
    }
  }
}
```

### 4. Execute (Real)

```bash
curl -X POST http://localhost:3001/api/playground/execute \
  -H "Content-Type: application/json" \
  -d '{ /* same plan */ }'
```

### 5. View on Explorer

```
https://explorer.cronos.org/testnet/tx/0x8b193107...
```

---

## What This Demonstrates

### For Judges (Dev Tooling Track)

✅ **Agent Runtime & Orchestration**
- Complete execution plan format
- Step-by-step orchestration
- State management across actions

✅ **Programmatic LLM ↔ Blockchain Interface**
- Structured APIs (not UI-based)
- Tool-calling friendly
- Agent-readable responses

✅ **Data Virtualization**
- Unified virtual state
- Balance tracking
- Contract state management

✅ **Agent-Readable Feeds**
- Detailed execution traces
- Gas estimates
- Error/warning reporting

✅ **Observability & Debugging**
- Complete action history
- State snapshots
- Timing information

### For Judges (x402 Track)

✅ **x402 Integration**
- Payment execution via ExecutionRouter
- Real Cronos testnet transactions
- Observable x402 flows

---

## Safety Features

### Simulation Mode (Default)
- No real transactions
- Virtual balance tracking
- Gas estimation
- Safe experimentation

### Validation
- Plan structure validation
- Required field checks
- Type checking
- Pre-execution warnings

### Error Handling
- Graceful failures
- Detailed error messages
- Non-blocking warnings
- State rollback (simulate)

---

## Next Steps

1. **Agent Integration**: Connect more AI agents (PlannerAgent, RiskAgent)
2. **Frontend UI**: Build optional playground UI for visualization
3. **Advanced Actions**: Add swap, approve, multi-step transactions
4. **Persistence**: Store traces in database
5. **Analytics**: Execution statistics and insights

---

## Support

- **Docs**: `/docs/x402-playground.md`
- **API Health**: `GET /api/playground/health`
- **Examples**: See `/agents/src/test-agents.ts`

---

**Built for the x402 Cronos Hackathon** 🚀
