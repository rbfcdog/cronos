"use client";

import { useState } from "react";
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, 
  ExternalLink, ArrowRight, Database, Zap, Code, Eye, CircleCheck, Activity, Brain
} from "lucide-react";
import type { ExecutionTrace } from "@/lib/types";

interface TraceViewerProps {
  trace: ExecutionTrace | null;
  isLoading?: boolean;
}

export default function TraceViewer({ trace, isLoading }: TraceViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0])); // Expand first by default
  
  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const getActionIcon = (actionType?: string) => {
    switch (actionType) {
      case "read_balance":
        return <Database className="w-4 h-4" />;
      case "x402_payment":
        return <Zap className="w-4 h-4" />;
      case "contract_call":
        return <Code className="w-4 h-4" />;
      case "read_state":
        return <Eye className="w-4 h-4" />;
      case "approve_token":
        return <CircleCheck className="w-4 h-4" />;
      case "llm_agent":
        return <Brain className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "simulated":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "simulated":
        return "bg-green-900/20 border-green-700/30";
      case "error":
        return "bg-red-900/20 border-red-700/30";
      case "warning":
        return "bg-yellow-900/20 border-yellow-700/30";
      default:
        return "bg-[#1a1a1a] border-[#2a2a2a]";
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-200 mb-4 text-sm">Execution Trace</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!trace) {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-200 mb-4 text-sm">Execution Trace</h3>
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-600" />
          <p className="text-xs">No execution trace yet</p>
          <p className="text-xs mt-1">Run a simulation or execution to see results</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-200 text-sm">Execution Trace</h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          trace.mode === "simulate" ? "bg-blue-900/30 text-blue-300" : "bg-purple-900/30 text-purple-300"
        }`}>
          {trace.mode === "simulate" ? "Simulation" : "Live"}
        </span>
      </div>
      
      {/* Metadata */}
      <div className="mb-3 p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Run ID:</span>
          <span className="font-mono text-gray-300">{trace.runId}</span>
        </div>
        {trace.metadata?.executionTime && (
          <div className="flex justify-between">
            <span className="text-gray-500">Execution Time:</span>
            <span className="text-gray-300">{trace.metadata.executionTime}</span>
          </div>
        )}
      </div>
      
      {/* Steps Timeline */}
      <div className="space-y-2">
        {trace.steps.map((step, index) => {
          const isExpanded = expandedSteps.has(index);
          const statusColor = getStatusColor(step.status);
          
          return (
            <div key={index} className={`border rounded-lg ${statusColor} transition-all`}>
              {/* Step Header */}
              <button
                onClick={() => toggleStep(index)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    step.status === "success" || step.status === "simulated" ? "bg-green-500/20" :
                    step.status === "error" ? "bg-red-500/20" :
                    "bg-gray-500/20"
                  }`}>
                    {getActionIcon(step.action?.type)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">Step {index + 1}</span>
                      <span className="font-semibold text-sm text-gray-200">
                        {step.action?.type?.replace(/_/g, " ").toUpperCase() || "Unknown Action"}
                      </span>
                      {getStatusIcon(step.status)}
                    </div>
                    {!isExpanded && step.result?.summary && (
                      <div className="text-xs text-gray-500 mt-1">
                        {step.result.summary}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.gasUsed && (
                    <span className="text-xs font-mono text-gray-500">
                      ⛽ {typeof step.gasUsed === 'number' ? step.gasUsed.toLocaleString() : step.gasUsed}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  <div className="h-px bg-[#2a2a2a]" />
                  
                  {/* INPUT Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                        📥 Input
                      </div>
                      <div className="flex-1 h-px bg-blue-900/30" />
                    </div>
                    <div className="bg-[#0a0a0a] border border-blue-900/30 rounded-lg p-3 space-y-2">
                      {Object.entries(step.action).map(([key, value]) => {
                        if (key === 'type' || value === undefined) return null;
                        return (
                          <div key={key} className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-blue-300">{key}:</span>
                            <span className="text-xs font-mono text-gray-300 bg-[#1a1a1a] px-2 py-1 rounded break-all">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </span>
                          </div>
                        );
                      })}
                      {Object.keys(step.action).length === 1 && (
                        <span className="text-xs text-gray-500 italic">No parameters</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                  </div>

                  {/* OUTPUT Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-green-400 uppercase tracking-wide">
                        📤 Output
                      </div>
                      <div className="flex-1 h-px bg-green-900/30" />
                    </div>
                    {(step.status === "success" || step.status === "simulated") && step.result ? (
                      <div className="bg-[#0a0a0a] border border-green-900/30 rounded-lg p-3">
                        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
                          {typeof step.result === 'object' 
                            ? JSON.stringify(step.result, null, 2)
                            : String(step.result)
                          }
                        </pre>
                      </div>
                    ) : step.status === "error" && step.error ? (
                      <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-red-300">Error</div>
                            <div className="text-xs font-mono text-red-200">{step.error}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
                        <span className="text-xs text-gray-500 italic">Pending execution...</span>
                      </div>
                    )}
                  </div>

                  {/* Transaction Details */}
                  {step.txHash && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                          🔗 Transaction
                        </div>
                        <div className="flex-1 h-px bg-purple-900/30" />
                      </div>
                      <div className="bg-[#0a0a0a] border border-purple-900/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Tx Hash:</span>
                          <a
                            href={`https://explorer.cronos.org/testnet/tx/${step.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
                          >
                            {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {step.gasUsed && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Gas Used:</span>
                            <span className="font-mono text-xs text-gray-300">
                              {typeof step.gasUsed === 'number' ? step.gasUsed.toLocaleString() : step.gasUsed}
                            </span>
                          </div>
                        )}
                        {step.gasEstimate && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Gas Estimate:</span>
                            <span className="font-mono text-xs text-gray-400">
                              {typeof step.gasEstimate === 'number' ? step.gasEstimate.toLocaleString() : step.gasEstimate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timing */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#2a2a2a]">
                    <span>Timestamp: {new Date(step.timestamp).toLocaleTimeString()}</span>
                    {step.status === "success" && (
                      <span className="text-green-400 font-semibold">✓ Completed</span>
                    )}
                    {step.status === "error" && (
                      <span className="text-red-400 font-semibold">✗ Failed</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {trace.steps.length > 0 && (
        <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Steps</div>
              <div className="text-lg font-bold text-gray-200">{trace.steps.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Success</div>
              <div className="text-lg font-bold text-green-400">
                {trace.steps.filter(s => s.status === "success").length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Errors</div>
              <div className="text-lg font-bold text-red-400">
                {trace.steps.filter(s => s.status === "error").length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
