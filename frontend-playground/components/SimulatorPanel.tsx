"use client";

import { Terminal, Rocket, Loader2 } from "lucide-react";

interface SimulatorPanelProps {
  mode: "simulate" | "execute";
  setMode: (mode: "simulate" | "execute") => void;
  onSimulate: () => void;
  onExecute: () => void;
  isLoading: boolean;
  isValidPlan: boolean;
}

export default function SimulatorPanel({
  mode,
  setMode,
  onSimulate,
  onExecute,
  isLoading,
  isValidPlan,
}: SimulatorPanelProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
      <h3 className="font-semibold text-gray-200 mb-4 text-sm">Execution Controls</h3>
      
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-[#0a0a0a] rounded-lg mb-4">
        <button
          onClick={() => setMode("simulate")}
          className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all ${
            mode === "simulate"
              ? "bg-[#1a1a1a] text-gray-100 border border-[#2a2a2a]"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Simulation
        </button>
        <button
          onClick={() => setMode("execute")}
          className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all ${
            mode === "execute"
              ? "bg-[#1a1a1a] text-gray-100 border border-[#2a2a2a]"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Live
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        {mode === "simulate" ? (
          <button
            onClick={onSimulate}
            disabled={!isValidPlan || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                Simulate Plan
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onExecute}
            disabled={!isValidPlan || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Execute Plan
              </>
            )}
          </button>
        )}
      </div>
      
      {!isValidPlan && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          Add at least one node to enable execution
        </p>
      )}
      
      {mode === "execute" && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
          <p className="text-xs text-amber-200">
            <strong>⚠️ Warning:</strong> This will execute real transactions on Cronos Testnet
          </p>
        </div>
      )}
    </div>
  );
}
