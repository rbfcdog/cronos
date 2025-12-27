"use client";

import { useState } from "react";
import { Database, Zap, Code2, SlidersHorizontal, Eye, CheckCircle, Info, Brain } from "lucide-react";
import { getNodeDefinition } from "@/lib/nodeRegistry";
import NodeDocModal from "./NodeDocModal";

const actionTypes = [
  { id: "read_balance", label: "Read Balance", icon: Database, color: "from-blue-500 to-blue-600" },
  { id: "x402_payment", label: "x402 Payment", icon: Zap, color: "from-purple-500 to-purple-600" },
  { id: "contract_call", label: "Contract Call", icon: Code2, color: "from-green-500 to-green-600" },
  { id: "read_state", label: "Read State", icon: Eye, color: "from-cyan-500 to-cyan-600" },
  { id: "condition", label: "Condition", icon: SlidersHorizontal, color: "from-yellow-500 to-yellow-600" },
  { id: "approve_token", label: "Approve Token", icon: CheckCircle, color: "from-pink-500 to-pink-600" },
  { id: "llm_agent", label: "LLM Agent", icon: Brain, color: "from-indigo-500 to-purple-600" },
];

export default function NodePalette() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleInfoClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNodeId(nodeId);
    setShowDocs(true);
  };

  const getNodeSpecs = (nodeId: string) => {
    const nodeDef = getNodeDefinition(nodeId);
    if (!nodeDef) return null;

    const requiredInputs = nodeDef.inputs.filter(i => i.required).length;
    const totalInputs = nodeDef.inputs.length;
    const outputs = nodeDef.outputs.length;

    return { requiredInputs, totalInputs, outputs };
  };

  return (
    <>
      <div className="space-y-3">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Action Nodes</h3>
          <p className="text-xs text-gray-500">Drag nodes onto the canvas</p>
        </div>

        {actionTypes.map((action) => {
          const Icon = action.icon;
          const specs = getNodeSpecs(action.id);
          const isHovered = hoveredNodeId === action.id;
          
          return (
            <div key={action.id} className="relative">
              <div
                draggable
                onDragStart={(e) => onDragStart(e, action.id)}
                onMouseEnter={() => setHoveredNodeId(action.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg cursor-grab hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-all group"
              >
                <div className={`p-2 bg-linear-to-br ${action.color} rounded-lg shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-300 group-hover:text-gray-100 block">
                    {action.label}
                  </span>
                  {specs && (
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <span>📥 {specs.requiredInputs}/{specs.totalInputs}</span>
                      <span>📤 {specs.outputs}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => handleInfoClick(action.id, e)}
                  className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="View documentation"
                >
                  <Info className="w-4 h-4 text-blue-400" />
                </button>
              </div>

              {/* Quick Preview Tooltip */}
              {isHovered && specs && (
                <div className="absolute left-full ml-2 top-0 z-50 w-64 p-3 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-xl pointer-events-none">
                  <div className="text-xs font-semibold text-gray-200 mb-2">{action.label}</div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold text-blue-400 uppercase mb-1">Inputs ({specs.totalInputs})</div>
                      <div className="text-[10px] text-gray-400">
                        {getNodeDefinition(action.id)?.inputs.slice(0, 3).map((input) => (
                          <div key={input.name} className="flex items-start gap-1 mb-1">
                            <span className={input.required ? "text-red-400" : "text-gray-500"}>•</span>
                            <span className="text-gray-300">{input.name}</span>
                            <span className="text-gray-500">({input.type})</span>
                          </div>
                        ))}
                        {(getNodeDefinition(action.id)?.inputs.length || 0) > 3 && (
                          <div className="text-gray-600 italic">+{(getNodeDefinition(action.id)?.inputs.length || 0) - 3} more...</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold text-green-400 uppercase mb-1">Outputs ({specs.outputs})</div>
                      <div className="text-[10px] text-gray-400">
                        {getNodeDefinition(action.id)?.outputs.slice(0, 3).map((output) => (
                          <div key={output.name} className="flex items-start gap-1 mb-1">
                            <span className="text-green-500">→</span>
                            <span className="text-gray-300">{output.name}</span>
                            <span className="text-gray-500">({output.type})</span>
                          </div>
                        ))}
                        {(getNodeDefinition(action.id)?.outputs.length || 0) > 3 && (
                          <div className="text-gray-600 italic">+{(getNodeDefinition(action.id)?.outputs.length || 0) - 3} more...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#2a2a2a] text-[10px] text-gray-500">
                    <span className="text-red-400">• Required</span> | <span className="text-gray-500">• Optional</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-6 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <p className="text-xs text-gray-500">
            💡 <span className="text-gray-400">Tips:</span>
          </p>
          <ul className="text-[10px] text-gray-500 mt-2 space-y-1 ml-4">
            <li>• Hover to see inputs/outputs</li>
            <li>• Click <Info className="w-3 h-3 inline text-blue-400" /> for full docs</li>
            <li>• Drag to canvas to add node</li>
            <li>• Connect outputs to inputs</li>
          </ul>
        </div>
      </div>

      {/* Documentation Modal */}
      {selectedNodeId && (
        <NodeDocModal
          node={getNodeDefinition(selectedNodeId)!}
          isOpen={showDocs}
          onClose={() => setShowDocs(false)}
        />
      )}
    </>
  );
}
