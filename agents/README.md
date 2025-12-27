# x402 AI Agents Platform

**Specialized AI agents with integrated testing, observability & orchestration for Cronos blockchain.**

Built with [Crypto.com AI Agent SDK](https://github.com/crypto-com/ai-agent-client) and designed for production-ready AI agent deployment.

---

## 🎯 Overview

The x402 Agents Platform provides autonomous AI agents with full development infrastructure:

### Core Agents
- **Planner Agent** - Parses user intents and generates execution plans
- **Risk Agent** - Evaluates plans for potential risks and safety
- **Executor Agent** - Monitors execution and handles errors

### Specialized Agents (Production-Ready)
- **Recurring Payment Agent** - Automated subscription payments with retry logic (50 tests, 100% pass)
- **Portfolio Rebalancing Agent** - DeFi portfolio optimization on VVS Finance (30 tests, 100% pass)
- **Treasury Management Agent** - Multi-wallet DAO treasury automation (20 tests, 100% pass)

### Platform Features
- **Testing Studio** - 20+ pre-built scenarios, gas profiling, fuzz testing
- **Observability** - Transaction indexing, decision traces, performance metrics
- **Orchestration** - Multi-agent coordination and workflow automation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Cronos testnet wallet with CRO tokens

### Setup

```bash
# Install dependencies
npm install

# Configure environment
# Add to ../.env:
# OPENAI_API_KEY=sk-...
# CRONOS_TESTNET_EXPLORER_KEY=...

Converts natural language to structured execution plans.

**Input:** User intent string
**Output:** JSON execution plan

Example:
```typescript
const plan = await plannerAgent.generatePlan(
  "Send 5 CRO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
);
```

### Run Tests

```bash
# Test all core agents
npm test

# Test specialized agents (recurring payment, portfolio, treasury)
npm run test:specialized

# Test platform integration
npm run test:integration

# Run specific agent tests
ts-node src/specialized/recurring-payment.test.ts
```

### Development

```bash
# Start agent dev server
npm run dev

# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

---

## 📁 Project Structure

```
agents/
├── src/
│   ├── index.ts                    # Main agent exports
│   ├── planner.agent.ts            # Intent → Plan conversion
│   ├── risk.agent.ts               # Risk evaluation
│   ├── executor.agent.ts           # Execution monitoring
│   ├── agent-integration.ts        # Platform integration layer
│   ├── playground-integration.ts   # Frontend integration
│   ├── test-agents.ts              # Core agent tests
│   └── specialized/                # Production-ready agents
│       ├── recurring-payment.agent.ts     # 50 tests ✅
│       ├── portfolio-rebalancing.agent.ts # 30 tests ✅
│       ├── treasury-management.agent.ts   # 20 tests ✅
│       └── run-all-tests.ts
├── lib/                            # Platform utilities
│   ├── agent-client.ts             # Crypto.com SDK integration
│   ├── types.ts                    # Type definitions
│   └── test-integration.ts         # Integration test runner
├── observability/                  # Monitoring & tracing
│   └── dashboard/                  # Metrics dashboard
├── testing/                        # Test scenarios
│   └── scenarios/                  # Pre-built test cases
├── prompts/                        # AI agent prompts
└── tools/                          # Agent tool definitions
```

---

## 🤖 Core Agents

### Planner Agent

Converts natural language intents into structured execution plans.

**Input:** User intent string  
**Output:** Structured execution plan

Example:
```typescript
const intent = "Send 10 CRO to Bob at 0x123...";
const plan = await plannerAgent.generatePlan(intent);
// Returns: { executionId, type, steps, estimatedGas }
```

Evaluates execution plans for risks.

**Input:** Execution plan
**Output:** Risk assessment

Example:
```typescript
const assessment = await riskAgent.evaluatePlan(plan);
// assessment.recommendation: APPROVE | REVIEW | REJECT
```

### Executor Agent

Monitors and manages execution.

**Input:** Execution ID
**Output:** Execution status

Features:
- Transaction monitoring
- Retry logic
- Error recovery
- Status updates

## Configuration

### AI Providers

#### OpenAI (Recommended)
- Model: GPT-4 Turbo
- Structured JSON output
- High accuracy

#### Anthropic
- Model: Claude 3.5 Sonnet
- Strong reasoning
- Alternative to OpenAI

### Fallback Mode

If no AI provider is configured, agents use:
- Regex-based intent parsing
- Rule-based risk assessment
- Basic error handling

## Integration

### With Backend

Agents are called by backend API:

```typescript
import { plannerAgent, riskAgent } from "../agents";

// In API route
const plan = await plannerAgent.generatePlan(intent);
const assessment = await riskAgent.evaluatePlan(plan);

if (assessment.recommendation === "APPROVE") {
  // Execute via Cronos service
}
```

## Examples

### Simple Payment

```typescript
const intent = "Send 10 CRO to Bob at 0x123...";
const plan = await plannerAgent.generatePlan(intent);

// Plan output:
{
  "executionId": "pay-123",
  "type": "payment",
  "steps": [{
    "action": "payment",
    "target": "0x123...",
    "amount": "10.0"
  }],
  "estimatedGas": "21000"
}
```

### Risk Evaluation

```typescript
const assessment = await riskAgent.evaluatePlan(plan);

// Assessment output:
{
  "riskScore": 0.1,
  "riskLevel": "LOW",
  "risks": [],
  "warnings": [],
  "recommendation": "APPROVE"
}
```

## Security

- Agents **never** have access to private keys
- All plans validated by backend
- High-risk operations flagged automatically
- Known scam addresses blocked

## Future Enhancements

- Multi-agent coordination
- Learning from execution history
- Advanced DeFi strategy planning
- Cross-chain intent resolution

## License

MIT
