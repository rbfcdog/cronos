/**
 * x402 Agent Platform - Agent Client Wrapper
 * 
 * Integrates with Crypto.com AI Agent SDK to provide:
 * - Agent creation and management
 * - Query execution with tracing
 * - Decision logging for observability
 * - Multi-agent coordination support
 */

import { createClient } from "@crypto.com/ai-agent-client";
import { QueryOptions } from "@crypto.com/ai-agent-client/dist/integrations/cdc-ai-agent.interfaces";

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  model?: string;
  chainId?: number;
  context?: any[];
  customRPC?: string;
  enableTracing?: boolean;
}

/**
 * Agent query result with observability metadata
 */
export interface AgentQueryResult {
  agentId: string;
  query: string;
  response: any;
  timestamp: number;
  executionTime: number;
  gasEstimate?: string;
  success: boolean;
  error?: string;
  trace?: DecisionTrace;
}

/**
 * Decision trace for observability
 */
export interface DecisionTrace {
  steps: Array<{
    step: number;
    action: string;
    reasoning: string;
    result: any;
    timestamp: number;
  }>;
  llmCalls: number;
  totalTokens?: number;
}

/**
 * Agent Client wrapper class
 */
export class AgentClient {
  private client: any;
  private config: AgentConfig;
  private queryHistory: AgentQueryResult[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Initialize the agent client
   */
  async initialize() {
    const queryOptions: QueryOptions = {
      openAI: {
        apiKey: process.env.OPENAI_API_KEY || "",
        model: this.config.model || "gpt-4-turbo",
      },
      chainId: this.config.chainId || 338, // Default to Cronos testnet
      explorerKeys: {
        cronosMainnetKey: process.env.CRONOS_MAINNET_EXPLORER_KEY || "",
        cronosTestnetKey: process.env.CRONOS_TESTNET_EXPLORER_KEY || "",
        cronosZkEvmKey: process.env.CRONOS_ZKEVM_MAINNET_EXPLORER_KEY || "",
        cronosZkEvmTestnetKey: process.env.CRONOS_ZKEVM_TESTNET_EXPLORER_KEY || "",
      },
      context: this.config.context || [],
      customRPC: this.config.customRPC,
    };

    this.client = createClient(queryOptions);
    return this;
  }

  /**
   * Execute a query with full observability tracking
   */
  async query(query: string): Promise<AgentQueryResult> {
    const startTime = Date.now();
    const timestamp = Date.now();

    try {
      // Execute query using the SDK's agent.generateQuery method
      const response = await this.client.agent.generateQuery(query);
      const executionTime = Date.now() - startTime;

      // Build result with observability data
      const result: AgentQueryResult = {
        agentId: this.config.id,
        query,
        response,
        timestamp,
        executionTime,
        success: true,
      };

      // Extract gas estimate if available
      if (response?.gasEstimate) {
        result.gasEstimate = response.gasEstimate;
      }

      // Build decision trace if tracing enabled
      if (this.config.enableTracing) {
        result.trace = this.buildDecisionTrace(response);
      }

      // Store in history
      this.queryHistory.push(result);

      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      const result: AgentQueryResult = {
        agentId: this.config.id,
        query,
        response: null,
        timestamp,
        executionTime,
        success: false,
        error: error.message || "Unknown error",
      };

      this.queryHistory.push(result);
      throw error;
    }
  }

  /**
   * Build decision trace from response
   */
  private buildDecisionTrace(response: any): DecisionTrace {
    // Extract decision steps from response
    // This structure depends on what the AI Agent SDK returns
    const steps = [];
    
    if (response?.reasoning) {
      steps.push({
        step: 1,
        action: "analyze",
        reasoning: response.reasoning,
        result: response.result,
        timestamp: Date.now(),
      });
    }

    return {
      steps,
      llmCalls: response?.llmCalls || 1,
      totalTokens: response?.totalTokens,
    };
  }

  /**
   * Get query history for observability
   */
  getQueryHistory(): AgentQueryResult[] {
    return this.queryHistory;
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Get success rate metric
   */
  getSuccessRate(): number {
    if (this.queryHistory.length === 0) return 0;
    
    const successful = this.queryHistory.filter(r => r.success).length;
    return (successful / this.queryHistory.length) * 100;
  }

  /**
   * Get average execution time
   */
  getAverageExecutionTime(): number {
    if (this.queryHistory.length === 0) return 0;
    
    const total = this.queryHistory.reduce((sum, r) => sum + r.executionTime, 0);
    return total / this.queryHistory.length;
  }

  /**
   * Get total gas estimate
   */
  getTotalGasEstimate(): string {
    const total = this.queryHistory.reduce((sum, r) => {
      if (r.gasEstimate) {
        return sum + BigInt(r.gasEstimate);
      }
      return sum;
    }, BigInt(0));

    return total.toString();
  }
}

/**
 * Create a new agent client
 */
export async function createAgentClient(config: AgentConfig): Promise<AgentClient> {
  const client = new AgentClient(config);
  await client.initialize();
  return client;
}

/**
 * Helper to get chain name from chainId
 */
export function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    25: "Cronos EVM Mainnet",
    338: "Cronos EVM Testnet",
    388: "Cronos zkEVM Mainnet",
    240: "Cronos zkEVM Testnet",
  };

  return chains[chainId] || `Unknown Chain (${chainId})`;
}

/**
 * Helper to validate agent configuration
 */
export function validateAgentConfig(config: Partial<AgentConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.id) errors.push("Agent ID is required");
  if (!config.name) errors.push("Agent name is required");
  
  if (config.chainId && ![25, 338, 388, 240].includes(config.chainId)) {
    errors.push("Invalid chainId. Must be 25, 338, 388, or 240");
  }

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    errors.push("OPENAI_API_KEY environment variable is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
