/**
 * 🔥 DeFi Agent Test Scenarios
 * 
 * Comprehensive scenarios for portfolio rebalancing, swaps, and liquidity management.
 * Demonstrates advanced testing capabilities for decentralized finance operations.
 */

export interface DeFiScenario {
  id: string;
  name: string;
  description: string;
  category: 'rebalancing' | 'swap' | 'liquidity' | 'stake' | 'yield';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Test inputs
  input: {
    action: 'rebalance' | 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'unstake';
    portfolio?: {
      token: string;
      currentAllocation: number; // percentage
      targetAllocation: number;  // percentage
      balance: string;
    }[];
    swap?: {
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
      minAmountOut?: string;
      slippage?: number; // percentage
    };
    slippageTolerance?: number;
    deadline?: number;
  };
  
  // Environment conditions
  environment: {
    portfolioValue: string;
    availableLiquidity: {
      [pair: string]: string;
    };
    prices: {
      [token: string]: string;
    };
    apr?: {
      [pool: string]: number;
    };
    volatility: 'low' | 'medium' | 'high' | 'extreme';
    simulatedEvents?: string[];
  };
  
  // Expected outcomes
  expected: {
    shouldSucceed: boolean;
    errorType?: string;
    minGasUsed?: string;
    maxGasUsed?: string;
    reasoningSteps?: number;
    rebalanceCount?: number;
    finalAllocation?: { [token: string]: number };
  };
  
  tags: string[];
}

/**
 * 🎯 PORTFOLIO REBALANCING SCENARIOS
 */
export const rebalancingScenarios: DeFiScenario[] = [
  {
    id: 'DEFI-001',
    name: 'Simple Two-Token Rebalancing',
    description: 'Rebalance 60/40 TCRO/USDC portfolio',
    category: 'rebalancing',
    severity: 'medium',
    input: {
      action: 'rebalance',
      portfolio: [
        { token: 'TCRO', currentAllocation: 70, targetAllocation: 60, balance: '350' },
        { token: 'USDC', currentAllocation: 30, targetAllocation: 40, balance: '150' }
      ],
      slippageTolerance: 1
    },
    environment: {
      portfolioValue: '500',
      availableLiquidity: {
        'TCRO/USDC': '1000000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00'
      },
      volatility: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '150000',
      maxGasUsed: '300000',
      reasoningSteps: 5,
      rebalanceCount: 1,
      finalAllocation: {
        'TCRO': 60,
        'USDC': 40
      }
    },
    tags: ['rebalancing', 'two-token', 'low-risk']
  },
  
  {
    id: 'DEFI-002',
    name: 'Multi-Asset Portfolio Rebalance',
    description: 'Rebalance 5-asset portfolio with different target allocations',
    category: 'rebalancing',
    severity: 'high',
    input: {
      action: 'rebalance',
      portfolio: [
        { token: 'TCRO', currentAllocation: 40, targetAllocation: 30, balance: '200' },
        { token: 'USDC', currentAllocation: 20, targetAllocation: 25, balance: '100' },
        { token: 'WETH', currentAllocation: 15, targetAllocation: 20, balance: '75' },
        { token: 'WBTC', currentAllocation: 15, targetAllocation: 15, balance: '75' },
        { token: 'DAI', currentAllocation: 10, targetAllocation: 10, balance: '50' }
      ],
      slippageTolerance: 1.5
    },
    environment: {
      portfolioValue: '500',
      availableLiquidity: {
        'TCRO/USDC': '500000',
        'USDC/WETH': '300000',
        'USDC/WBTC': '200000',
        'USDC/DAI': '400000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00',
        'WETH': '2000',
        'WBTC': '40000',
        'DAI': '1.00'
      },
      volatility: 'medium'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '400000',
      maxGasUsed: '800000',
      reasoningSteps: 8,
      rebalanceCount: 3
    },
    tags: ['rebalancing', 'multi-asset', 'complex']
  },
  
  {
    id: 'DEFI-003',
    name: 'Extreme Drift Rebalancing',
    description: 'Portfolio drifted 50%+ from target allocations',
    category: 'rebalancing',
    severity: 'critical',
    input: {
      action: 'rebalance',
      portfolio: [
        { token: 'TCRO', currentAllocation: 90, targetAllocation: 50, balance: '450' },
        { token: 'USDC', currentAllocation: 10, targetAllocation: 50, balance: '50' }
      ],
      slippageTolerance: 2
    },
    environment: {
      portfolioValue: '500',
      availableLiquidity: {
        'TCRO/USDC': '800000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00'
      },
      volatility: 'high'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '200000',
      maxGasUsed: '400000',
      reasoningSteps: 6,
      rebalanceCount: 1
    },
    tags: ['rebalancing', 'extreme-drift', 'high-risk']
  },
  
  {
    id: 'DEFI-004',
    name: 'Micro Rebalancing (Under Threshold)',
    description: 'Drift below rebalance threshold, should skip',
    category: 'rebalancing',
    severity: 'low',
    input: {
      action: 'rebalance',
      portfolio: [
        { token: 'TCRO', currentAllocation: 60.5, targetAllocation: 60, balance: '302.5' },
        { token: 'USDC', currentAllocation: 39.5, targetAllocation: 40, balance: '197.5' }
      ],
      slippageTolerance: 1
    },
    environment: {
      portfolioValue: '500',
      availableLiquidity: {
        'TCRO/USDC': '1000000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00'
      },
      volatility: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '50000',
      maxGasUsed: '100000',
      reasoningSteps: 3,
      rebalanceCount: 0 // Should skip - drift too small
    },
    tags: ['rebalancing', 'threshold', 'skip']
  }
];

/**
 * 🔄 SWAP SCENARIOS
 */
export const swapScenarios: DeFiScenario[] = [
  {
    id: 'DEFI-101',
    name: 'Simple TCRO → USDC Swap',
    description: 'Swap 10 TCRO for USDC with normal slippage',
    category: 'swap',
    severity: 'medium',
    input: {
      action: 'swap',
      swap: {
        tokenIn: 'TCRO',
        tokenOut: 'USDC',
        amountIn: '10',
        slippage: 1
      }
    },
    environment: {
      portfolioValue: '100',
      availableLiquidity: {
        'TCRO/USDC': '500000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00'
      },
      volatility: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '120000',
      maxGasUsed: '250000',
      reasoningSteps: 4
    },
    tags: ['swap', 'simple', 'stablecoin']
  },
  
  {
    id: 'DEFI-102',
    name: 'High Slippage Swap',
    description: 'Large swap causing 5%+ price impact',
    category: 'swap',
    severity: 'high',
    input: {
      action: 'swap',
      swap: {
        tokenIn: 'TCRO',
        tokenOut: 'RARE_TOKEN',
        amountIn: '1000',
        slippage: 5
      }
    },
    environment: {
      portfolioValue: '1500',
      availableLiquidity: {
        'TCRO/RARE_TOKEN': '50000'
      },
      prices: {
        'TCRO': '0.10',
        'RARE_TOKEN': '0.50'
      },
      volatility: 'high'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '150000',
      maxGasUsed: '350000',
      reasoningSteps: 6
    },
    tags: ['swap', 'high-slippage', 'illiquid']
  },
  
  {
    id: 'DEFI-103',
    name: 'Multi-Hop Swap',
    description: 'Swap through multiple pools (TCRO → USDC → WETH)',
    category: 'swap',
    severity: 'high',
    input: {
      action: 'swap',
      swap: {
        tokenIn: 'TCRO',
        tokenOut: 'WETH',
        amountIn: '50',
        slippage: 2
      }
    },
    environment: {
      portfolioValue: '200',
      availableLiquidity: {
        'TCRO/USDC': '500000',
        'USDC/WETH': '300000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00',
        'WETH': '2000'
      },
      volatility: 'medium'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '250000',
      maxGasUsed: '500000',
      reasoningSteps: 7
    },
    tags: ['swap', 'multi-hop', 'complex']
  },
  
  {
    id: 'DEFI-104',
    name: 'Failed Swap - Slippage Exceeded',
    description: 'Price moves beyond slippage tolerance',
    category: 'swap',
    severity: 'critical',
    input: {
      action: 'swap',
      swap: {
        tokenIn: 'TCRO',
        tokenOut: 'VOLATILE_TOKEN',
        amountIn: '100',
        slippage: 0.5,
        minAmountOut: '95'
      }
    },
    environment: {
      portfolioValue: '200',
      availableLiquidity: {
        'TCRO/VOLATILE_TOKEN': '100000'
      },
      prices: {
        'TCRO': '0.10',
        'VOLATILE_TOKEN': '0.08'
      },
      volatility: 'extreme',
      simulatedEvents: ['PRICE_SPIKE']
    },
    expected: {
      shouldSucceed: false,
      errorType: 'SLIPPAGE_EXCEEDED',
      reasoningSteps: 5
    },
    tags: ['swap', 'error', 'slippage', 'volatile']
  }
];

/**
 * 💧 LIQUIDITY MANAGEMENT SCENARIOS
 */
export const liquidityScenarios: DeFiScenario[] = [
  {
    id: 'DEFI-201',
    name: 'Add Balanced Liquidity',
    description: 'Add liquidity to TCRO/USDC pool with balanced amounts',
    category: 'liquidity',
    severity: 'medium',
    input: {
      action: 'add_liquidity',
      portfolio: [
        { token: 'TCRO', currentAllocation: 50, targetAllocation: 50, balance: '50' },
        { token: 'USDC', currentAllocation: 50, targetAllocation: 50, balance: '5' }
      ],
      slippageTolerance: 1
    },
    environment: {
      portfolioValue: '10',
      availableLiquidity: {
        'TCRO/USDC': '1000000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00'
      },
      apr: {
        'TCRO/USDC': 15.5
      },
      volatility: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '200000',
      maxGasUsed: '400000',
      reasoningSteps: 5
    },
    tags: ['liquidity', 'add', 'balanced']
  },
  
  {
    id: 'DEFI-202',
    name: 'Remove Liquidity (Partial)',
    description: 'Remove 50% of LP position',
    category: 'liquidity',
    severity: 'medium',
    input: {
      action: 'remove_liquidity',
      portfolio: [
        { token: 'TCRO/USDC-LP', currentAllocation: 100, targetAllocation: 50, balance: '10' }
      ],
      slippageTolerance: 1
    },
    environment: {
      portfolioValue: '100',
      availableLiquidity: {
        'TCRO/USDC': '1000000'
      },
      prices: {
        'TCRO': '0.10',
        'USDC': '1.00',
        'TCRO/USDC-LP': '10.00'
      },
      volatility: 'low'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '180000',
      maxGasUsed: '350000',
      reasoningSteps: 4
    },
    tags: ['liquidity', 'remove', 'partial']
  },
  
  {
    id: 'DEFI-203',
    name: 'Impermanent Loss Scenario',
    description: 'Add liquidity to volatile pair (high IL risk)',
    category: 'liquidity',
    severity: 'high',
    input: {
      action: 'add_liquidity',
      portfolio: [
        { token: 'TCRO', currentAllocation: 50, targetAllocation: 50, balance: '100' },
        { token: 'VOLATILE_TOKEN', currentAllocation: 50, targetAllocation: 50, balance: '10' }
      ],
      slippageTolerance: 2
    },
    environment: {
      portfolioValue: '20',
      availableLiquidity: {
        'TCRO/VOLATILE_TOKEN': '50000'
      },
      prices: {
        'TCRO': '0.10',
        'VOLATILE_TOKEN': '1.00'
      },
      apr: {
        'TCRO/VOLATILE_TOKEN': 150.0
      },
      volatility: 'extreme'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '220000',
      maxGasUsed: '450000',
      reasoningSteps: 7
    },
    tags: ['liquidity', 'high-risk', 'impermanent-loss', 'volatile']
  }
];

/**
 * 🎁 YIELD FARMING SCENARIOS
 */
export const yieldScenarios: DeFiScenario[] = [
  {
    id: 'DEFI-301',
    name: 'Auto-Compound Yield',
    description: 'Automatically compound earned rewards',
    category: 'yield',
    severity: 'low',
    input: {
      action: 'stake',
      portfolio: [
        { token: 'VVS', currentAllocation: 100, targetAllocation: 100, balance: '1000' }
      ],
      slippageTolerance: 1
    },
    environment: {
      portfolioValue: '100',
      availableLiquidity: {
        'VVS/USDC': '500000'
      },
      prices: {
        'VVS': '0.0001',
        'USDC': '1.00'
      },
      apr: {
        'VVS-STAKE': 45.0
      },
      volatility: 'medium'
    },
    expected: {
      shouldSucceed: true,
      minGasUsed: '150000',
      maxGasUsed: '300000',
      reasoningSteps: 5
    },
    tags: ['yield', 'compound', 'auto']
  },
  
  {
    id: 'DEFI-302',
    name: 'Gas-Optimized Yield Harvest',
    description: 'Only harvest when rewards exceed gas costs by 2x',
    category: 'yield',
    severity: 'medium',
    input: {
      action: 'stake',
      portfolio: [
        { token: 'REWARD_TOKEN', currentAllocation: 100, targetAllocation: 100, balance: '0.1' }
      ],
      slippageTolerance: 1
    },
    environment: {
      portfolioValue: '1',
      availableLiquidity: {
        'REWARD_TOKEN/USDC': '100000'
      },
      prices: {
        'REWARD_TOKEN': '10.00',
        'USDC': '1.00'
      },
      apr: {
        'REWARD_POOL': 80.0
      },
      volatility: 'low'
    },
    expected: {
      shouldSucceed: false,
      errorType: 'GAS_NOT_ECONOMICAL',
      reasoningSteps: 4
    },
    tags: ['yield', 'gas-optimization', 'skip']
  }
];

/**
 * 📦 EXPORT ALL SCENARIOS
 */
export const allDeFiScenarios: DeFiScenario[] = [
  ...rebalancingScenarios,
  ...swapScenarios,
  ...liquidityScenarios,
  ...yieldScenarios
];

/**
 * 🔍 DEFI SCENARIO UTILITIES
 */
export const defiScenarioUtils = {
  getByCategory: (category: DeFiScenario['category']) =>
    allDeFiScenarios.filter(s => s.category === category),
  
  getBySeverity: (severity: DeFiScenario['severity']) =>
    allDeFiScenarios.filter(s => s.severity === severity),
  
  getByTag: (tag: string) =>
    allDeFiScenarios.filter(s => s.tags.includes(tag)),
  
  getHighRisk: () =>
    allDeFiScenarios.filter(s => 
      s.tags.includes('high-risk') || s.environment.volatility === 'extreme'
    ),
  
  getComplexScenarios: () =>
    allDeFiScenarios.filter(s => 
      s.tags.includes('complex') || s.tags.includes('multi-hop')
    ),
  
  getStats: () => ({
    total: allDeFiScenarios.length,
    rebalancing: rebalancingScenarios.length,
    swaps: swapScenarios.length,
    liquidity: liquidityScenarios.length,
    yield: yieldScenarios.length,
    critical: allDeFiScenarios.filter(s => s.severity === 'critical').length
  })
};

/**
 * 📊 SUMMARY
 * 
 * Total DeFi Scenarios: 13
 * - Rebalancing: 4
 * - Swaps: 4
 * - Liquidity: 3
 * - Yield: 2
 * - Critical: 2
 */
