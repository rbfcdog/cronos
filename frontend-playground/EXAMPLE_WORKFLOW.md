# Example Workflow Guide

This guide demonstrates how to use the x402 Agent Playground with a pre-built example workflow.

## 🚀 Quick Start

1. **Load the Example**: Click the **"Load Example"** button in the header (blue/purple gradient button with play icon)

2. **What You'll See**: A 3-node workflow will appear:
   - **Node 1**: Check Balance (reads CRO balance)
   - **Node 2**: Read Contract State (reads ExecutionRouter state)
   - **Node 3**: Send Payment (sends 0.5 CRO)

## ✅ Supported Action Types

The backend currently supports these action types:
- ✅ `read_balance` - Read wallet token balances
- ✅ `x402_payment` - Send payments with metadata
- ✅ `contract_call` - Call smart contract methods
- ✅ `read_state` - Read contract state
- ✅ `approve_token` - Approve token spending
- ❌ `condition` - **NOT SUPPORTED YET** (logic will be added later)

## 📊 Understanding the Workflow

### Node 1: Check Balance (read_balance)
```json
{
  "actionType": "read_balance",
  "params": {}
}
```

**What it does**: Reads the native CRO balance of the connected wallet

**Outputs** (from backend):
- `token`: Token symbol (e.g., "TCRO")
- `balance`: Human-readable balance (e.g., "10")
- `address`: Wallet address

**How to reference**: Use `step_0.balance` in later nodes

**Note**: In simulation mode, starts with 10 TCRO balance

---

### Node 2: Read Contract State (read_state)
```json
{
  "actionType": "read_state",
  "params": {
    "contract": "ExecutionRouter"
  }
}
```

**What it does**: Reads the state of the ExecutionRouter contract

**Outputs**:
- `contract`: Contract address
- `state`: Contract state data
- `isDeployed`: Whether contract is deployed

**How to reference**: Use `step_1.state` or `step_1.contract`

---

### Node 3: Send Payment (x402_payment)
```json
{
  "actionType": "x402_payment",
  "params": {
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "0.5",
    "token": "CRO"
  }
}
```

**What it does**: Sends 0.5 CRO to the recipient address

**Outputs**:
- `from`: Sender address
- `to`: Recipient address
- `amount`: Amount sent
- `token`: Token used
- `newBalance`: Remaining balance after payment

**Important**: Amount must be ≤ available balance (10 TCRO in simulation)

---

## 🔗 Connection Flow

The example demonstrates **parallel data gathering** followed by execution:

```
Check Balance ──┐
                ├──→ Send Payment
Read State ─────┘
```

### How Data Flows:
1. **Step 0 (read_balance)**: Gets wallet balance
2. **Step 1 (read_state)**: Gets contract state
3. **Step 2 (x402_payment)**: Uses data from both to send payment

---

## 🎮 Testing the Workflow

### Using Simulate Mode:
1. Click **"Load Example"** to load the workflow
2. Keep mode as **"Simulate"** (default)
3. Click **"Run Simulation"**
4. Watch the execution:
   - Nodes turn **blue** → **green** as they execute
   - Edges animate to show data flow
   - Check the **Connection Map** on the right to see execution order
   - View **Trace Viewer** at the bottom for step-by-step logs
   - See **Unified State** for accumulated variables

**Expected Results** (Simulation):
- ✅ Step 0: Balance = "10" TCRO (simulated starting balance)
- ✅ Step 1: ExecutionRouter state loaded
- ✅ Step 2: Payment successful, new balance = "9.5" TCRO

### Using Execute Mode:
1. Connect your wallet (RainbowKit button in header)
2. Ensure you have TCRO on Cronos Testnet
3. Switch to **"Execute"** mode
4. Click **"Execute on Cronos"**
5. Approve the transaction in your wallet
6. Wait for on-chain confirmation
7. View the real transaction hash in the trace

**Note**: Execute mode requires actual TCRO balance and gas fees

---

## ✏️ Customizing the Workflow

### Modify Node Parameters:
1. Click the **expand icon** (⌄) on any node
2. Edit the input fields:
   - **Node 1**: Leave empty for CRO, or add token address for ERC20
   - **Node 2**: Change contract name to any deployed contract
   - **Node 3**: Update recipient address or amount (keep ≤ 10 for simulation)

### Add More Nodes:
1. Drag nodes from the **left palette**:
   - 📊 Read Balance
   - ⚡ x402 Payment
   - 🔧 Contract Call
   - 🔍 Read State
   - ✅ Approve Token

2. **Connect nodes**: Drag from the bottom handle of one node to the top handle of another

3. **Reference previous steps**: Use `step_N.key` syntax in any parameter
   - Example: `step_0.balance` → Balance from step 0
   - Example: `step_1.contract` → Contract address from step 1
   - Example: `step_2.newBalance` → Updated balance after payment

### Delete Nodes:
- Click the **trash icon** (🗑️) on any node header to remove it and its connections

---

## 📖 Node Documentation

Each node type has comprehensive documentation:

1. **In the Palette**: Hover over a node type and click the **info icon** (ℹ️)
2. **Documentation Modal** shows:
   - Inputs with validation rules
   - Outputs with examples
   - Gas estimates
   - Example configurations
   - Use case descriptions

---

## 🧪 Example Use Cases

### Use Case 1: Balance Check + Payment
```
Read Balance → x402 Payment
```
Check balance, then send payment (example workflow)

### Use Case 2: Token Approval Flow
```
Read Balance → Approve Token → Contract Call
```
Approve spending before interacting with DeFi contract

### Use Case 3: State Verification
```
Read State → Contract Call
```
Verify contract state before executing action

### Use Case 4: Multi-Payment Chain
```
Read Balance → Payment 1 → Payment 2 → Payment 3
```
Complete DeFi interaction with verification

---

## 🔍 Debugging Tips

### Connection Map (Right Sidebar):
- Shows **execution order** (1, 2, 3...)
- Displays **data flow** between nodes
- Warns about **disconnected nodes**

### Trace Viewer (Bottom Panel):
- Shows **step-by-step execution**
- Displays **outputs** from each step
- Shows **errors** if any step fails
- Includes **gas costs** and **timing**

### Unified State (Bottom Panel):
- Shows **all variables** accumulated during execution
- Displays **step_N.key** references available
- Updates **in real-time** during simulation

---

## 🎯 Best Practices

1. **Test with Simulate First**: Always run simulation before executing on-chain
2. **Check Connection Map**: Verify execution order makes sense
3. **Use Step References**: Leverage `step_N.key` for dynamic data
4. **Read Documentation**: Hover info icons to understand inputs/outputs
5. **Start Simple**: Begin with 2-3 nodes, then add complexity
6. **Monitor Gas**: Check gas estimates in node documentation
7. **Verify Addresses**: Double-check recipient addresses before execution

---

## 🚨 Common Issues

### "No execution order possible (cycle detected)"
- **Problem**: Nodes are connected in a loop
- **Solution**: Remove one connection to break the cycle

### "Disconnected nodes detected"
- **Problem**: Some nodes aren't connected to the workflow
- **Solution**: Connect them or delete them

### "Insufficient balance"
- **Problem**: Wallet doesn't have enough tokens
- **Solution**: Fund wallet on Cronos testnet faucet

### "Transaction failed"
- **Problem**: On-chain execution reverted
- **Solution**: Check trace viewer for error details

---

## 📚 Next Steps

1. **Explore All Node Types**: Try read_state, contract_call, approve_token
2. **Build Complex Workflows**: Chain 5+ nodes together
3. **Use Conditional Logic**: Branch based on conditions
4. **Integrate with Contracts**: Call your own smart contracts
5. **Share Your Workflow**: Export JSON and share with team

---

## 🎉 Success Criteria

You'll know the example works when:
- ✅ All 3 nodes turn green after simulation
- ✅ Connection Map shows order: 1 → 2 → 3
- ✅ Trace Viewer shows outputs from each step
- ✅ Unified State displays `step_1.balance`, `step_2.result`, `step_3.txHash`
- ✅ No errors in the trace

**Happy Building! 🚀**
