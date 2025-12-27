/**
 * Tests for AIAgentTester Component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIAgentTester from "@/components/AIAgentTester";

// Mock fetch
global.fetch = jest.fn();

describe("AIAgentTester Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("should render the component with all UI elements", () => {
    render(<AIAgentTester />);

    expect(screen.getByText("AI Agent Tester")).toBeInTheDocument();
    expect(screen.getByText("Powered by Crypto.com AI Agent SDK")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your query about Cronos blockchain...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("should render example queries", () => {
    render(<AIAgentTester />);

    expect(screen.getByText("What is the current CRO price?")).toBeInTheDocument();
    expect(screen.getByText("Show me the latest transactions on Cronos")).toBeInTheDocument();
    expect(screen.getByText("What's the gas price on Cronos testnet?")).toBeInTheDocument();
    expect(screen.getByText("Explain how to swap tokens on VVS Finance")).toBeInTheDocument();
  });

  it("should load example query when clicked", async () => {
    const user = userEvent.setup();
    render(<AIAgentTester />);

    const exampleButton = screen.getByText("What is the current CRO price?");
    await user.click(exampleButton);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...") as HTMLInputElement;
    expect(input.value).toBe("What is the current CRO price?");
  });

  it("should disable send button when input is empty", () => {
    render(<AIAgentTester />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("should enable send button when input has text", async () => {
    const user = userEvent.setup();
    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Test query");

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeEnabled();
  });

  it("should submit query and display success response", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      query: "What is the current CRO price?",
      response: {
        price: "$0.12",
        change24h: "+5.2%",
      },
      executionTime: 1250,
      timestamp: Date.now(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "What is the current CRO price?");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    // Wait for loading state
    expect(screen.getByText(/processing/i)).toBeInTheDocument();

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText("✓ Success")).toBeInTheDocument();
    });

    expect(screen.getByText(/What is the current CRO price\?/)).toBeInTheDocument();
    expect(screen.getByText("1250ms")).toBeInTheDocument();

    // Check that fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith("/api/ai-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "What is the current CRO price?",
        chainId: 338,
      }),
    });
  });

  it("should display error response when API fails", async () => {
    const user = userEvent.setup();
    const mockErrorResponse = {
      success: false,
      query: "Invalid query",
      response: null,
      executionTime: 0,
      timestamp: Date.now(),
      error: "Failed to process query",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockErrorResponse,
    });

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Invalid query");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("✗ Error")).toBeInTheDocument();
    });

    expect(screen.getByText("Failed to process query")).toBeInTheDocument();
  });

  it("should handle network errors gracefully", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Test query");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("✗ Error")).toBeInTheDocument();
    });

    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("should disable inputs while loading", async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                json: async () => ({
                  success: true,
                  query: "Test",
                  response: {},
                  executionTime: 100,
                  timestamp: Date.now(),
                }),
              }),
            1000
          )
        )
    );

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Test query");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    // Check that input and button are disabled during loading
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: /processing/i })).toBeDisabled();

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByText("✓ Success")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should display response JSON with proper formatting", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      query: "Test",
      response: {
        data: "test data",
        nested: {
          key: "value",
        },
      },
      executionTime: 500,
      timestamp: Date.now(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Test");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("AI Agent Response:")).toBeInTheDocument();
    });

    // Check that JSON is displayed
    const jsonElement = screen.getByText(/"data": "test data"/);
    expect(jsonElement).toBeInTheDocument();
  });

  it("should display metadata correctly", async () => {
    const user = userEvent.setup();
    const timestamp = Date.now();
    const mockResponse = {
      success: true,
      query: "Test",
      response: { result: "ok" },
      executionTime: 1234,
      timestamp: timestamp,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Test");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("1234ms")).toBeInTheDocument();
    });

    expect(screen.getByText("Execution Time:")).toBeInTheDocument();
    expect(screen.getByText("Timestamp:")).toBeInTheDocument();
  });

  it("should prevent double submission", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                json: async () => ({
                  success: true,
                  query: "Test",
                  response: {},
                  executionTime: 100,
                  timestamp: Date.now(),
                }),
              }),
            500
          )
        )
    );

    render(<AIAgentTester />);

    const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
    await user.type(input, "Test");

    const sendButton = screen.getByRole("button", { name: /send/i });
    
    // Click twice quickly
    await user.click(sendButton);
    await user.click(sendButton);

    // Fetch should only be called once
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("should display info banner", () => {
    render(<AIAgentTester />);

    expect(screen.getByText("🧠 About the AI Agent SDK")).toBeInTheDocument();
    expect(
      screen.getByText(/This uses the Crypto.com AI Agent SDK to process natural language/)
    ).toBeInTheDocument();
  });
});
