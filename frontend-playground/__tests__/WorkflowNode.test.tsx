import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReactFlowProvider } from '@xyflow/react'
import WorkflowNode from '@/components/WorkflowNode'

const mockNodeProps = {
  id: 'node_1',
  data: {
    actionType: 'read_balance',
    label: 'Read Balance',
    params: { token: 'CRO' },
  },
  selected: false,
  type: 'workflow',
  zIndex: 0,
  isConnectable: true,
  xPos: 0,
  yPos: 0,
  dragging: false,
  selectable: true,
  deletable: true,
  draggable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
}

describe('WorkflowNode', () => {
  it('renders node with label', () => {
    render(
      <ReactFlowProvider>
        <WorkflowNode {...mockNodeProps} />
      </ReactFlowProvider>
    )
    
    expect(screen.getByText('Read Balance')).toBeInTheDocument()
  })

  it('expands when clicked', () => {
    render(
      <ReactFlowProvider>
        <WorkflowNode {...mockNodeProps} />
      </ReactFlowProvider>
    )
    
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-chevron-down'))
    fireEvent.click(expandButton!)
    
    expect(screen.getByPlaceholderText(/Token address/i)).toBeInTheDocument()
  })

  it('renders different fields for x402_payment', () => {
    const paymentProps = {
      ...mockNodeProps,
      data: {
        actionType: 'x402_payment',
        label: 'x402 Payment',
        params: {},
      },
    }
    
    render(
      <ReactFlowProvider>
        <WorkflowNode {...paymentProps} />
      </ReactFlowProvider>
    )
    
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-chevron-down'))
    fireEvent.click(expandButton!)
    
    expect(screen.getByPlaceholderText(/Recipient address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Amount/i)).toBeInTheDocument()
  })

  it('renders different fields for contract_call', () => {
    const contractProps = {
      ...mockNodeProps,
      data: {
        actionType: 'contract_call',
        label: 'Contract Call',
        params: {},
      },
    }
    
    render(
      <ReactFlowProvider>
        <WorkflowNode {...contractProps} />
      </ReactFlowProvider>
    )
    
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-chevron-down'))
    fireEvent.click(expandButton!)
    
    expect(screen.getByPlaceholderText(/Contract address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Method name/i)).toBeInTheDocument()
  })

  it('updates param values when input changes', () => {
    render(
      <ReactFlowProvider>
        <WorkflowNode {...mockNodeProps} />
      </ReactFlowProvider>
    )
    
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-chevron-down'))
    fireEvent.click(expandButton!)
    
    const input = screen.getByPlaceholderText(/Token address/i)
    fireEvent.change(input, { target: { value: '0x123' } })
    
    expect(input).toHaveValue('0x123')
  })

  it('renders delete button', () => {
    render(
      <ReactFlowProvider>
        <WorkflowNode {...mockNodeProps} />
      </ReactFlowProvider>
    )
    
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-trash-2'))
    
    expect(deleteButton).toBeInTheDocument()
  })
})
