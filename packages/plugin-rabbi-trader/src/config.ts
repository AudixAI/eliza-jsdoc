/**
 * Configuration object for different endpoints and constants related to a provider.
 * @constant
 * @type {object}
 * @property {string} BIRDEYE_API - The base URL for the BirdEye API.
 * @property {string} TOKEN_SECURITY_ENDPOINT - The endpoint for token security.
 * @property {string} TOKEN_METADATA_ENDPOINT - The endpoint for token metadata.
 * @property {string} MARKET_SEARCH_ENDPOINT - The endpoint for market search.
 * @property {string} TOKEN_PRICE_CHANGE_ENDPOINT - The endpoint for token price change.
 * @property {string} TOKEN_VOLUME_24_CHANGE_ENDPOINT - The endpoint for token volume 24-hour change.
 * @property {string} TOKEN_BUY_24_CHANGE_ENDPOINT - The endpoint for token buy 24-hour change.
 * @property {string} TOKEN_SECURITY_ENDPOINT_BASE - The base endpoint for token security.
 * @property {string} TOKEN_METADATA_ENDPOINT_BASE - The base endpoint for token metadata.
 * @property {string} MARKET_SEARCH_ENDPOINT_BASE - The base endpoint for market search.
 * @property {string} TOKEN_PRICE_CHANGE_ENDPOINT_BASE - The base endpoint for token price change.
 * @property {string} TOKEN_VOLUME_24_ENDPOINT_BASE - The base endpoint for token volume 24-hour.
 * @property {string} TOKEN_BUY_24_ENDPOINT_BASE - The base endpoint for token buy 24-hour.
 * @property {number} MAX_RETRIES - The maximum number of retries allowed.
 * @property {number} RETRY_DELAY - The delay in milliseconds between retries.
 */
export const PROVIDER_CONFIG = {
  BIRDEYE_API: "https://public-api.birdeye.so",
  TOKEN_SECURITY_ENDPOINT: "/defi/token_security?address=",
  TOKEN_METADATA_ENDPOINT: "/defi/v3/token/meta-data/single?address=",
  MARKET_SEARCH_ENDPOINT: "/defi/v3/token/trade-data/single?address=",
  TOKEN_PRICE_CHANGE_ENDPOINT:
    "/defi/v3/search?chain=solana&target=token&sort_by=price_change_24h_percent&sort_type=desc&verify_token=true&markets=Raydium&limit=20",
  TOKEN_VOLUME_24_CHANGE_ENDPOINT:
    "/defi/v3/search?chain=solana&target=token&sort_by=volume_24h_change_percent&sort_type=desc&verify_token=true&markets=Raydium&limit=20",
  TOKEN_BUY_24_CHANGE_ENDPOINT:
    "/defi/v3/search?chain=solana&target=token&sort_by=buy_24h_change_percent&sort_type=desc&verify_token=true&markets=Raydium&offset=0&limit=20",

  TOKEN_SECURITY_ENDPOINT_BASE: "/defi/token_security?address=",
  TOKEN_METADATA_ENDPOINT_BASE: "/defi/v3/token/meta-data/single?address=",
  MARKET_SEARCH_ENDPOINT_BASE: "/defi/v3/token/trade-data/single?address=",
  TOKEN_PRICE_CHANGE_ENDPOINT_BASE:
    "/defi/v3/search?chain=base&target=token&sort_by=price_change_24h_percent&sort_type=desc&offset=0&limit=20",
  TOKEN_VOLUME_24_ENDPOINT_BASE:
    "/defi/v3/search?chain=base&target=token&sort_by=volume_24h_usd&sort_type=desc&offset=2&limit=20",
  TOKEN_BUY_24_ENDPOINT_BASE:
    "/defi/v3/search?chain=base&target=token&sort_by=buy_24h&sort_type=desc&offset=2&limit=20",

  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
};

// Add configuration for enabled chains
export const CHAIN_CONFIG = {
  SOLANA_ENABLED: false, // Can be controlled via settings
  BASE_ENABLED: true, // Can be controlled via settings
};

// Add Base chain configuration near other export constants
/**
 * Base configuration object containing RPC URL, Router Address, WETH Address, Chain ID, and Aerodrome-specific addresses.
 * 
 * @type {Object}
 * @property {string} RPC_URL - The RPC URL for the EVM provider.
 * @property {string} ROUTER_ADDRESS - The address of the Base Uniswap V2 Router.
 * @property {string} WETH_ADDRESS - The address of Base WETH.
 * @property {number} CHAIN_ID - The Chain ID.
 * @property {Object} AERODROME - Object containing Aerodrome-specific addresses.
 * @property {string} AERODROME.WETH - The WETH address for Aerodrome.
 * @property {string} AERODROME.USDC - The USDC address for Aerodrome.
 * @property {string} AERODROME.USDT - The USDT address for Aerodrome.
 */
export const BASE_CONFIG = {
  RPC_URL: process.env.EVM_PROVIDER_URL || "https://mainnet.base.org",
  ROUTER_ADDRESS: "0x327Df1E6de05895d2ab08513aaDD9313Fe505d86", // Base Uniswap V2 Router
  WETH_ADDRESS: "0x4200000000000000000000000000000000000006", // Base WETH
  CHAIN_ID: 8453,
  // Add Aerodrome-specific addresses
  AERODROME: {
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDT: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },
};

// Add 0x API configuration near other export constants
/**
 * ZeroEx Configuration object containing API URL, API KEY, endpoints, supported chains, and headers.
 * 
 * @constant
 * @type {object}
 * @property {string} API_URL - The base API URL for ZeroEx.
 * @property {string} API_KEY - The API key for ZeroEx, defaulting to an empty string if not provided in the environment.
 * @property {string} QUOTE_ENDPOINT - The endpoint for obtaining a quote.
 * @property {string} PRICE_ENDPOINT - The endpoint for obtaining price information.
 * @property {object} SUPPORTED_CHAINS - Object containing supported chain information.
 * @property {number} SUPPORTED_CHAINS.BASE - The base chain ID.
 * @property {object} HEADERS - Object containing headers for API requests.
 * @property {string} HEADERS.Content-Type - The content type of the request.
 * @property {string} HEADERS.0x-api-key - The 0x API key for authentication, defaulting to an empty string if not provided in the environment.
 * @property {string} HEADERS.0x-version - The version of the 0x API.
 */

export const ZEROEX_CONFIG = {
  API_URL: "https://api.0x.org",
  API_KEY: process.env.ZEROEX_API_KEY || "",
  QUOTE_ENDPOINT: "/swap/permit2/quote",
  PRICE_ENDPOINT: "/swap/permit2/price",
  SUPPORTED_CHAINS: {
    BASE: 8453,
  },
  HEADERS: {
    "Content-Type": "application/json",
    "0x-api-key": process.env.ZEROEX_API_KEY || "",
    "0x-version": "v2",
  },
};
