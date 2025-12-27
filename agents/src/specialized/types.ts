/**
 * Agent Type Definitions
 * Copied from backend/src/playground/types.ts for agent development
 */

export type ExecutionMode = "simulate" | "execute";

export type ActionType =
  | "read_balance"
  | "x402_payment"
  | "contract_call"
  | "read_state"
  | "approve_token"
  | "swap"
  | "llm_agent"
  | "condition";

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

export interface ExecutionPlan {
  mode: ExecutionMode;
  planId?: string;
  description?: string;
  actions: ExecutionAction[];
  context?: Record<string, any>;
}

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

export interface VirtualState {
  wallet: {
    address: string;
    balances: Record<string, string>;
  };
  contracts: Record<string, {
    address: string;
    isDeployed: boolean;
  }>;
}
