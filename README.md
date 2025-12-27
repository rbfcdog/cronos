# 🚀 Atlas402

**AI-Powered Agent Execution Platform on Cronos EVM with x402 Integration**

---

## 🎯 Project Overview

Atlas402 is an **AI agent orchestration platform** that enables intelligent, automated on-chain actions on the Cronos blockchain using x402 payment facilitation.

### Hackathon Tracks

This project targets:
- ✅ **Track 1:** x402 Applications (agent-triggered payments & smart contract interactions)
- ✅ **Track 4:** Dev Tooling & Data Virtualization (agent runtime & orchestration)

---

## 🏗️ Architecture

```
┌─────────────┐
│   User/API  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   AI Agents     │  ← Intent parsing, planning, risk evaluation
│  (planner.ts)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Backend      │  ← Orchestration, validation, execution
│  (Express API)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│  x402  │ │ Cronos EVM   │
│        │ │ (Testnet)    │
└────────┘ └──────────────┘
              │
              ▼
      ┌──────────────────┐
      │ Smart Contracts  │
      │ - ExecutionRouter│
      │ - TreasuryVault  │
      │ - Attestation    │
      └──────────────────┘
```

---

## 📁 Project Structure

```
atlas402/
├── contracts/          # Solidity smart contracts
│   ├── src/
│   │   ├── ExecutionRouter.sol
│   │   ├── TreasuryVault.sol
│   │   └── AttestationRegistry.sol
│   └── scripts/
│       └── deploy.ts
│
├── agents/            # AI agent logic
│   ├── src/
│   │   ├── planner.agent.ts
│   │   ├── risk.agent.ts
│   │   └── executor.agent.ts
│   └── tools/
│
├── backend/           # Orchestration API
│   └── src/
│       ├── server.ts
│       ├── services/
│       └── routes/
│
├── frontend/          # Demo UI
│   └── src/
│
├── docs/             # Documentation
└── scripts/          # Utilities
```

---

## ✨ Key Features

- 🤖 **AI-Driven Intent Parsing** - Natural language to structured execution
- 💰 **Agent-Triggered Payments** - Autonomous on-chain transactions
- 🔐 **Policy Enforcement** - Backend validates all agent plans
- 📋 **Execution Attestation** - On-chain audit trail
- 🛠️ **Reusable Infrastructure** - Agent runtime for future use cases

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Cronos testnet wallet with tCRO
- OpenAI or Anthropic API key

### Setup

1. **Clone and install:**

```bash
git clone <repo>
cd atlas402
cp .env.example .env
```

2. **Configure `.env`** (see INSTRUCTIONS.md)

3. **Install dependencies:**

```bash
cd contracts && npm install
cd ../backend && npm install
cd ../agents && npm install
```

4. **Deploy contracts:**

```bash
cd contracts
npm run compile
npm run deploy:testnet
```

5. **Start backend:**

```bash
cd backend
npm run dev
```

---

## 📖 Documentation

- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Detailed setup guide
- **[docs/architecture.md](./docs/architecture.md)** - System architecture
- **[docs/setup.md](./docs/setup.md)** - Development setup
- **[docs/demo.md](./docs/demo.md)** - Demo scenarios

---

## 🧪 Testing

```bash
# Test contracts
cd contracts
npm test

# Test backend
cd backend
npm run dev

# End-to-end test
cd scripts
./test-e2e.sh

# Test agents
cd agents
npm start
```

---

## 🛠️ Tech Stack

### Smart Contracts
- Solidity 0.8.20
- Hardhat
- OpenZeppelin
- Ethers.js

### Backend
- Node.js + TypeScript
- Express
- Ethers.js
- x402 SDK

### AI Agents
- OpenAI / Anthropic
- Crypto.com AI Agent SDK
- Custom orchestration

### Infrastructure
- Cronos EVM Testnet
- x402 Facilitator

---

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- [x] Core contract deployment
- [x] Transaction infrastructure
- [x] AI agents (Planner, Risk, Executor)
- [x] Backend API with routes
- [x] Core services (Cronos, x402, Market)
- [ ] Frontend UI

### Phase 2 (Future)
- [ ] x402 integration
- [ ] Advanced risk evaluation
- [ ] Multi-agent coordination
- [ ] Production deployment

### Phase 3 (Extended)
- [ ] Track 2: Agentic Finance features
- [ ] Track 3: Crypto.com integrations
- [ ] Mobile app

---

## 📜 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

## 📞 Support

- Cronos Discord: https://discord.gg/cronos
- Documentation: https://docs.cronos.org
- x402 Docs: https://docs.x402.dev

---

**Built for Cronos x402 Hackathon 2025**
