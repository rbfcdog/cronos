# Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Environment Setup (30 seconds)

```bash
cd frontend-playground

# Copy environment template
cp .env.local .env.local.example

# Edit .env.local
# Add your WalletConnect Project ID from https://cloud.walletconnect.com/
```

Required in `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CRONOS_RPC_URL=https://evm-t3.cronos.org
```

### Step 2: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Should run on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend-playground
npm run dev -- --port 3001
# Opens on http://localhost:3001
```

### Step 3: Test the Application (90 seconds)

1. **Open Browser**: http://localhost:3001

2. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Select your wallet (MetaMask, etc.)
   - Switch to Cronos Testnet if prompted
   - Get test CRO from https://cronos.org/faucet

3. **Build a Plan**:
   - Drag "read_balance" from left palette to center canvas
   - Click the block to expand
   - Enter token address (or leave blank for CRO)
   - Drag "x402_payment" block
   - Edit: recipient address, amount, token

4. **View JSON**:
   - Right panel shows live JSON of your plan
   - Click "Copy" to copy to clipboard

5. **Simulate**:
   - Ensure "Simulation" mode is selected
   - Click "Simulate Plan" button
   - Wait for results (no gas required!)

6. **View Results**:
   - Bottom left: Execution trace with steps
   - Click steps to expand details
   - See gas estimates, results
   - Bottom right: Updated wallet state

7. **Execute (Optional)**:
   - Switch to "Live" mode
   - Review the warning
   - Click "Execute Plan"
   - Approve transaction in wallet
   - View real transaction on Cronos explorer

## 🎯 Common Tasks

### Check if Backend is Running
```bash
curl http://localhost:3000/api/playground/health
# Should return: {"status":"ok","timestamp":...}
```

### Check Frontend Compilation
```bash
cd frontend-playground
npx tsc --noEmit
# Should show no errors
```

### View Logs
- **Frontend**: Check browser console (F12)
- **Backend**: Check terminal running backend

### Restart TypeScript Server
If VS Code shows type errors:
1. Press `Cmd/Ctrl + Shift + P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

## 🐛 Common Issues

### "Cannot find module '@/lib/types'"
**Solution**: Restart TypeScript server (see above)

### "Failed to fetch remote project configuration"
**Solution**: This is a non-critical warning from Reown/WalletConnect. The app will still work with local config.

### Wallet connection fails
**Solution**: 
- Check `.env.local` has valid WalletConnect project ID
- Ensure wallet extension is installed
- Try different browser if issue persists

### Backend connection error (CORS)
**Solution**: 
- Verify backend is running on port 3000
- Check backend has CORS enabled for localhost:3001
- Look at backend logs for errors

### "npm run dev" not found
**Solution**: 
- Make sure you're in `frontend-playground/` directory
- Run `npm install` if dependencies missing

## 📱 Example Workflows

### Workflow 1: Check Balance
1. Drag "read_balance" block
2. Edit: token = "CRO" (or leave blank)
3. Simulate
4. View balance in trace viewer

### Workflow 2: Simple Payment
1. Drag "read_balance" 
2. Drag "x402_payment"
3. Edit payment: 
   - to = "0x..." (recipient)
   - amount = "1.0"
   - token = "CRO"
4. Simulate to test
5. Execute to send real payment

### Workflow 3: Contract Interaction
1. Drag "read_state" (check contract)
2. Drag "contract_call" 
3. Edit call:
   - contract = "0x..." (contract address)
   - method = "methodName"
4. Drag "read_state" again (verify change)
5. Simulate full flow
6. Execute if successful

## 🎨 UI Overview

```
┌─────────────────────────────────────────────────────┐
│ [Logo] x402 Playground  [Cronos] [Connect Wallet]  │
├───────┬──────────────────────────────┬──────────────┤
│ Drag  │   Plan Canvas                │ Controls     │
│ Blocks│   (Drop zone)                │ JSON Output  │
├───────┴──────────────────────────────┴──────────────┤
│ Trace Viewer              │ State Panel             │
└───────────────────────────┴─────────────────────────┘
```

## 📚 Resources

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Cronos Explorer**: https://explorer.cronos.org/testnet
- **Cronos Faucet**: https://cronos.org/faucet
- **WalletConnect**: https://cloud.walletconnect.com/

## ✅ Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] WalletConnect project ID in `.env.local`
- [ ] Wallet extension installed (MetaMask, etc.)
- [ ] Cronos Testnet added to wallet
- [ ] Test CRO tokens from faucet
- [ ] Health check returns OK
- [ ] Connect wallet succeeds
- [ ] Drag-and-drop works
- [ ] JSON output displays
- [ ] Simulate button works
- [ ] Trace viewer shows results

## 🎉 You're Ready!

If all steps work, you're ready to build and test x402 agent execution plans!

For detailed documentation, see:
- `README.md` - Full documentation
- `BUILD_SUMMARY.md` - Build details
- `ARCHITECTURE.md` - Component structure

Happy building! 🚀
