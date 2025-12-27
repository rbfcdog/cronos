# 🔍 Transaction Flow - Files Responsible

## Overview: How Transactions Work in Atlas402

Your system has **3 transaction paths** depending on what you're testing:

---

## 📁 **Key Files Responsible for Transactions**

### **1. Smart Contract Layer (Blockchain)**

#### **ExecutionRouter.sol** - Main Transaction Executor
📍 Location: `contracts/src/ExecutionRouter.sol`

**Key Functions:**
```solidity
// Line 91-114: Execute payment on blockchain
function executePayment(
    bytes32 executionId,
    address payable recipient,
    uint256 amount,
    string memory reason
) external payable onlyAuthorized whenNotPaused nonReentrant

// Line 57-88: Execute generic contract call
function execute(
    bytes32 executionId,
    string memory intentType,
    address targetContract,
    bytes memory callData
) external payable onlyAuthorized whenNotPaused nonReentrant
```

**What it does:**
- ✅ Receives transactions from authorized executors
- ✅ Routes payments to recipients
- ✅ Enforces access control (only authorized addresses)
- ✅ Emits events for tracking
- ✅ Prevents reentrancy attacks

---

#### **TreasuryVault.sol** - Treasury Management
📍 Location: `contracts/src/TreasuryVault.sol`

**Key Functions:**
```solidity
// Deposit funds
function deposit() external payable

// Withdraw with allowance check
function withdraw(uint256 amount) external

// Set spending allowances
function setAllowance(address spender, uint256 amount) external
```

**What it does:**
- ✅ Holds treasury funds (currently has 2 tCRO)
- ✅ Manages withdrawal allowances
- ✅ Provides secure fund management

---

#### **AttestationRegistry.sol** - Audit Trail
📍 Location: `contracts/src/AttestationRegistry.sol`

**Key Functions:**
```solidity
// Record attestation on-chain
function attest(
    address executor,
    string calldata agentName,
    bytes32 intentHash,
    string calldata metadata
) external
```

**What it does:**
- ✅ Records AI agent decisions on blockchain
- ✅ Creates immutable audit trail
- ✅ Links transactions to agent intents

---

### **2. Backend Service Layer (Orchestration)**

#### **cronos.service.ts** - Blockchain Interface
📍 Location: `backend/src/services/cronos.service.ts`

**Key Functions:**
```typescript
// Line 55-60: Simple direct payment
async sendPayment(to: string, amountInEther: string)

// Line 65-95: Payment via ExecutionRouter contract
async executePaymentViaRouter(
    executionId: string,
    recipient: string,
    amountInEther: string,
    reason: string
)

// Line 97-130: Generic contract execution
async executeViaRouter(
    executionId: string,
    intentType: string,
    targetContract: string,
    callData: string,
    valueInEther: string
)

// Line 132-165: Record attestation
async recordAttestation(
    executor: string,
    agentName: string,
    intentHash: string,
    metadata: string
)
```

**What it does:**
- ✅ Wraps Ethers.js for blockchain interactions
- ✅ Manages wallet (executor private key)
- ✅ Signs and sends transactions
- ✅ Handles gas estimation
- ✅ Waits for transaction confirmation

---

#### **execute.ts** - API Endpoints
📍 Location: `backend/src/routes/execute.ts`

**Key Endpoints:**
```typescript
// Line 12-67: POST /execute/payment
router.post("/payment", async (req, res) => {
  // Validates input
  // Calls cronosService.executePaymentViaRouter()
  // Returns transaction hash
})

// Line 73-120: POST /execute/contract
router.post("/contract", async (req, res) => {
  // Validates contract address and calldata
  // Calls cronosService.executeViaRouter()
  // Returns transaction result
})

// Line 126-175: POST /execute/attest
router.post("/attest", async (req, res) => {
  // Records attestation on blockchain
  // Calls cronosService.recordAttestation()
})
```

**What it does:**
- ✅ Exposes REST API for transactions
- ✅ Validates request parameters
- ✅ Orchestrates service calls
- ✅ Returns formatted responses with explorer links

---

### **3. Deployment & Setup Scripts**

#### **deploy.ts** - Contract Deployment
📍 Location: `contracts/scripts/deploy.ts`

**What it does:**
```typescript
// Line 31-36: Deploy ExecutionRouter
const executionRouter = await ExecutionRouter.deploy();

// Line 39-44: Deploy TreasuryVault
const treasuryVault = await TreasuryVault.deploy();

// Line 47-52: Deploy AttestationRegistry
const attestationRegistry = await AttestationRegistry.deploy();

// Line 57-66: Setup permissions
await executionRouter.authorizeExecutor(deployer.address);
await treasuryVault.setAllowance(executionRouterAddress, allowanceAmount);
await attestationRegistry.addTrustedAttester(deployer.address);
```

**Responsible for:**
- ✅ Deploying all 3 contracts
- ✅ Setting up initial permissions
- ✅ Saving deployment addresses
- ✅ Creating the transactions you saw on explorer

---

#### **setup-permissions.js** - Post-Deployment Setup
📍 Location: `scripts/setup-permissions.js`

**What it does:**
```javascript
// Authorize executor wallet
await router.authorizeExecutor(executor.address);

// Add trusted attester
await registry.addTrustedAttester(executor.address);
```

**Responsible for:**
- ✅ Authorizing your executor wallet
- ✅ Making executor a trusted attester
- ✅ The authorization transactions you saw (0x7e818d85... and 0xa0b448f1...)

---

#### **simple-test.js** - Test Transactions
📍 Location: `scripts/simple-test.js`

**What it does:**
```javascript
// Line 146-162: Deposit to vault
const tx = await treasuryVault.deposit({ value: depositAmount });

// Line 196-213: Execute payment
const tx = await routerWithExecutor.executePayment(recipient, paymentAmount, {
  value: paymentAmount,
});

// Line 271-280: Record attestation
const tx = await registryWithExecutor.attest(
  executor.address,
  agentName,
  intentHash,
  metadata
);
```

**Responsible for:**
- ✅ The 2 vault deposit transactions (0x8b193107... and 0xf1279bd...)
- ✅ Testing contract functionality
- ✅ Demonstrating real blockchain execution

---

## 🔄 **Transaction Flow Diagram**

```
┌─────────────────────────────────────────────────────────┐
│ 1. User/Agent Makes Request                              │
│    (Natural language or API call)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Backend API (execute.ts)                             │
│    • POST /execute/payment                               │
│    • Validates input                                     │
│    • Logs request                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Cronos Service (cronos.service.ts)                   │
│    • executePaymentViaRouter()                           │
│    • Signs transaction with executor wallet              │
│    • Estimates gas                                       │
│    • Sends to blockchain                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Cronos Testnet Blockchain                            │
│    • Validates transaction                               │
│    • Checks gas and signature                            │
│    • Routes to ExecutionRouter contract                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. ExecutionRouter.sol                                   │
│    • executePayment() function                           │
│    • Checks authorization (onlyAuthorized)               │
│    • Checks not paused (whenNotPaused)                   │
│    • Prevents reentrancy (nonReentrant)                  │
│    • Executes payment                                    │
│    • Emits events                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Recipient Receives CRO                                │
│    • Balance updated on blockchain                       │
│    • Transaction confirmed in block                      │
│    • Visible on Cronos Explorer                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **Your Actual Transactions Breakdown**

### **Deployment Transactions** (from deploy.ts)
```
1. ExecutionRouter deployment
2. TreasuryVault deployment
3. AttestationRegistry deployment
```

### **Setup Transactions** (from setup-permissions.js)
```
4. TX 0x7e818d85... - authorizeExecutor()
5. TX 0xa0b448f1... - addTrustedAttester()
```

### **Test Transactions** (from simple-test.js)
```
6. TX 0x8b193107... - treasuryVault.deposit() - 1 tCRO
7. TX 0xf1279bd... - treasuryVault.deposit() - 1 tCRO
```

---

## 🎯 **Which File for What?**

| Want to... | Use this file |
|------------|---------------|
| **Execute payment transaction** | `backend/src/services/cronos.service.ts` → `executePaymentViaRouter()` |
| **Define payment logic** | `contracts/src/ExecutionRouter.sol` → `executePayment()` |
| **Expose payment API** | `backend/src/routes/execute.ts` → `POST /payment` |
| **Deploy contracts** | `contracts/scripts/deploy.ts` |
| **Test transactions** | `scripts/simple-test.js` |
| **Setup permissions** | `scripts/setup-permissions.js` |
| **Manage treasury** | `contracts/src/TreasuryVault.sol` |
| **Record attestations** | `contracts/src/AttestationRegistry.sol` |

---

## 🔧 **How to Trigger a Transaction**

### **Method 1: Via Backend API**
```bash
curl -X POST http://localhost:3000/execute/payment \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "amount": "0.01",
    "reason": "Test payment"
  }'
```
**Files involved:** `execute.ts` → `cronos.service.ts` → `ExecutionRouter.sol`

### **Method 2: Direct Script**
```bash
cd scripts
node simple-test.js
```
**Files involved:** `simple-test.js` → Ethers.js → Smart contracts

### **Method 3: Hardhat Console**
```bash
cd contracts
npx hardhat console --network cronosTestnet
```
```javascript
const router = await ethers.getContractAt("ExecutionRouter", "0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6");
await router.executePayment(ethers.id("test-1"), "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", ethers.parseEther("0.01"), "test", {value: ethers.parseEther("0.01")});
```
**Files involved:** Hardhat → `ExecutionRouter.sol`

---

## 🎓 **Summary**

**Transaction happens in this order:**

1. **Request** → `backend/src/routes/execute.ts`
2. **Service call** → `backend/src/services/cronos.service.ts`
3. **Blockchain call** → `contracts/src/ExecutionRouter.sol`
4. **Result** → Confirmed on Cronos Explorer

**Core files:**
- ✅ `ExecutionRouter.sol` - The smart contract that executes on blockchain
- ✅ `cronos.service.ts` - The service that sends transactions
- ✅ `execute.ts` - The API that exposes endpoints
- ✅ `deploy.ts` - Script that deployed your contracts
- ✅ `simple-test.js` - Script that created the test transactions you see

All your transactions are visible at:
https://explorer.cronos.org/testnet/address/0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7
