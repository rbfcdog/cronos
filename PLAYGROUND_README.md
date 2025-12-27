# x402 Agent Playground

A node-based workflow editor for simulating and executing x402 agent actions on Cronos Testnet.

## 🎨 Features

- **Node-Based Workflow Editor**: Drag and drop actions on a 2D canvas (powered by React Flow)
- **Dark Mode UI**: Professional dark theme optimized for development
- **Real-time Simulation**: Test action sequences before execution
- **State Monitoring**: Track wallet balances, contracts, and x402 payments
- **Execution Tracing**: Detailed step-by-step execution logs
- **Backend Integration**: RESTful API for blockchain interactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com/)

### Setup

1. **Start All Services:**
   ```bash
   ./start-playground.sh
   ```

   This script will:
   - Check dependencies and install if needed
   - Start backend on port 3000 (dev mode with hot reload)
   - Start frontend on port 3001 (dev mode with hot reload)
   - Verify both services are healthy
   - **Run in background and exit** - services continue running

2. **Access the Playground:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/api/playground/health

3. **Stop Services When Done:**
   ```bash
   ./stop-playground.sh
   ```
   This will cleanly stop both backend and frontend services.

4. **Configure WalletConnect:**
   Edit `frontend-playground/.env.local`:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

### Manual Start (Alternative)

**Backend (Dev Mode with Hot Reload):**
```bash
cd backend
npm run dev
```

**Frontend (Dev Mode with Hot Reload):**
```bash
cd frontend-playground
npm run dev -- --port 3001
```

**Note:** Both services run in development mode with automatic reload on file changes.

## 🧪 Testing

Run all component tests:
```bash
cd frontend-playground
npm test
```

**Test Coverage:** 33 tests across 6 test suites
- ✅ NodePalette (4 tests) - Draggable action types
- ✅ SimulatorPanel (6 tests) - Execution controls
- ✅ JsonOutput (4 tests) - JSON display
- ✅ WorkflowNode (5 tests) - Custom workflow nodes
- ✅ TraceViewer (8 tests) - Execution trace viewer
- ✅ UnifiedStatePanel (6 tests) - State monitoring

## 📁 Project Structure

```
cronos/
├── backend/                  # Express.js API server
│   ├── src/
│   │   └── routes/
│   │       └── playground.js # API endpoints
│   └── package.json
│
├── frontend-playground/      # Next.js application
│   ├── app/
│   │   ├── page.tsx         # Main workflow editor
│   │   └── globals.css      # Dark theme styles
│   ├── components/
│   │   ├── NodePalette.tsx  # Draggable action types
│   │   ├── WorkflowNode.tsx # Custom React Flow node
│   │   ├── SimulatorPanel.tsx
│   │   ├── TraceViewer.tsx
│   │   ├── UnifiedStatePanel.tsx
│   │   ├── JsonOutput.tsx
│   │   └── Header.tsx
│   ├── lib/
│   │   └── types.ts         # TypeScript definitions
│   ├── __tests__/           # Component tests
│   ├── jest.config.js
│   └── package.json
│
├── start-playground.sh       # Startup script
└── logs/                    # Server logs
    ├── backend.log
    └── frontend.log
```

## 🎯 Usage Guide

### Creating a Workflow

1. **Drag Actions**: Drag action types from the left palette onto the canvas
2. **Connect Nodes**: Click and drag from output handle to input handle
3. **Configure**: Click nodes to expand and fill in parameters
4. **Simulate**: Click "Run Simulation" to test the workflow
5. **Execute**: Click "Execute on Chain" to run on Cronos Testnet

### Available Actions

- **Read Balance**: Get CRO balance of an address
- **Contract Call**: Invoke a smart contract function
- **x402 Payment**: Send CRO payment with metadata
- **Multi-Contract Call**: Execute multiple contract calls
- **Custom Logic**: Define custom action logic
- **Wait**: Add delay between actions

### Workflow Modes

- **Simulation**: Test workflow without gas costs or wallet signature
- **Execution**: Real blockchain transactions requiring wallet connection

## 🔌 Backend API

### Endpoints

- `POST /api/playground/simulate` - Simulate workflow execution
- `POST /api/playground/execute` - Execute workflow on-chain
- `POST /api/playground/validate` - Validate workflow structure
- `GET /api/playground/runs/:id` - Get execution result
- `GET /api/playground/runs` - List all executions
- `GET /api/playground/health` - Health check

### Example Request

```bash
curl -X POST http://localhost:3000/api/playground/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "type": "read_balance",
        "params": {"address": "0x123..."}
      }
    ]
  }'
```

## 🎨 Dark Theme Colors

- Background: `#0a0a0a`
- Surfaces: `#1a1a1a`
- Borders: `#2a2a2a`
- Primary Text: `#ededed`
- Secondary Text: `#a0a0a0`
- Accents: Blue (`#3b82f6`), Purple (`#9333ea`)

## 🛠️ Development

### Hot Reload

Both servers support hot reload:
- Frontend: Next.js Fast Refresh
- Backend: nodemon

### Logs

View live logs:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Environment Variables

**Frontend (.env.local):**
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)
- `NEXT_PUBLIC_CRONOS_RPC_URL` - Cronos Testnet RPC

**Backend:**
- `PORT` - Server port (default: 3000)

## 🧩 Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework
- **React Flow** - Node-based editor
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **RainbowKit** - Wallet connection
- **Jest + Testing Library** - Testing

### Backend
- **Express.js** - REST API
- **ethers.js** - Blockchain interactions
- **Cronos Testnet** - Chain ID 338

## 📝 Notes

- The playground uses Cronos Testnet (Chain ID 338)
- Get testnet CRO from the [Cronos Faucet](https://cronos.org/faucet)
- All executions require wallet connection via RainbowKit
- Simulations don't require wallet or gas

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 3000 is already in use: `lsof -i :3000`
- Check logs: `cat logs/backend.log`

**Frontend won't start:**
- Check if port 3001 is already in use: `lsof -i :3001`
- Check logs: `cat logs/frontend.log`

**Tests failing:**
- Clear jest cache: `npm test -- --clearCache`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

**Wallet won't connect:**
- Verify WalletConnect Project ID is set
- Check browser console for errors
- Try different wallet (MetaMask, WalletConnect, etc.)

## 📄 License

MIT
