"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import BlockItem from "./BlockItem";
import { BlockType } from "@/lib/types";
import { ArrowDown } from "lucide-react";

interface PlanCanvasProps {
  blocks: BlockType[];
  removeBlock: (id: string) => void;
  updateBlock: (id: string, data: any) => void;
}

export default function PlanCanvas({ blocks, removeBlock, updateBlock }: PlanCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: "canvas",
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-white rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Execution Plan</h2>
        <span className="text-sm text-gray-500">
          {blocks.length} {blocks.length === 1 ? "action" : "actions"}
        </span>
      </div>

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg font-medium">Drop blocks here to start building</p>
          <p className="text-sm mt-2">Drag action blocks from the left panel</p>
        </div>
      ) : (
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div key={block.id}>
                <BlockItem
                  block={block}
                  onRemove={() => removeBlock(block.id)}
                  onUpdate={(data) => updateBlock(block.id, data)}
                />
                {index < blocks.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
