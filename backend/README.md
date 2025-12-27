# Backend

Orchestration and API layer for Atlas402.

## Overview

The backend serves as the coordination layer between AI agents and the blockchain:

- Validates agent execution plans
- Controls private keys securely
- Triggers x402 payments
- Logs all operations
- Enforces business logic and policies

## Architecture

```
API Layer (Express)
    ↓
Route Handlers
    ↓
Services
├── cronos.service.ts    (blockchain interactions)
├── x402.service.ts      (payment facilitation)
└── market.service.ts    (price/data feeds)
    ↓
Configuration
└── config/index.ts
```

## Development

### Install Dependencies

```bash
npm install
```

### Configure Environment

Copy `.env.example` to `.env` and fill in values.

### Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### POST /execute

Execute an agent-generated plan.

**Request:**
```json
{
  "executionId": "unique-id",
  "intent": "Send 5 CRO to 0x123...",
  "agent": "planner",
  "plan": {
    "type": "payment",
    "recipient": "0x123...",
    "amount": "5.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0xabc...",
  "executionId": "unique-id"
}
```

### GET /status

Check system status and configuration.

### GET /balance/:address

Get CRO balance for an address.

## Services

### CronosService

Handles all blockchain interactions:
- Send payments
- Execute via ExecutionRouter
- Record attestations
- Query balances and gas prices

### X402Service

Manages x402 payment facilitation:
- Initialize payment intents
- Execute cross-chain operations
- Track payment status

### MarketService

Fetches market data:
- Token prices
- Gas estimates
- Network status

## Security

- Private keys never exposed via API
- All executions logged
- Rate limiting enabled
- CORS configured
- Input validation on all endpoints

## Monitoring

- Request/response logging
- Error tracking
- Performance metrics
- Transaction monitoring

## License

MIT
