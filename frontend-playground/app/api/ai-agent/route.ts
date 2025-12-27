/**
 * AI Agent Query API
 * Uses Crypto.com AI Agent SDK to process natural language queries
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@crypto.com/ai-agent-client";
import type { QueryOptions } from "@crypto.com/ai-agent-client/dist/integrations/cdc-ai-agent.interfaces";

export async function POST(request: NextRequest) {
  try {
    const { query, chainId } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Initialize AI Agent SDK
    const queryOptions: QueryOptions = {
      openAI: {
        apiKey: process.env.OPENAI_API_KEY || "",
        model: "gpt-4-turbo",
      },
      chainId: chainId || 338, // Default to Cronos testnet
      explorerKeys: {
        cronosMainnetKey: process.env.CRONOS_MAINNET_EXPLORER_KEY || "",
        cronosTestnetKey: process.env.CRONOS_TESTNET_EXPLORER_KEY || "",
        cronosZkEvmKey: process.env.CRONOS_ZKEVM_MAINNET_EXPLORER_KEY || "",
        cronosZkEvmTestnetKey: process.env.CRONOS_ZKEVM_TESTNET_EXPLORER_KEY || "",
      },
    };

    const startTime = Date.now();
    const client = createClient(queryOptions);

    // Execute query
    const response = await client.agent.generateQuery(query);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      response,
      executionTime,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("AI Agent query error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process query",
      },
      { status: 500 }
    );
  }
}
