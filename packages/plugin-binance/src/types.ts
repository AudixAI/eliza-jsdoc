// types.ts
import { z } from "zod";

// Base configuration types
/**
 * Represents the configuration options for connecting to the Binance API.
 * @typedef {Object} BinanceConfig
 * @property {string} [apiKey] - The API key required for authentication.
 * @property {string} [secretKey] - The secret key required for authentication.
 * @property {string} [baseURL] - The base URL for the Binance API.
 */
export interface BinanceConfig {
    apiKey?: string;
    secretKey?: string;
    baseURL?: string;
}

// Enhanced schemas with better validation
export const PriceCheckSchema = z.object({
    symbol: z.string().min(1).toUpperCase(),
    quoteCurrency: z.string().min(1).toUpperCase().default("USDT"),
});

export const SpotTradeSchema = z.object({
    symbol: z.string().min(1).toUpperCase(),
    side: z.enum(["BUY", "SELL"]),
    type: z.enum(["MARKET", "LIMIT"]),
    quantity: z.number().positive(),
    price: z.number().positive().optional(),
    timeInForce: z.enum(["GTC", "IOC", "FOK"]).optional().default("GTC"),
});

// Inferred types from schemas
/**
 * Type definition for PriceCheckRequest, inferred from PriceCheckSchema.
 */
export type PriceCheckRequest = z.infer<typeof PriceCheckSchema>;
/**
 * Type definition for a Spot Trade Request, inferred from an existing schema.
 */
export type SpotTradeRequest = z.infer<typeof SpotTradeSchema>;

// Response types
/**
 * Interface for a Price Response object.
 * @typedef {Object} PriceResponse
 * @property {string} symbol - The symbol of the asset.
 * @property {string} price - The price of the asset.
 * @property {number} timestamp - The timestamp of when the price was retrieved.
 */
export interface PriceResponse {
    symbol: string;
    price: string;
    timestamp: number;
}

/**
 * Interface representing the response of a trade.
 * @typedef {object} TradeResponse
 * @property {string} symbol - The symbol of the trade.
 * @property {number} orderId - The unique identifier for the trade order.
 * @property {"NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED"} status - The status of the trade.
 * @property {string} executedQty - The quantity of the trade that has been executed.
 * @property {string} cummulativeQuoteQty - The cumulative quote quantity for the trade.
 * @property {string} price - The price at which the trade was executed.
 * @property {string} type - The type of trade request.
 * @property {string} side - The side of the trade request.
 */
export interface TradeResponse {
    symbol: string;
    orderId: number;
    status: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED";
    executedQty: string;
    cummulativeQuoteQty: string;
    price: string;
    type: SpotTradeRequest["type"];
    side: SpotTradeRequest["side"];
}

// Error handling types
/**
 * Represents an error specific to the Binance API.
 * @extends Error
 * @constructor
 * @param {string} message The error message.
 * @param {number} [code] The error code associated with the Binance error.
 * @param {unknown} [details] Additional details about the error.
 */
export class BinanceError extends Error {
/**
 * Constructs a new instance of BinanceError.
 * @param {string} message The error message.
 * @param {number} [code] The error code (optional).
 * @param {unknown} [details] Additional details about the error (optional).
 */
    constructor(
        message: string,
        public code?: number,
        public details?: unknown
    ) {
        super(message);
        this.name = "BinanceError";
    }
}

// Constants
export const TRADE_STATUS = {
    NEW: "NEW",
    PARTIALLY_FILLED: "PARTIALLY_FILLED",
    FILLED: "FILLED",
    CANCELED: "CANCELED",
    REJECTED: "REJECTED",
} as const;

/**
 * Type that represents the possible values for trade status.
 */
export type TradeStatus = keyof typeof TRADE_STATUS;

// Balance types
/**
 * Interface representing a balance check request.
 * @property {string} asset - The asset for which the balance needs to be checked. Optional.
 */
export interface BalanceCheckRequest {
    asset?: string;
}

/**
 * Interface representing the balance of a specific asset.
 * @typedef {Object} AssetBalance
 * @property {string} asset - The asset symbol.
 * @property {string} free - The available balance of the asset.
 * @property {string} locked - The locked balance of the asset.
 */ 
export interface AssetBalance {
    asset: string;
    free: string;
    locked: string;
}

/**
 * Interface representing the response object containing balances and timestamp.
 * @typedef {Object} BalanceResponse
 * @property {AssetBalance[]} balances - The array of AssetBalance objects representing the balances.
 * @property {number} timestamp - The timestamp when the response was generated.
 */
export interface BalanceResponse {
    balances: AssetBalance[];
    timestamp: number;
}
