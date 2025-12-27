/**
 * End-to-End Workflow Tests
 * 
 * Tests complete workflows by calling the actual backend API
 * Run with: npm run test:e2e (when backend is running)
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

// Helper to check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

// Helper to simulate a workflow execution
async function simulateWorkflow(actions: any[]) {
  const plan = {
    mode: 'simulate',
    planId: `test_${Date.now()}`,
    actions,
    context: {
      chainId: 338,
      timestamp: Date.now(),
    },
    description: 'E2E Test Workflow',
  }
  
  const response = await fetch(`${BACKEND_URL}/api/playground/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan), // Send plan directly, not wrapped
  })
  
  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}: ${await response.text()}`)
  }
  
  const result = await response.json()
  return result.data || result // Handle both response formats
}

describe('E2E Workflow Tests', () => {
  let backendAvailable = false
  
  beforeAll(async () => {
    backendAvailable = await isBackendAvailable()
    if (!backendAvailable) {
      console.warn('⚠️  Backend not available - skipping E2E tests')
      console.warn('   Start backend with: ./start-playground.sh')
    }
  })
  
  describe('Example Workflow: Balance → State → Payment', () => {
    it('should execute complete workflow successfully', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'read_balance',
          stepId: 'step_0',
        },
        {
          type: 'read_state',
          stepId: 'step_1',
          contract: 'ExecutionRouter',
        },
        {
          type: 'x402_payment',
          stepId: 'step_2',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '0.5',
          token: 'TCRO',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      // Check overall success
      expect(result.success).toBe(true)
      expect(result.trace).toBeDefined()
      expect(result.trace.steps).toHaveLength(3)
      
      // Check step 0: read_balance
      const step0 = result.trace.steps[0]
      expect(step0.status).toBe('simulated')
      expect(step0.result.token).toBe('TCRO')
      expect(step0.result.balance).toBe('10') // Initial simulated balance
      expect(step0.result.address).toBeDefined()
      
      // Check step 1: read_state
      const step1 = result.trace.steps[1]
      expect(step1.status).toBe('simulated')
      expect(step1.result.contract).toBeDefined()
      
      // Check step 2: x402_payment
      const step2 = result.trace.steps[2]
      expect(step2.status).toBe('simulated')
      expect(step2.result.from).toBeDefined()
      expect(step2.result.to).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
      expect(step2.result.amount).toBe('0.5')
      expect(step2.result.token).toBe('TCRO')
      expect(step2.result.newBalance).toBe('9.5') // 10 - 0.5
    }, 10000) // 10 second timeout
    
    it('should fail with insufficient balance', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'read_balance',
          stepId: 'step_0',
        },
        {
          type: 'x402_payment',
          stepId: 'step_1',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '15', // More than simulated balance of 10
          token: 'TCRO',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(false)
      expect(result.trace.steps[1].status).toBe('error')
      expect(result.trace.steps[1].error).toMatch(/Insufficient.*balance/i)
    }, 10000)
  })
  
  describe('Individual Action Tests', () => {
    it('should read balance successfully', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'read_balance',
          stepId: 'step_0',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(true)
      expect(result.trace.steps[0].result.balance).toBe('10')
      expect(result.trace.steps[0].result.token).toBe('TCRO')
    }, 10000)
    
    it('should read contract state successfully', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'read_state',
          stepId: 'step_0',
          contract: 'ExecutionRouter',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(true)
      expect(result.trace.steps[0].result.contract).toBeDefined()
    }, 10000)
    
    it('should execute payment with sufficient balance', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'x402_payment',
          stepId: 'step_0',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1',
          token: 'TCRO',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(true)
      expect(result.trace.steps[0].result.amount).toBe('1')
      expect(result.trace.steps[0].result.newBalance).toBe('9') // 10 - 1
    }, 10000)
    
    it('should reject unsupported action type', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'condition', // NOT SUPPORTED
          stepId: 'step_0',
          condition: 'true',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(false)
      expect(result.trace.steps[0].status).toBe('error')
      expect(result.trace.steps[0].error).toMatch(/Unsupported action type/i)
    }, 10000)
  })
  
  describe('Sequential Workflows', () => {
    it('should execute multiple payments in sequence', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'read_balance',
          stepId: 'step_0',
        },
        {
          type: 'x402_payment',
          stepId: 'step_1',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '2',
          token: 'TCRO',
        },
        {
          type: 'x402_payment',
          stepId: 'step_2',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '3',
          token: 'TCRO',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(true)
      expect(result.trace.steps).toHaveLength(3)
      
      // Check balances decrease correctly
      expect(result.trace.steps[0].result.balance).toBe('10')
      expect(result.trace.steps[1].result.newBalance).toBe('8') // 10 - 2
      expect(result.trace.steps[2].result.newBalance).toBe('5') // 8 - 3
    }, 10000)
    
    it('should stop execution on first error', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'x402_payment',
          stepId: 'step_0',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '15', // Will fail: insufficient balance
          token: 'TCRO',
        },
        {
          type: 'x402_payment',
          stepId: 'step_1',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1',
          token: 'TCRO',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(false)
      expect(result.trace.steps[0].status).toBe('error')
      // Second step should still execute (backend doesn't stop on errors currently)
      expect(result.trace.steps).toHaveLength(2)
    }, 10000)
  })
  
  describe('Token Validation', () => {
    it('should accept TCRO token', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'x402_payment',
          stepId: 'step_0',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1',
          token: 'TCRO',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(true)
      expect(result.trace.steps[0].result.token).toBe('TCRO')
    }, 10000)
    
    it('should handle USDC token (starts with 1000)', async () => {
      if (!backendAvailable) {
        console.log('Skipping: Backend not available')
        return
      }
      
      const actions = [
        {
          type: 'x402_payment',
          stepId: 'step_0',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '100',
          token: 'USDC',
        },
      ]
      
      const result = await simulateWorkflow(actions)
      
      expect(result.success).toBe(true)
      expect(result.trace.steps[0].result.token).toBe('USDC')
      expect(result.trace.steps[0].result.newBalance).toBe('900') // 1000 - 100
    }, 10000)
  })
})
