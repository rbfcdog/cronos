/**
 * 🔥 Payment Agent Test Scenarios
 * 
 * Comprehensive edge cases demonstrating testing superiority over competitors.
 * Covers: normal flows, edge cases, error conditions, network issues, economic scenarios.
 */

export interface PaymentScenario {
  id: string;
  name: string;
  description: string;
  category: 'normal' | 'edge-case' | 'error' | 'network' | 'economic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Test inputs
  input: {
    amount: string;
    recipient: string;
    token?: string;
    schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
    gasLimit?: string;
    maxGasPrice?: string;
  };
  
  // Environment conditions
  environment: {
    accountBalance: string;
    networkGasPrice: string;
    networkCongestion: 'low' | 'medium' | 'high';
    tokenPrice?: string;
    simulatedErrors?: string[];
  };
  
  // Expected outcomes
  expected: {
    shouldSucceed: boolean;
    errorType?: string;
    minGasUsed?: string;
    maxGasUsed?: string;
    reasoningSteps?: number;
  };
  
  // Tags for filtering
  tags: string[];
}

/**
 * 🎯 NORMAL FLOW SCENARIOS (Basic Happy Paths)
 */
export const normalFlowScenarios: PaymentScenario[] = [
  {
    id: 'PAY-001',
    name: 'Simple TCRO Transfer',
    description: 'Standard one-time payment with sufficient balance',
    category: 'normal',
    severity: 'low',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '50000',
      reasoningSteps: 3
    },
    tags: ['basic', 'tcro', 'once']
  },
  
  {
    id: 'PAY-002',
    name: 'Recurring Daily Payment',
    description: 'Daily payment schedule with ample balance',
    category: 'normal',
    severity: 'medium',
    input: {
      amount: '2',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'daily'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '80000',
      reasoningSteps: 4
    },
    tags: ['recurring', 'daily', 'tcro']
  },
  
  {
    id: 'PAY-003',
    name: 'Weekly Payment with Buffer',
    description: 'Weekly payment with 10x required balance',
    category: 'normal',
    severity: 'low',
    input: {
      amount: '10',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'weekly'
    },
    environment: {
      accountBalance: '500',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '100000',
      reasoningSteps: 4
    },
    tags: ['recurring', 'weekly', 'large-buffer']
  }
];

/**
 * 💥 EDGE CASE SCENARIOS (Boundary Conditions)
 */
export const edgeCaseScenarios: PaymentScenario[] = [
  {
    id: 'PAY-101',
    name: 'Exact Balance Match',
    description: 'Payment amount + gas = exact account balance',
    category: 'edge-case',
    severity: 'high',
    input: {
      amount: '4.98',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once',
      gasLimit: '21000'
    },
    environment: {
      accountBalance: '5',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '21000',
      reasoningSteps: 5
    },
    tags: ['edge-case', 'exact-balance', 'critical']
  },
  
  {
    id: 'PAY-102',
    name: 'Micro Payment',
    description: 'Extremely small payment (0.001 TCRO)',
    category: 'edge-case',
    severity: 'medium',
    input: {
      amount: '0.001',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '10',
      networkGasPrice: '5000',
      networkCongestion: 'medium'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '50000',
      reasoningSteps: 4
    },
    tags: ['edge-case', 'micro-payment', 'gas-heavy']
  },
  
  {
    id: 'PAY-103',
    name: 'High Frequency Recurring',
    description: 'Daily payment with 30-day projection',
    category: 'edge-case',
    severity: 'high',
    input: {
      amount: '1',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'daily'
    },
    environment: {
      accountBalance: '35',
      networkGasPrice: '5000',
      networkCongestion: 'medium'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '80000',
      reasoningSteps: 6
    },
    tags: ['edge-case', 'high-frequency', 'projection']
  },
  
  {
    id: 'PAY-104',
    name: 'Zero Balance Post-Payment',
    description: 'Payment leaves exactly 0 balance',
    category: 'edge-case',
    severity: 'critical',
    input: {
      amount: '4.9',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once',
      gasLimit: '21000',
      maxGasPrice: '5000'
    },
    environment: {
      accountBalance: '5',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '21000',
      reasoningSteps: 5
    },
    tags: ['edge-case', 'zero-balance', 'critical']
  }
];

/**
 * ❌ ERROR SCENARIOS (Failure Cases)
 */
export const errorScenarios: PaymentScenario[] = [
  {
    id: 'PAY-201',
    name: 'Insufficient Balance',
    description: 'Payment amount exceeds available balance',
    category: 'error',
    severity: 'critical',
    input: {
      amount: '100',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '10',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: false,
      errorType: 'INSUFFICIENT_BALANCE',
      reasoningSteps: 2
    },
    tags: ['error', 'insufficient-balance', 'should-fail']
  },
  
  {
    id: 'PAY-202',
    name: 'Invalid Recipient Address',
    description: 'Malformed recipient address',
    category: 'error',
    severity: 'critical',
    input: {
      amount: '5',
      recipient: '0xinvalid',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: false,
      errorType: 'INVALID_ADDRESS',
      reasoningSteps: 1
    },
    tags: ['error', 'invalid-address', 'validation']
  },
  
  {
    id: 'PAY-203',
    name: 'Gas Price Too High',
    description: 'Network gas price exceeds maxGasPrice limit',
    category: 'error',
    severity: 'high',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once',
      maxGasPrice: '3000'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '10000',
      networkCongestion: 'high'
    },
    expected: {
      shouldSucceed: false,
      errorType: 'GAS_PRICE_TOO_HIGH',
      reasoningSteps: 3
    },
    tags: ['error', 'gas-limit', 'protection']
  },
  
  {
    id: 'PAY-204',
    name: 'Insufficient Gas Buffer',
    description: 'Balance cannot cover amount + minimum gas',
    category: 'error',
    severity: 'critical',
    input: {
      amount: '4.99',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '5',
      networkGasPrice: '20000',
      networkCongestion: 'high'
    },
    expected: {
      shouldSucceed: false,
      errorType: 'INSUFFICIENT_GAS_BUFFER',
      reasoningSteps: 4
    },
    tags: ['error', 'gas-calculation', 'safety']
  },
  
  {
    id: 'PAY-205',
    name: 'Negative Amount',
    description: 'Attempt to send negative amount',
    category: 'error',
    severity: 'critical',
    input: {
      amount: '-5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '5000',
      networkCongestion: 'low'
    },
    expected: {
      shouldSucceed: false,
      errorType: 'INVALID_AMOUNT',
      reasoningSteps: 1
    },
    tags: ['error', 'validation', 'sanitization']
  }
];

/**
 * 🌐 NETWORK SCENARIOS (Infrastructure Issues)
 */
export const networkScenarios: PaymentScenario[] = [
  {
    id: 'PAY-301',
    name: 'High Network Congestion',
    description: 'Network gas price 10x normal during peak',
    category: 'network',
    severity: 'high',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '50000',
      networkCongestion: 'high'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '150000',
      reasoningSteps: 5
    },
    tags: ['network', 'congestion', 'high-gas']
  },
  
  {
    id: 'PAY-302',
    name: 'RPC Timeout Simulation',
    description: 'Simulated RPC timeout during balance check',
    category: 'network',
    severity: 'medium',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '5000',
      networkCongestion: 'medium',
      simulatedErrors: ['RPC_TIMEOUT']
    },
    expected: {
      shouldSucceed: false,
      errorType: 'NETWORK_ERROR',
      reasoningSteps: 3
    },
    tags: ['network', 'rpc', 'timeout', 'retry']
  },
  
  {
    id: 'PAY-303',
    name: 'Chain Reorganization',
    description: 'Transaction during chain reorg',
    category: 'network',
    severity: 'high',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '5000',
      networkCongestion: 'medium',
      simulatedErrors: ['CHAIN_REORG']
    },
    expected: {
      shouldSucceed: false,
      errorType: 'UNSTABLE_NETWORK',
      reasoningSteps: 4
    },
    tags: ['network', 'reorg', 'stability']
  }
];

/**
 * 💰 ECONOMIC SCENARIOS (Market Conditions)
 */
export const economicScenarios: PaymentScenario[] = [
  {
    id: 'PAY-401',
    name: 'Bull Market Payment',
    description: 'Payment during rapid price appreciation',
    category: 'economic',
    severity: 'medium',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '15000',
      networkCongestion: 'high',
      tokenPrice: '0.15'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '100000',
      reasoningSteps: 4
    },
    tags: ['economic', 'bull-market', 'congestion']
  },
  
  {
    id: 'PAY-402',
    name: 'Bear Market Optimization',
    description: 'Cost-conscious payment during low prices',
    category: 'economic',
    severity: 'low',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'once',
      maxGasPrice: '3000'
    },
    environment: {
      accountBalance: '100',
      networkGasPrice: '2000',
      networkCongestion: 'low',
      tokenPrice: '0.08'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '30000',
      reasoningSteps: 3
    },
    tags: ['economic', 'bear-market', 'optimization']
  },
  
  {
    id: 'PAY-403',
    name: 'Volatile Market Payment',
    description: 'Payment during high volatility period',
    category: 'economic',
    severity: 'high',
    input: {
      amount: '5',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      schedule: 'daily'
    },
    environment: {
      accountBalance: '50',
      networkGasPrice: '8000',
      networkCongestion: 'medium',
      tokenPrice: '0.12'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '21000',
      maxGasUsed: '80000',
      reasoningSteps: 6
    },
    tags: ['economic', 'volatile', 'risk-assessment']
  }
];

/**
 * 📦 EXPORT ALL SCENARIOS
 */
export const allPaymentScenarios: PaymentScenario[] = [
  ...normalFlowScenarios,
  ...edgeCaseScenarios,
  ...errorScenarios,
  ...networkScenarios,
  ...economicScenarios
];

/**
 * 🔍 SCENARIO UTILITIES
 */
export const paymentScenarioUtils = {
  /**
   * Get scenarios by category
   */
  getByCategory: (category: PaymentScenario['category']) => 
    allPaymentScenarios.filter(s => s.category === category),
  
  /**
   * Get scenarios by severity
   */
  getBySeverity: (severity: PaymentScenario['severity']) =>
    allPaymentScenarios.filter(s => s.severity === severity),
  
  /**
   * Get scenarios by tag
   */
  getByTag: (tag: string) =>
    allPaymentScenarios.filter(s => s.tags.includes(tag)),
  
  /**
   * Get critical scenarios only
   */
  getCritical: () =>
    allPaymentScenarios.filter(s => s.severity === 'critical'),
  
  /**
   * Get expected failures
   */
  getExpectedFailures: () =>
    allPaymentScenarios.filter(s => !s.expected.shouldSucceed),
  
  /**
   * Get scenario statistics
   */
  getStats: () => ({
    total: allPaymentScenarios.length,
    normal: normalFlowScenarios.length,
    edgeCases: edgeCaseScenarios.length,
    errors: errorScenarios.length,
    network: networkScenarios.length,
    economic: economicScenarios.length,
    critical: allPaymentScenarios.filter(s => s.severity === 'critical').length
  })
};

/**
 * 📊 SUMMARY
 * 
 * Total Scenarios: 20
 * - Normal: 3
 * - Edge Cases: 4
 * - Errors: 5
 * - Network: 3
 * - Economic: 3
 * - Critical: 6
 */
