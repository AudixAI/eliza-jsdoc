// Create Convert Quote
import { RatConvertTrade, TradeIncentiveMetadata } from './common-types';

/**
 * Represents the request body for creating a convert quote.
 * @typedef {Object} CreateConvertQuoteRequest
 * @property {string} fromAccount - The account to convert from.
 * @property {string} toAccount - The account to convert to.
 * @property {string} amount - The amount to convert.
 * @property {TradeIncentiveMetadata} [tradeIncentiveMetadata] - Optional metadata for trade incentives.
 */ 

export type CreateConvertQuoteRequest = {
    // Body Params
    fromAccount: string;
    toAccount: string;
    amount: string;
    tradeIncentiveMetadata?: TradeIncentiveMetadata;
};

/**
 * Type representing the response for creating a convert quote.
 * @typedef {Object} CreateConvertQuoteResponse
 * @property {RatConvertTrade} [trade] - The converted trade information.
 */
export type CreateConvertQuoteResponse = {
    trade?: RatConvertTrade;
};

// Get Convert Trade
/**
 * Represents the request body for converting a trade.
 * @typedef GetConvertTradeRequest
 * @type {Object}
 * @property {string} tradeId - The ID of the trade to be converted.
 * @property {string} fromAccount - The account to convert from.
 * @property {string} toAccount - The account to convert to.
 */
export type GetConvertTradeRequest = {
    // Path Params
    tradeId: string;

    //Query Params
    fromAccount: string;
    toAccount: string;
};

/**
 * Response object for converting a trade.
 * @typedef {Object} GetConvertTradeResponse
 * @property {RatConvertTrade} trade - The converted trade object.
 */
export type GetConvertTradeResponse = {
    trade?: RatConvertTrade;
};

// Commit Convert Trade
/**
 * Type representing a request to convert a trade from one account to another.
 * @typedef {Object} CommitConvertTradeRequest
 * @property {string} tradeId - The ID of the trade to be converted.
 * @property {string} fromAccount - The account from which the trade will be converted.
 * @property {string} toAccount - The account to which the trade will be converted.
 */
export type CommitConvertTradeRequest = {
    // Path Params
    tradeId: string;

    // Body Params
    fromAccount: string;
    toAccount: string;
};

/**
 * Response type for converting a trade commit request.
 * 
 * @typedef {Object} CommitConvertTradeResponse
 * @property {RatConvertTrade} trade - The converted trade object.
 */
export type CommitConvertTradeResponse = {
    trade?: RatConvertTrade;
};
