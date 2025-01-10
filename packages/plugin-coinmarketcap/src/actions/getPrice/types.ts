import { Content } from "@elizaos/core";

/**
 * Interface representing content for getting price information.
 * @interface
 * @extends Content
 */
export interface GetPriceContent extends Content {
    symbol: string;
    currency: string;
}

/**
 * Interface representing price data for a cryptocurrency.
 * @typedef {Object} PriceData
 * @property {number} price - The current price of the cryptocurrency.
 * @property {number} marketCap - The market capitalization of the cryptocurrency.
 * @property {number} volume24h - The 24-hour trading volume of the cryptocurrency.
 * @property {number} percentChange24h - The percentage change in price over the last 24 hours.
 */

export interface PriceData {
    price: number;
    marketCap: number;
    volume24h: number;
    percentChange24h: number;
}

/**
 * Interface representing a response from an API. Contains data for each symbol, with each symbol containing quote information for each currency.
 * @typedef {Object} ApiResponse
 * @property {Object.<string, Object>} data - Object containing quote information for each symbol
 * @property {Object} data[symbol] - Object containing quote information for each currency
 * @property {Object.<string, Object>} data[symbol].quote - Object containing price, market cap, 24h volume, and 24h percent change for each currency
 * @property {number} data[symbol].quote[currency].price - Price of the symbol in the specified currency
 * @property {number} data[symbol].quote[currency].market_cap - Market capitalization of the symbol in the specified currency
 * @property {number} data[symbol].quote[currency].volume_24h - 24h trading volume of the symbol in the specified currency
 * @property {number} data[symbol].quote[currency].percent_change_24h - Percentage change in price of the symbol in the last 24 hours in the specified currency
 */
export interface ApiResponse {
    data: {
        [symbol: string]: {
            quote: {
                [currency: string]: {
                    price: number;
                    market_cap: number;
                    volume_24h: number;
                    percent_change_24h: number;
                };
            };
        };
    };
}
