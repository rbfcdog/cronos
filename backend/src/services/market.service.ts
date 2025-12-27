import axios from "axios";

/**
 * Market Data Service
 * Fetches token prices, gas estimates, and market data
 */
export class MarketService {
  /**
   * Get CRO price in USD
   */
  async getCROPrice(): Promise<number> {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
          params: {
            ids: "crypto-com-chain",
            vs_currencies: "usd",
          },
        }
      );

      return response.data["crypto-com-chain"]?.usd || 0;
    } catch (error: any) {
      console.error("Failed to fetch CRO price:", error.message);
      return 0;
    }
  }

  /**
   * Get token price
   */
  async getTokenPrice(tokenId: string, vsCurrency: string = "usd"): Promise<number> {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
          params: {
            ids: tokenId,
            vs_currencies: vsCurrency,
          },
        }
      );

      return response.data[tokenId]?.[vsCurrency] || 0;
    } catch (error: any) {
      console.error(`Failed to fetch ${tokenId} price:`, error.message);
      return 0;
    }
  }

  /**
   * Calculate USD value of CRO amount
   */
  async calculateUSDValue(croAmount: string): Promise<number> {
    const price = await this.getCROPrice();
    return parseFloat(croAmount) * price;
  }

  /**
   * Get gas price recommendation
   */
  async getGasRecommendation(): Promise<{
    low: string;
    standard: string;
    fast: string;
  }> {
    // For Cronos, gas price is typically fixed
    // In production, could fetch from RPC or gas oracle
    return {
      low: "5000000000000",    // 5000 gwei
      standard: "5000000000000", // 5000 gwei
      fast: "5000000000000",     // 5000 gwei
    };
  }

  /**
   * Estimate transaction cost in CRO
   */
  async estimateTransactionCost(gasLimit: number): Promise<string> {
    const gasPrice = "5000000000000"; // 5000 gwei
    const costInWei = BigInt(gasLimit) * BigInt(gasPrice);
    const costInCRO = Number(costInWei) / 1e18;
    return costInCRO.toFixed(6);
  }

  /**
   * Get market summary
   */
  async getMarketSummary() {
    const croPrice = await this.getCROPrice();
    const gasRec = await this.getGasRecommendation();
    const transferCost = await this.estimateTransactionCost(21000);

    return {
      cro: {
        priceUSD: croPrice,
        change24h: 0, // Could fetch from CoinGecko
      },
      gas: {
        recommendations: gasRec,
        estimatedTransferCost: transferCost + " CRO",
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export default new MarketService();
