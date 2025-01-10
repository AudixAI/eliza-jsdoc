import { ContractExpiryType, ProductType, ProductVenue } from './common-types';

// Get Transactions Summary
/**
 * Represents a request object for retrieving a summary of transactions.
 * @typedef {Object} GetTransactionsSummaryRequest
 * @property {ProductType} [productType] - The type of product being queried.
 * @property {ContractExpiryType} [contractExpiryType] - The type of contract expiration being queried.
 * @property {ProductVenue} [productVenue] - The venue of the product being queried.
 */
export type GetTransactionsSummaryRequest = {
    // Query Params
    productType?: ProductType;
    contractExpiryType?: ContractExpiryType;
    productVenue?: ProductVenue;
};

/**
 * Response object containing summary information for transactions.
 * @typedef {Object} GetTransactionsSummaryResponse
 * @property {number} total_volume - Total volume of transactions.
 * @property {number} total_fees - Total fees for transactions.
 * @property {Object<string, any>} fee_tier - Fee tier information.
 * @property {Object<string, any>} [margin_rate] - Margin rate information.
 * @property {Object<string, any>} [goods_and_services_tax] - Goods and services tax information.
 * @property {number} [advanced_trade_only_volumes] - Volume for advanced trade only transactions.
 * @property {number} [advanced_trade_only_fees] - Fees for advanced trade only transactions.
 * @property {number} [coinbase_pro_volume] - Volume for Coinbase Pro transactions (deprecated).
 * @property {number} [coinbase_pro_fees] - Fees for Coinbase Pro transactions (deprecated).
 * @property {string} [total_balance] - Total balance information.
 * @property {boolean} [has_promo_fee] - Boolean indicating if there is a promotional fee.
 */
export type GetTransactionsSummaryResponse = {
    total_volume: number;
    total_fees: number;
    fee_tier: Record<string, any>;
    margin_rate?: Record<string, any>;
    goods_and_services_tax?: Record<string, any>;
    advanced_trade_only_volumes?: number;
    advanced_trade_only_fees?: number;
    coinbase_pro_volume?: number; // deprecated
    coinbase_pro_fees?: number; // deprecated
    total_balance?: string;
    has_promo_fee?: boolean;
};
