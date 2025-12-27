"use client";

import { X, Info, ArrowRight, Tag, Zap } from "lucide-react";
import type { NodeDefinition } from "@/lib/nodeRegistry";

interface NodeDocModalProps {
  node: NodeDefinition;
  isOpen: boolean;
  onClose: () => void;
}

export default function NodeDocModal({ node, isOpen, onClose }: NodeDocModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br ${node.color} rounded-lg`}>
              <node.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">{node.name}</h2>
              <p className="text-xs text-gray-500">v{node.version} • {node.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-300">{node.description}</p>
            <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">
                {node.longDescription}
              </pre>
            </div>
          </div>

          {/* Gas Estimate */}
          {node.gasEstimate && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/10 border border-yellow-700/30 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-300">
                <strong>Gas Estimate:</strong> {node.gasEstimate}
              </span>
            </div>
          )}

          {/* Inputs */}
          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
              📥 INPUTS
              <span className="text-xs font-normal text-gray-500">({node.inputs.length})</span>
            </h3>
            <div className="space-y-3">
              {node.inputs.map((input) => (
                <div key={input.name} className="p-3 bg-[#1a1a1a] border border-blue-900/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-blue-300">{input.name}</code>
                      {input.required && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-900/30 text-red-300 rounded">
                          required
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-500">{input.type}</span>
                  </div>
                  <p className="text-xs text-gray-400">{input.description}</p>
                  {input.placeholder && (
                    <div className="mt-2 px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                      <span className="text-xs font-mono text-gray-500">
                        Example: {input.placeholder}
                      </span>
                    </div>
                  )}
                  {input.default !== undefined && (
                    <div className="mt-2 text-xs text-gray-500">
                      Default: <code className="text-gray-400">{String(input.default)}</code>
                    </div>
                  )}
                </div>
              ))}
              {node.inputs.length === 0 && (
                <p className="text-xs text-gray-500 italic">No inputs required</p>
              )}
            </div>
          </div>

          {/* Outputs */}
          <div>
            <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
              📤 OUTPUTS
              <span className="text-xs font-normal text-gray-500">({node.outputs.length})</span>
            </h3>
            <div className="space-y-3">
              {node.outputs.map((output) => (
                <div key={output.name} className="p-3 bg-[#1a1a1a] border border-green-900/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <code className="text-sm font-mono text-green-300">{output.name}</code>
                    <span className="text-xs font-mono text-gray-500">{output.type}</span>
                  </div>
                  <p className="text-xs text-gray-400">{output.description}</p>
                  {output.example !== undefined && (
                    <div className="mt-2 px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                      <span className="text-xs font-mono text-gray-400">
                        Example: {typeof output.example === 'object' 
                          ? JSON.stringify(output.example) 
                          : String(output.example)
                        }
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          {node.examples.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                💡 EXAMPLES
              </h3>
              <div className="space-y-3">
                {node.examples.map((example, idx) => (
                  <div key={idx} className="p-3 bg-[#1a1a1a] border border-purple-900/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-300 mb-1">
                      {example.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">{example.description}</p>
                    <pre className="text-xs font-mono text-gray-300 bg-[#0a0a0a] p-2 rounded border border-[#2a2a2a] overflow-x-auto">
                      {JSON.stringify(example.config, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded-full flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Author */}
          {node.author && (
            <div className="pt-3 border-t border-[#2a2a2a] text-xs text-gray-500">
              Created by {node.author}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-4 h-4" />
            <span>
              To use this node output in another node, reference it as{" "}
              <code className="text-blue-400">step_N.{node.outputs[0]?.name || "value"}</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
