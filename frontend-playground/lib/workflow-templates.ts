/**
 * Workflow Templates for High-Value Agents
 * 
 * Pre-built workflows showcasing:
 * - Recurring Payment Agent
 * - Portfolio Rebalancing Agent
 * - Treasury Management Agent
 * 
 * ⚠️ IMPORTANT: ALL addresses MUST come from .env file:
 * - DEPLOYER_ADDRESS: 0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7
 * - EXECUTOR_ADDRESS: 0x36aE091C6264Cb30b2353806EEf2F969Dc2893f8
 * 
 * DO NOT use any other addresses - they will fail validation!
 */

import { ExecutionPlan, ExecutionAction } from "./types";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "payments" | "defi" | "treasury" | "demo";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  tags: string[];
  plan: ExecutionPlan;
}

// ==================== RECURRING PAYMENT AGENT ====================

export const recurringPaymentSimple: WorkflowTemplate = {
  id: "recurring-payment-simple",
  name: "💰 Monthly Salary Payment",
  description: "Simple monthly salary payment with balance checks and verification. Perfect x402 showcase.",
  category: "payments",
  difficulty: "beginner",
  estimatedTime: "30 seconds",
  tags: ["x402", "payments", "subscription", "recurring"],
  plan: {
    mode: "simulate",
    planId: "recurring-payment-demo-1",
    description: "Pay monthly salary with automatic balance verification",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check TCRO balance before payment",
      },
      {
        type: "x402_payment",
        to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
        amount: "5",
        token: "TCRO",
        description: "Pay 5 TCRO salary to Alice",
      },
    ],
    context: {
      agentType: "RecurringPaymentAgent",
      paymentFrequency: "monthly",
      retryEnabled: true,
      maxRetries: 3,
    },
  },
};

export const recurringPaymentMulti: WorkflowTemplate = {
  id: "recurring-payment-multi",
  name: "💰 Multi-Payment Payroll",
  description: "Pay 3 employees with TCRO. Demonstrates batch payments.",
  category: "payments",
  difficulty: "intermediate",
  estimatedTime: "30 seconds",
  tags: ["x402", "payroll", "batch", "tcro"],
  plan: {
    mode: "simulate",
    planId: "recurring-payment-demo-2",
    description: "Execute payroll for 3 employees",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check TCRO balance",
      },
      {
        type: "x402_payment",
        to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
        amount: "5",
        token: "TCRO",
        description: "Salary: Alice (5 TCRO)",
      },
      {
        type: "x402_payment",
        to: "0x36aE091C6264Cb30b2353806EEf2F969Dc2893f8",
        amount: "3",
        token: "TCRO",
        description: "Salary: Bob (3 TCRO)",
      },
      {
        type: "x402_payment",
        to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
        amount: "4",
        token: "TCRO",
        description: "Salary: Charlie (4 TCRO)",
      },
    ],
    context: {
      agentType: "RecurringPaymentAgent",
      totalPayments: 3,
      totalTCRO: 12,
    },
  },
};

// ==================== PORTFOLIO REBALANCING AGENT ====================

export const portfolioRebalanceBasic: WorkflowTemplate = {
  id: "portfolio-rebalance-basic",
  name: "📊 DeFi Portfolio Rebalancer",
  description: "Check portfolio balances and rebalance on VVS Finance. Demonstrates DeFi integration.",
  category: "defi",
  difficulty: "intermediate",
  estimatedTime: "2 minutes",
  tags: ["defi", "vvs", "rebalancing", "portfolio"],
  plan: {
    mode: "simulate",
    planId: "portfolio-rebalance-demo-1",
    description: "Rebalance portfolio across VVS Finance",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check CRO balance",
      },
      {
        type: "read_balance",
        token: "USDC",
        description: "Check USDC balance",
      },
      {
        type: "read_state",
        contract: "SwapRouter",
        description: "Verify VVS Router deployed",
      },
      {
        type: "contract_call",
        contract: "SwapRouter",
        method: "getAmountsOut",
        args: ["100", ["TCRO", "USDC"]],
        description: "Get swap quote for 100 CRO",
      },
    ],
    context: {
      agentType: "PortfolioRebalancingAgent",
      targetAllocations: { CRO: 50, USDC: 30, VVS: 20 },
      rebalanceThreshold: 5,
      maxSlippage: 1.0,
    },
  },
};

export const portfolioRebalanceAdvanced: WorkflowTemplate = {
  id: "portfolio-rebalance-advanced",
  name: "📊 Portfolio Balance Checker",
  description: "Check balances across multiple tokens and read DeFi contract state.",
  category: "defi",
  difficulty: "intermediate",
  estimatedTime: "30 seconds",
  tags: ["defi", "balance", "tcro"],
  plan: {
    mode: "simulate",
    planId: "portfolio-rebalance-demo-2",
    description: "Check portfolio balances",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check TCRO balance",
      },
      {
        type: "read_balance",
        token: "USDC",
        description: "Check USDC balance",
      },
      {
        type: "read_state",
        contract: "SwapRouter",
        description: "Check VVS Router status",
      },
    ],
    context: {
      agentType: "PortfolioRebalancingAgent",
      balanceCheck: true,
    },
  },
};

// ==================== TREASURY MANAGEMENT AGENT ====================

export const treasuryBasic: WorkflowTemplate = {
  id: "treasury-basic",
  name: "🏦 Treasury Balance Check",
  description: "Check treasury balances and execute one contributor payment.",
  category: "treasury",
  difficulty: "beginner",
  estimatedTime: "30 seconds",
  tags: ["dao", "treasury", "tcro"],
  plan: {
    mode: "simulate",
    planId: "treasury-demo-1",
    description: "Check treasury and execute payment",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Check main treasury TCRO",
      },
      {
        type: "x402_payment",
        to: "0x36aE091C6264Cb30b2353806EEf2F969Dc2893f8",
        amount: "5",
        token: "TCRO",
        description: "Contributor payment (5 TCRO)",
      },
    ],
    context: {
      agentType: "TreasuryManagementAgent",
      paymentsExecuted: 1,
    },
  },
};

export const treasuryAdvanced: WorkflowTemplate = {
  id: "treasury-advanced",
  name: "🏦 Multi-Token Treasury Check",
  description: "Check balances across multiple tokens and read contract state.",
  category: "treasury",
  difficulty: "intermediate",
  estimatedTime: "30 seconds",
  tags: ["dao", "treasury", "multi-token"],
  plan: {
    mode: "simulate",
    planId: "treasury-demo-2",
    description: "Multi-token treasury overview",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "Main wallet TCRO",
      },
      {
        type: "read_balance",
        token: "USDC",
        description: "Main wallet USDC",
      },
      {
        type: "read_state",
        contract: "TectonicLending",
        description: "Check lending protocol status",
      },
    ],
    context: {
      agentType: "TreasuryManagementAgent",
      multiToken: true,
    },
  },
};

// ==================== DEMO: MULTI-AGENT ORCHESTRATION ====================

export const multiAgentOrchestration: WorkflowTemplate = {
  id: "multi-agent-orchestration",
  name: "🤖 Multi-Agent Demo",
  description: "Demonstrate multiple agent types checking balances and reading contract states.",
  category: "demo",
  difficulty: "intermediate",
  estimatedTime: "45 seconds",
  tags: ["multi-agent", "demo", "tcro"],
  plan: {
    mode: "simulate",
    planId: "multi-agent-demo",
    description: "Multiple agents working together",
    actions: [
      {
        type: "read_balance",
        token: "TCRO",
        description: "[Treasury] Check main treasury",
      },
      {
        type: "read_balance",
        token: "USDC",
        description: "[Portfolio] Check USDC holdings",
      },
      {
        type: "read_state",
        contract: "SwapRouter",
        description: "[Portfolio] Verify VVS Router",
      },
      {
        type: "read_state",
        contract: "TectonicLending",
        description: "[Treasury] Check lending protocol",
      },
    ],
    context: {
      agentTypes: ["TreasuryManagementAgent", "PortfolioRebalancingAgent", "RecurringPaymentAgent"],
      orchestration: true,
      totalActions: 4,
    },
  },
};

// ==================== EXPORT ALL TEMPLATES ====================

export const ALL_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Recurring Payment Agent (2 templates)
  recurringPaymentSimple,
  recurringPaymentMulti,
  
  // Portfolio Rebalancing Agent (2 templates)
  portfolioRebalanceBasic,
  portfolioRebalanceAdvanced,
  
  // Treasury Management Agent (2 templates)
  treasuryBasic,
  treasuryAdvanced,
  
  // Multi-Agent Orchestration (1 template)
  multiAgentOrchestration,
];

export const TEMPLATES_BY_CATEGORY = {
  payments: [recurringPaymentSimple, recurringPaymentMulti],
  defi: [portfolioRebalanceBasic, portfolioRebalanceAdvanced],
  treasury: [treasuryBasic, treasuryAdvanced],
  demo: [multiAgentOrchestration],
};

export const TEMPLATES_BY_DIFFICULTY = {
  beginner: [recurringPaymentSimple, treasuryBasic],
  intermediate: [recurringPaymentMulti, portfolioRebalanceBasic, portfolioRebalanceAdvanced, treasuryAdvanced, multiAgentOrchestration],
  advanced: [],
};
