import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import JsonOutput from '@/components/JsonOutput'

describe('JsonOutput', () => {
  const mockPlan = {
    mode: 'simulate' as const,
    planId: 'plan_123',
    actions: [
      { type: 'read_balance' as const, token: 'CRO' },
    ],
    context: { chainId: 338 },
    description: 'Test plan',
  }

  it('renders JSON output', () => {
    render(<JsonOutput plan={mockPlan} />)
    
    expect(screen.getByText(/JSON Output/i)).toBeInTheDocument()
  })

  it('displays formatted JSON', () => {
    render(<JsonOutput plan={mockPlan} />)
    
    const pre = screen.getByText(/"mode": "simulate"/)
    expect(pre).toBeInTheDocument()
  })

  it('copies JSON to clipboard when copy button clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    })

    render(<JsonOutput plan={mockPlan} />)
    
    const copyButton = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyButton)
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockPlan, null, 2)
    )
  })

  it('shows "Copied" state after copying', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    })

    render(<JsonOutput plan={mockPlan} />)
    
    const copyButton = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyButton)
    
    expect(screen.getByText('Copied')).toBeInTheDocument()
  })
})
