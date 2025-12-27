import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConnectionMap from "@/components/ConnectionMap";
import type { Node, Edge } from "@xyflow/react";

describe("ConnectionMap", () => {
  const mockNodes: Node[] = [
    {
      id: "node1",
      type: "workflow",
      position: { x: 0, y: 0 },
      data: { label: "Read Balance", actionType: "read_balance" },
    },
    {
      id: "node2",
      type: "workflow",
      position: { x: 100, y: 100 },
      data: { label: "X402 Payment", actionType: "x402_payment" },
    },
    {
      id: "node3",
      type: "workflow",
      position: { x: 200, y: 200 },
      data: { label: "Contract Call", actionType: "contract_call" },
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: "edge1",
      source: "node1",
      target: "node2",
    },
    {
      id: "edge2",
      source: "node2",
      target: "node3",
    },
  ];

  it("renders empty state when no nodes", () => {
    render(<ConnectionMap nodes={[]} edges={[]} />);

    expect(screen.getByText("No nodes yet")).toBeInTheDocument();
    expect(screen.getByText("Add nodes to see connections")).toBeInTheDocument();
  });

  it("shows connection count", () => {
    render(<ConnectionMap nodes={mockNodes} edges={mockEdges} />);

    expect(screen.getByText("2 connections")).toBeInTheDocument();
  });

  it("displays execution order", () => {
    render(<ConnectionMap nodes={mockNodes} edges={mockEdges} />);

    expect(screen.getByText("Execution Order")).toBeInTheDocument();
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
    expect(screen.getByText("3.")).toBeInTheDocument();
  });

  it("shows node labels in execution order", () => {
    render(<ConnectionMap nodes={mockNodes} edges={mockEdges} />);

    const readBalanceNodes = screen.getAllByText("Read Balance");
    expect(readBalanceNodes.length).toBeGreaterThan(0);
    const paymentNodes = screen.getAllByText("X402 Payment");
    expect(paymentNodes.length).toBeGreaterThan(0);
    const contractNodes = screen.getAllByText("Contract Call");
    expect(contractNodes.length).toBeGreaterThan(0);
  });

  it("displays data flow section", () => {
    render(<ConnectionMap nodes={mockNodes} edges={mockEdges} />);

    expect(screen.getByText("Data Flow")).toBeInTheDocument();
  });

  it("shows tip about step references", () => {
    render(<ConnectionMap nodes={mockNodes} edges={mockEdges} />);

    expect(screen.getByText(/step_N\.outputKey/)).toBeInTheDocument();
  });

  it("renders with no edges", () => {
    render(<ConnectionMap nodes={mockNodes} edges={[]} />);

    expect(screen.getByText("0 connections")).toBeInTheDocument();
    expect(screen.getByText("Execution Order")).toBeInTheDocument();
  });

  it("shows warning for disconnected nodes", () => {
    const disconnectedNodes = [
      ...mockNodes,
      {
        id: "node4",
        type: "workflow",
        position: { x: 300, y: 300 },
        data: { label: "Isolated Node", actionType: "read_state" },
      },
    ];

    render(<ConnectionMap nodes={disconnectedNodes} edges={mockEdges} />);

    expect(screen.getByText("Disconnected Nodes")).toBeInTheDocument();
  });
});
