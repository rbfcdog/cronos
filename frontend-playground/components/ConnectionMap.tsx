"use client";

import { ArrowRight, Network, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

interface ConnectionMapProps {
  nodes: Node[];
  edges: Edge[];
}

export default function ConnectionMap({ nodes, edges }: ConnectionMapProps) {
  // Build adjacency list
  const connections = new Map<string, string[]>();
  edges.forEach(edge => {
    if (edge.source && edge.target) {
      if (!connections.has(edge.source)) {
        connections.set(edge.source, []);
      }
      connections.get(edge.source)?.push(edge.target);
    }
  });

  // Get node label by id
  const getNodeLabel = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return String(node?.data?.label || nodeId);
  };

  // Get node action type
  const getNodeType = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return String(node?.data?.actionType || "");
  };

  // Find execution order
  const getExecutionOrder = () => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const executionOrder: Node[] = [];
    const visited = new Set<string>();
    
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    edges.forEach(edge => {
      if (edge.source && edge.target) {
        graph.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId);
      if (node) executionOrder.push(node);
      visited.add(nodeId);
      
      graph.get(nodeId)?.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      });
    }
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        executionOrder.push(node);
      }
    });
    
    return executionOrder;
  };

  const executionOrder = getExecutionOrder();
  const hasDisconnectedNodes = executionOrder.length !== nodes.length || 
                                nodes.some(n => !connections.has(n.id) && edges.length > 0);

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center">
        <Network className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No nodes yet</p>
        <p className="text-xs text-gray-600 mt-1">Add nodes to see connections</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Network className="w-4 h-4" />
          Connection Map
        </h3>
        <span className="text-xs text-gray-500">
          {edges.length} {edges.length === 1 ? 'connection' : 'connections'}
        </span>
      </div>

      {/* Execution Order */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <CheckCircle2 className="w-3 h-3" />
          Execution Order
        </div>
        <div className="space-y-1">
          {executionOrder.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded border border-[#2a2a2a] text-xs">
              <span className="font-mono text-gray-500 min-w-8">
                {index + 1}.
              </span>
              <span className="font-medium text-gray-300 flex-1">
                {String(node.data?.label || node.id)}
              </span>
              <span className="text-xs font-mono text-blue-400">
                {String(node.data?.actionType)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Details */}
      {edges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <ArrowRight className="w-3 h-3" />
            Data Flow
          </div>
          <div className="space-y-2">
            {Array.from(connections.entries()).map(([sourceId, targets]) => (
              <div key={sourceId} className="p-2 bg-[#1a1a1a] rounded border border-[#2a2a2a]">
                <div className="text-xs font-medium text-gray-300 mb-2">
                  {getNodeLabel(sourceId)}
                  <span className="ml-2 text-xs font-mono text-gray-500">
                    ({getNodeType(sourceId)})
                  </span>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-blue-500/30">
                  {targets.map(targetId => (
                    <div key={targetId} className="flex items-center gap-2 text-xs">
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <span className="text-gray-400">{getNodeLabel(targetId)}</span>
                      <span className="text-xs font-mono text-gray-600">
                        ({getNodeType(targetId)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning for disconnected nodes */}
      {hasDisconnectedNodes && edges.length > 0 && (
        <div className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-300">Disconnected Nodes</div>
            <div className="text-yellow-400/80 mt-1">
              Some nodes are not connected. They will execute in their original order.
            </div>
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
        <p className="text-xs text-gray-500">
          💡 <span className="text-gray-400">Tip:</span> Connect nodes to pass data between them. 
          Use <code className="text-blue-400 bg-[#0a0a0a] px-1 py-0.5 rounded">step_N.outputKey</code> to reference outputs.
        </p>
      </div>
    </div>
  );
}
