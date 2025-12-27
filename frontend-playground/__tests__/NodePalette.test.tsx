import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import NodePalette from '@/components/NodePalette'

describe('NodePalette', () => {
  it('renders all 6 action types', () => {
    render(<NodePalette />)
    
    expect(screen.getByText('Read Balance')).toBeInTheDocument()
    expect(screen.getByText('x402 Payment')).toBeInTheDocument()
    expect(screen.getByText('Contract Call')).toBeInTheDocument()
    expect(screen.getByText('Condition')).toBeInTheDocument()
    expect(screen.getByText('Read State')).toBeInTheDocument()
    expect(screen.getByText('Approve Token')).toBeInTheDocument()
  })

  it('renders the tip section with documentation hint', () => {
    render(<NodePalette />)
    
    expect(screen.getByText(/see documentation/i)).toBeInTheDocument()
  })

  it('all nodes are draggable', () => {
    render(<NodePalette />)
    
    const draggableElements = screen.getAllByText(/Read Balance|x402 Payment|Contract Call|Condition|Read State|Approve Token/)
    draggableElements.forEach(el => {
      const parent = el.closest('[draggable]')
      expect(parent).toHaveAttribute('draggable', 'true')
    })
  })

  it('shows info icon on hover', () => {
    render(<NodePalette />)
    
    const infoButtons = screen.getAllByTitle('View documentation')
    expect(infoButtons.length).toBe(6) // One for each node type
  })

  it('opens documentation modal when info icon is clicked', () => {
    render(<NodePalette />)
    
    const infoButtons = screen.getAllByTitle('View documentation')
    fireEvent.click(infoButtons[0])
    
    // Modal should open with node documentation
    const readBalanceTitles = screen.getAllByText('Read Balance')
    expect(readBalanceTitles.length).toBeGreaterThan(1) // One in palette, one in modal
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument()
  })
})
