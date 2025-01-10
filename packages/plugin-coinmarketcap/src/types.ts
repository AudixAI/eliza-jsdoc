import { Content } from "@elizaos/core";

/**
 * Defines the interface for retrieving price content.
 * @interface GetPriceContent
 * @extends Content
 * @property {string} symbol - The symbol of the price content.
 * @property {string} currency - The currency of the price content.
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
 * Represents the structure of an API response containing data for multiple symbols.
 * @typedef {object} ApiResponse
 * @property {object} data - The data object containing symbol-specific information.
 * @property {object} data[symbol] - The symbol-specific object containing quote information.
 * @property {object} data[symbol].quote - The quote object containing currency-specific information.
 * @property {number} data[symbol].quote[currency].price - The price of the symbol in the specified currency.
 * @property {number} data[symbol].quote[currency].market_cap - The market capitalization of the symbol in the specified currency.
 * @property {number} data[symbol].quote[currency].volume_24h - The 24-hour trading volume of the symbol in the specified currency.
 * @property {number} data[symbol].quote[currency].percent_change_24h - The percentage change in price of the symbol in the specified currency over the last 24 hours.
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
