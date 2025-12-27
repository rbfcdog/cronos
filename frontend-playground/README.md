# x402 Agent Playground - Frontend

Modern, developer-centric UI for building and testing x402 agent execution plans on Cronos.

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react
- **Drag & Drop**: @dnd-kit (core + sortable + utilities)
- **Wallet**: RainbowKit + wagmi + viem
- **State**: React Query (@tanstack/react-query)
- **Chain**: Cronos Testnet (Chain ID 338)

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your WalletConnect project ID
```

## 🔧 Configuration

Create `.env.local` with:

```env
# Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Backend API URL (default: http://localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cronos Testnet RPC
NEXT_PUBLIC_CRONOS_RPC_URL=https://evm-t3.cronos.org
```

## 🏃 Running

```bash
# Development server (port 3001)
npm run dev -- --port 3001

# Build for production
npm run build

# Start production server
npm start
```

**Frontend**: http://localhost:3001  
**Backend**: http://localhost:3000

## 🎨 Features

### 1. **Header** - Wallet Connection
- RainbowKit integration
- Cronos Testnet indicator
- Clean modern design

### 2. **Drag Palette** - Action Blocks
- 6 action types with icons
- Drag-and-drop to canvas
- Color-coded categories

### 3. **Plan Canvas** - Build Plans
- Drop zone for blocks
- Reorder with drag-and-drop
- Edit block parameters
- Remove blocks

### 4. **Simulator Controls** - Execute
- Mode toggle (Simulate/Live)
- Simulate button (safe)
- Execute button (real tx)
- Loading states

### 5. **JSON Output** - Real-time
- Live plan JSON
- Copy to clipboard
- Formatted display

### 6. **Trace Viewer** - Results
- Step-by-step timeline
- Expandable details
- TX hash links
- Gas usage

### 7. **State Panel** - Overview
- Wallet balances
- Contract status
- x402 metrics

## 🔗 API Endpoints

- `POST /api/playground/simulate` - Virtual execution
- `POST /api/playground/execute` - Real blockchain
- `POST /api/playground/validate` - Plan validation
- `GET /api/playground/runs/:id` - Get trace
- `GET /api/playground/runs` - List runs
- `GET /api/playground/health` - Health check

## 🎯 Usage Flow

1. Connect wallet (RainbowKit)
2. Drag blocks to canvas
3. Edit block parameters
4. View JSON output
5. Click "Simulate Plan"
6. Review execution trace
7. Switch to "Live" mode
8. Click "Execute Plan"
9. Monitor on Cronos explorer

## 🔐 Security

- WalletConnect v2
- Private keys stay in wallet
- Clear live execution warnings
- Safe simulation mode first

## 🌐 Cronos Testnet

- **Chain ID**: 338
- **RPC**: https://evm-t3.cronos.org
- **Explorer**: https://explorer.cronos.org/testnet
- **Faucet**: https://cronos.org/faucet

## 📝 Development

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

## 🐛 Troubleshooting

**"Cannot find module '@/lib/types'"**
- Restart TypeScript server in VS Code

**Wallet connection fails**
- Check `.env.local` has WalletConnect project ID

**Backend errors**
- Verify backend running on port 3000
- Check CORS settings

## 📄 License

See parent project.
