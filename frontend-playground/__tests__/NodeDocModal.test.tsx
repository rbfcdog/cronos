import { render, screen, fireEvent } from "@testing-library/react";
import NodeDocModal from "@/components/NodeDocModal";
import { NODE_REGISTRY } from "@/lib/nodeRegistry";

describe("NodeDocModal", () => {
  const mockNode = NODE_REGISTRY.read_balance;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <NodeDocModal node={mockNode} isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders node documentation when open", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Read Balance")).toBeInTheDocument();
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    expect(screen.getAllByText(/query/i).length).toBeGreaterThan(0);
  });

  it("displays inputs section", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/📥 INPUTS/)).toBeInTheDocument();
    const addressInputs = screen.getAllByText("address");
    expect(addressInputs.length).toBeGreaterThan(0);
    const tokenInputs = screen.getAllByText("token");
    expect(tokenInputs.length).toBeGreaterThan(0);
  });

  it("displays outputs section", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/📤 OUTPUTS/)).toBeInTheDocument();
    const balanceOutputs = screen.getAllByText("balance");
    expect(balanceOutputs.length).toBeGreaterThan(0);
    expect(screen.getByText("balanceWei")).toBeInTheDocument();
  });

  it("displays examples section", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/💡 EXAMPLES/)).toBeInTheDocument();
    expect(screen.getByText(/Check CRO Balance/)).toBeInTheDocument();
  });

  it("displays gas estimate if provided", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Gas Estimate:/)).toBeInTheDocument();
    expect(screen.getByText(/~0 \(read-only\)/)).toBeInTheDocument();
  });

  it("displays tags", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Tags")).toBeInTheDocument();
    const tags = screen.getAllByText("query");
    expect(tags.length).toBeGreaterThan(0);
    const balanceTags = screen.getAllByText("balance");
    expect(balanceTags.length).toBeGreaterThan(0);
  });

  it("calls onClose when close button clicked", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[0]; // First button is close
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows required badges on required inputs", () => {
    const paymentNode = NODE_REGISTRY.x402_payment;
    render(<NodeDocModal node={paymentNode} isOpen={true} onClose={mockOnClose} />);

    const requiredBadges = screen.getAllByText("required");
    expect(requiredBadges.length).toBeGreaterThan(0);
  });

  it("displays step reference hint in footer", () => {
    render(<NodeDocModal node={mockNode} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/step_N\.balance/)).toBeInTheDocument();
  });
});
