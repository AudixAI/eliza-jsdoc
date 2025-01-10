// Type definitions for CoinGecko plugin

/**
 * Interface for configuring the CoinGecko API connection.
 * @typedef {Object} CoinGeckoConfig
 * @property {string} apiKey - The API key required for accessing the CoinGecko API.
 * @property {string} [baseUrl] - The base URL for the CoinGecko API (optional).
 */
export interface CoinGeckoConfig {
    apiKey: string;
    baseUrl?: string;
}

/**
 * Interface for a response object containing prices in different currencies.
 * The keys are string values representing items, and the values are objects
 * where keys are currency codes and values are corresponding prices.
 */
export interface PriceResponse {
    [key: string]: {
        [currency: string]: number;
    };
}

/**
 * Represents market data for a specific asset.
 * @typedef {Object} MarketData
 * @property {string} id - The unique identifier of the asset.
 * @property {string} symbol - The symbol of the asset.
 * @property {string} name - The name of the asset.
 * @property {number} current_price - The current price of the asset.
 * @property {number} market_cap - The market capitalization of the asset.
 * @property {number} market_cap_rank - The rank of the asset based on market capitalization.
 * @property {number} price_change_percentage_24h - The percentage change in price over the last 24 hours.
 * @property {number} total_volume - The total trading volume of the asset.
 */
export interface MarketData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    price_change_percentage_24h: number;
    total_volume: number;
}
