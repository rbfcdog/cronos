"use client";

import { useState } from "react";
import { Brain, Loader2, Send } from "lucide-react";

interface AIAgentResponse {
  success: boolean;
  query: string;
  response: any;
  executionTime: number;
  timestamp: number;
  error?: string;
}

export default function AIAgentTester() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIAgentResponse | null>(null);

  const exampleQueries = [
    "What is the current CRO price?",
    "Show me the latest transactions on Cronos",
    "What's the gas price on Cronos testnet?",
    "Explain how to swap tokens on VVS Finance",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          chainId: 338, // Cronos testnet
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({
        success: false,
        query,
        response: null,
        executionTime: 0,
        timestamp: Date.now(),
        error: error.message || "Failed to query AI agent",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/10 rounded-lg">
          <Brain className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">AI Agent Tester</h2>
          <p className="text-sm text-gray-400">
            Powered by Crypto.com AI Agent SDK
          </p>
        </div>
      </div>

      {/* Example Queries */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Try these examples:
        </label>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => loadExample(example)}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Ask the AI Agent:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query about Cronos blockchain..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {/* Status */}
          <div
            className={`p-4 rounded-lg ${
              response.success
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {response.success ? "✓ Success" : "✗ Error"}
              </span>
              <span className="text-sm text-gray-400">
                {response.executionTime}ms
              </span>
            </div>
            <p className="text-sm text-gray-300">
              Query: <span className="italic">{response.query}</span>
            </p>
          </div>

          {/* Response Data */}
          {response.success ? (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                AI Agent Response:
              </h3>
              <pre className="text-sm overflow-x-auto bg-gray-900 p-4 rounded-lg">
                {JSON.stringify(response.response, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-400 mb-2">Error:</h3>
              <p className="text-sm text-gray-300">{response.error}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-800 rounded-lg p-3">
              <span className="text-gray-400">Execution Time:</span>
              <span className="ml-2 font-mono">{response.executionTime}ms</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <span className="text-gray-400">Timestamp:</span>
              <span className="ml-2 font-mono">
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          🧠 About the AI Agent SDK
        </h4>
        <p className="text-sm text-gray-300">
          This uses the Crypto.com AI Agent SDK to process natural language
          queries about the Cronos blockchain. The agent can analyze
          transactions, provide market data, and help with DeFi operations.
        </p>
      </div>
    </div>
  );
}
