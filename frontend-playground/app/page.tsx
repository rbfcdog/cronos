"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Header from "@/components/Header";
import NodePalette from "@/components/NodePalette";
import WorkflowNode from "@/components/WorkflowNode";
import SimulatorPanel from "@/components/SimulatorPanel";
import JsonOutput from "@/components/JsonOutput";
import TraceViewer from "@/components/TraceViewer";
import UnifiedStatePanel from "@/components/UnifiedStatePanel";
import ConnectionMap from "@/components/ConnectionMap";
import FieldHelper from "@/components/FieldHelper";
import WorkflowTemplateSelector from "@/components/WorkflowTemplateSelector";
import AgentDashboard from "@/components/AgentDashboard";
import AIAgentTester from "@/components/AIAgentTester";
import type { ExecutionPlan, ExecutionTrace, UnifiedState } from "@/lib/types";
import type { WorkflowTemplate } from "@/lib/workflow-templates";

const nodeTypes = {
  workflow: WorkflowNode,
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [executionTrace, setExecutionTrace] = useState<ExecutionTrace | null>(null);
  const [unifiedState, setUnifiedState] = useState<UnifiedState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mode, setMode] = useState<"simulate" | "execute">("simulate");
  const [executionStatus, setExecutionStatus] = useState<Record<string, "pending" | "running" | "success" | "error">>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [currentAgentType, setCurrentAgentType] = useState<"recurring-payment" | "portfolio-rebalancing" | "treasury-management" | "multi-agent" | undefined>(undefined);
  const [previewPlan, setPreviewPlan] = useState<ExecutionPlan>({
    mode: "simulate",
    planId: "plan_preview",
    actions: [],
    context: { chainId: 338, timestamp: 0 },
    description: "No actions yet",
  });

  // Update node and edge styles based on execution status
  useEffect(() => {
    // Only update if there's execution status to show
    if (Object.keys(executionStatus).length === 0) return;

    setNodes((nds) =>
      nds.map((node, index) => ({
        ...node,
        style: {
          ...node.style,
          borderColor: 
            executionStatus[index] === "running" ? "#3b82f6" :
            executionStatus[index] === "success" ? "#10b981" :
            executionStatus[index] === "error" ? "#ef4444" :
            "#2a2a2a",
          borderWidth: executionStatus[index] ? "2px" : "1px",
          boxShadow: 
            executionStatus[index] === "running" ? "0 0 20px rgba(59, 130, 246, 0.5)" :
            executionStatus[index] === "success" ? "0 0 20px rgba(16, 185, 129, 0.5)" :
            executionStatus[index] === "error" ? "0 0 20px rgba(239, 68, 68, 0.5)" :
            "none",
        },
      }))
    );
    
    // Update edge styles based on execution
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceIndex = nodes.findIndex(n => n.id === edge.source);
        const targetIndex = nodes.findIndex(n => n.id === edge.target);
        const sourceStatus = executionStatus[sourceIndex];
        const targetStatus = executionStatus[targetIndex];
        
        // Edge is active if source is complete and target is running/complete
        const isActive = sourceStatus === "success" && 
                        (targetStatus === "running" || targetStatus === "success");
        
        return {
          ...edge,
          animated: isActive,
          style: {
            ...edge.style,
            stroke: isActive ? "#10b981" : 
                   sourceStatus === "error" ? "#ef4444" : 
                   "#3b82f6",
            strokeWidth: isActive ? 3 : 2,
            opacity: isActive ? 1 : 0.5,
          },
        };
      })
    );
  }, [executionStatus]); // Only depend on executionStatus, not nodes/edges

  // Update preview plan when nodes or mode changes (client-side only)
  useEffect(() => {
    setPreviewPlan({
      mode,
      planId: "plan_preview",
      actions: nodes.map((node) => ({
        type: node.data.actionType as any,
        ...(node.data.params || {}),
      })),
      context: {
        chainId: 338,
        timestamp: 0, // Static for preview
      },
      description: `${mode === "simulate" ? "Simulation" : "Execution"} plan with ${nodes.length} actions`,
    });
  }, [mode, nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Get source and target nodes to determine data flow
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      // Create edge with label showing data flow
      const newEdge: Edge = {
        ...params,
        id: `edge_${params.source}_${params.target}`,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: '#3b82f6',
          strokeWidth: 2,
        },
        label: sourceNode ? `${sourceNode.data.actionType} → data` : undefined,
        labelStyle: { 
          fill: '#3b82f6', 
          fontWeight: 600,
          fontSize: 10,
        },
        labelBgStyle: {
          fill: '#0a0a0a',
          fillOpacity: 0.8,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: "workflow",
        position,
        data: {
          actionType: type,
          label: type.replace(/_/g, " "),
          params: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                params: { ...(node.data.params || {}), ...newData }
              }
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const loadExampleWorkflow = useCallback((exampleId: string = "ai-workflow") => {
    let exampleNodes: Node[] = [];
    let exampleEdges: Edge[] = [];

    switch (exampleId) {
      case "basic":
        // Simple: Balance check → Payment
        exampleNodes = [
          {
            id: "node-1",
            type: "workflow",
            position: { x: 150, y: 100 },
            data: {
              label: "1. Check Balance",
              actionType: "read_balance",
              params: { token: "TCRO" },
            },
          },
          {
            id: "node-2",
            type: "workflow",
            position: { x: 150, y: 250 },
            data: {
              label: "2. Send Payment",
              actionType: "x402_payment",
              params: {
                to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
                amount: "5",
                token: "TCRO",
              },
            },
          },
        ];
        exampleEdges = [
          { id: "edge-1", source: "node-1", target: "node-2", animated: true },
        ];
        break;

      case "defi-swap":
        // Complex: Balance → Approve → Contract Call (swap) → Verify
        exampleNodes = [
          {
            id: "node-1",
            type: "workflow",
            position: { x: 100, y: 50 },
            data: {
              label: "1. Check USDC Balance",
              actionType: "read_balance",
              params: { token: "USDC" },
            },
          },
          {
            id: "node-2",
            type: "workflow",
            position: { x: 400, y: 50 },
            data: {
              label: "2. Check Router State",
              actionType: "read_state",
              params: { contract: "SwapRouter" },
            },
          },
          {
            id: "node-3",
            type: "workflow",
            position: { x: 250, y: 180 },
            data: {
              label: "3. Approve USDC",
              actionType: "approve_token",
              params: {
                token: "USDC",
                amount: "100",
                contract: "SwapRouter",
              },
            },
          },
          {
            id: "node-4",
            type: "workflow",
            position: { x: 250, y: 320 },
            data: {
              label: "4. Execute Swap",
              actionType: "contract_call",
              params: {
                contract: "SwapRouter",
                method: "swapExactTokensForTokens",
              },
            },
          },
          {
            id: "node-5",
            type: "workflow",
            position: { x: 250, y: 460 },
            data: {
              label: "5. Verify New Balance",
              actionType: "read_balance",
              params: { token: "TCRO" },
            },
          },
        ];
        exampleEdges = [
          { id: "edge-1", source: "node-1", target: "node-3", animated: true },
          { id: "edge-2", source: "node-2", target: "node-3", animated: true },
          { id: "edge-3", source: "node-3", target: "node-4", animated: true },
          { id: "edge-4", source: "node-4", target: "node-5", animated: true },
        ];
        break;

      case "conditional":
        // Conditional: Balance → Condition → Two paths (high/low amount)
        exampleNodes = [
          {
            id: "node-1",
            type: "workflow",
            position: { x: 250, y: 50 },
            data: {
              label: "1. Check Balance",
              actionType: "read_balance",
              params: { token: "TCRO" },
            },
          },
          {
            id: "node-2",
            type: "workflow",
            position: { x: 250, y: 180 },
            data: {
              label: "2. Check Amount",
              actionType: "condition",
              params: {
                condition: "balance > 100",
                variable: "step_0.balance",
              },
            },
          },
          {
            id: "node-3",
            type: "workflow",
            position: { x: 100, y: 320 },
            data: {
              label: "3a. Large Payment",
              actionType: "x402_payment",
              params: {
                amount: "50",
                token: "TCRO",
                to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
              },
            },
          },
          {
            id: "node-4",
            type: "workflow",
            position: { x: 400, y: 320 },
            data: {
              label: "3b. Small Payment",
              actionType: "x402_payment",
              params: {
                amount: "5",
                token: "TCRO",
                to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
              },
            },
          },
        ];
        exampleEdges = [
          { id: "edge-1", source: "node-1", target: "node-2", animated: true },
          { id: "edge-2", source: "node-2", target: "node-3", label: "true", animated: true },
          { id: "edge-3", source: "node-2", target: "node-4", label: "false", animated: true },
        ];
        break;

      case "ai-workflow":
      default:
        // AI-powered: Balance → State → LLM Agent → Payment
        exampleNodes = [
          {
            id: "node-1",
            type: "workflow",
            position: { x: 100, y: 50 },
            data: {
              label: "1. Check Balance",
              actionType: "read_balance",
              params: { token: "TCRO" },
            },
          },
          {
            id: "node-2",
            type: "workflow",
            position: { x: 400, y: 50 },
            data: {
              label: "2. Read Contract State",
              actionType: "read_state",
              params: {
                contract: "ExecutionRouter",
              },
            },
          },
          {
            id: "node-3",
            type: "workflow",
            position: { x: 250, y: 200 },
            data: {
              label: "3. LLM Risk Analysis",
              actionType: "llm_agent",
              params: {
                prompt: "Analyze the wallet balance and contract state. Calculate the optimal payment amount considering: 1) Keep at least 30% as safety buffer, 2) Gas costs (~0.01 TCRO), 3) Contract deployment status. Respond with JSON: {amount: number, shouldExecute: boolean, reason: string}",
                context: '{"balance": "step_0.balance", "contractState": "step_1.state", "recipient": "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7"}',
                model: "gpt-4",
                temperature: "0.3",
              },
            },
          },
          {
            id: "node-4",
            type: "workflow",
            position: { x: 250, y: 380 },
            data: {
              label: "4. Execute Payment",
              actionType: "x402_payment",
              params: {
                to: "0xB3fdA213Ad32798724aA7aF685a8DD46f3cbd7f7",
                amount: "0.5",
                token: "TCRO",
              },
            },
          },
        ];
        exampleEdges = [
          { id: "edge-1-3", source: "node-1", target: "node-3", label: "balance", animated: true, style: { stroke: "#3b82f6" } },
          { id: "edge-2-3", source: "node-2", target: "node-3", label: "state", animated: true, style: { stroke: "#10b981" } },
          { id: "edge-3-4", source: "node-3", target: "node-4", label: "decision", animated: true, style: { stroke: "#8b5cf6" } },
        ];
        break;
    }

    setNodes(exampleNodes);
    setEdges(exampleEdges);
    setExecutionStatus({});
  }, [setNodes, setEdges]);

  const loadFromTemplate = useCallback((template: WorkflowTemplate) => {
    // Convert template actions to workflow nodes
    const templateNodes: Node[] = template.plan.actions.map((action, index) => {
      // Create params without type, stepId, and description
      const { type, stepId, description, ...cleanParams } = action as any;
      
      return {
        id: `node-${index + 1}`,
        type: "workflow",
        position: { 
          x: 250, 
          y: 100 + (index * 150) // Stack vertically with 150px spacing
        },
        data: {
          label: `${index + 1}. ${action.description || action.type}`,
          actionType: action.type,
          params: cleanParams,
        },
      };
    });

    // Create sequential edges connecting all nodes
    const templateEdges: Edge[] = [];
    for (let i = 0; i < templateNodes.length - 1; i++) {
      templateEdges.push({
        id: `edge-${i + 1}`,
        source: templateNodes[i].id,
        target: templateNodes[i + 1].id,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      });
    }

    setNodes(templateNodes);
    setEdges(templateEdges);
    setExecutionStatus({});
    setShowTemplates(false); // Close modal after loading
    
    // Detect agent type from template
    const agentTypeMap: Record<string, "recurring-payment" | "portfolio-rebalancing" | "treasury-management" | "multi-agent"> = {
      "recurring-payment-simple": "recurring-payment",
      "recurring-payment-multi": "recurring-payment",
      "portfolio-rebalance-basic": "portfolio-rebalancing",
      "portfolio-rebalance-advanced": "portfolio-rebalancing",
      "treasury-basic": "treasury-management",
      "treasury-advanced": "treasury-management",
      "multi-agent-orchestration": "multi-agent",
    };
    setCurrentAgentType(agentTypeMap[template.id]);
    
    // Show success notification
    console.log(`✅ Loaded template: ${template.name}`);
  }, [setNodes, setEdges]);

  const buildExecutionPlan = useCallback((): ExecutionPlan => {
    // Build execution order based on graph topology
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const executionOrder: Node[] = [];
    const visited = new Set<string>();
    
    // Build adjacency list from edges
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
    
    // Topological sort (Kahn's algorithm)
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
    
    // If not all nodes visited, there's a cycle or disconnected nodes
    // Add remaining nodes in original order
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        executionOrder.push(node);
      }
    });
    
    const plan = {
      mode,
      planId: `plan_${Date.now()}`,
      actions: executionOrder.map((node, index) => ({
        type: node.data.actionType as any,
        stepId: `step_${index}`,
        ...(node.data.params || {}),
      })),
      context: {
        chainId: 338,
        timestamp: Date.now(),
      },
      description: `${mode === "simulate" ? "Simulation" : "Execution"} plan with ${executionOrder.length} actions`,
    };
    
    console.log("📋 Execution Plan:", JSON.stringify(plan, null, 2));
    return plan;
  }, [mode, nodes, edges]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setExecutionStatus({}); // Reset status
    setExecutionTrace(null); // Clear previous trace
    
    try {
      const executionPlan = buildExecutionPlan();
      
      // Set all nodes to pending
      const initialStatus: Record<string, "pending"> = {};
      nodes.forEach((_, index) => {
        initialStatus[index] = "pending";
      });
      setExecutionStatus(initialStatus);
      
      const response = await fetch("http://localhost:3000/api/playground/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(executionPlan),
      });
      const data = await response.json();
      
      // Update status based on trace
      if (data.trace?.steps) {
        const newStatus: Record<string, "pending" | "running" | "success" | "error"> = {};
        data.trace.steps.forEach((step: any, index: number) => {
          newStatus[index] = step.status === "success" ? "success" : 
                            step.status === "error" ? "error" : "pending";
        });
        setExecutionStatus(newStatus);
      }
      
      setExecutionTrace(data.trace);
      setUnifiedState(data.virtualState);
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecute = async () => {
    setIsSimulating(true);
    setExecutionStatus({}); // Reset status
    setExecutionTrace(null); // Clear previous trace
    
    try {
      const executionPlan = buildExecutionPlan();
      
      // Set all nodes to pending
      const initialStatus: Record<string, "pending"> = {};
      nodes.forEach((_, index) => {
        initialStatus[index] = "pending";
      });
      setExecutionStatus(initialStatus);
      
      const response = await fetch("http://localhost:3000/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(executionPlan),
      });
      const data = await response.json();
      
      // Update status based on trace
      if (data.trace?.steps) {
        const newStatus: Record<string, "pending" | "running" | "success" | "error"> = {};
        data.trace.steps.forEach((step: any, index: number) => {
          newStatus[index] = step.status === "success" ? "success" : 
                            step.status === "error" ? "error" : "pending";
        });
        setExecutionStatus(newStatus);
      }
      
      setExecutionTrace(data.trace);
      setUnifiedState(data.state);
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const isValidPlan = nodes.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <Header 
        onLoadExample={loadExampleWorkflow}
        onShowTemplates={() => setShowTemplates(true)}
        onShowAIAgent={() => setShowAIAgent(true)}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Node Palette */}
        <div className="w-64 bg-[#0f0f0f] border-r border-[#2a2a2a] shrink-0 flex flex-col">
          <div className="overflow-y-auto flex-1 p-4">
            <NodePalette />
          </div>
        </div>

        {/* Center - React Flow Canvas */}
        <div className="flex-1 relative">{/* Execution Status Overlay */}
          {/* Execution Status Overlay */}
          {isSimulating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#1a1a1a] border border-blue-500 rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200" />
                </div>
                <span className="text-sm font-medium text-blue-300">
                  {mode === "simulate" ? "Simulating..." : "Executing on-chain..."}
                </span>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-400">
                    ✓ {Object.values(executionStatus).filter(s => s === "success").length}
                  </span>
                  <span className="text-red-400">
                    ✗ {Object.values(executionStatus).filter(s => s === "error").length}
                  </span>
                  <span className="text-gray-500">
                    / {nodes.length}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0a0a0a]"
          >
            <Background color="#1a1a1a" gap={16} />
            <Controls className="bg-[#1a1a1a] border border-[#2a2a2a]" />
            <MiniMap className="bg-[#1a1a1a] border border-[#2a2a2a]" nodeColor="#2a2a2a" />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Controls & Output */}
        <div className="w-96 bg-[#0f0f0f] border-l border-[#2a2a2a] overflow-y-auto">
          <div className="p-4 space-y-4">
            <SimulatorPanel
              mode={mode}
              setMode={setMode}
              onSimulate={handleSimulate}
              onExecute={handleExecute}
              isLoading={isSimulating}
              isValidPlan={isValidPlan}
            />
            <FieldHelper nodes={nodes} selectedNodeId={selectedNodeId || undefined} />
            <ConnectionMap nodes={nodes} edges={edges} />
            <JsonOutput plan={previewPlan} />
          </div>
        </div>
      </div>

      {/* Bottom Panel - Trace & State & Agent Dashboard */}
      <div className="fixed bottom-0 left-0 right-0 h-80 bg-[#2a2a2a] border-t border-[#2a2a2a] grid grid-cols-3 gap-px">
        <div className="bg-[#0f0f0f] overflow-y-auto">
          <TraceViewer trace={executionTrace} isLoading={isSimulating} />
        </div>
        <div className="bg-[#0f0f0f] overflow-y-auto">
          <UnifiedStatePanel state={unifiedState} />
        </div>
        <div className="bg-[#0f0f0f] overflow-y-auto">
          <AgentDashboard trace={executionTrace} agentType={currentAgentType} />
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <div>
                <h2 className="text-xl font-bold text-gray-100">🤖 Agent Workflow Templates</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pre-built workflows showcasing specialized agents
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <WorkflowTemplateSelector onLoadTemplate={loadFromTemplate} />
            </div>
          </div>
        </div>
      )}

      {/* AI Agent Tester Modal */}
      {showAIAgent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <div>
                <h2 className="text-xl font-bold text-gray-100">🧠 AI Agent SDK Tester</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Test the Crypto.com AI Agent SDK directly
                </p>
              </div>
              <button
                onClick={() => setShowAIAgent(false)}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <AIAgentTester />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
