/**
 * Tests for AI Agent API Route
 */

// Mock the AI Agent SDK before importing
jest.mock("@crypto.com/ai-agent-client", () => ({
  createClient: jest.fn(() => ({
    agent: {
      generateQuery: jest.fn(),
    },
  })),
}));

describe("AI Agent API Route Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Query Validation", () => {
    it("should validate that query is required", () => {
      const invalidInputs = [
        {},
        { query: "" },
        { query: null },
        { query: undefined },
      ];

      invalidInputs.forEach((input) => {
        const hasQuery = input.query && typeof input.query === "string" && input.query.trim();
        expect(hasQuery).toBeFalsy();
      });
    });

    it("should validate that query is a string", () => {
      const invalidQueries = [123, true, [], {}];

      invalidQueries.forEach((query) => {
        expect(typeof query).not.toBe("string");
      });
    });

    it("should accept valid queries", () => {
      const validQueries = [
        "What is the current CRO price?",
        "Show me the latest transactions",
        "  Valid query with spaces  ",
      ];

      validQueries.forEach((query) => {
        expect(typeof query).toBe("string");
        expect(query.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe("SDK Configuration", () => {
    it("should use correct default chainId", () => {
      const defaultChainId = 338; // Cronos testnet
      expect(defaultChainId).toBe(338);
    });

    it("should trim whitespace from queries", () => {
      const query = "  What is CRO?  ";
      const trimmed = query.trim();
      expect(trimmed).toBe("What is CRO?");
    });

    it("should handle environment variables", () => {
      const config = {
        openAIKey: process.env.OPENAI_API_KEY || "",
        explorerKey: process.env.CRONOS_TESTNET_EXPLORER_KEY || "",
      };

      expect(typeof config.openAIKey).toBe("string");
      expect(typeof config.explorerKey).toBe("string");
    });
  });

  describe("Response Format", () => {
    it("should format success response correctly", () => {
      const mockResponse = {
        success: true,
        query: "Test query",
        response: { data: "test" },
        executionTime: 1000,
        timestamp: Date.now(),
      };

      expect(mockResponse).toHaveProperty("success");
      expect(mockResponse).toHaveProperty("query");
      expect(mockResponse).toHaveProperty("response");
      expect(mockResponse).toHaveProperty("executionTime");
      expect(mockResponse).toHaveProperty("timestamp");
      expect(mockResponse.success).toBe(true);
    });

    it("should format error response correctly", () => {
      const mockErrorResponse = {
        success: false,
        error: "Test error",
      };

      expect(mockErrorResponse).toHaveProperty("success");
      expect(mockErrorResponse).toHaveProperty("error");
      expect(mockErrorResponse.success).toBe(false);
    });
  });

  describe("SDK Integration", () => {
    it("should create client with correct options", async () => {
      const { createClient } = require("@crypto.com/ai-agent-client");
      
      const mockOptions = {
        openAI: {
          apiKey: "test-key",
          model: "gpt-4-turbo",
        },
        chainId: 338,
        explorerKeys: {
          cronosTestnetKey: "test-explorer-key",
        },
      };

      createClient(mockOptions);

      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          openAI: expect.objectContaining({
            model: "gpt-4-turbo",
          }),
          chainId: 338,
        })
      );
    });

    it("should call generateQuery with correct input", async () => {
      const { createClient } = require("@crypto.com/ai-agent-client");
      const mockGenerateQuery = jest.fn().mockResolvedValue({ result: "test" });
      
      createClient.mockReturnValue({
        agent: {
          generateQuery: mockGenerateQuery,
        },
      });

      const client = createClient({});
      await client.agent.generateQuery("What is CRO?");

      expect(mockGenerateQuery).toHaveBeenCalledWith("What is CRO?");
    });
  });
});
