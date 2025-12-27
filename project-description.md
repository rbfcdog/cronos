# Hackathon Track Compliance Scope

This project is intentionally scoped to **comply ONLY with the following tracks at this stage**:

- ✅ **Track 1 — Main Track: x402 Applications (Broad Use Cases)**
- ✅ **Track 4 — Dev Tooling & Data Virtualization Track**

Tracks **2 (Agentic Finance)** and **3 (Crypto.com Ecosystem Integrations)** are **explicitly out of scope for the initial version** and may be added later.

---

## ✅ Track 1 — Main Track: x402 Applications (Broad Use Cases)

### Track Objective
Build AI agents using **x402** for **novel, intelligent, or automated on-chain actions** on Cronos EVM.

### Required Capabilities (What This Project WILL Do)

This project **must implement at least one** of the following using **x402**:

- [x] **Agent-triggered payments**
- [x] **AI-driven smart contract interactions**
- [x] **Automated treasury or routing logic**

### Concrete Scope for Track 1

The project will include:

- An **off-chain AI agent** that:
  - Interprets a user or system intent
  - Produces a structured execution plan (JSON)
- A **backend service** that:
  - Validates the agent’s plan
  - Executes **on-chain settlement via x402**
- At least **one deployed Cronos EVM smart contract** that:
  - Receives x402-triggered execution
  - Emits logs / events for verification

### Explicitly NOT Required for Track 1 (Out of Scope)

- ❌ Multi-leg institutional workflows
- ❌ Portfolio optimization
- ❌ RWA lifecycle automation
- ❌ Advanced risk engines
- ❌ Crypto.com SDK integrations (for now)

---

## ✅ Track 4 — Dev Tooling & Data Virtualization Track

### Track Objective
Provide **infrastructure or tooling** that enables AI agents or x402 applications to be **built, tested, debugged, and scaled**.

### Required Capabilities (What This Project WILL Do)

This project will function as **developer tooling**, not just an end-user app.

It will include:

- [x] **Agent runtime & orchestration layer**
- [x] **Clear agent ↔ backend interface**
- [x] **Agent-readable execution plans**
- [x] **Execution logs & observability**
- [x] **Reusable structure for future agents**

### Concrete Scope for Track 4

The project will expose:

- A **defined agent interface**:
  - Agents return structured execution plans
  - Agents do NOT execute transactions
- A **backend execution layer**:
  - Enforces policies
  - Controls keys
  - Triggers x402
- A **clear folder structure** that:
  - Separates agents, execution, and contracts
  - Can be reused by other developers
- **Documentation** explaining:
  - Architecture
  - Setup
  - Agent → x402 → Cronos flow

### Explicitly NOT Required for Track 4 (Out of Scope)

- ❌ Custom indexers
- ❌ ZK proofs
- ❌ Rust services
- ❌ Full MCP server implementations
- ❌ Production-grade monitoring stacks

---

## 🚫 Explicitly Out of Scope (For Now)

The following tracks are **NOT targeted in the current implementation**:

### ❌ Track 2 — x402 Agentic Finance / Payment Track
(Not required because this version does NOT include)
- Multi-leg transactions
- Institutional workflows
- Portfolio rebalancing
- Advanced risk-managed strategies

### ❌ Track 3 — Crypto.com × Cronos Ecosystem Integrations
(Not required because this version does NOT include)
- Crypto.com AI Agent SDK
- Crypto.com Market Data MCP
- Direct Cronos dApp integrations (VVS, Delphi, Moonlander)

These integrations may be added in future iterations.

---

## Summary (One-Line)

> **This project currently targets Track 1 (x402 Applications) and Track 4 (Dev Tooling), focusing on agent-triggered x402 payments and reusable agent execution infrastructure on Cronos EVM.**

