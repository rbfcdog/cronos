import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TraceViewer from '@/components/TraceViewer'
import type { ExecutionTrace } from '@/lib/types'

describe('TraceViewer', () => {
  const mockTrace: ExecutionTrace = {
    runId: 'run_123',
    planId: 'plan_456',
    mode: 'simulate',
    steps: [
      {
        action: { type: 'read_balance', token: 'CRO' },
        status: 'success',
        result: { summary: 'Balance: 100 CRO', data: { balance: '100' } },
        timestamp: Date.now(),
      },
      {
        action: { type: 'x402_payment', to: '0x123', amount: '10' },
        status: 'success',
        result: { summary: 'Payment sent' },
        txHash: '0xabc123def456',
        gasUsed: 21000,
        timestamp: Date.now(),
      },
    ],
    warnings: [],
    errors: [],
    metadata: {
      executionTime: '1s',
      totalGas: '21000',
    },
  }

  it('shows empty state when no trace', () => {
    render(<TraceViewer trace={null} />)
    
    expect(screen.getByText(/No execution trace yet/i)).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(<TraceViewer trace={null} isLoading={true} />)
    
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders trace metadata', () => {
    render(<TraceViewer trace={mockTrace} />)
    
    expect(screen.getByText('run_123')).toBeInTheDocument()
    expect(screen.getByText(/Simulation/i)).toBeInTheDocument()
  })

  it('renders trace steps with input/output', () => {
    render(<TraceViewer trace={mockTrace} />)
    
    // Check for step headers
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
    expect(screen.getByText(/READ BALANCE/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument()
    expect(screen.getByText(/X402 PAYMENT/i)).toBeInTheDocument()
    
    // Check for input/output sections
    expect(screen.getAllByText(/Input/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Output/i).length).toBeGreaterThan(0)
  })

  it('shows step summaries', () => {
    render(<TraceViewer trace={mockTrace} />)
    
    expect(screen.getByText(/Balance: 100 CRO/)).toBeInTheDocument()
    expect(screen.getByText('Payment sent')).toBeInTheDocument()
  })

  it('displays execution mode badge', () => {
    render(<TraceViewer trace={mockTrace} />)
    
    const badge = screen.getByText(/Simulation/i)
    expect(badge).toHaveClass('bg-blue-900/30')
  })

  it('displays live mode badge correctly', () => {
    const liveTrace = { ...mockTrace, mode: 'execute' as const }
    render(<TraceViewer trace={liveTrace} />)
    
    const badge = screen.getByText(/Live/i)
    expect(badge).toHaveClass('bg-purple-900/30')
  })
})
