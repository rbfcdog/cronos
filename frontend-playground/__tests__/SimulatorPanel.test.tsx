import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SimulatorPanel from '@/components/SimulatorPanel'

describe('SimulatorPanel', () => {
  const mockProps = {
    mode: 'simulate' as const,
    setMode: jest.fn(),
    onSimulate: jest.fn(),
    onExecute: jest.fn(),
    isLoading: false,
    isValidPlan: true,
  }

  it('renders simulation mode by default', () => {
    render(<SimulatorPanel {...mockProps} />)
    
    expect(screen.getByText('Simulate Plan')).toBeInTheDocument()
  })

  it('switches to execute mode when clicked', () => {
    render(<SimulatorPanel {...mockProps} />)
    
    const liveButton = screen.getByText('Live')
    fireEvent.click(liveButton)
    
    expect(mockProps.setMode).toHaveBeenCalledWith('execute')
  })

  it('shows warning in execute mode', () => {
    const executeProps = { ...mockProps, mode: 'execute' as const }
    render(<SimulatorPanel {...executeProps} />)
    
    expect(screen.getByText(/Warning:/i)).toBeInTheDocument()
    expect(screen.getByText(/real transactions/i)).toBeInTheDocument()
  })

  it('disables button when plan is invalid', () => {
    const invalidProps = { ...mockProps, isValidPlan: false }
    render(<SimulatorPanel {...invalidProps} />)
    
    const button = screen.getByRole('button', { name: /Simulate Plan/i })
    expect(button).toBeDisabled()
  })

  it('shows loading state', () => {
    const loadingProps = { ...mockProps, isLoading: true }
    render(<SimulatorPanel {...loadingProps} />)
    
    expect(screen.getByText('Simulating...')).toBeInTheDocument()
  })

  it('calls onSimulate when simulate button clicked', () => {
    render(<SimulatorPanel {...mockProps} />)
    
    const button = screen.getByText('Simulate Plan')
    fireEvent.click(button)
    
    expect(mockProps.onSimulate).toHaveBeenCalled()
  })
})
