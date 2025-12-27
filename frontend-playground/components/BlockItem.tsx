"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BlockType } from "@/lib/types";
import { Database, Zap, Code2, SlidersHorizontal, Eye, CheckCircle, X, GripVertical } from "lucide-react";
import { useState } from "react";

const iconMap = {
  read_balance: <Database className="w-5 h-5" />,
  x402_payment: <Zap className="w-5 h-5" />,
  contract_call: <Code2 className="w-5 h-5" />,
  condition: <SlidersHorizontal className="w-5 h-5" />,
  read_state: <Eye className="w-5 h-5" />,
  approve_token: <CheckCircle className="w-5 h-5" />,
};

const colorMap = {
  read_balance: "bg-blue-50 border-blue-200",
  x402_payment: "bg-purple-50 border-purple-200",
  contract_call: "bg-emerald-50 border-emerald-200",
  condition: "bg-amber-50 border-amber-200",
  read_state: "bg-cyan-50 border-cyan-200",
  approve_token: "bg-rose-50 border-rose-200",
};

interface BlockItemProps {
  block: BlockType;
  onRemove: () => void;
  onUpdate: (data: Record<string, any>) => void;
}

export default function BlockItem({ block, onRemove, onUpdate }: BlockItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 ${colorMap[block.type]} overflow-hidden`}
    >
      <div className="flex items-center gap-3 p-4">
        <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </button>
        
        {iconMap[block.type]}
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 capitalize">
            {block.type.replace(/_/g, " ")}
          </h3>
          {Object.keys(block.data).length > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {Object.entries(block.data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ")}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white rounded border border-gray-300 hover:bg-gray-50"
        >
          {expanded ? "Hide" : "Edit"}
        </button>
        
        <button
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-white space-y-3">
          {block.type === "read_balance" && (
            <input
              type="text"
              placeholder="Token (e.g., TCRO)"
              value={block.data.token || ""}
              onChange={(e) => onUpdate({ token: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          
          {block.type === "x402_payment" && (
            <>
              <input
                type="text"
                placeholder="Recipient Address (0x...)"
                value={block.data.to || ""}
                onChange={(e) => onUpdate({ to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Amount"
                value={block.data.amount || ""}
                onChange={(e) => onUpdate({ amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Token (e.g., TCRO)"
                value={block.data.token || "TCRO"}
                onChange={(e) => onUpdate({ token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </>
          )}
          
          {block.type === "contract_call" && (
            <>
              <input
                type="text"
                placeholder="Contract Name"
                value={block.data.contract || ""}
                onChange={(e) => onUpdate({ contract: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Method Name"
                value={block.data.method || ""}
                onChange={(e) => onUpdate({ method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
