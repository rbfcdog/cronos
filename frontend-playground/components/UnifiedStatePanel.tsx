"use client";

import { Wallet, FileCode, Zap, ExternalLink } from "lucide-react";
import type { UnifiedState } from "@/lib/types";

interface UnifiedStatePanelProps {
  state: UnifiedState | null;
}

export default function UnifiedStatePanel({ state }: UnifiedStatePanelProps) {
  if (!state) {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-200 mb-4 text-sm">State Overview</h3>
        <div className="text-center py-12 text-gray-500">
          <FileCode className="w-10 h-10 mx-auto mb-2 text-gray-600" />
          <p className="text-xs">No state data available</p>
          <p className="text-xs mt-1">Run a simulation to see wallet and contract state</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-200 mb-4 text-sm">State Overview</h3>
      
      {/* Wallet Section */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Wallet className="w-3.5 h-3.5 text-blue-400" />
          <h4 className="font-medium text-xs text-gray-300">Wallet</h4>
        </div>
        
        <div className="space-y-2">
          {state.wallet.address && (
            <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Address</div>
              <div className="font-mono text-xs text-gray-300 break-all">
                {state.wallet.address}
              </div>
            </div>
          )}
          
          {state.wallet.balances && state.wallet.balances.length > 0 ? (
            <div className="space-y-1.5">
              {state.wallet.balances.map((balance, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {balance.symbol[0]}
                    </div>
                    <span className="font-medium text-xs text-gray-300">{balance.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-gray-200">
                      {parseFloat(balance.balance).toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-center text-xs text-gray-500">
              No balance data
            </div>
          )}
        </div>
      </div>
      
      {/* Contracts Section */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <FileCode className="w-3.5 h-3.5 text-purple-400" />
          <h4 className="font-medium text-xs text-gray-300">Contracts</h4>
        </div>
        
        {state.contracts && state.contracts.length > 0 ? (
          <div className="space-y-2">
            {state.contracts.map((contract, index) => (
              <div key={index} className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-xs text-gray-300">
                    {contract.name || `Contract ${index + 1}`}
                  </span>
                  {contract.status && (
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                      contract.status === "deployed" || contract.status === "reachable"
                        ? "bg-green-900/30 text-green-300"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {contract.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-gray-500 break-all">
                    {contract.address}
                  </span>
                  <a
                    href={`https://explorer.cronos.org/testnet/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-center text-xs text-gray-500">
            No contract data
          </div>
        )}
      </div>
      
      {/* x402 Section */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <h4 className="font-medium text-xs text-gray-300">x402 Protocol</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Executions</div>
            <div className="text-base font-bold text-gray-200">
              {state.x402?.executions || 0}
            </div>
          </div>
          <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Last Execution</div>
            <div className="text-xs font-medium text-gray-400">
              {state.x402?.lastExecution ? new Date(state.x402.lastExecution).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
