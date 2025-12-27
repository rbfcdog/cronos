/**
 * Simulation Engine
 * 
 * Simulates blockchain execution without sending real transactions.
 * Provides gas estimates, balance tracking, and state changes.
 */

import { ExecutionAction, ActionResult, VirtualState } from "./types";
import { stateManager } from "./state";
import { traceBuilder } from "./trace";

export class SimulationEngine {
  /**
   * Simulate reading a balance
   */
  async simulateReadBalance(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const token = action.token || "TCRO";
    const state = stateManager.getState(runId);

    if (!state) {
      return {
        action,
        status: "error",
        error: "Invalid run state",
        timestamp: Date.now(),
      };
    }

    const balance = state.wallet.balances[token] || "0";

    return {
      action,
      status: "simulated",
      result: { token, balance, address: state.wallet.address },
      gasEstimate: "0", // Read operations are free
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate an x402 payment
   */
  async simulatePayment(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const token = action.token || "TCRO";
    const amount = action.amount || "0";
    const to = action.to;

    if (!to) {
      return {
        action,
        status: "error",
        error: "Missing recipient address",
        timestamp: Date.now(),
      };
    }

    // Check if balance is sufficient
    const state = stateManager.getState(runId);
    if (!state) {
      return {
        action,
        status: "error",
        error: "Invalid run state",
        timestamp: Date.now(),
      };
    }

    const currentBalance = parseFloat(state.wallet.balances[token] || "0");
    const paymentAmount = parseFloat(amount);

    if (currentBalance < paymentAmount) {
      traceBuilder.addWarning(
        runId,
        `Insufficient ${token} balance. Have: ${currentBalance}, Need: ${paymentAmount}`
      );
      return {
        action,
        status: "error",
        error: `Insufficient ${token} balance`,
        timestamp: Date.now(),
      };
    }

    // Simulate deduction
    const success = stateManager.deductBalance(runId, token, amount);

    if (!success) {
      return {
        action,
        status: "error",
        error: "Failed to deduct balance",
        timestamp: Date.now(),
      };
    }

    // Estimate gas for x402 payment
    const gasEstimate = "210000"; // Typical for x402 payment

    return {
      action,
      status: "simulated",
      result: {
        from: state.wallet.address,
        to,
        amount,
        token,
        newBalance: state.wallet.balances[token],
      },
      gasEstimate,
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate a contract call
   */
  async simulateContractCall(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const contract = action.contract;
    const method = action.method;
    const args = action.args || [];

    if (!contract || !method) {
      return {
        action,
        status: "error",
        error: "Missing contract or method",
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

    // Check if contract exists
    const contractState = state.contracts[contract];
    if (!contractState || !contractState.isDeployed) {
      traceBuilder.addWarning(runId, `Contract ${contract} not deployed`);
      return {
        action,
        status: "error",
        error: `Contract ${contract} not found or not deployed`,
        timestamp: Date.now(),
      };
    }

    // Estimate gas based on method
    let gasEstimate = "100000"; // Default
    if (method === "executePayment" || method === "execute") {
      gasEstimate = "250000";
    } else if (method.startsWith("approve")) {
      gasEstimate = "50000";
    }

    return {
      action,
      status: "simulated",
      result: {
        contract: contractState.address,
        method,
        args,
        success: true,
      },
      gasEstimate,
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate reading contract state
   */
  async simulateReadState(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const contract = action.contract;

    if (!contract) {
      return {
        action,
        status: "error",
        error: "Missing contract name",
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

    const contractState = state.contracts[contract];
    if (!contractState) {
      return {
        action,
        status: "error",
        error: `Contract ${contract} not found`,
        timestamp: Date.now(),
      };
    }

    return {
      action,
      status: "simulated",
      result: {
        contract,
        address: contractState.address,
        deployed: contractState.isDeployed,
      },
      gasEstimate: "0", // Read operations are free
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate token approval
   */
  async simulateTokenApproval(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const token = action.token || "USDC";
    const amount = action.amount || "0";
    const contract = action.contract;

    if (!contract) {
      return {
        action,
        status: "error",
        error: "Missing spender contract",
        timestamp: Date.now(),
      };
    }

    return {
      action,
      status: "simulated",
      result: {
        token,
        spender: contract,
        amount,
        approved: true,
      },
      gasEstimate: "50000",
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate condition evaluation
   */
  async simulateCondition(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const condition = action.condition;
    const variable = action.variable;

    if (!condition) {
      return {
        action,
        status: "error",
        error: "Missing condition expression",
        timestamp: Date.now(),
      };
    }

    // Get current state for variable resolution
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
      // Parse condition (e.g., "balance > 100" or "step_0.balance > 2.0")
      let evaluatedCondition = condition;
      let resolvedValue: any;

      // If variable is provided, resolve it from state
      if (variable) {
        // Handle step references like "step_0.balance"
        if (variable.startsWith("step_")) {
          const [stepRef, property] = variable.split(".");
          // For simulation, we'll use the current balance
          if (property === "balance") {
            resolvedValue = parseFloat(state.wallet.balances["TCRO"] || "0");
          } else {
            resolvedValue = 0; // Default for unknown properties
          }
        } else {
          resolvedValue = 0; // Default for unknown variables
        }
        
        // Replace variable in condition with resolved value
        evaluatedCondition = condition.replace(/balance|step_\d+\.balance/g, resolvedValue.toString());
      } else {
        // Try to extract variable from condition
        const balanceMatch = condition.match(/balance|step_\d+\.balance/);
        if (balanceMatch) {
          resolvedValue = parseFloat(state.wallet.balances["TCRO"] || "0");
          evaluatedCondition = condition.replace(/balance|step_\d+\.balance/g, resolvedValue.toString());
        }
      }

      // Simple evaluation for common operators
      let result = false;
      const greaterThanMatch = evaluatedCondition.match(/(\d+\.?\d*)\s*>\s*(\d+\.?\d*)/);
      const lessThanMatch = evaluatedCondition.match(/(\d+\.?\d*)\s*<\s*(\d+\.?\d*)/);
      const equalsMatch = evaluatedCondition.match(/(\d+\.?\d*)\s*===?\s*(\d+\.?\d*)/);

      if (greaterThanMatch) {
        const [, left, right] = greaterThanMatch;
        result = parseFloat(left) > parseFloat(right);
      } else if (lessThanMatch) {
        const [, left, right] = lessThanMatch;
        result = parseFloat(left) < parseFloat(right);
      } else if (equalsMatch) {
        const [, left, right] = equalsMatch;
        result = parseFloat(left) === parseFloat(right);
      }

      return {
        action,
        status: "simulated",
        result: {
          condition: condition,
          variable: variable,
          resolvedValue: resolvedValue,
          evaluatedCondition: evaluatedCondition,
          result: result,
          message: result ? "Condition TRUE" : "Condition FALSE",
        },
        gasEstimate: "0",
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        action,
        status: "error",
        error: `Failed to evaluate condition: ${error.message}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Simulate LLM agent decision making
   */
  async simulateLLMAgent(
    runId: string,
    action: ExecutionAction
  ): Promise<ActionResult> {
    const prompt = action.prompt;
    const context = action.context || {};
    const model = action.model || "gpt-4-turbo";
    const agentId = (action as any).agentId || "risk-analyzer"; // Default to risk analyzer

    if (!prompt) {
      return {
        action,
        status: "error",
        error: "Missing prompt for LLM agent",
        timestamp: Date.now(),
      };
    }

    // Get current state for context
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
      // Call our Crypto.com AI Agent SDK integration
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

      // Log the AI interaction
      traceBuilder.addWarning(
        runId,
        `[AI AGENT] Agent: ${agentId}, Model: ${model}, Execution time: ${result.data?.executionTime || 0}ms`
      );

      return {
        action,
        status: "simulated",
        result: {
          agentId,
          response: result.data?.response,
          executionTime: result.data?.executionTime,
          model,
          query: prompt,
          context: state.wallet.balances,
        },
        gasEstimate: "0", // AI runs off-chain
        timestamp: Date.now(),
      };
    } catch (error: any) {
      // Fallback to mock response if agent API fails
      const balance = state.wallet.balances["TCRO"] || "0";
      const balanceNum = parseFloat(balance);
      
      const shouldExecute = balanceNum > 1;
      const recommendedAmount = Math.min(balanceNum * 0.2, 10); // Conservative: 20% max or 10 TCRO
      
      const decision = shouldExecute ? "execute" : "skip";
      const reasoning = shouldExecute 
        ? `Balance: ${balance} TCRO. Recommending ${recommendedAmount.toFixed(2)} TCRO for execution.`
        : `Insufficient balance: ${balance} TCRO.`;

      traceBuilder.addWarning(
        runId,
        `[FALLBACK] AI Agent API unavailable, using mock response. Error: ${error.message}`
      );

      return {
        action,
        status: "simulated",
        result: {
          decision,
          reasoning,
          confidence: 0.85,
          parameters: { amount: recommendedAmount, shouldExecute },
          fallback: true,
          error: error.message,
        },
        gasEstimate: "0",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Main simulation router
   */
  async simulate(runId: string, action: ExecutionAction): Promise<ActionResult> {
    switch (action.type) {
      case "read_balance":
        return this.simulateReadBalance(runId, action);
      
      case "x402_payment":
        return this.simulatePayment(runId, action);
      
      case "contract_call":
        return this.simulateContractCall(runId, action);
      
      case "read_state":
        return this.simulateReadState(runId, action);
      
      case "approve_token":
        return this.simulateTokenApproval(runId, action);
      
      case "condition":
        return this.simulateCondition(runId, action);
      
      case "llm_agent":
        return this.simulateLLMAgent(runId, action);
      
      default:
        return {
          action,
          status: "error",
          error: `Unsupported action type: ${action.type}`,
          timestamp: Date.now(),
        };
    }
  }
}

export const simulationEngine = new SimulationEngine();
