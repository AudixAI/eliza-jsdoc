import { Plugin } from "@elizaos/core";
import { executeSwap } from "./actions/swap";
import transfer from "./actions/transfer";
import { deployToken } from "./actions/unruggable";
import transferSubdomain from "./actions/subdomain";
/**
 * Configuration object for providers and endpoints.
 * 
 * @type {Object}
 * @property {string} AVNU_API - The base URL for the AVNU API.
 * @property {number} MAX_RETRIES - The maximum number of retries for API calls.
 * @property {number} RETRY_DELAY - The delay in milliseconds between retries.
 * @property {Object} TOKEN_ADDRESSES - Object containing addresses for different tokens.
 * @property {string} TOKEN_SECURITY_ENDPOINT - The endpoint for token security information.
 * @property {string} TOKEN_TRADE_DATA_ENDPOINT - The endpoint for token trade data.
 * @property {string} DEX_SCREENER_API - The base URL for the DEX Screener API.
 * @property {string} MAIN_WALLET - The main wallet address (currently empty string).
 */
export const PROVIDER_CONFIG = {
    AVNU_API: "https://starknet.impulse.avnu.fi/v1",
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    TOKEN_ADDRESSES: {
        BTC: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
        ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    },
    TOKEN_SECURITY_ENDPOINT: "/defi/token_security?address=",
    TOKEN_TRADE_DATA_ENDPOINT: "/defi/v3/token/trade-data/single?address=",
    DEX_SCREENER_API: "https://api.dexscreener.com/latest/dex/tokens/",
    MAIN_WALLET: "",
};

export const starknetPlugin: Plugin = {
    name: "starknet",
    description: "Starknet Plugin for Eliza",
    actions: [transfer, executeSwap, deployToken, transferSubdomain],
    evaluators: [],
    providers: [],
};

export default starknetPlugin;
