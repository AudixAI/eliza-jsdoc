export const ERROR_CODES = {
    INVALID_CREDENTIALS: 401,
    INVALID_PARAMETERS: 400,
    INSUFFICIENT_BALANCE: -1012,
    MIN_NOTIONAL_NOT_MET: -1013,
    UNKNOWN_ORDER_COMPOSITION: -1111,
    PRICE_QTY_EXCEED_HARD_LIMITS: -1021,
} as const;

/**
 * Object containing error messages for various scenarios.
 * @readonly
 * @type {Object}
 * @property {string} INVALID_CREDENTIALS - Message for invalid API credentials.
 * @property {string} INVALID_SYMBOL - Message for invalid trading pair symbol.
 * @property {Function} SYMBOL_NOT_FOUND - Function returning message for unavailable trading pair symbol.
 * @property {Function} MIN_NOTIONAL_NOT_MET - Function returning message for order value too small.
 * @property {string} LIMIT_ORDER_PRICE_REQUIRED - Message indicating price requirement for LIMIT orders.
 * @property {Function} BALANCE_FETCH_ERROR - Function returning message for balance fetch error.
 * @property {Function} PRICE_FETCH_ERROR - Function returning message for price fetch error.
 */
export const ERROR_MESSAGES = {
    INVALID_CREDENTIALS:
        "Invalid API credentials. Please check your API key and secret.",
    INVALID_SYMBOL: "Invalid trading pair symbol",
    SYMBOL_NOT_FOUND: (symbol: string) =>
        `Trading pair ${symbol} is not available`,
    MIN_NOTIONAL_NOT_MET: (minNotional?: string) =>
        `Order value is too small. Please increase the quantity to meet the minimum order value requirement.${
            minNotional ? ` Minimum order value is ${minNotional} USDC.` : ""
        }`,
    LIMIT_ORDER_PRICE_REQUIRED: "Price is required for LIMIT orders",
    BALANCE_FETCH_ERROR: (asset?: string) =>
        asset
            ? `Failed to fetch balance for ${asset}`
            : "Failed to fetch account balances",
    PRICE_FETCH_ERROR: (symbol: string) =>
        `Failed to fetch price for ${symbol}`,
} as const;

export const VALIDATION_ERRORS = {
    MISSING_API_KEY: "BINANCE_API_KEY is required but not configured",
    MISSING_SECRET_KEY: "BINANCE_SECRET_KEY is required but not configured",
    INVALID_SYMBOL_LENGTH: "Invalid cryptocurrency symbol length",
} as const;
