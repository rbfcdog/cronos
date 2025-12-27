import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import UnifiedStatePanel from '@/components/UnifiedStatePanel'
import type { UnifiedState } from '@/lib/types'

describe('UnifiedStatePanel', () => {
  const mockState: UnifiedState = {
    wallet: {
      address: '0x1234567890123456789012345678901234567890',
      balances: [
        { token: 'CRO', balance: '100.5', symbol: 'CRO' },
        { token: 'USDT', balance: '50.25', symbol: 'USDT' },
      ],
    },
    contracts: [
      {
        name: 'ExecutionRouter',
        address: '0xabc123',
        status: 'deployed',
      },
    ],
    x402: {
      executions: 42,
      lastExecution: '2025-12-25T00:00:00Z',
    },
  }

  it('shows empty state when no state data', () => {
    render(<UnifiedStatePanel state={null} />)
    
    expect(screen.getByText(/No state data available/i)).toBeInTheDocument()
  })

  it('renders wallet address', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText(/0x1234567890123456789012345678901234567890/i)).toBeInTheDocument()
  })

  it('renders wallet balances', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText('CRO')).toBeInTheDocument()
    expect(screen.getByText('USDT')).toBeInTheDocument()
    expect(screen.getByText('100.5000')).toBeInTheDocument()
    expect(screen.getByText('50.2500')).toBeInTheDocument()
  })

  it('renders contract information', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText('ExecutionRouter')).toBeInTheDocument()
    expect(screen.getByText(/0xabc123/i)).toBeInTheDocument()
  })

  it('renders x402 execution count', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows wallet section header', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText('Wallet')).toBeInTheDocument()
  })

  it('shows contracts section header', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText('Contracts')).toBeInTheDocument()
  })

  it('shows x402 protocol section header', () => {
    render(<UnifiedStatePanel state={mockState} />)
    
    expect(screen.getByText('x402 Protocol')).toBeInTheDocument()
  })
})
