import {
    Candles,
    ContractExpiryType,
    ExpiringContractStatus,
    Granularity,
    HistoricalMarketTrade,
    PriceBook,
    Product,
    Products,
    ProductType,
} from './common-types';

// Get Best Bid Ask
/**
 * Type representing a request to get the best bid/ask prices for a list of product IDs.
 * 
 * @typedef {Object} GetBestBidAskRequest
 * @property {string[]} productIds - Optional array of product IDs to query for best bid/ask prices.
 */
export type GetBestBidAskRequest = {
    // Query Params
    productIds?: string[];
};

/**
 * Represents the response object for retrieving the best bid and ask prices.
 * @typedef {Object} GetBestBidAskResponse
 * @property {PriceBook[]} pricebooks - Array of PriceBook objects containing bid and ask prices.
 */
export type GetBestBidAskResponse = {
    pricebooks: PriceBook[];
};

// Get Product Book
/**
 * Definition of the request object used to retrieve books associated with a specific product.
 * @typedef {Object} GetProductBookRequest
 * @property {string} productId - The ID of the product to retrieve books for.
 * @property {number} [limit] - The maximum number of books to return.
 * @property {number} [aggregationPriceIncrement] - The increment value for aggregating prices.
 */
export type GetProductBookRequest = {
    // Query Params
    productId: string;
    limit?: number;
    aggregationPriceIncrement?: number;
};

/**
 * Response object containing a pricebook for a product.
 * @typedef GetProductBookResponse
 * @property {PriceBook} pricebook - The pricebook associated with the product.
 */
export type GetProductBookResponse = {
    pricebook: PriceBook;
};

// List Products
/**
 * Represents a request object to list products with optional query parameters.
 * @typedef {Object} ListProductsRequest
 * @property {number} [limit] - Limit of products to be returned.
 * @property {number} [offset] - Offset for paging through products.
 * @property {ProductType} [productType] - Type of products to filter by.
 * @property {string[]} [productIds] - Array of product IDs to filter by.
 * @property {ContractExpiryType} [contractExpiryType] - Type of contract expiry to filter by.
 * @property {ExpiringContractStatus} [expiringContractStatus] - Status of expiring contracts to filter by.
 * @property {boolean} [getTradabilityStatus] - Flag to include product tradability status.
 * @property {boolean} [getAllProducts] - Flag to retrieve all products without filters.
 */
export type ListProductsRequest = {
    // Query Params
    limit?: number;
    offset?: number;
    productType?: ProductType;
    productIds?: string[];
    contractExpiryType?: ContractExpiryType;
    expiringContractStatus?: ExpiringContractStatus;
    getTradabilityStatus?: boolean;
    getAllProducts?: boolean;
};

/**
 * Defines the structure of the response object when listing products.
 * @typedef {Object} ListProductsResponse
 * @property {Products} [body] - The list of products in the response body.
 */
export type ListProductsResponse = {
    body?: Products;
};

// Get Product
/**
 * Type representing a request to get product information.
 * @typedef {Object} GetProductRequest
 * @property {string} productId - The unique identifier of the product.
 * @property {boolean} [getTradabilityStatus] - Optional flag to indicate if tradability status should be included in the response.
 */
export type GetProductRequest = {
    // Path Params
    productId: string;

    // Query Params
    getTradabilityStatus?: boolean;
};

/**
 * Response object for getting a product.
 * @typedef {Object} GetProductResponse
 * @property {Product} [body] - The product data in the response body.
 */
export type GetProductResponse = {
    body?: Product;
};

// Get Product Candles
/**
 * Represents a request object for fetching product candles.
 * @typedef {Object} GetProductCandlesRequest
 * @property {string} productId - The ID of the product.
 * @property {string} start - The start date for the candles.
 * @property {string} end - The end date for the candles.
 * @property {Granularity} granularity - The granularity for the candles.
 * @property {number} [limit] - Optional parameter to limit the number of candles returned.
 */
export type GetProductCandlesRequest = {
    // Path Params
    productId: string;

    // Query Params
    start: string;
    end: string;
    granularity: Granularity;
    limit?: number;
};

/**
 * Response object for getting product candles.
 * @typedef {Object} GetProductCandlesResponse
 * @property {Candles} body - The candles data.
 */
export type GetProductCandlesResponse = {
    body?: Candles;
};

// Get Market Trades
/**
 * Represents a request object for fetching market trades.
 * @typedef {object} GetMarketTradesRequest
 * @property {string} productId - The ID of the product.
 * @property {number} limit - The maximum number of trades to return.
 * @property {string} [start] - Optional start timestamp for filtering trades.
 * @property {string} [end] - Optional end timestamp for filtering trades.
 */
export type GetMarketTradesRequest = {
    // Path Params
    productId: string;

    // Query Params
    limit: number;
    start?: string;
    end?: string;
};

/**
 * Response object for getting market trades data.
 *
 * @typedef {Object} GetMarketTradesResponse
 * @property {HistoricalMarketTrade[]} trades - List of historical market trades.
 * @property {string} best_bid - The best bid price in the market.
 * @property {string} best_ask - The best ask price in the market.
 */
export type GetMarketTradesResponse = {
    trades?: HistoricalMarketTrade[];
    best_bid?: string;
    best_ask?: string;
};
