# Integration Guide

How Atlas402 integrates with x402, Cronos, and Crypto.com ecosystem.

## x402 Integration

### Overview

x402 is the payment facilitation protocol from Crypto.com that enables cross-chain intents and settlements.

### Integration Points

1. **Payment Intents**
   - Create payment intents via x402 API
   - Support cross-chain routing
   - Track settlement status

2. **Facilitator Integration**
   ```typescript
   import x402Service from "./services/x402.service";
   
   // Create payment intent
   const intent = await x402Service.createPaymentIntent({
     sourceChain: "cronos",
     destinationChain: "ethereum",
     recipient: "0x...",
     amount: "10.0",
     token: "CRO"
   });
   
   // Execute intent
   const result = await x402Service.executeIntent(intent.id);
   ```

3. **Status Tracking**
   ```typescript
   const status = await x402Service.getIntentStatus(intentId);
   // Returns: PENDING, EXECUTING, COMPLETED, FAILED
   ```

### Configuration

Add to `.env`:
```env
X402_FACILITATOR_URL=https://facilitator.x402.dev
X402_API_KEY=your_x402_api_key
```

### Use Cases

- Cross-chain payments
- Multi-hop routing
- Atomic swaps
- Bridge operations

---

## Cronos EVM Integration

### Smart Contracts

All contracts deployed to Cronos testnet:

```
Network: Cronos Testnet
RPC: https://evm-t3.cronos.org
Chain ID: 338
Explorer: https://explorer.cronos.org/testnet
```

### Contract Interactions

```typescript
import cronosService from "./services/cronos.service";

// Execute via ExecutionRouter
const result = await cronosService.executePaymentViaRouter(
  executionId,
  recipient,
  amount,
  reason
);

// Record attestation
await cronosService.recordAttestation(
  executionId,
  agentName,
  intentHash
);
```

### Gas Management

- Fixed gas price: 5000 gwei
- Standard transfer: 21,000 gas
- Contract calls: Varies by complexity

---

## Crypto.com AI Agent SDK

### Future Integration

Atlas402 is designed to integrate with Crypto.com AI Agent SDK:

```typescript
import { CryptoComAgent } from "@crypto-com/ai-agent-sdk";

const agent = new CryptoComAgent({
  apiKey: process.env.CRYPTOCOM_API_KEY,
  network: "cronos-testnet"
});

// Use SDK tools
const marketData = await agent.tools.marketData.getCROPrice();
const balance = await agent.tools.wallet.getBalance(address);
```

### SDK Features

- Market data access
- Wallet management
- Intent parsing
- Multi-chain support

---

## Cronos DApp Integrations

### VVS Finance

Integration points:
- Swap tokens
- Add/remove liquidity
- Stake CRO
- Yield farming

Example:
```typescript
// Agent plans VVS swap
const plan = {
  type: "contract-interaction",
  target: VVS_ROUTER_ADDRESS,
  action: "swapExactETHForTokens",
  params: { ... }
};
```

### Delphi Testnet

- Oracle price feeds
- Data verification
- Cross-chain data

### Moonlander Launchpad

- Token launches
- IDO participation
- Staking programs

---

## Market Data Integration

### CoinGecko API

```typescript
import marketService from "./services/market.service";

// Get CRO price
const price = await marketService.getCROPrice();

// Calculate USD value
const usdValue = await marketService.calculateUSDValue("10");

// Get gas recommendations
const gas = await marketService.getGasRecommendation();
```

### On-Chain Oracles

Future support for:
- Chainlink price feeds
- Band Protocol
- Pyth Network

---

## Wallet Integration

### MetaMask

```typescript
// Frontend integration
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);

// Add Cronos network
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x152', // 338 in hex
    chainName: 'Cronos Testnet',
    nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 },
    rpcUrls: ['https://evm-t3.cronos.org'],
    blockExplorerUrls: ['https://explorer.cronos.org/testnet']
  }]
});
```

### WalletConnect

```typescript
import WalletConnectProvider from "@walletconnect/web3-provider";

const provider = new WalletConnectProvider({
  rpc: {
    338: "https://evm-t3.cronos.org"
  }
});

await provider.enable();
```

---

## Event Monitoring

### Contract Events

Listen for ExecutionRouter events:

```typescript
const router = new ethers.Contract(
  EXECUTION_ROUTER_ADDRESS,
  ABI,
  provider
);

// Listen for executions
router.on("ExecutionRequested", (executionId, requester, intentType) => {
  console.log("New execution:", executionId);
});

router.on("ExecutionCompleted", (executionId, success, result) => {
  console.log("Execution complete:", executionId, success);
});
```

### WebSocket Subscriptions

```typescript
const ws = new ethers.WebSocketProvider("wss://evm-t3.cronos.org/ws");

// Subscribe to pending transactions
ws.on("pending", (tx) => {
  console.log("Pending tx:", tx);
});
```

---

## API Integration Examples

### Backend API

```bash
# Health check
curl http://localhost:3000/health

# System status
curl http://localhost:3000/status

# Execute payment
curl -X POST http://localhost:3000/execute/payment \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "0x...",
    "amount": "5.0"
  }'
```

### Agent API

```bash
# Generate plan (when agent API is exposed)
curl -X POST http://localhost:3001/agent/plan \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Send 10 CRO to Bob"
  }'

# Evaluate risk
curl -X POST http://localhost:3001/agent/risk \
  -H "Content-Type: application/json" \
  -d '{
    "plan": { ... }
  }'
```

---

## External Services

### Faucets

- Cronos Testnet: https://cronos.org/faucet
- Request tCRO for testing

### Explorers

- Cronos Testnet: https://explorer.cronos.org/testnet
- View transactions, contracts, events

### RPC Providers

- Official Cronos RPC: https://evm-t3.cronos.org
- Backup options available

---

## Security Considerations

### API Keys

- Never expose private keys
- Use environment variables
- Rotate keys regularly

### Rate Limiting

- Implement on backend
- Monitor API usage
- Handle rate limit errors

### Validation

- Validate all addresses
- Check transaction amounts
- Verify contract calls

---

## Future Integrations

### Planned

- [ ] Crypto.com Pay integration
- [ ] Crypto.com Exchange API
- [ ] More DeFi protocols (Ferro, Tectonic)
- [ ] NFT marketplace integration
- [ ] Cross-chain bridges

### Under Consideration

- [ ] Telegram bot interface
- [ ] Discord notifications
- [ ] Mobile app
- [ ] Hardware wallet support

---

**Last Updated:** December 25, 2025
