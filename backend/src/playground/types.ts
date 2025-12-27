/**
 * x402 Agent Playground - Type Definitions
 * 
 * These types define the structured interface between LLMs/agents and the playground.
 */

/**
 * Execution mode: simulate (no real txs) or execute (real blockchain)
 */
export type ExecutionMode = "simulate" | "execute";

/**
 * Action types that agents can request
 */
export type ActionType =
  | "read_balance"
  | "x402_payment"
  | "contract_call"
  | "read_state"
  | "approve_token"
  | "swap"
  | "llm_agent"
  | "condition";

/**
 * Individual action in an execution plan
 */
export interface ExecutionAction {
  type: ActionType;
  description?: string;
  
  // For read_balance
  token?: string;
  address?: string;
  
  // For x402_payment
  amount?: string;
  to?: string;
  
  // For contract_call
  contract?: string;
  method?: string;
  args?: any[];
  value?: string;
  
  // For llm_agent
  prompt?: string;
  context?: string | Record<string, any>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // For condition
  condition?: string;
  variable?: string;
}

/**
 * Complete execution plan submitted by agents
 */
export interface ExecutionPlan {
  mode: ExecutionMode;
  planId?: string;
  description?: string;
  actions: ExecutionAction[];
  context?: Record<string, any>;
}

/**
 * Result of a single action execution
 */
export interface ActionResult {
  action: ExecutionAction;
  status: "success" | "error" | "simulated" | "pending";
  result?: any;
  txHash?: string;
  gasUsed?: string;
  gasEstimate?: string;
  error?: string;
  timestamp: number;
}

/**
 * Virtualized wallet state
 */
export interface VirtualWallet {
  address: string;
  balances: Record<string, string>; // token -> amount
  nonce?: number;
}

/**
 * Virtualized contract state
 */
export interface ContractState {
  address: string;
  name: string;
  isDeployed: boolean;
  abi?: any[];
}

/**
 * Complete virtualized execution state
 */
export interface VirtualState {
  runId: string;
  mode: ExecutionMode;
  wallet: VirtualWallet;
  contracts: Record<string, ContractState>;
  x402: {
    mode: "simulated" | "real";
    lastExecution?: {
      timestamp: number;
      txHash?: string;
    };
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
}

/**
 * Execution trace for observability
 */
export interface ExecutionTrace {
  runId: string;
  planId?: string;
  mode: ExecutionMode;
  status: "pending" | "running" | "completed" | "failed";
  steps: ActionResult[];
  virtualState: VirtualState;
  warnings: string[];
  errors: string[];
  metadata: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
}

/**
 * Simulation result returned to agents
 */
export interface SimulationResult {
  runId: string;
  success: boolean;
  trace: ExecutionTrace;
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    totalGasEstimate: string;
  };
}

/**
 * Real execution result
 */
export interface ExecutionResult {
  runId: string;
  success: boolean;
  trace: ExecutionTrace;
  transactions: Array<{
    hash: string;
    explorerUrl: string;
  }>;
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    totalGasUsed: string;
  };
}

/**
 * Agent-friendly API response
 */
export interface PlaygroundResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  trace?: ExecutionTrace;
  timestamp: number;
}
