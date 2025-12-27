export type ActionType =
  | "read_balance"
  | "x402_payment"
  | "contract_call"
  | "read_state"
  | "approve_token"
  | "condition";

export interface BlockType {
  id: string;
  type: ActionType;
  data: Record<string, any>;
}

export interface ExecutionAction {
  type: ActionType;
  token?: string;
  to?: string;
  amount?: string;
  contract?: string;
  method?: string;
  args?: any[];
  description?: string;
  condition?: string; // For conditional execution
  variable?: string; // For referencing previous step results
}

export interface ExecutionPlan {
  mode: "simulate" | "execute";
  planId: string;
  actions: ExecutionAction[];
  context?: Record<string, any>;
  description?: string;
}

export interface TraceStep {
  action: ExecutionAction;
  status: "success" | "error" | "simulated" | "pending";
  result?: any;
  txHash?: string;
  gasUsed?: string | number;
  gasEstimate?: string | number;
  timestamp: number;
  error?: string;
}

export interface ExecutionTrace {
  runId: string;
  planId: string;
  mode: "simulate" | "execute";
  steps: TraceStep[];
  virtualState?: {
    wallet: Record<string, string>;
    contracts: Record<string, any>;
    x402: Record<string, any>;
  };
  warnings: string[];
  errors: string[];
  metadata?: {
    executionTime?: string;
    totalGas?: string;
  };
}

export interface WalletBalance {
  token: string;
  balance: string;
  symbol: string;
}

export interface UnifiedState {
  wallet: {
    address: string;
    balances: WalletBalance[];
  };
  contracts: {
    name: string;
    address: string;
    status: "deployed" | "not-deployed" | "reachable" | "unreachable";
  }[];
  x402: {
    executions: number;
    lastExecution?: string;
  };
}
