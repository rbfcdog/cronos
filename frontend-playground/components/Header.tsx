"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap, PlaySquare, ChevronDown, Sparkles, Brain } from "lucide-react";

interface HeaderProps {
  onLoadExample?: (exampleId: string) => void;
  onShowTemplates?: () => void;
  onShowAIAgent?: () => void;
}

export default function Header({ onLoadExample, onShowTemplates, onShowAIAgent }: HeaderProps) {
  const [showExamples, setShowExamples] = useState(false);

  const examples = [
    { id: "basic", label: "Basic Payment", description: "Simple balance check and payment" },
    { id: "ai-workflow", label: "AI Risk Analysis", description: "LLM agent for smart decisions" },
    { id: "defi-swap", label: "DeFi Token Swap", description: "Multi-step approval and swap" },
    { id: "conditional", label: "Conditional Execution", description: "Branch based on conditions" },
  ];

  return (
    <header className="h-16 bg-[#0f0f0f] border-b border-[#2a2a2a] px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">x402 Agent Playground</h1>
            <p className="text-xs text-gray-500">Cronos Developer Sandbox</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* AI Agent SDK Button */}
        {onShowAIAgent && (
          <button
            onClick={onShowAIAgent}
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Brain className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">AI Agent SDK</span>
          </button>
        )}
        
        {/* Agent Templates Button */}
        {onShowTemplates && (
          <button
            onClick={onShowTemplates}
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Agent Templates</span>
          </button>
        )}
        
        {onLoadExample && (
          <div className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <PlaySquare className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Load Example</span>
              <ChevronDown className="w-3 h-3 text-white" />
            </button>

            {/* Dropdown Menu */}
            {showExamples && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-1 mb-1">
                    Example Workflows
                  </div>
                  {examples.map((example) => (
                    <button
                      key={example.id}
                      onClick={() => {
                        onLoadExample(example.id);
                        setShowExamples(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-[#2a2a2a] transition-colors group"
                    >
                      <div className="text-sm font-medium text-gray-200 group-hover:text-white">
                        {example.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {example.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-300">Cronos Testnet</span>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
