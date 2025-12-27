// Node Registry System for x402 Agent Playground
// This defines all available action nodes with their inputs, outputs, and documentation

import { LucideIcon, Database, Zap, Code2, SlidersHorizontal, Eye, CheckCircle, Activity, Brain } from "lucide-react";

export interface NodeInput {
  name: string;
  type: "string" | "number" | "address" | "boolean" | "json" | "reference";
  required: boolean;
  description: string;
  placeholder?: string;
  default?: any;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface NodeOutput {
  name: string;
  type: "string" | "number" | "address" | "boolean" | "json" | "object";
  description: string;
  example?: any;
}

export interface NodeDefinition {
  id: string;
  name: string;
  category: "query" | "transaction" | "logic" | "state";
  description: string;
  longDescription: string;
  icon: LucideIcon;
  color: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  examples: {
    title: string;
    description: string;
    config: Record<string, any>;
  }[];
  tags: string[];
  version: string;
  author?: string;
  gasEstimate?: string;
}

export const NODE_REGISTRY: Record<string, NodeDefinition> = {
  read_balance: {
    id: "read_balance",
    name: "Read Balance",
    category: "query",
    description: "Reads the token balance of a wallet address",
    longDescription: `
Queries the blockchain to retrieve the balance of a specific token (or native CRO) 
for a given wallet address. This is a read-only operation that doesn't consume gas.

**Use Cases:**
- Check wallet balance before payment
- Validate sufficient funds
- Monitor account balances
- Conditional logic based on balance
    `.trim(),
    icon: Database,
    color: "from-blue-500 to-blue-600",
    inputs: [
      {
        name: "address",
        type: "address",
        required: false,
        description: "Wallet address to check (defaults to connected wallet)",
        placeholder: "0x1234...5678",
        validation: {
          pattern: /^0x[a-fA-F0-9]{40}$/,
        },
      },
      {
        name: "token",
        type: "address",
        required: false,
        description: "Token contract address (leave empty for native CRO)",
        placeholder: "0xabcd...ef00 or leave empty",
      },
    ],
    outputs: [
      {
        name: "balance",
        type: "string",
        description: "Token balance in human-readable format",
        example: "100.5",
      },
      {
        name: "balanceWei",
        type: "string",
        description: "Raw balance in smallest unit (wei)",
        example: "100500000000000000000",
      },
      {
        name: "symbol",
        type: "string",
        description: "Token symbol",
        example: "CRO",
      },
      {
        name: "decimals",
        type: "number",
        description: "Token decimals",
        example: 18,
      },
    ],
    examples: [
      {
        title: "Check CRO Balance",
        description: "Read native CRO balance of connected wallet",
        config: {},
      },
      {
        title: "Check USDC Balance",
        description: "Read USDC token balance",
        config: {
          token: "0x...USDC_ADDRESS",
        },
      },
    ],
    tags: ["query", "balance", "read", "wallet"],
    version: "1.0.0",
    gasEstimate: "~0 (read-only)",
  },

  x402_payment: {
    id: "x402_payment",
    name: "x402 Payment",
    category: "transaction",
    description: "Sends tokens with embedded metadata using x402 protocol",
    longDescription: `
Executes a payment transaction on Cronos using the x402 protocol, which embeds 
structured metadata directly on-chain. This enables AI agents to make verifiable 
payments with contextual information.

**Key Features:**
- Metadata stored on-chain
- Verifiable payment context
- AI-readable transaction history
- Supports CRO and ERC20 tokens

**Use Cases:**
- AI agent payments with context
- Automated payouts with reasoning
- Conditional transfers with metadata
    `.trim(),
    icon: Zap,
    color: "from-purple-500 to-purple-600",
    inputs: [
      {
        name: "to",
        type: "address",
        required: true,
        description: "Recipient wallet address",
        placeholder: "0x1234...5678",
        validation: {
          pattern: /^0x[a-fA-F0-9]{40}$/,
        },
      },
      {
        name: "amount",
        type: "string",
        required: true,
        description: "Amount to send in token units",
        placeholder: "10.5",
        validation: {
          pattern: /^\d+(\.\d+)?$/,
          min: 0,
        },
      },
      {
        name: "token",
        type: "address",
        required: false,
        description: "Token address (leave empty for CRO)",
        placeholder: "0xabcd...ef00",
        default: "CRO",
      },
      {
        name: "metadata",
        type: "json",
        required: false,
        description: "Custom metadata to embed (JSON object)",
        placeholder: '{"purpose": "payment", "ref": "12345"}',
      },
    ],
    outputs: [
      {
        name: "txHash",
        type: "string",
        description: "Transaction hash on Cronos",
        example: "0xabc123...",
      },
      {
        name: "blockNumber",
        type: "number",
        description: "Block number where tx was included",
        example: 12345678,
      },
      {
        name: "gasUsed",
        type: "string",
        description: "Actual gas consumed",
        example: "21000",
      },
      {
        name: "status",
        type: "string",
        description: "Transaction status",
        example: "success",
      },
    ],
    examples: [
      {
        title: "Simple CRO Payment",
        description: "Send 10 CRO to deployer address",
        config: {
          to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
          amount: "10",
        },
      },
      {
        title: "Payment with Metadata",
        description: "Send payment with embedded context",
        config: {
          to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
          amount: "5",
          metadata: {
            purpose: "subscription",
            planId: "pro-monthly",
            agentId: "agent-001",
          },
        },
      },
    ],
    tags: ["payment", "transaction", "x402", "metadata"],
    version: "1.0.0",
    gasEstimate: "~50,000",
  },

  contract_call: {
    id: "contract_call",
    name: "Contract Call",
    category: "transaction",
    description: "Executes a function on a smart contract",
    longDescription: `
Invokes a method on a deployed smart contract on Cronos. Supports both read-only 
calls (view/pure) and state-changing transactions (payable/non-payable).

**Capabilities:**
- Call any public contract function
- Pass arguments dynamically
- Handle return values
- Support for payable functions

**Use Cases:**
- Execute contract logic
- Trigger contract events
- Update contract state
- Query contract data
    `.trim(),
    icon: Code2,
    color: "from-green-500 to-green-600",
    inputs: [
      {
        name: "contract",
        type: "address",
        required: true,
        description: "Contract address to interact with",
        placeholder: "0xcontract...address",
        validation: {
          pattern: /^0x[a-fA-F0-9]{40}$/,
        },
      },
      {
        name: "method",
        type: "string",
        required: true,
        description: "Function name to call",
        placeholder: "transfer",
      },
      {
        name: "args",
        type: "json",
        required: false,
        description: "Function arguments as JSON array",
        placeholder: '["0x123...", "1000000000000000000"]',
      },
      {
        name: "value",
        type: "string",
        required: false,
        description: "CRO to send with call (for payable functions)",
        placeholder: "0",
        default: "0",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "object",
        description: "Return value from contract function",
        example: { success: true, value: "42" },
      },
      {
        name: "txHash",
        type: "string",
        description: "Transaction hash (for state-changing calls)",
        example: "0xdef456...",
      },
      {
        name: "gasUsed",
        type: "string",
        description: "Gas consumed by the call",
        example: "65000",
      },
    ],
    examples: [
      {
        title: "ERC20 Transfer",
        description: "Transfer tokens using contract call",
        config: {
          contract: "0x...TOKEN_ADDRESS",
          method: "transfer",
          args: ["0x...RECIPIENT", "1000000000000000000"],
        },
      },
      {
        title: "Query Contract State",
        description: "Read data from contract",
        config: {
          contract: "0x...CONTRACT_ADDRESS",
          method: "balanceOf",
          args: ["0x...ADDRESS"],
        },
      },
    ],
    tags: ["contract", "transaction", "call", "smart-contract"],
    version: "1.0.0",
    gasEstimate: "~65,000 (varies by function)",
  },

  read_state: {
    id: "read_state",
    name: "Read State",
    category: "query",
    description: "Reads current execution state and previous step outputs",
    longDescription: `
Accesses the current workflow execution state, including outputs from previous steps. 
This enables dynamic workflows where later steps depend on earlier results.

**Features:**
- Access previous step outputs
- Read execution context
- Reference computed values
- Build dynamic workflows

**Use Cases:**
- Use balance from previous step
- Chain multiple operations
- Conditional logic based on results
- Data transformation pipelines
    `.trim(),
    icon: Eye,
    color: "from-cyan-500 to-cyan-600",
    inputs: [
      {
        name: "key",
        type: "string",
        required: true,
        description: "State key to read (e.g., 'step_0.balance')",
        placeholder: "step_0.balance",
      },
      {
        name: "default",
        type: "string",
        required: false,
        description: "Default value if key not found",
        placeholder: "0",
      },
    ],
    outputs: [
      {
        name: "value",
        type: "object",
        description: "Retrieved state value",
        example: "100.5",
      },
      {
        name: "found",
        type: "boolean",
        description: "Whether key was found",
        example: true,
      },
    ],
    examples: [
      {
        title: "Read Previous Balance",
        description: "Get balance from previous read_balance step",
        config: {
          key: "step_0.balance",
        },
      },
      {
        title: "Read with Fallback",
        description: "Provide default if value missing",
        config: {
          key: "step_1.result",
          default: "0",
        },
      },
    ],
    tags: ["query", "state", "reference", "data"],
    version: "1.0.0",
    gasEstimate: "~0 (read-only)",
  },

  condition: {
    id: "condition",
    name: "Condition",
    category: "logic",
    description: "Conditional branching based on values",
    longDescription: `
Evaluates a condition and routes execution flow accordingly. Supports comparison 
operators and logical expressions for building complex conditional workflows.

**Operators:**
- Comparison: ==, !=, >, <, >=, <=
- Logical: &&, ||, !
- Type checks: typeof, exists

**Use Cases:**
- Check balance before payment
- Validate transaction results
- Implement approval workflows
- Error handling
    `.trim(),
    icon: SlidersHorizontal,
    color: "from-yellow-500 to-yellow-600",
    inputs: [
      {
        name: "condition",
        type: "string",
        required: true,
        description: "Expression to evaluate",
        placeholder: "step_0.balance > 10",
      },
      {
        name: "onTrue",
        type: "reference",
        required: false,
        description: "Action to execute if true",
        placeholder: "next_step_id",
      },
      {
        name: "onFalse",
        type: "reference",
        required: false,
        description: "Action to execute if false",
        placeholder: "alternate_step_id",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "boolean",
        description: "Condition evaluation result",
        example: true,
      },
      {
        name: "branch",
        type: "string",
        description: "Which branch was taken",
        example: "true",
      },
    ],
    examples: [
      {
        title: "Balance Check",
        description: "Verify sufficient balance",
        config: {
          condition: "step_0.balance >= 100",
        },
      },
      {
        title: "Success Validation",
        description: "Check if transaction succeeded",
        config: {
          condition: "step_1.status == 'success'",
        },
      },
    ],
    tags: ["logic", "condition", "branch", "control-flow"],
    version: "1.0.0",
    gasEstimate: "~0 (computation only)",
  },

  approve_token: {
    id: "approve_token",
    name: "Approve Token",
    category: "transaction",
    description: "Approves token spending for a contract",
    longDescription: `
Grants approval for a smart contract to spend tokens on behalf of the caller. 
Required before many DeFi operations like swaps, deposits, or transfers.

**Important:**
- Required for ERC20 interactions
- Sets spending allowance
- Can be revoked by setting to 0
- Check existing allowance first

**Use Cases:**
- Enable token swaps
- Approve DEX contracts
- Grant lending protocol access
- Setup automated payments
    `.trim(),
    icon: CheckCircle,
    color: "from-pink-500 to-pink-600",
    inputs: [
      {
        name: "token",
        type: "address",
        required: true,
        description: "Token contract to approve",
        placeholder: "0x...TOKEN_ADDRESS",
        validation: {
          pattern: /^0x[a-fA-F0-9]{40}$/,
        },
      },
      {
        name: "spender",
        type: "address",
        required: true,
        description: "Contract address to grant approval to",
        placeholder: "0x...SPENDER_ADDRESS",
        validation: {
          pattern: /^0x[a-fA-F0-9]{40}$/,
        },
      },
      {
        name: "amount",
        type: "string",
        required: true,
        description: "Amount to approve (use 'max' for unlimited)",
        placeholder: "1000 or max",
      },
    ],
    outputs: [
      {
        name: "txHash",
        type: "string",
        description: "Approval transaction hash",
        example: "0xghi789...",
      },
      {
        name: "allowance",
        type: "string",
        description: "New allowance amount",
        example: "1000000000000000000000",
      },
    ],
    examples: [
      {
        title: "Approve DEX",
        description: "Allow DEX to spend tokens",
        config: {
          token: "0x...USDC_ADDRESS",
          spender: "0x...DEX_ADDRESS",
          amount: "max",
        },
      },
      {
        title: "Limited Approval",
        description: "Approve specific amount",
        config: {
          token: "0x...TOKEN_ADDRESS",
          spender: "0x...CONTRACT_ADDRESS",
          amount: "100",
        },
      },
    ],
    tags: ["token", "approval", "erc20", "permission"],
    version: "1.0.0",
    gasEstimate: "~45,000",
  },

  llm_agent: {
    id: "llm_agent",
    name: "AI Agent (Crypto.com SDK)",
    category: "logic",
    description: "Crypto.com AI Agent that analyzes data and makes intelligent decisions",
    longDescription: `
Uses Crypto.com AI Agent SDK to analyze workflow data and make intelligent decisions.
The agent can interpret context, evaluate conditions, generate responses, and decide
on next actions based on blockchain state and previous step outputs.

**Powered by Crypto.com AI Agent SDK**
- Integrated with OpenAI GPT-4 Turbo
- Blockchain-aware context understanding
- Gas estimation and optimization
- Real-time Cronos network analysis

**Pre-configured Agents:**
- **risk-analyzer**: Analyzes transaction risks and security
- **defi-agent**: Optimizes DeFi swaps and liquidity
- **payment-agent**: Makes intelligent payment decisions

**Use Cases:**
- Dynamic amount calculation based on market conditions
- Risk assessment before executing transactions
- Natural language condition evaluation
- Multi-factor decision making
- Context-aware workflow routing
    `.trim(),
    icon: Brain,
    color: "from-indigo-500 to-purple-600",
    inputs: [
      {
        name: "agentId",
        type: "string",
        required: false,
        description: "Crypto.com AI Agent to use (risk-analyzer, defi-agent, payment-agent)",
        placeholder: "risk-analyzer",
        default: "risk-analyzer",
        validation: {
          options: ["risk-analyzer", "defi-agent", "payment-agent"],
        },
      },
      {
        name: "prompt",
        type: "string",
        required: true,
        description: "Instruction for the LLM agent",
        placeholder: "Analyze the balance and decide if we should execute the payment",
      },
      {
        name: "context",
        type: "json",
        required: false,
        description: "Additional context data (JSON object with previous step results)",
        placeholder: '{"balance": "step_0.balance", "threshold": 5}',
      },
      {
        name: "model",
        type: "string",
        required: false,
        description: "LLM model to use (default: gpt-4)",
        placeholder: "gpt-4, gpt-3.5-turbo, claude-3-opus",
        default: "gpt-4",
      },
      {
        name: "temperature",
        type: "number",
        required: false,
        description: "Creativity level (0.0 = deterministic, 1.0 = creative)",
        placeholder: "0.7",
        default: 0.7,
        validation: {
          min: 0,
          max: 1,
        },
      },
      {
        name: "maxTokens",
        type: "number",
        required: false,
        description: "Maximum response length",
        placeholder: "500",
        default: 500,
        validation: {
          min: 1,
          max: 4000,
        },
      },
    ],
    outputs: [
      {
        name: "decision",
        type: "string",
        description: "Agent's decision or recommendation",
        example: "execute",
      },
      {
        name: "reasoning",
        type: "string",
        description: "Explanation of the decision",
        example: "Balance of 10 TCRO is above threshold of 5, safe to proceed",
      },
      {
        name: "confidence",
        type: "number",
        description: "Confidence score (0-1)",
        example: 0.95,
      },
      {
        name: "parameters",
        type: "json",
        description: "Generated parameters for next actions",
        example: { amount: "2.5", shouldExecute: true },
      },
      {
        name: "raw_response",
        type: "string",
        description: "Full LLM response",
        example: "Based on analysis...",
      },
    ],
    examples: [
      {
        title: "Risk Analysis with Crypto.com Agent",
        description: "Use risk-analyzer agent to evaluate transaction safety",
        config: {
          agentId: "risk-analyzer",
          prompt: "Analyze the risk of sending 2 TCRO from this wallet. Consider balance, gas costs, and security best practices.",
          context: '{"balance": "step_0.balance", "amount": 2}',
        },
      },
      {
        title: "DeFi Swap Optimization",
        description: "Use defi-agent to find best swap route",
        config: {
          agentId: "defi-agent",
          prompt: "What's the best way to swap 10 CRO to USDC on Cronos? Consider gas costs, slippage, and DEX liquidity.",
          context: '{"balance": "step_0.balance", "tokenIn": "CRO", "tokenOut": "USDC"}',
        },
      },
      {
        title: "Payment Decision",
        description: "Use payment-agent for intelligent payment decisions",
        config: {
          agentId: "payment-agent",
          prompt: "Should I execute this x402 payment? Consider the current balance, gas costs, and network congestion.",
          context: '{"balance": "step_0.balance", "recipient": "step_1.address", "amount": "step_1.amount"}',
        },
      },
      {
        title: "Custom AI Query",
        description: "Ask the AI agent any blockchain-related question",
        config: {
          agentId: "risk-analyzer",
          prompt: "What are the current gas prices on Cronos testnet? Should I execute now or wait?",
          context: '{}',
        },
      },
    ],
    tags: ["ai", "llm", "agent", "decision", "analysis", "crypto.com", "sdk", "blockchain"],
    version: "2.0.0",
    author: "x402 Team (Crypto.com AI Agent SDK)",
    gasEstimate: "~0 (off-chain computation)",
  },
};

// Helper to get all nodes by category
export function getNodesByCategory(category: NodeDefinition["category"]): NodeDefinition[] {
  return Object.values(NODE_REGISTRY).filter((node) => node.category === category);
}

// Helper to get node definition
export function getNodeDefinition(id: string): NodeDefinition | undefined {
  return NODE_REGISTRY[id];
}

// Helper to validate inputs
export function validateNodeInputs(
  nodeId: string,
  inputs: Record<string, any>
): { valid: boolean; errors: string[] } {
  const def = getNodeDefinition(nodeId);
  if (!def) return { valid: false, errors: ["Unknown node type"] };

  const errors: string[] = [];

  def.inputs.forEach((input) => {
    const value = inputs[input.name];

    // Check required
    if (input.required && (value === undefined || value === "")) {
      errors.push(`${input.name} is required`);
    }

    // Validate pattern
    if (value && input.validation?.pattern && !input.validation.pattern.test(String(value))) {
      errors.push(`${input.name} format is invalid`);
    }

    // Validate range
    if (value !== undefined && input.validation?.min !== undefined && Number(value) < input.validation.min) {
      errors.push(`${input.name} must be >= ${input.validation.min}`);
    }

    if (value !== undefined && input.validation?.max !== undefined && Number(value) > input.validation.max) {
      errors.push(`${input.name} must be <= ${input.validation.max}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
