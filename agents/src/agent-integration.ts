/**
 * x402 Platform - Integration with Existing Backend
 * 
 * This module integrates the Crypto.com AI Agent SDK with the existing
 * x402 playground backend, adding AI-powered decision making to workflows.
 */

import { createAgentClient, AgentClient } from "../lib/agent-client";
import type { AgentConfig } from "../lib/agent-client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from root
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * AI Agent Manager for x402 workflows
 */
export class X402AgentManager {
  private agents: Map<string, AgentClient> = new Map();

  /**
   * Create a new AI agent for a workflow
   */
  async createAgent(config: Partial<AgentConfig> & { id: string; name: string }): Promise<AgentClient> {
    const fullConfig: AgentConfig = {
      id: config.id,
      name: config.name,
      description: config.description || `AI agent for ${config.name}`,
      model: config.model || "gpt-4-turbo",
      chainId: config.chainId || 338, // Default to Cronos testnet
      context: config.context || [],
      enableTracing: config.enableTracing ?? true,
    };

    try {
      const agent = await createAgentClient(fullConfig);
      this.agents.set(config.id, agent);
      
      console.log(`✅ Created AI agent: ${config.name} (${config.id})`);
      return agent;
    } catch (error: any) {
      console.error(`❌ Failed to create agent ${config.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get an existing agent by ID
   */
  getAgent(agentId: string): AgentClient | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Execute an AI agent query for decision making
   */
  async executeAgentQuery(agentId: string, query: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      const result = await agent.query(query);
      return {
        success: result.success,
        response: result.response,
        executionTime: result.executionTime,
        gasEstimate: result.gasEstimate,
        trace: result.trace,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get metrics for all agents
   */
  getAllMetrics() {
    const metrics: Record<string, any> = {};
    
    this.agents.forEach((agent, id) => {
      const config = agent.getConfig();
      metrics[id] = {
        name: config.name,
        successRate: agent.getSuccessRate(),
        averageExecutionTime: agent.getAverageExecutionTime(),
        totalQueries: agent.getQueryHistory().length,
        totalGasEstimate: agent.getTotalGasEstimate(),
      };
    });

    return metrics;
  }

  /**
   * Remove an agent
   */
  removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * List all agents
   */
  listAgents() {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      config: agent.getConfig(),
      metrics: {
        successRate: agent.getSuccessRate(),
        averageExecutionTime: agent.getAverageExecutionTime(),
        totalQueries: agent.getQueryHistory().length,
      },
    }));
  }
}

// Singleton instance
let agentManager: X402AgentManager | null = null;

/**
 * Get the global agent manager instance
 */
export function getAgentManager(): X402AgentManager {
  if (!agentManager) {
    agentManager = new X402AgentManager();
  }
  return agentManager;
}

/**
 * Create a pre-configured agent for risk analysis
 */
export async function createRiskAnalysisAgent(): Promise<AgentClient> {
  const manager = getAgentManager();
  return manager.createAgent({
    id: "risk-analyzer",
    name: "Risk Analysis Agent",
    description: "Analyzes transaction risks and provides recommendations",
    model: "gpt-4-turbo",
    chainId: 338,
    enableTracing: true,
    context: [
      "You are a blockchain risk analysis expert.",
      "Analyze transactions for potential risks including:",
      "- Smart contract vulnerabilities",
      "- Unusual transaction patterns",
      "- Gas optimization opportunities",
      "- Security concerns",
      "Provide clear, actionable recommendations.",
    ],
  });
}

/**
 * Create a pre-configured agent for DeFi operations
 */
export async function createDeFiAgent(): Promise<AgentClient> {
  const manager = getAgentManager();
  return manager.createAgent({
    id: "defi-agent",
    name: "DeFi Operations Agent",
    description: "Handles DeFi swaps, liquidity, and yield farming",
    model: "gpt-4-turbo",
    chainId: 338,
    enableTracing: true,
    context: [
      "You are a DeFi operations expert on Cronos blockchain.",
      "Help users with:",
      "- Token swaps and optimal routes",
      "- Liquidity provision strategies",
      "- Yield farming opportunities",
      "- Gas optimization for DeFi transactions",
      "Always consider gas costs and slippage.",
    ],
  });
}

/**
 * Create a pre-configured agent for payment decisions
 */
export async function createPaymentAgent(): Promise<AgentClient> {
  const manager = getAgentManager();
  return manager.createAgent({
    id: "payment-agent",
    name: "Payment Decision Agent",
    description: "Makes intelligent decisions about x402 payments",
    model: "gpt-4-turbo",
    chainId: 338,
    enableTracing: true,
    context: [
      "You are an x402 payment system expert.",
      "Help optimize payment workflows:",
      "- Verify payment parameters",
      "- Suggest gas optimizations",
      "- Detect potential issues",
      "- Recommend best practices",
      "Focus on reliability and cost efficiency.",
    ],
  });
}

// Export types
export type { AgentConfig, AgentClient };
