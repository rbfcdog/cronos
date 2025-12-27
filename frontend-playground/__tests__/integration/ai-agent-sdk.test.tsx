/**
 * Integration Tests for AI Agent SDK
 * Tests the full flow from component to API to SDK
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIAgentTester from "@/components/AIAgentTester";

// Mock the entire API route
jest.mock("@crypto.com/ai-agent-client", () => ({
  createClient: jest.fn(() => ({
    agent: {
      generateQuery: jest.fn(),
    },
  })),
}));

describe("AI Agent SDK Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.OPENAI_API_KEY = "test-key";
    process.env.CRONOS_TESTNET_EXPLORER_KEY = "test-explorer-key";
  });

  describe("End-to-End Query Flow", () => {
    it("should successfully query CRO price", async () => {
      const user = userEvent.setup();

      const mockResponse = {
        price: "$0.12",
        marketCap: "$3.1B",
        volume24h: "$150M",
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "What is the current CRO price?",
          response: mockResponse,
          executionTime: 850,
          timestamp: Date.now(),
        }),
      });

      render(<AIAgentTester />);

      // Load example query by clicking the button
      const exampleButton = screen.getByRole("button", { name: "What is the current CRO price?" });
      await user.click(exampleButton);

      // Submit query
      await user.click(screen.getByRole("button", { name: /send/i }));

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText("✓ Success")).toBeInTheDocument();
      });

      // Verify response data is displayed in the query section (not the button)
      const responseElements = screen.getAllByText(/What is the current CRO price\?/);
      expect(responseElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/"price": "\$0.12"/)).toBeInTheDocument();
    });

    it("should handle complex blockchain queries", async () => {
      const user = userEvent.setup();

      const mockResponse = {
        transactions: [
          {
            hash: "0xabc123",
            from: "0x123...",
            to: "0x456...",
            value: "100",
          },
        ],
        totalCount: 1,
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "Show me the latest transactions on Cronos",
          response: mockResponse,
          executionTime: 1200,
          timestamp: Date.now(),
        }),
      });

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Show me the latest transactions on Cronos");

      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText("✓ Success")).toBeInTheDocument();
      });

      expect(screen.getByText(/"hash": "0xabc123"/)).toBeInTheDocument();
    });

    it("should handle gas price queries", async () => {
      const user = userEvent.setup();

      const mockResponse = {
        gasPrice: "5000000000",
        gasPriceGwei: "5",
        maxFeePerGas: "6000000000",
        maxPriorityFeePerGas: "1000000000",
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "What's the gas price on Cronos testnet?",
          response: mockResponse,
          executionTime: 500,
          timestamp: Date.now(),
        }),
      });

      render(<AIAgentTester />);

      const exampleButton = screen.getByRole("button", { name: "What's the gas price on Cronos testnet?" });
      await user.click(exampleButton);
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/"gasPriceGwei": "5"/)).toBeInTheDocument();
      });
    });

    it("should handle DeFi protocol queries", async () => {
      const user = userEvent.setup();

      const mockResponse = {
        protocol: "VVS Finance",
        steps: [
          "1. Connect wallet",
          "2. Approve token",
          "3. Execute swap",
        ],
        estimatedGas: "150000",
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "Explain how to swap tokens on VVS Finance",
          response: mockResponse,
          executionTime: 1800,
          timestamp: Date.now(),
        }),
      });

      render(<AIAgentTester />);

      const exampleButton = screen.getByRole("button", { name: "Explain how to swap tokens on VVS Finance" });
      await user.click(exampleButton);
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/"protocol": "VVS Finance"/)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API timeout errors", async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Request timeout"));

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Test query");
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText("✗ Error")).toBeInTheDocument();
        expect(screen.getByText("Request timeout")).toBeInTheDocument();
      });
    });

    it("should handle rate limit errors", async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: false,
          query: "Test",
          response: null,
          executionTime: 0,
          timestamp: Date.now(),
          error: "Rate limit exceeded. Please try again later.",
        }),
      });

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Test query");
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText("Rate limit exceeded. Please try again later.")).toBeInTheDocument();
      });
    });

    it("should handle invalid query errors", async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: false,
          query: "Invalid",
          response: null,
          executionTime: 100,
          timestamp: Date.now(),
          error: "Unable to process query. Please provide more context.",
        }),
      });

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Invalid");
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Unable to process query. Please provide more context.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Performance Tests", () => {
    it("should track execution time accurately", async () => {
      const user = userEvent.setup();

      const executionTime = 1234;
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "Test",
          response: { result: "ok" },
          executionTime: executionTime,
          timestamp: Date.now(),
        }),
      });

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Test");
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(`${executionTime}ms`)).toBeInTheDocument();
      });
    });

    it("should handle slow responses gracefully", async () => {
      const user = userEvent.setup();

      global.fetch = jest.fn().mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({
                    success: true,
                    query: "Slow query",
                    response: { result: "delayed" },
                    executionTime: 5000,
                    timestamp: Date.now(),
                  }),
                }),
              2000
            )
          )
      );

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Slow query");
      await user.click(screen.getByRole("button", { name: /send/i }));

      // Should show loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(
        () => {
          expect(screen.getByText("✓ Success")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Multiple Query Scenarios", () => {
    it("should handle multiple consecutive queries", async () => {
      const user = userEvent.setup();

      // First query
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "Query 1",
          response: { result: "1" },
          executionTime: 100,
          timestamp: Date.now(),
        }),
      });

      render(<AIAgentTester />);

      const input = screen.getByPlaceholderText("Enter your query about Cronos blockchain...");
      await user.type(input, "Query 1");
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText("✓ Success")).toBeInTheDocument();
      });

      // Clear input and send second query
      await user.clear(input);
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => ({
          success: true,
          query: "Query 2",
          response: { result: "2" },
          executionTime: 200,
          timestamp: Date.now(),
        }),
      });

      await user.type(input, "Query 2");
      await user.click(screen.getByRole("button", { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/Query 2/)).toBeInTheDocument();
      });
    });
  });
});
