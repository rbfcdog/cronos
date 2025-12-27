# 🚀 Atlas402 Setup Instructions

This document outlines **what YOU need to do manually** to get the system running.

---

## ⚠️ Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Node.js** (v18 or higher) installed
- [ ] **npm** or **yarn** package manager
- [ ] **Git** for version control
- [ ] A code editor (VS Code recommended)

---

## 🔑 Step 1: API Keys & Accounts (MANUAL)

You need to obtain the following API keys and credentials:

### 1.1 Cronos Testnet Wallets

**Create 2 wallet addresses:**

1. **Deployer Wallet** (for deploying contracts)
2. **Executor Wallet** (for executing transactions)

**How to create:**
- Use MetaMask, Trust Wallet, or any Ethereum-compatible wallet
- Export the **private keys** (keep them secret!)
- Add Cronos Testnet to your wallet:
  - Network Name: `Cronos Testnet`
  - RPC URL: `https://evm-t3.cronos.org`
  - Chain ID: `338`
  - Currency Symbol: `tCRO`
  - Explorer: `https://explorer.cronos.org/testnet`

**Fund your wallets:**
- Go to: https://cronos.org/faucet
- Request testnet CRO for both wallets
- Recommended amounts:
  - Deployer: 10-50 tCRO
  - Executor: 5-10 tCRO

---

### 1.2 x402 API Key (OPTIONAL for MVP)

**What:** x402 is the Crypto.com facilitator for agent payments.

**How to get it:**
1. Visit: https://x402.dev or check Crypto.com developer docs
2. Register for testnet access
3. Obtain your API key

**Note:** If not available yet, you can use direct Cronos transactions for now.

---

### 1.3 AI Provider API Key

Choose **ONE** of the following:

#### Option A: OpenAI (Recommended)
1. Go to: https://platform.openai.com
2. Create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

#### Option B: Anthropic (Claude)
1. Go to: https://console.anthropic.com
2. Create an account
3. Navigate to API Keys
4. Create a new key
5. Copy the key

---

## 📝 Step 2: Configure Environment Variables

1. **Copy the example environment file:**

```bash
cd atlas402
cp .env.example .env
```

2. **Open `.env` in your editor and fill in:**

```env
# Cronos Testnet Configuration
CRONOS_TESTNET_RPC_URL=https://evm-t3.cronos.org
CRONOS_TESTNET_CHAIN_ID=338
CRONOS_TESTNET_EXPLORER=https://explorer.cronos.org/testnet

# Private Keys (PASTE YOUR ACTUAL KEYS HERE)
DEPLOYER_PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY_HERE
EXECUTOR_PRIVATE_KEY=YOUR_EXECUTOR_PRIVATE_KEY_HERE

# x402 Configuration (optional for now)
X402_FACILITATOR_URL=https://facilitator.x402.dev
X402_API_KEY=YOUR_X402_API_KEY_HERE

# AI Agent Configuration (CHOOSE ONE)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
# or
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE

# Backend Configuration
BACKEND_PORT=3000
NODE_ENV=development

# Contract Addresses (leave empty, will be filled after deployment)
EXECUTION_ROUTER_ADDRESS=
TREASURY_VAULT_ADDRESS=
ATTESTATION_REGISTRY_ADDRESS=
```

⚠️ **IMPORTANT:** Never commit your `.env` file to Git!

---

## 🔧 Step 3: Install Dependencies

Install packages for each module:

### 3.1 Contracts Module

```bash
cd atlas402/contracts
npm install
```

### 3.2 Backend Module

```bash
cd ../backend
npm install
```

### 3.3 Agents Module (coming next)

```bash
cd ../agents
npm install
```

---

## 🚀 Step 4: Deploy Smart Contracts

1. **Check wallet balances:**

```bash
cd atlas402
node scripts/fund-wallet.ts
```

Make sure your deployer wallet has at least 5-10 tCRO.

2. **Compile contracts:**

```bash
cd contracts
npm run compile
```

3. **Deploy to Cronos Testnet:**

```bash
npm run deploy:testnet
```

This will:
- Deploy ExecutionRouter
- Deploy TreasuryVault
- Deploy AttestationRegistry
- Set up initial permissions
- Save addresses to `deployments/testnet-deployment.json`

4. **Copy contract addresses to `.env`:**

After deployment, open `contracts/deployments/testnet-deployment.json` and copy the addresses to your `.env` file:

```env
EXECUTION_ROUTER_ADDRESS=0x...
TREASURY_VAULT_ADDRESS=0x...
ATTESTATION_REGISTRY_ADDRESS=0x...
```

---

## ✅ Step 5: Verify Contracts (Optional but Recommended)

```bash
npm run verify
```

This makes your contracts readable on Cronos Explorer.

---

## 💰 Step 6: Fund Treasury Vault

Send some test CRO to the TreasuryVault for agent operations:

**Using MetaMask:**
1. Open MetaMask
2. Send 10-20 tCRO to `TREASURY_VAULT_ADDRESS`

**Or use a script (coming soon):**
```bash
node scripts/fund-treasury.ts
```

---

## 🧪 Step 7: Test the System

### 7.1 Check Configuration

```bash
cd backend
npm run check-config
```

### 7.2 Start Backend Server

```bash
npm run dev
```

Should see:
```
🚀 Backend server running on port 3000
```

### 7.3 Test Transaction Flow (coming next)

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Send 1 CRO to 0x...",
    "agent": "planner"
  }'
```

---

## 📚 What's Next?

After completing these steps, you'll have:

- ✅ Funded wallets
- ✅ Deployed smart contracts
- ✅ Configured environment
- ✅ Backend ready to orchestrate

**Next development steps:**
1. Implement AI agents (planner, risk, executor)
2. Build x402 integration
3. Create frontend demo UI
4. Add comprehensive testing

---

## 🆘 Troubleshooting

### "Insufficient funds" error
- Make sure your deployer wallet has enough tCRO
- Use the faucet: https://cronos.org/faucet

### "Invalid private key" error
- Make sure your private key doesn't have `0x` prefix
- Check for extra spaces or quotes

### "Contract not deployed" error
- Run deployment first: `npm run deploy:testnet`
- Check that addresses are in `.env`

### "OpenAI API error"
- Verify your API key is correct
- Check you have credits/quota available
- Try the Anthropic option instead

---

## 📞 Need Help?

- Cronos Docs: https://docs.cronos.org
- x402 Docs: https://docs.x402.dev
- Hardhat Docs: https://hardhat.org/docs

---

**Last Updated:** December 25, 2025
