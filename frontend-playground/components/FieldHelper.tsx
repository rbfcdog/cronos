"use client";

import { Node } from "@xyflow/react";
import { getNodeDefinition } from "@/lib/nodeRegistry";
import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

interface FieldHelperProps {
  nodes: Node[];
  selectedNodeId?: string;
}

export default function FieldHelper({ nodes, selectedNodeId }: FieldHelperProps) {
  // Group nodes by their step index
  const sortedNodes = [...nodes].sort((a, b) => {
    const aY = a.position?.y || 0;
    const bY = b.position?.y || 0;
    return aY - bY;
  });

  // Get available outputs from previous steps
  const getAvailableOutputs = (currentNodeIndex: number) => {
    const outputs: Array<{ step: number; node: Node; outputs: any[] }> = [];
    
    for (let i = 0; i < currentNodeIndex; i++) {
      const node = sortedNodes[i];
      const nodeDef = getNodeDefinition(String(node.data.actionType));
      
      if (nodeDef) {
        outputs.push({
          step: i,
          node,
          outputs: nodeDef.outputs,
        });
      }
    }
    
    return outputs;
  };

  if (!selectedNodeId) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="text-xs text-gray-500">Select a node to see connection hints</p>
      </div>
    );
  }

  const selectedIndex = sortedNodes.findIndex(n => n.id === selectedNodeId);
  const selectedNode = sortedNodes[selectedIndex];
  const nodeDef = getNodeDefinition(String(selectedNode?.data.actionType));
  
  if (!nodeDef) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">Unknown node type</p>
      </div>
    );
  }

  const availableOutputs = getAvailableOutputs(selectedIndex);
  const requiredInputs = nodeDef.inputs.filter(i => i.required);
  const optionalInputs = nodeDef.inputs.filter(i => !i.required);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Field Helper</h3>
        <div className="text-xs text-gray-500 mb-3">
          Step {selectedIndex}: {nodeDef.name}
        </div>
      </div>

      {/* Required Inputs */}
      {requiredInputs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-red-400 uppercase flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Required Inputs ({requiredInputs.length})
          </div>
          <div className="space-y-2">
            {requiredInputs.map((input) => (
              <div key={input.name} className="p-2 bg-red-900/10 border border-red-900/30 rounded text-xs">
                <div className="font-medium text-gray-300">{input.name}</div>
                <div className="text-gray-500 text-[10px] mt-0.5">{input.type} - {input.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Inputs */}
      {optionalInputs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Optional Inputs ({optionalInputs.length})
          </div>
          <div className="space-y-1">
            {optionalInputs.map((input) => (
              <div key={input.name} className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs">
                <div className="font-medium text-gray-300">{input.name}</div>
                <div className="text-gray-500 text-[10px] mt-0.5">{input.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Outputs from Previous Steps */}
      {availableOutputs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-green-400 uppercase flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Available Outputs
          </div>
          <div className="space-y-2">
            {availableOutputs.map(({ step, node, outputs }) => (
              <div key={step} className="space-y-1">
                <div className="text-[10px] text-gray-500 font-semibold">
                  Step {step}: {getNodeDefinition(String(node.data.actionType))?.name}
                </div>
                {outputs.map((output) => (
                  <div 
                    key={output.name}
                    className="p-2 bg-green-900/10 border border-green-900/30 rounded text-xs"
                  >
                    <div className="font-mono text-green-400 text-[10px]">
                      step_{step}.{output.name}
                    </div>
                    <div className="text-gray-500 text-[10px] mt-0.5">
                      {output.type} - {output.description}
                    </div>
                    {output.example && (
                      <div className="text-gray-600 text-[9px] mt-1 font-mono">
                        e.g., {typeof output.example === 'object' 
                          ? JSON.stringify(output.example)
                          : `"${output.example}"`
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {availableOutputs.length === 0 && selectedIndex > 0 && (
        <div className="p-3 bg-yellow-900/10 border border-yellow-900/30 rounded text-xs">
          <AlertCircle className="w-4 h-4 text-yellow-400 mb-1" />
          <p className="text-yellow-400 font-medium">No previous steps</p>
          <p className="text-gray-500 text-[10px] mt-1">
            Add nodes before this one to reference their outputs
          </p>
        </div>
      )}

      {/* Usage Guide */}
      <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
        <div className="text-xs font-semibold text-gray-400 mb-2">💡 How to Reference Outputs</div>
        <div className="space-y-1 text-[10px] text-gray-500">
          <div>• Use <code className="text-green-400 font-mono">step_0.balance</code> syntax</div>
          <div>• Previous step outputs only</div>
          <div>• Connect nodes with edges</div>
          <div>• Required fields must be filled</div>
        </div>
      </div>
    </div>
  );
}
