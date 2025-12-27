/**
 * x402 Backend - AI Agent API Endpoints
 * 
 * Integration with Crypto.com AI Agent SDK for AI-powered workflows
 */

import { Router, Request, Response } from "express";
import { createClient } from "@crypto.com/ai-agent-client";
import type { CdcAiAgentClient } from "@crypto.com/ai-agent-client/dist/lib/client";
import type { QueryOptions } from "@crypto.com/ai-agent-client/dist/integrations/cdc-ai-agent.interfaces";

const router = Router();

// Agent storage
interface AgentData {
  id: string;
  name: string;
  description: string;
  model: string;
  chainId: number;
  client: CdcAiAgentClient;
  queries: Array<{
    query: string;
    response: any;
    timestamp: number;
    executionTime: number;
  }>;
  createdAt: number;
}

const agents = new Map<string, AgentData>();

/**
 * Helper to create an agent client
 */
function createAgentClient(config: {
  id: string;
  name: string;
  description?: string;
  model?: string;
  chainId?: number;
  context?: string[];
}): AgentData {
  const queryOptions: QueryOptions = {
    openAI: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: config.model || "gpt-4-turbo",
    },
    chainId: config.chainId || 338,
    explorerKeys: {
      cronosMainnetKey: process.env.CRONOS_MAINNET_EXPLORER_KEY || "",
      cronosTestnetKey: process.env.CRONOS_TESTNET_EXPLORER_KEY || "",
      cronosZkEvmKey: process.env.CRONOS_ZKEVM_MAINNET_EXPLORER_KEY || "",
      cronosZkEvmTestnetKey: process.env.CRONOS_ZKEVM_TESTNET_EXPLORER_KEY || "",
    },
    // Context will be added in the query itself
  };

  const client = createClient(queryOptions);

  const agentData: AgentData = {
    id: config.id,
    name: config.name,
    description: config.description || "",
    model: config.model || "gpt-4-turbo",
    chainId: config.chainId || 338,
    client,
    queries: [],
    createdAt: Date.now(),
  };

  agents.set(config.id, agentData);
  return agentData;
}

/**
 * POST /api/agents/create
 * Create a new AI agent
 */
router.post("/create", (req: Request, res: Response) => {
  try {
    const { id, name, description, model, chainId, context } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: "Agent id and name are required",
      });
    }

    if (agents.has(id)) {
      return res.status(400).json({
        success: false,
        error: `Agent with id '${id}' already exists`,
      });
    }

    const agent = createAgentClient({
      id,
      name,
      description,
      model,
      chainId,
      context,
    });

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        chainId: agent.chainId,
        createdAt: agent.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating agent:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create agent",
    });
  }
});

/**
 * POST /api/agents/:agentId/query
 * Execute a query with a specific agent
 */
router.post("/:agentId/query", async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentId}' not found`,
      });
    }

    const startTime = Date.now();
    
    try {
      console.log(`[AI Agent] Executing query for agent '${agentId}':`, query);
      console.log(`[AI Agent] API Key present:`, !!process.env.OPENAI_API_KEY);
      console.log(`[AI Agent] API Key length:`, process.env.OPENAI_API_KEY?.length || 0);
      
      const response = await agent.client.agent.generateQuery(query);
      const executionTime = Date.now() - startTime;

      console.log(`[AI Agent] Query successful, execution time: ${executionTime}ms`);

      // Store query history
      agent.queries.push({
        query,
        response,
        timestamp: Date.now(),
        executionTime,
      });

      res.json({
        success: true,
        data: {
          agentId,
          query,
          response,
          executionTime,
          timestamp: Date.now(),
        },
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`[AI Agent] Query failed:`, error);
      console.error(`[AI Agent] Error details:`, JSON.stringify(error, null, 2));
      
      res.status(500).json({
        success: false,
        error: `Generate query failed with status ${error.status || 'unknown'}: ${error.message || JSON.stringify(error)}`,
        executionTime,
      });
    }
  } catch (error: any) {
    console.error("Error executing query:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to execute query",
    });
  }
});

/**
 * GET /api/agents
 * List all agents
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const agentsList = Array.from(agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      model: agent.model,
      chainId: agent.chainId,
      createdAt: agent.createdAt,
      totalQueries: agent.queries.length,
      averageExecutionTime: agent.queries.length > 0
        ? agent.queries.reduce((sum, q) => sum + q.executionTime, 0) / agent.queries.length
        : 0,
    }));

    res.json({
      success: true,
      data: agentsList,
      total: agentsList.length,
    });
  } catch (error: any) {
    console.error("Error listing agents:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to list agents",
    });
  }
});

/**
 * GET /api/agents/:agentId
 * Get agent details
 */
router.get("/:agentId", (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = agents.get(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent '${agentId}' not found`,
      });
    }

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        chainId: agent.chainId,
        createdAt: agent.createdAt,
        metrics: {
          totalQueries: agent.queries.length,
          averageExecutionTime: agent.queries.length > 0
            ? agent.queries.reduce((sum, q) => sum + q.executionTime, 0) / agent.queries.length
            : 0,
          recentQueries: agent.queries.slice(-5),
        },
      },
    });
  } catch (error: any) {
    console.error("Error getting agent:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get agent",
    });
  }
});

/**
 * POST /api/agents/presets/risk-analyzer
 * Create a pre-configured risk analysis agent
 */
router.post("/presets/risk-analyzer", (req: Request, res: Response) => {
  try {
    if (agents.has("risk-analyzer")) {
      return res.status(400).json({
        success: false,
        error: "Risk analyzer agent already exists",
      });
    }

    const agent = createAgentClient({
      id: "risk-analyzer",
      name: "Risk Analysis Agent",
      description: "Analyzes transaction risks and provides recommendations",
      model: "gpt-4-turbo",
      chainId: 338,
      context: [
        "You are a blockchain risk analysis expert.",
        "Analyze transactions for potential risks including smart contract vulnerabilities, unusual patterns, gas optimization opportunities, and security concerns.",
        "Provide clear, actionable recommendations.",
      ],
    });

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        message: "Risk Analysis Agent created successfully",
      },
    });
  } catch (error: any) {
    console.error("Error creating risk analyzer:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create risk analyzer",
    });
  }
});

/**
 * POST /api/agents/presets/defi-agent
 * Create a pre-configured DeFi operations agent
 */
router.post("/presets/defi-agent", (req: Request, res: Response) => {
  try {
    if (agents.has("defi-agent")) {
      return res.status(400).json({
        success: false,
        error: "DeFi agent already exists",
      });
    }

    const agent = createAgentClient({
      id: "defi-agent",
      name: "DeFi Operations Agent",
      description: "Handles DeFi swaps, liquidity, and yield farming",
      model: "gpt-4-turbo",
      chainId: 338,
      context: [
        "You are a DeFi operations expert on Cronos blockchain.",
        "Help users with token swaps, optimal routes, liquidity provision, yield farming, and gas optimization.",
        "Always consider gas costs and slippage.",
      ],
    });

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        message: "DeFi Agent created successfully",
      },
    });
  } catch (error: any) {
    console.error("Error creating DeFi agent:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create DeFi agent",
    });
  }
});

/**
 * POST /api/agents/presets/payment-agent
 * Create a pre-configured payment decision agent
 */
router.post("/presets/payment-agent", (req: Request, res: Response) => {
  try {
    if (agents.has("payment-agent")) {
      return res.status(400).json({
        success: false,
        error: "Payment agent already exists",
      });
    }

    const agent = createAgentClient({
      id: "payment-agent",
      name: "Payment Decision Agent",
      description: "Makes intelligent decisions about x402 payments",
      model: "gpt-4-turbo",
      chainId: 338,
      context: [
        "You are an x402 payment system expert.",
        "Help optimize payment workflows, verify parameters, suggest gas optimizations, detect issues, and recommend best practices.",
        "Focus on reliability and cost efficiency.",
      ],
    });

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        message: "Payment Agent created successfully",
      },
    });
  } catch (error: any) {
    console.error("Error creating payment agent:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create payment agent",
    });
  }
});

/**
 * DELETE /api/agents/:agentId
 * Remove an agent
 */
router.delete("/:agentId", (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const removed = agents.delete(agentId);

    if (removed) {
      res.json({
        success: true,
        message: `Agent '${agentId}' removed successfully`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Agent '${agentId}' not found`,
      });
    }
  } catch (error: any) {
    console.error("Error removing agent:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to remove agent",
    });
  }
});

export default router;
