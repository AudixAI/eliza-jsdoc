import { Address } from "viem";

/**
 * Interface representing a YakSwapQuote object.
 *
 * @property {bigint[]} amounts - An array of amounts.
 * @property {Address[]} adapters - An array of adapter addresses.
 * @property {Address[]} path - An array representing a path.
 * @property {bigint} gasEstimate - The gas estimate for the quote.
 */
interface YakSwapQuote {
    amounts: bigint[];
    adapters: Address[];
    path: Address[];
    gasEstimate: bigint;
}

// struct MarketCreationParameters {
//     uint96 tokenType;
//     string name;
//     string symbol;
//     address quoteToken;
//     uint256 totalSupply;
//     uint16 creatorShare;
//     uint16 stakingShare;
//     uint256[] bidPrices;
//     uint256[] askPrices;
//     bytes args;
// }
/**
 * Interface representing the parameters required for creating a TokenMill market.
 * @typedef {Object} TokenMillMarketCreationParameters
 * @property {number} tokenType - The type of token.
 * @property {string} name - The name of the market.
 * @property {string} symbol - The symbol of the market.
 * @property {Address} quoteToken - The address of the quote token.
 * @property {bigint} totalSupply - The total supply of tokens.
 * @property {number} creatorShare - The share of the creator.
 * @property {number} stakingShare - The share for staking.
 * @property {bigint[]} bidPrices - An array of bid prices.
 * @property {bigint[]} askPrices - An array of ask prices.
 * @property {string} args - Additional arguments.
 */
interface TokenMillMarketCreationParameters {
    tokenType: number;
    name: string;
    symbol: string;
    quoteToken: Address;
    totalSupply: bigint;
    creatorShare: number;
    stakingShare: number;
    bidPrices: bigint[];
    askPrices: bigint[];
    args: string;
}

export type { YakSwapQuote, TokenMillMarketCreationParameters };
