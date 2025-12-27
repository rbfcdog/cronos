"use client";

import { useDraggable } from "@dnd-kit/core";
import { Database, Zap, Code2, SlidersHorizontal, Eye, CheckCircle } from "lucide-react";
import { ActionType } from "@/lib/types";

interface PaletteItem {
  id: ActionType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const paletteItems: PaletteItem[] = [
  {
    id: "read_balance",
    label: "Read Balance",
    icon: <Database className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "x402_payment",
    label: "x402 Payment",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "contract_call",
    label: "Contract Call",
    icon: <Code2 className="w-5 h-5" />,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    id: "condition",
    label: "Condition",
    icon: <SlidersHorizontal className="w-5 h-5" />,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "read_state",
    label: "Read State",
    icon: <Eye className="w-5 h-5" />,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  {
    id: "approve_token",
    label: "Approve Token",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
];

function DraggableBlock({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 rounded-lg border-2 cursor-move
        transition-all hover:scale-105 hover:shadow-md
        ${item.color}
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
    >
      {item.icon}
      <span className="text-sm font-medium">{item.label}</span>
    </div>
  );
}

export default function DragPalette() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Action Blocks
      </h2>
      <div className="space-y-2">
        {paletteItems.map((item) => (
          <DraggableBlock key={item.id} item={item} />
        ))}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Drag blocks to the canvas to build your execution plan
        </p>
      </div>
    </div>
  );
}
