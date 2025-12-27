"use client";

import { Terminal, Rocket, Loader2 } from "lucide-react";

interface SimulatorControlsProps {
  mode: "simulate" | "execute";
  setMode: (mode: "simulate" | "execute") => void;
  onSimulate: () => void;
  onExecute: () => void;
  isLoading: boolean;
  isValidPlan: boolean;
}

export default function SimulatorControls({
  mode,
  setMode,
  onSimulate,
  onExecute,
  isLoading,
  isValidPlan,
}: SimulatorControlsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Execution Controls</h3>
      
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg mb-4">
        <button
          onClick={() => setMode("simulate")}
          className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${
            mode === "simulate"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Simulation
        </button>
        <button
          onClick={() => setMode("execute")}
          className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${
            mode === "execute"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
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
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Terminal className="w-5 h-5" />
                Simulate Plan
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onExecute}
            disabled={!isValidPlan || isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Execute Plan
              </>
            )}
          </button>
        )}
      </div>
      
      {!isValidPlan && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          Add at least one action block to enable execution
        </p>
      )}
      
      {mode === "execute" && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>⚠️ Warning:</strong> This will execute real transactions on Cronos Testnet
          </p>
        </div>
      )}
    </div>
  );
}
