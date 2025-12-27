"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Database, Zap, Code2, SlidersHorizontal, Eye, CheckCircle, X, ChevronDown, ChevronUp, Trash2, Brain, AlertCircle } from "lucide-react";
import { getNodeDefinition } from "@/lib/nodeRegistry";

const iconMap: Record<string, any> = {
  read_balance: Database,
  x402_payment: Zap,
  contract_call: Code2,
  condition: SlidersHorizontal,
  read_state: Eye,
  approve_token: CheckCircle,
  llm_agent: Brain,
};

const colorMap: Record<string, string> = {
  read_balance: "from-blue-500 to-blue-600",
  x402_payment: "from-purple-500 to-purple-600",
  contract_call: "from-green-500 to-green-600",
  condition: "from-yellow-500 to-yellow-600",
  read_state: "from-cyan-500 to-cyan-600",
  approve_token: "from-pink-500 to-pink-600",
  llm_agent: "from-indigo-500 to-purple-600",
};

function WorkflowNode({ data, id }: NodeProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for better UX
  const [params, setParams] = useState<Record<string, any>>(data.params || {});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { deleteElements, updateNodeData } = useReactFlow();

  const actionType = String(data.actionType || "");
  const nodeDef = getNodeDefinition(actionType);

  const Icon = iconMap[actionType] || Database;
  const gradient = colorMap[actionType] || "from-gray-500 to-gray-600";

  // Update parent node data when params change
  useEffect(() => {
    updateNodeData(id, { params });
  }, [params, id, updateNodeData]);

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleParamChange = (key: string, value: string) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      const newErrors = { ...validationErrors };
      delete newErrors[key];
      setValidationErrors(newErrors);
    }
  };

  const validateField = (input: any, value: string) => {
    if (input.required && !value) {
      return "Required field";
    }
    
    if (value && input.validation?.pattern && !input.validation.pattern.test(value)) {
      return "Invalid format";
    }
    
    if (value && input.type === "number") {
      const num = parseFloat(value);
      if (isNaN(num)) return "Must be a number";
      if (input.validation?.min !== undefined && num < input.validation.min) {
        return `Min: ${input.validation.min}`;
      }
      if (input.validation?.max !== undefined && num > input.validation.max) {
        return `Max: ${input.validation.max}`;
      }
    }
    
    return null;
  };

  const renderDynamicFields = () => {
    if (!nodeDef) return null;

    return (
      <div className="space-y-3">
        {/* Inputs Section */}
        <div>
          <div className="text-[10px] font-semibold text-blue-400 uppercase mb-2 flex items-center gap-1">
            <span>📥</span> Inputs
          </div>
          <div className="space-y-2">
            {nodeDef.inputs.map((input) => {
              const error = validationErrors[input.name];
              const hasError = !!error;
              
              return (
                <div key={input.name} className="space-y-1">
                  <label className="text-[10px] text-gray-400 flex items-center gap-1">
                    {input.required && <span className="text-red-400">*</span>}
                    {input.name}
                    <span className="text-gray-600">({input.type})</span>
                  </label>
                  
                  {input.type === "json" ? (
                    <textarea
                      placeholder={input.placeholder || input.description}
                      value={params[input.name] || input.default || ""}
                      onChange={(e) => handleParamChange(input.name, e.target.value)}
                      onBlur={(e) => {
                        const err = validateField(input, e.target.value);
                        if (err) {
                          setValidationErrors({ ...validationErrors, [input.name]: err });
                        }
                      }}
                      rows={2}
                      className={`w-full px-2 py-1.5 bg-[#0a0a0a] border ${
                        hasError ? "border-red-500/50" : "border-[#2a2a2a]"
                      } rounded text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 resize-none font-mono`}
                    />
                  ) : (
                    <input
                      type={input.type === "number" ? "number" : "text"}
                      placeholder={input.placeholder || input.description}
                      value={params[input.name] || input.default || ""}
                      onChange={(e) => handleParamChange(input.name, e.target.value)}
                      onBlur={(e) => {
                        const err = validateField(input, e.target.value);
                        if (err) {
                          setValidationErrors({ ...validationErrors, [input.name]: err });
                        }
                      }}
                      className={`w-full px-2 py-1.5 bg-[#0a0a0a] border ${
                        hasError ? "border-red-500/50" : "border-[#2a2a2a]"
                      } rounded text-xs text-gray-300 focus:outline-none focus:border-blue-500/50`}
                    />
                  )}
                  
                  {hasError && (
                    <div className="flex items-center gap-1 text-[9px] text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </div>
                  )}
                  
                  {!hasError && input.description && (
                    <div className="text-[9px] text-gray-600 italic">{input.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Outputs Section */}
        <div>
          <div className="text-[10px] font-semibold text-green-400 uppercase mb-2 flex items-center gap-1">
            <span>📤</span> Outputs
          </div>
          <div className="space-y-1">
            {nodeDef.outputs.map((output) => (
              <div key={output.name} className="flex items-start gap-1 text-[10px]">
                <span className="text-green-500 mt-0.5">→</span>
                <div className="flex-1">
                  <span className="text-gray-300 font-medium">{output.name}</span>
                  <span className="text-gray-600 ml-1">({output.type})</span>
                  {output.description && (
                    <div className="text-gray-600 italic text-[9px] mt-0.5">{output.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg min-w-50 shadow-lg">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Node Header */}
      <div className="flex items-center gap-2 p-3 border-b border-[#2a2a2a]">
        <div className={`p-1.5 bg-linear-to-br ${gradient} rounded`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-200 flex-1">{String(data.label)}</span>
        
        <button
          onClick={handleDelete}
          className="p-0.5 hover:bg-red-500/20 rounded transition-colors group"
          title="Delete node"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400" />
        </button>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-[#2a2a2a] rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded Fields */}
      {isExpanded && (
        <div className="p-3 border-t border-[#2a2a2a]">
          {renderDynamicFields()}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

export default memo(WorkflowNode);
