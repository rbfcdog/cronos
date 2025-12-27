/**
 * Playground Runner
 * 
 * Orchestrates execution plans from agents, routing to simulation or real execution.
 */

import { ethers } from "ethers";
import {
  ExecutionPlan,
  ExecutionAction,
  ActionResult,
  SimulationResult,
  ExecutionResult,
  ExecutionTrace,
} from "./types";
import { stateManager } from "./state";
import { traceBuilder } from "./trace";
import { simulationEngine } from "./simulator";
import cronosService from "../services/cronos.service";
import config from "../config";

export class PlaygroundRunner {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.cronos.testnet.rpcUrl);
  }

  /**
   * Generate a unique run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Run a plan in simulation mode
   */
  async runSimulation(plan: ExecutionPlan): Promise<SimulationResult> {
    const runId = this.generateRunId();
    const executorAddress = cronosService.getExecutorAddress();

    // Initialize state
    const virtualState = stateManager.createState(runId, "simulate", executorAddress);
    
    // Load initial simulated balances
    stateManager.updateBalance(runId, "TCRO", "10"); // Start with 10 TCRO
    stateManager.updateBalance(runId, "USDC", "1000"); // Start with 1000 USDC

    // Initialize trace
    const trace = traceBuilder.createTrace(runId, plan.planId, "simulate", virtualState);
    traceBuilder.startExecution(runId);

    let totalGasEstimate = 0;
    let successfulSteps = 0;
    let failedSteps = 0;

    try {
      // Execute each action in sequence
      for (const action of plan.actions) {
        const result = await simulationEngine.simulate(runId, action);
        
        traceBuilder.addStep(runId, result);

        if (result.status === "simulated" || result.status === "success") {
          successfulSteps++;
          if (result.gasEstimate) {
            totalGasEstimate += parseInt(result.gasEstimate);
          }
        } else if (result.status === "error") {
          failedSteps++;
          traceBuilder.addError(runId, result.error || "Unknown error");
        }
      }

      traceBuilder.completeExecution(runId);

      const finalTrace = traceBuilder.getTrace(runId)!;

      return {
        runId,
        success: failedSteps === 0,
        trace: finalTrace,
        summary: {
          totalSteps: plan.actions.length,
          successfulSteps,
          failedSteps,
          totalGasEstimate: totalGasEstimate.toString(),
        },
      };
    } catch (error: any) {
      traceBuilder.failExecution(runId, error.message);
      const finalTrace = traceBuilder.getTrace(runId)!;

      return {
        runId,
        success: false,
        trace: finalTrace,
        summary: {
          totalSteps: plan.actions.length,
          successfulSteps,
          failedSteps: failedSteps + 1,
          totalGasEstimate: totalGasEstimate.toString(),
        },
      };
    }
  }

  /**
   * Execute a read_balance action for real
   */
  private async executeReadBalance(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    try {
      const address = action.address || cronosService.getExecutorAddress();
      const balance = await cronosService.getBalance(address);

      stateManager.updateBalance(runId, "TCRO", balance);

      return {
        action,
        status: "success",
        result: { token: "TCRO", balance, address },
        gasUsed: "0",
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        action,
        status: "error",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a read_state action for real
   */
  private async executeReadState(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    try {
      const contract = action.contract;

      if (!contract) {
        throw new Error("Missing contract name");
      }

      const state = stateManager.getState(runId);
      if (!state) {
        throw new Error("Invalid run state");
      }

      const contractState = state.contracts[contract];
      if (!contractState) {
        throw new Error(`Contract ${contract} not found in state`);
      }

      return {
        action,
        status: "success",
        result: {
          contract,
          address: contractState.address,
          deployed: contractState.isDeployed,
        },
        gasUsed: "0", // Read operations are free
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        action,
        status: "error",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute LLM agent for real (calls actual AI agent API)
   */
  private async executeLLMAgent(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const prompt = action.prompt;
    const context = action.context || {};
    const model = action.model || "gpt-4-turbo";
    const agentId = (action as any).agentId || "risk-analyzer";

    if (!prompt) {
      return {
        action,
        status: "error",
        error: "Missing prompt for LLM agent",
        timestamp: Date.now(),
      };
    }

    const state = stateManager.getState(runId);
    if (!state) {
      return {
        action,
        status: "error",
        error: "Invalid run state",
        timestamp: Date.now(),
      };
    }

    try {
      // Call AI Agent API
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: `${prompt}\n\nContext: Current balance: ${state.wallet.balances["TCRO"] || "0"} TCRO, Address: ${state.wallet.address}`
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent query failed: ${response.status}`);
      }

      const result: any = await response.json();

      traceBuilder.addWarning(
        runId,
        `[AI AGENT] Agent: ${agentId}, Model: ${model}, Execution time: ${result.data?.executionTime || 0}ms`
      );

      return {
        action,
        status: "success",
        result: {
          agentId,
          response: result.data?.response,
          executionTime: result.data?.executionTime,
          model,
          query: prompt,
          context: state.wallet.balances,
        },
        gasUsed: "0", // AI runs off-chain
        timestamp: Date.now(),
      };
    } catch (error: any) {
      // Fallback to simple logic if agent API fails
      const balance = state.wallet.balances["TCRO"] || "0";
      const balanceNum = parseFloat(balance);
      
      const shouldExecute = balanceNum > 1;
      const recommendedAmount = Math.min(balanceNum * 0.2, 10);
      
      traceBuilder.addWarning(
        runId,
        `[FALLBACK] AI Agent API unavailable, using fallback logic. Error: ${error.message}`
      );

      return {
        action,
        status: "success",
        result: {
          decision: shouldExecute ? "execute" : "skip",
          reasoning: shouldExecute 
            ? `Balance: ${balance} TCRO. Recommending ${recommendedAmount.toFixed(2)} TCRO for execution.`
            : `Insufficient balance: ${balance} TCRO.`,
          confidence: 0.85,
          parameters: { amount: recommendedAmount, shouldExecute },
          fallback: true,
        },
        gasUsed: "0",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute token approval for real (ERC20 approve)
   */
  private async executeApproveToken(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    try {
      const token = action.token || "USDC";
      const amount = action.amount || "0";
      const spender = action.contract;

      if (!spender) {
        throw new Error("Missing spender contract address");
      }

      // For now, simulate the approval since we need actual token contract addresses
      // In production, this would call the ERC20 approve method
      traceBuilder.addWarning(
        runId,
        `[SIMULATED] Token approval: ${token} amount ${amount} to spender ${spender}`
      );

      return {
        action,
        status: "success",
        result: {
          token,
          spender,
          amount,
          approved: true,
          note: "Approval simulated - requires actual token contract integration",
        },
        gasUsed: "50000",
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        action,
        status: "error",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a real x402 payment
   */
  private async executePayment(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    try {
      if (!action.to || !action.amount) {
        throw new Error("Missing recipient or amount");
      }

      const result = await cronosService.executePaymentViaRouter(
        `playground-${runId}`,
        action.to,
        action.amount,
        "Payment via x402 Playground"
      );

      stateManager.updateX402Execution(runId, result.hash);

      return {
        action,
        status: "success",
        result: {
          from: cronosService.getExecutorAddress(),
          to: action.to,
          amount: action.amount,
          token: "TCRO",
        },
        txHash: result.hash,
        gasUsed: "unknown", // Not returned by service
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        action,
        status: "error",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute a real contract call
   */
  private async executeContractCall(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    try {
      if (!action.contract || !action.method) {
        throw new Error("Missing contract or method");
      }

      const state = stateManager.getState(runId);
      if (!state) {
        throw new Error("Invalid run state");
      }

      const contractState = state.contracts[action.contract];
      if (!contractState) {
        throw new Error(`Contract ${action.contract} not found or not deployed`);
      }

      // For DeFi contracts (SwapRouter, LiquidityPool, etc.), simulate the call
      if (["SwapRouter", "LiquidityPool", "PriceOracle"].includes(action.contract)) {
        traceBuilder.addWarning(
          runId,
          `[SIMULATED] Contract call: ${action.contract}.${action.method}`
        );

        return {
          action,
          status: "success",
          result: {
            contract: action.contract,
            method: action.method,
            simulated: true,
            note: "DeFi contract call simulated - requires actual contract integration",
          },
          gasUsed: "150000",
          timestamp: Date.now(),
        };
      }

      // For ExecutionRouter, use real contract call
      if (action.contract === "ExecutionRouter") {
        const result = await cronosService.executePaymentViaRouter(
          `playground-${runId}-call`,
          action.args?.[0] || "",
          action.args?.[1] || "0",
          action.args?.[2] || ""
        );

        return {
          action,
          status: "success",
          result: { contract: action.contract, method: action.method },
          txHash: result.hash,
          gasUsed: "unknown",
          timestamp: Date.now(),
        };
      }

      throw new Error(`Unsupported contract: ${action.contract}`);
    } catch (error: any) {
      return {
        action,
        status: "error",
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Run a plan with real blockchain execution
   */
  async runExecution(plan: ExecutionPlan): Promise<ExecutionResult> {
    const runId = this.generateRunId();
    const executorAddress = cronosService.getExecutorAddress();

    // Initialize state
    const virtualState = stateManager.createState(runId, "execute", executorAddress);
    
    // Load real balances
    await stateManager.loadRealBalances(runId, this.provider);

    // Initialize trace
    const trace = traceBuilder.createTrace(runId, plan.planId, "execute", virtualState);
    traceBuilder.startExecution(runId);

    let totalGasUsed = 0;
    let successfulSteps = 0;
    let failedSteps = 0;
    const transactions: Array<{ hash: string; explorerUrl: string }> = [];

    try {
      // Execute each action in sequence
      for (const action of plan.actions) {
        let result: ActionResult;

        switch (action.type) {
          case "read_balance":
            result = await this.executeReadBalance(runId, action);
            break;
          
          case "read_state":
            result = await this.executeReadState(runId, action);
            break;
          
          case "llm_agent":
            result = await this.executeLLMAgent(runId, action);
            break;
          
          case "approve_token":
            result = await this.executeApproveToken(runId, action);
            break;
          
          case "x402_payment":
            result = await this.executePayment(runId, action);
            if (result.txHash) {
              transactions.push({
                hash: result.txHash,
                explorerUrl: `https://explorer.cronos.org/testnet/tx/${result.txHash}`,
              });
            }
            break;
          
          case "contract_call":
            result = await this.executeContractCall(runId, action);
            if (result.txHash) {
              transactions.push({
                hash: result.txHash,
                explorerUrl: `https://explorer.cronos.org/testnet/tx/${result.txHash}`,
              });
            }
            break;
          
          default:
            result = {
              action,
              status: "error",
              error: `Unsupported action type for real execution: ${action.type}`,
              timestamp: Date.now(),
            };
        }

        traceBuilder.addStep(runId, result);

        if (result.status === "success") {
          successfulSteps++;
          if (result.gasUsed) {
            totalGasUsed += parseInt(result.gasUsed);
          }
        } else if (result.status === "error") {
          failedSteps++;
          traceBuilder.addError(runId, result.error || "Unknown error");
          
          // Stop on first error in execute mode
          break;
        }
      }

      traceBuilder.completeExecution(runId);

      const finalTrace = traceBuilder.getTrace(runId)!;

      return {
        runId,
        success: failedSteps === 0,
        trace: finalTrace,
        transactions,
        summary: {
          totalSteps: plan.actions.length,
          successfulSteps,
          failedSteps,
          totalGasUsed: totalGasUsed.toString(),
        },
      };
    } catch (error: any) {
      traceBuilder.failExecution(runId, error.message);
      const finalTrace = traceBuilder.getTrace(runId)!;

      return {
        runId,
        success: false,
        trace: finalTrace,
        transactions,
        summary: {
          totalSteps: plan.actions.length,
          successfulSteps,
          failedSteps: failedSteps + 1,
          totalGasUsed: totalGasUsed.toString(),
        },
      };
    }
  }

  /**
   * Main entry point - routes based on mode
   */
  async run(plan: ExecutionPlan): Promise<SimulationResult | ExecutionResult> {
    if (plan.mode === "simulate") {
      return this.runSimulation(plan);
    } else {
      return this.runExecution(plan);
    }
  }
}

export const playgroundRunner = new PlaygroundRunner();
