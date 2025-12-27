# Contracts

Smart contracts for Atlas402 on Cronos EVM.

## Overview

This module contains all on-chain logic for the Atlas402 platform:

- **ExecutionRouter.sol** - Routes agent-triggered executions
- **TreasuryVault.sol** - Manages funds with allowance system
- **AttestationRegistry.sol** - Records execution attestations

## Development

### Install Dependencies

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy to Testnet

```bash
npm run deploy:testnet
```

### Verify Contracts

```bash
npm run verify
```

## Contract Addresses

After deployment, addresses will be saved to `deployments/testnet-deployment.json`.

## Architecture

```
ExecutionRouter
├── Authorizes executors (backend wallets)
├── Routes execution commands
├── Emits audit events
└── Supports emergency pause

TreasuryVault
├── Holds funds for agent operations
├── Allowance-based withdrawals
└── Owner emergency controls

AttestationRegistry
├── Records agent attestations
├── Links executions to agent decisions
└── Provides audit trail
```

## Security Features

- Reentrancy guards on all state-changing functions
- Access control via Ownable
- Emergency pause functionality
- Event emission for all critical actions
- Allowance system for fund management

## Testing

Tests cover:
- Deployment and initialization
- Authorization management
- Payment execution
- Pause functionality
- Treasury operations
- Attestation recording
- Access control
- Edge cases and failures

## Gas Optimization

- Optimizer enabled (200 runs)
- Minimal storage operations
- Efficient event emission
- Batch operations support

## License

MIT
