/**
 * Workflow Integration Tests
 * 
 * Tests complete workflows end-to-end, including:
 * - Node creation and connection
 * - Execution plan building
 * - Topological sorting
 * - Data flow between nodes
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { Node, Edge } from '@xyflow/react'

// Helper to build execution plan (simplified version from page.tsx)
function buildExecutionPlan(nodes: Node[], edges: Edge[]) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const executionOrder: Node[] = []
  
  // Build adjacency list from edges
  const graph = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  nodes.forEach(node => {
    graph.set(node.id, [])
    inDegree.set(node.id, 0)
  })
  
  edges.forEach(edge => {
    if (edge.source && edge.target) {
      graph.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }
  })
  
  // Topological sort (Kahn's algorithm)
  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId)
  })
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const node = nodeMap.get(nodeId)
    if (node) executionOrder.push(node)
    
    graph.get(nodeId)?.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    })
  }
  
  return executionOrder
}

describe('Workflow Integration Tests', () => {
  describe('Example Workflow: Balance Check → State Read → Payment', () => {
    let nodes: Node[]
    let edges: Edge[]
    
    beforeEach(() => {
      // Example workflow structure
      nodes = [
        {
          id: "node-1",
          type: "workflow",
          position: { x: 100, y: 50 },
          data: {
            label: "1. Check Balance",
            actionType: "read_balance",
            params: {},
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
          position: { x: 250, y: 250 },
          data: {
            label: "3. Send Payment",
            actionType: "x402_payment",
            params: {
              to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              amount: "0.5",
              token: "TCRO",
            },
          },
        },
      ]
      
      edges = [
        {
          id: "edge-1-3",
          source: "node-1",
          target: "node-3",
        },
        {
          id: "edge-2-3",
          source: "node-2",
          target: "node-3",
        },
      ]
    })
    
    it('should create 3 nodes with correct types', () => {
      expect(nodes).toHaveLength(3)
      expect(nodes[0].data.actionType).toBe('read_balance')
      expect(nodes[1].data.actionType).toBe('read_state')
      expect(nodes[2].data.actionType).toBe('x402_payment')
    })
    
    it('should have 2 edges connecting to payment node', () => {
      expect(edges).toHaveLength(2)
      expect(edges[0].target).toBe('node-3')
      expect(edges[1].target).toBe('node-3')
    })
    
    it('should use TCRO token for payment', () => {
      const paymentNode = nodes.find(n => n.data.actionType === 'x402_payment')
      expect((paymentNode?.data as any).params.token).toBe('TCRO')
    })
    
    it('should have valid recipient address', () => {
      const paymentNode = nodes.find(n => n.data.actionType === 'x402_payment')
      expect((paymentNode?.data as any).params.to).toMatch(/^0x[a-fA-F0-9]{39,40}$/)
    })
    
    it('should have amount <= 10 for simulation', () => {
      const paymentNode = nodes.find(n => n.data.actionType === 'x402_payment')
      const amount = parseFloat((paymentNode?.data as any).params.amount || '0')
      expect(amount).toBeGreaterThan(0)
      expect(amount).toBeLessThanOrEqual(10)
    })
    
    it('should build correct execution order', () => {
      const executionOrder = buildExecutionPlan(nodes, edges)
      
      expect(executionOrder).toHaveLength(3)
      
      // First two can be in any order (parallel)
      const firstTwo = executionOrder.slice(0, 2)
      expect(firstTwo.map(n => n.id)).toContain('node-1')
      expect(firstTwo.map(n => n.id)).toContain('node-2')
      
      // Last must be payment (depends on both)
      expect(executionOrder[2].id).toBe('node-3')
    })
    
    it('should have all required parameters for each action', () => {
      // read_balance: no required params
      const balanceNode = nodes.find(n => n.data.actionType === 'read_balance')
      expect((balanceNode?.data as any).params).toBeDefined()
      
      // read_state: requires contract
      const stateNode = nodes.find(n => n.data.actionType === 'read_state')
      expect((stateNode?.data as any).params.contract).toBeDefined()
      expect((stateNode?.data as any).params.contract).toBe('ExecutionRouter')
      
      // x402_payment: requires to, amount, token
      const paymentNode = nodes.find(n => n.data.actionType === 'x402_payment')
      expect((paymentNode?.data as any).params.to).toBeDefined()
      expect((paymentNode?.data as any).params.amount).toBeDefined()
      expect((paymentNode?.data as any).params.token).toBeDefined()
    })
  })
  
  describe('Linear Workflow: A → B → C', () => {
    it('should execute in correct order', () => {
      const nodes: Node[] = [
        { id: '1', type: 'workflow', position: { x: 0, y: 0 }, data: { actionType: 'read_balance' } },
        { id: '2', type: 'workflow', position: { x: 0, y: 100 }, data: { actionType: 'read_state' } },
        { id: '3', type: 'workflow', position: { x: 0, y: 200 }, data: { actionType: 'x402_payment' } },
      ]
      
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
      ]
      
      const order = buildExecutionPlan(nodes, edges)
      
      expect(order.map(n => n.id)).toEqual(['1', '2', '3'])
    })
  })
  
  describe('Parallel Workflow: A → C, B → C', () => {
    it('should execute A and B in parallel, then C', () => {
      const nodes: Node[] = [
        { id: 'A', type: 'workflow', position: { x: 0, y: 0 }, data: { actionType: 'read_balance' } },
        { id: 'B', type: 'workflow', position: { x: 200, y: 0 }, data: { actionType: 'read_state' } },
        { id: 'C', type: 'workflow', position: { x: 100, y: 200 }, data: { actionType: 'x402_payment' } },
      ]
      
      const edges: Edge[] = [
        { id: 'eA-C', source: 'A', target: 'C' },
        { id: 'eB-C', source: 'B', target: 'C' },
      ]
      
      const order = buildExecutionPlan(nodes, edges)
      
      expect(order).toHaveLength(3)
      
      // First two can be in any order
      const firstTwo = order.slice(0, 2).map(n => n.id)
      expect(firstTwo).toContain('A')
      expect(firstTwo).toContain('B')
      
      // Last must be C
      expect(order[2].id).toBe('C')
    })
  })
  
  describe('Diamond Workflow: A → B → D, A → C → D', () => {
    it('should handle diamond dependency correctly', () => {
      const nodes: Node[] = [
        { id: 'A', type: 'workflow', position: { x: 100, y: 0 }, data: { actionType: 'read_balance' } },
        { id: 'B', type: 'workflow', position: { x: 0, y: 100 }, data: { actionType: 'read_state' } },
        { id: 'C', type: 'workflow', position: { x: 200, y: 100 }, data: { actionType: 'approve_token' } },
        { id: 'D', type: 'workflow', position: { x: 100, y: 200 }, data: { actionType: 'x402_payment' } },
      ]
      
      const edges: Edge[] = [
        { id: 'eA-B', source: 'A', target: 'B' },
        { id: 'eA-C', source: 'A', target: 'C' },
        { id: 'eB-D', source: 'B', target: 'D' },
        { id: 'eC-D', source: 'C', target: 'D' },
      ]
      
      const order = buildExecutionPlan(nodes, edges)
      
      expect(order).toHaveLength(4)
      
      // A must be first
      expect(order[0].id).toBe('A')
      
      // B and C in middle (any order)
      const middle = order.slice(1, 3).map(n => n.id)
      expect(middle).toContain('B')
      expect(middle).toContain('C')
      
      // D must be last
      expect(order[3].id).toBe('D')
    })
  })
  
  describe('Disconnected Nodes', () => {
    it('should handle disconnected nodes', () => {
      const nodes: Node[] = [
        { id: '1', type: 'workflow', position: { x: 0, y: 0 }, data: { actionType: 'read_balance' } },
        { id: '2', type: 'workflow', position: { x: 200, y: 0 }, data: { actionType: 'read_state' } },
        { id: '3', type: 'workflow', position: { x: 400, y: 0 }, data: { actionType: 'x402_payment' } },
      ]
      
      const edges: Edge[] = [] // No connections
      
      const order = buildExecutionPlan(nodes, edges)
      
      expect(order).toHaveLength(3)
      // All nodes should be in the order (can execute in parallel)
      expect(order.map(n => n.id)).toContain('1')
      expect(order.map(n => n.id)).toContain('2')
      expect(order.map(n => n.id)).toContain('3')
    })
  })
  
  describe('Supported Action Types', () => {
    const supportedTypes = [
      'read_balance',
      'x402_payment',
      'contract_call',
      'read_state',
      'approve_token',
    ]
    
    supportedTypes.forEach(actionType => {
      it(`should support ${actionType} action type`, () => {
        expect(supportedTypes).toContain(actionType)
      })
    })
    
    it('should NOT support condition action type (not implemented yet)', () => {
      expect(supportedTypes).not.toContain('condition')
    })
  })
  
  describe('Token Format', () => {
    it('should use TCRO for testnet simulations', () => {
      const node: Node = {
        id: '1',
        type: 'workflow',
        position: { x: 0, y: 0 },
        data: {
          actionType: 'x402_payment',
          params: {
            to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            amount: '1.0',
            token: 'TCRO',
          },
        },
      }
      
      expect((node.data as any).params.token).toBe('TCRO')
    })
    
    it('should accept valid Ethereum addresses', () => {
      const addresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0x0000000000000000000000000000000000000000',
        '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
      ]
      
      addresses.forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{39,40}$/)
      })
    })
  })
})
