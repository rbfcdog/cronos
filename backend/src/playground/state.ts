/**
 * Virtual State Manager
 * 
 * Maintains unified execution state that's agent-readable and LLM-friendly.
 */

import { VirtualState, VirtualWallet, ContractState, ExecutionMode } from "./types";
import { ethers } from "ethers";
import config from "../config";

export class StateManager {
  private states: Map<string, VirtualState> = new Map();

  /**
   * Initialize a new virtual state for a run
   */
  createState(runId: string, mode: ExecutionMode, executorAddress: string): VirtualState {
    const state: VirtualState = {
      runId,
      mode,
      wallet: {
        address: executorAddress,
        balances: {
          TCRO: "0",
          USDC: "0",
        },
        nonce: 0,
      },
      contracts: {
        ExecutionRouter: {
          address: config.contracts.executionRouter || "0x0B10060fF00CF2913a81f5BdBEA1378eD10092c6",
          name: "ExecutionRouter",
          isDeployed: true,
        },
        TreasuryVault: {
          address: config.contracts.treasuryVault || "0x169439e816B63D3836e1E4e9C407c7936505C202",
          name: "TreasuryVault",
          isDeployed: true,
        },
        AttestationRegistry: {
          address: config.contracts.attestationRegistry || "0xb183502116bcc1b41Bb42C704F4868e5Dc812Ce2",
          name: "AttestationRegistry",
          isDeployed: true,
        },
        // Common DeFi contracts for simulation
        SwapRouter: {
          address: "0x145677FC4d9b8F19B5D56d1820c48e0443049a30",
          name: "SwapRouter",
          isDeployed: true,
        },
        LiquidityPool: {
          address: "0x7c3c0c8f6f7e7d8c9b8b7b7c6c5c4c3c2c1c0c9c",
          name: "LiquidityPool",
          isDeployed: true,
        },
        PriceOracle: {
          address: "0x6c3c0c8f6f7e7d8c9b8b7b7c6c5c4c3c2c1c0c8c",
          name: "PriceOracle",
          isDeployed: true,
        },
      },
      x402: {
        mode: mode === "simulate" ? "simulated" : "real",
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    this.states.set(runId, state);
    return state;
  }

  /**
   * Get state for a run
   */
  getState(runId: string): VirtualState | undefined {
    return this.states.get(runId);
  }

  /**
   * Update wallet balance (for simulation)
   */
  updateBalance(runId: string, token: string, amount: string): void {
    const state = this.states.get(runId);
    if (!state) return;

    state.wallet.balances[token] = amount;
    state.metadata.updatedAt = Date.now();
  }

  /**
   * Deduct balance (for simulated payments)
   */
  deductBalance(runId: string, token: string, amount: string): boolean {
    const state = this.states.get(runId);
    if (!state) return false;

    const currentBalance = parseFloat(state.wallet.balances[token] || "0");
    const deductAmount = parseFloat(amount);

    if (currentBalance < deductAmount) {
      return false; // Insufficient balance
    }

    state.wallet.balances[token] = (currentBalance - deductAmount).toString();
    state.metadata.updatedAt = Date.now();
    return true;
  }

  /**
   * Add balance (for simulated receipts)
   */
  addBalance(runId: string, token: string, amount: string): void {
    const state = this.states.get(runId);
    if (!state) return;

    const currentBalance = parseFloat(state.wallet.balances[token] || "0");
    const addAmount = parseFloat(amount);

    state.wallet.balances[token] = (currentBalance + addAmount).toString();
    state.metadata.updatedAt = Date.now();
  }

  /**
   * Update x402 execution info
   */
  updateX402Execution(runId: string, txHash?: string): void {
    const state = this.states.get(runId);
    if (!state) return;

    state.x402.lastExecution = {
      timestamp: Date.now(),
      txHash,
    };
    state.metadata.updatedAt = Date.now();
  }

  /**
   * Get agent-friendly state summary
   */
  getStateSummary(runId: string): any {
    const state = this.states.get(runId);
    if (!state) return null;

    return {
      wallet: {
        address: state.wallet.address,
        balances: state.wallet.balances,
      },
      contracts: Object.entries(state.contracts).map(([name, contract]) => ({
        name,
        address: contract.address,
        deployed: contract.isDeployed,
      })),
      mode: state.mode,
      x402Status: state.x402.mode,
      lastUpdated: new Date(state.metadata.updatedAt).toISOString(),
    };
  }

  /**
   * Load real balances from chain (for execute mode)
   */
  async loadRealBalances(runId: string, provider: ethers.JsonRpcProvider): Promise<void> {
    const state = this.states.get(runId);
    if (!state) return;

    try {
      const balance = await provider.getBalance(state.wallet.address);
      state.wallet.balances.TCRO = ethers.formatEther(balance);
      state.metadata.updatedAt = Date.now();
    } catch (error) {
      console.error("Failed to load real balances:", error);
    }
  }

  /**
   * Clear old states (memory management)
   */
  clearOldStates(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [runId, state] of this.states.entries()) {
      if (now - state.metadata.createdAt > maxAgeMs) {
        this.states.delete(runId);
      }
    }
  }
}

export const stateManager = new StateManager();
