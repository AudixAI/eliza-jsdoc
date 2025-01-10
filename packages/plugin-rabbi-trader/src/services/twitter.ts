import { z } from "zod";
import { elizaLogger } from "@elizaos/core";
import { MAX_TWEETS_PER_HOUR } from "../constants";
import { MarketData } from "../types";

export const TwitterConfigSchema = z.object({
  enabled: z.boolean(),
  username: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
  apiKey: z.string().optional(),
});

/**
 * Interface representing a trade alert object.
 * @typedef {Object} TradeAlert
 * @property {string} token - The token symbol.
 * @property {number} amount - The amount of tokens to trade.
 * @property {number} trustScore - The trust score of the trade.
 * @property {"LOW" | "MEDIUM" | "HIGH"} riskLevel - The risk level of the trade.
 * @property {Object} marketData - The market data related to the trade.
 * @property {number} marketData.priceChange24h - The price change in the last 24 hours.
 * @property {number} marketData.volume24h - The trading volume in the last 24 hours.
 * @property {Object} marketData.liquidity - The liquidity information.
 * @property {number} marketData.liquidity.usd - The liquidity in USD.
 * @property {number} timestamp - The timestamp of the trade alert.
 * @property {string} [signature] - Optional signature for verification.
 * @property {"BUY" | "SELL" | "WAIT" | "SKIP"} [action] - The recommended action for the trade.
 * @property {string} [reason] - The reason for the trade alert.
 * @property {number} [price] - The current price of the token.
 * @property {string} [profitPercent] - The profit percentage if trade is executed.
 * @property {string} [profitUsd] - The profit in USD if trade is executed.
 */
export interface TradeAlert {
  token: string;
  amount: number;
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  marketData: {
    priceChange24h: number;
    volume24h: number;
    liquidity: {
      usd: number;
    };
  };
  timestamp: number;
  signature?: string;
  action?: "BUY" | "SELL" | "WAIT" | "SKIP";
  reason?: string;
  price?: number;
  profitPercent?: string;
  profitUsd?: string;
}

/**
 * Interface representing a trade buy alert.
 * @typedef {Object} TradeBuyAlert
 * @property {string} token - The token symbol.
 * @property {string} tokenAddress - The token contract address.
 * @property {number} amount - The amount of tokens.
 * @property {number} trustScore - The trust score of the trade.
 * @property {"LOW" | "MEDIUM" | "HIGH"} riskLevel - The risk level of the trade.
 * @property {MarketData} marketData - The market data related to the trade.
 * @property {number} timestamp - The timestamp of the trade alert.
 * @property {string} [signature] - The signature of the trade alert.
 * @property {string} [hash] - The hash of the trade alert.
 * @property {string} [explorerUrl] - The URL to explore more details about the trade.
 * @property {"BUY" | "SELL" | "WAIT" | "SKIP"} [action] - The action suggested for the trade.
 * @property {string} [reason] - The reason for the trade alert.
 * @property {number} [price] - The price of the token.
 * @property {string} [profitPercent] - The percentage of profit expected from the trade.
 * @property {string} [profitUsd] - The profit in USD expected from the trade.
 */
export interface TradeBuyAlert {
  token: string;
  tokenAddress: string;
  amount: number;
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  marketData: MarketData;
  timestamp: number;
  signature?: string;
  hash?: string;
  explorerUrl?: string;
  action?: "BUY" | "SELL" | "WAIT" | "SKIP";
  reason?: string;
  price?: number;
  profitPercent?: string;
  profitUsd?: string;
}

// Set up trade notification function
export const tweetTrade = async (
  twitterService: TwitterService,
  alert: TradeBuyAlert,
) => {
  if (twitterService) {
    await twitterService.postTradeAlert({
      ...alert,
      timestamp: Date.now(),
    });
  }
};

/**
 * Check if a tweet can be sent based on the tweet type and rate limiting.
 * @param { "trade" | "market_search" | "shabbat" | "holiday" } tweetType - The type of tweet to check.
 * @returns {boolean} - True if the tweet can be sent, false if the rate limit has been reached.
 */
export function canTweet(tweetType: "trade" | "market_search" | "shabbat" | "holiday"): boolean {
  const now = Date.now();
  const hourKey = `tweets_${tweetType}_${Math.floor(now / 3600000)}`;

  // Simple in-memory rate limiting
  const tweetCounts = new Map<string, number>();
  const currentCount = tweetCounts.get(hourKey) || 0;

  if (currentCount >= MAX_TWEETS_PER_HOUR[tweetType]) {
    elizaLogger.warn(`Tweet rate limit reached for ${tweetType}`);
    return false;
  }

  tweetCounts.set(hourKey, currentCount + 1);
  return true;
}

/**
 * Interface for specifying options when creating a new tweet.
 * @typedef {Object} TweetOptions
 * @property {boolean} skipRateLimit - Flag to indicate whether to skip rate limit when posting the tweet.
 * @property {'trade' | 'market_search' | 'shabbat' | 'holiday'} type - Type of tweet (trade, market_search, shabbat, holiday).
 */
interface TweetOptions {
  skipRateLimit?: boolean;
  type?: 'trade' | 'market_search' | 'shabbat' | 'holiday';
}

/**
 * Class representing a Twitter service for posting trade alerts.
 */

export class TwitterService {
  private client: any;
  private config: z.infer<typeof TwitterConfigSchema>;

  // Add public getter for config
/**
   * Get the configuration object.
   * @returns {object} The configuration object.
   */
  public getConfig() {
    return this.config;
  }

/**
 * Constructor for creating a new instance of a Twitter client.
 * 
 * @param {any} client The client used to make requests to the Twitter API.
 * @param {z.infer<typeof TwitterConfigSchema>} config The configuration settings for the Twitter client.
 */
  constructor(client: any, config: z.infer<typeof TwitterConfigSchema>) {
    this.client = client;
    this.config = config;
  }

/**
 * Function to post a trade alert to Twitter.
 * @param {TradeBuyAlert} alert - The trade buy alert to post.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the tweet was successfully posted or not.
 */
  async postTradeAlert(alert: TradeBuyAlert): Promise<boolean> {
    try {
      const tweetContent = this.formatBuyAlert(alert);

      if (this.config.dryRun) {
        elizaLogger.log(
          "Dry run mode - would have posted tweet:",
          tweetContent,
        );
        return true;
      }

      if (!canTweet("trade")) {
        elizaLogger.warn("Trade tweet rate limit reached");
        return false;
      }

      // Use the correct client structure
      await this.client.post.client.twitterClient.sendTweet(tweetContent);
      elizaLogger.log("Successfully posted trade alert to Twitter:", {
        content: tweetContent,
      });

      return true;
    } catch (error) {
      elizaLogger.error("Failed to post trade alert to Twitter:", {
        error: error instanceof Error ? error.message : String(error),
        alert,
      });
      return false;
    }
  }

/**
   * Formats a TradeBuyAlert object into a string message based on the alert action (BUY or SELL).
   *
   * @param {TradeBuyAlert} alert - The TradeBuyAlert object to format.
   * @returns {string} The formatted message string.
   */
  private formatBuyAlert(alert: TradeBuyAlert): string {
    const priceChangePrefix = alert.marketData.priceChange24h >= 0 ? "+" : "";
    const trustScoreEmoji =
      alert.trustScore >= 0.8 ? "🟢" : alert.trustScore >= 0.5 ? "🟡" : "🔴";


    // Don't include explorer URL if we don't have a valid signature/hash
    const hasValidTxId = alert.hash || alert.signature;
    const explorerUrl = hasValidTxId
        ? `https://solscan.io/tx/${alert.signature}`
      : null;

    if (alert.action === "SELL") {
      // Simplified SELL format
      const actionEmoji =
        Number(alert.profitPercent?.replace("%", "")) >= 0
          ? "💰 PROFIT SELL"
          : "🔴 LOSS SELL";

      const lines = [
        `${actionEmoji} | ${alert.token}`,
        `📊 P/L: ${alert.profitPercent}`,
        `⚠️ Risk: ${alert.riskLevel}`,
        `💲 Price: $${alert.price?.toFixed(6)}`,
        `📈 24h: ${priceChangePrefix}${alert.marketData.priceChange24h.toFixed(1)}%`,
        explorerUrl ? `🔍 ${explorerUrl}` : null,
        `$${alert.token}`,
      ];

      return lines.filter(Boolean).join("\n");
    } else {
      // Simplified BUY format
      const lines = [
        `🟢 BUY | ${alert.token}`,
        `🎯 Trust: ${trustScoreEmoji} ${(alert.trustScore * 100).toFixed(0)}%`,
        `📈 24h: ${priceChangePrefix}${alert.marketData.priceChange24h.toFixed(1)}%`,
        `⚠️ Risk: ${alert.riskLevel}`,
        `💲 Price: $${alert.price?.toFixed(6)}`,
        explorerUrl ? `🔍 ${explorerUrl}` : null,
        `$${alert.token}`,
      ];

      return lines.filter(Boolean).join("\n");
    }
  }
}