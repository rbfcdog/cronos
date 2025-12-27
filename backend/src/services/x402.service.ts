import axios from "axios";
import config from "../config";

/**
 * x402 Payment Facilitation Service
 * Handles cross-chain payment intents via x402
 */
export class X402Service {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.x402.facilitatorUrl;
    this.apiKey = config.x402.apiKey;
  }

  /**
   * Check if x402 is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    sourceChain: string;
    destinationChain: string;
    recipient: string;
    amount: string;
    token?: string;
  }) {
    if (!this.isConfigured()) {
      throw new Error("x402 not configured. Please add X402_API_KEY to .env");
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/intent`,
        {
          sourceChain: params.sourceChain,
          destinationChain: params.destinationChain,
          recipient: params.recipient,
          amount: params.amount,
          token: params.token || "native",
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("x402 API Error:", error.response?.data || error.message);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Execute a payment intent
   */
  async executeIntent(intentId: string) {
    if (!this.isConfigured()) {
      throw new Error("x402 not configured");
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/execute/${intentId}`,
        {},
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("x402 Execution Error:", error.response?.data || error.message);
      throw new Error(`Failed to execute intent: ${error.message}`);
    }
  }

  /**
   * Get payment intent status
   */
  async getIntentStatus(intentId: string) {
    if (!this.isConfigured()) {
      throw new Error("x402 not configured");
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/intent/${intentId}`,
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("x402 Status Error:", error.response?.data || error.message);
      throw new Error(`Failed to get intent status: ${error.message}`);
    }
  }

  /**
   * Get supported chains
   */
  async getSupportedChains() {
    try {
      const response = await axios.get(`${this.baseUrl}/chains`);
      return response.data;
    } catch (error: any) {
      console.error("x402 Chains Error:", error.message);
      return [];
    }
  }
}

export default new X402Service();
