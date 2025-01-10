export * from "./token";

/**
 * Represents market data for a specific asset. 
 * @typedef {object} MarketData 
 * @property {number} priceChange24h - The price change of the asset in the last 24 hours.
 * @property {number} volume24h - The trading volume of the asset in the last 24 hours.
 * @property {object} liquidity - The liquidity of the asset.
 * @property {number} liquidity.usd - The liquidity of the asset in USD.
 */
export type MarketData = {
  priceChange24h: number;
  volume24h: number;
  liquidity: {
    usd: number;
  };
};

/**
 * Interface representing a trading position.
 * @typedef {Object} Position
 * @property {string} token - The token symbol of the position.
 * @property {string} tokenAddress - The address of the token.
 * @property {number} entryPrice - The price at which the position was entered.
 * @property {number} amount - The amount of the token in the position.
 * @property {number} timestamp - The timestamp when the position was opened.
 * @property {boolean} [sold] - Flag indicating if the position has been sold.
 * @property {number} [exitPrice] - The price at which the position was exited.
 * @property {number} [exitTimestamp] - The timestamp when the position was closed.
 * @property {Object} initialMetrics - Initial metrics of the token.
 * @property {number} initialMetrics.trustScore - The trust score of the token.
 * @property {number} initialMetrics.volume24h - The 24-hour trading volume of the token.
 * @property {Object} initialMetrics.liquidity - Liquidity information of the token.
 * @property {number} initialMetrics.liquidity.usd - The liquidity in USD.
 * @property {"LOW" | "MEDIUM" | "HIGH"} initialMetrics.riskLevel - The risk level of the token.
 * @property {number} [highestPrice] - The highest price reached by the token.
 * @property {boolean} [partialTakeProfit] - Flag indicating if a partial take profit was taken.
 */
export type Position = {
  token: string;
  tokenAddress: string;
  entryPrice: number;
  amount: number;
  timestamp: number;
  sold?: boolean;
  exitPrice?: number;
  exitTimestamp?: number;
  initialMetrics: {
    trustScore: number;
    volume24h: number;
    liquidity: { usd: number };
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  };
  highestPrice?: number;
  partialTakeProfit?: boolean;
};

/**
 * Data structure representing the analysis of a token.
 * @typedef {Object} TokenAnalysis
 * @property {Object} security - Security analysis data
 * @property {string} security.ownerBalance - The balance of the token owner
 * @property {string} security.creatorBalance - The balance of the token creator
 * @property {number} security.ownerPercentage - The percentage owned by the token owner
 * @property {number} security.top10HolderPercent - The percentage held by the top 10 token holders
 * @property {Object} trading - Trading analysis data
 * @property {number} trading.price - The current price of the token
 * @property {number} trading.priceChange24h - The price change in the last 24 hours
 * @property {number} trading.volume24h - The trading volume in the last 24 hours
 * @property {number} trading.uniqueWallets24h - The number of unique wallets trading in the last 24 hours
 * @property {Object} trading.walletChanges - Changes in unique wallets' activity
 * @property {number} trading.walletChanges.unique_wallet_30m_change_percent - The percentage change in unique wallets in the last 30 minutes
 * @property {number} trading.walletChanges.unique_wallet_1h_change_percent - The percentage change in unique wallets in the last 1 hour
 * @property {number} trading.walletChanges.unique_wallet_24h_change_percent - The percentage change in unique wallets in the last 24 hours
 * @property {Object} market - Market analysis data
 * @property {number} market.liquidity - The liquidity of the token
 * @property {number} market.marketCap - The market capitalization of the token
 * @property {number} market.fdv - The fully diluted valuation of the token
 */
export type TokenAnalysis = {
  security: {
    ownerBalance: string;
    creatorBalance: string;
    ownerPercentage: number;
    top10HolderPercent: number;
  };
  trading: {
    price: number;
    priceChange24h: number;
    volume24h: number;
    uniqueWallets24h: number;
    walletChanges: {
      unique_wallet_30m_change_percent: number;
      unique_wallet_1h_change_percent: number;
      unique_wallet_24h_change_percent: number;
    };
  };
  market: {
    liquidity: number;
    marketCap: number;
    fdv: number;
  };
};

// Add interface for 0x quote response
/**
 * Interface for a ZeroEx quote object.
 * @typedef {Object} ZeroExQuote
 * @property {string} price - The price of the quote.
 * @property {string} guaranteedPrice - The guaranteed price of the quote.
 * @property {string} estimatedPriceImpact - The estimated price impact of the quote.
 * @property {string} to - The recipient address of the quote.
 * @property {string} data - The data associated with the quote.
 * @property {string} value - The value associated with the quote.
 * @property {string} gas - The gas associated with the quote.
 * @property {string} estimatedGas - The estimated gas of the quote.
 * @property {string} gasPrice - The gas price of the quote.
 * @property {string} protocolFee - The protocol fee of the quote.
 * @property {string} minimumProtocolFee - The minimum protocol fee of the quote.
 * @property {string} buyAmount - The buy amount of the quote.
 * @property {string} sellAmount - The sell amount of the quote.
 * @property {Array<{ name: string; proportion: string; }>} sources - The sources of the quote.
 * @property {string} buyTokenAddress - The buy token address of the quote.
 * @property {string} sellTokenAddress - The sell token address of the quote.
 * @property {string} allowanceTarget - The allowance target of the quote.
 * @property {Object} [gasless] - Optional gasless details of the quote.
 * @property {string} gasEstimate - The gas estimate of the quote.
 * @property {string} approvalGasEstimate - The approval gas estimate of the quote.
 * @property {string} feeToken - The fee token of the quote.
 * @property {string} feeAmount - The fee amount of the quote.
 * @property {string} feeRecipient - The fee recipient of the quote.
 * @property {number} validTo - The validity period of the gasless details.
 * @property {string} signature - The signature of the gasless details.
 * @property {Object} [transaction] - Optional transaction details of the quote.
 * @property {string} data - The data of the transaction.
 * @property {string} to - The recipient address of the transaction.
 * @property {string} value - The value of the transaction.
 * @property {string} gas - The gas of the transaction.
 * @property {string} gasPrice - The gas price of the transaction.
 * @property {Object} [permit2] - Optional permit2 details of the quote.
 * @property {Object} [eip712] - Optional EIP712 details of permit2.
 * @property {string} signature - The signature of permit2.
 */
export interface ZeroExQuote {
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyAmount: string;
  sellAmount: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget: string;
  gasless?: {
    gasEstimate: string;
    approvalGasEstimate: string;
    feeToken: string;
    feeAmount: string;
    feeRecipient: string;
    validTo: number;
    signature: string;
  };
  transaction?: {
    data: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  permit2?: {
    eip712?: any;
    signature?: string;
  };
}

// Add new interface for 0x price response
/**
 * Represents the response object for fetching ZeroEx Price, extending ZeroExQuote interface.
 * @interface ZeroExPriceResponse
 * @extends {ZeroExQuote}
 * @property {Object} issues - An optional object containing potential issues with the response.
 * @property {Object} issues.allowance - An optional object containing specific concerns about allowance.
 * @property {string} issues.allowance.spender - The address of the spender involved in the allowance concern.
 */
export interface ZeroExPriceResponse extends ZeroExQuote {
  issues?: {
    allowance?: {
      spender: string;
    };
  };
}

// Add a new interface to track analyzed tokens
/**
 * Interface representing the state of token analysis.
 * @property {number} lastAnalyzedIndex - The index of the last token analyzed.
 * @property {Set<string>} analyzedTokens - A set of tokens that have been analyzed.
 */
export interface TokenAnalysisState {
  lastAnalyzedIndex: number;
  analyzedTokens: Set<string>;
}
