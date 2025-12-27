"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ExecutionPlan } from "@/lib/types";

interface JsonOutputProps {
  plan: ExecutionPlan;
}

export default function JsonOutput({ plan }: JsonOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-200 text-sm">JSON Output</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#0a0a0a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-gray-300 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 text-xs text-gray-300 overflow-x-auto max-h-96 overflow-y-auto font-mono">
        {JSON.stringify(plan, null, 2)}
      </pre>
    </div>
  );
}
