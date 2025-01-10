/**
 * Interface representing token security data.
 * @property {string} ownerBalance - The balance of the token owner.
 * @property {string} creatorBalance - The balance of the token creator.
 * @property {number} ownerPercentage - The percentage of tokens owned by the owner.
 * @property {number} creatorPercentage - The percentage of tokens owned by the creator.
 * @property {string} top10HolderBalance - The balance of the top 10 token holders.
 * @property {number} top10HolderPercent - The percentage of tokens owned by the top 10 holders.
 */
export interface TokenSecurityData {
    ownerBalance: string;
    creatorBalance: string;
    ownerPercentage: number;
    creatorPercentage: number;
    top10HolderBalance: string;
    top10HolderPercent: number;
}

/**
 * Interface representing data for a token trade.
 * @property {number} price - The current price of the token.
 * @property {number} priceChange24h - The percentage change in price over the last 24 hours.
 * @property {number} volume24h - The trading volume of the token over the last 24 hours.
 * @property {string} volume24hUsd - The trading volume of the token in USD over the last 24 hours.
 * @property {number} uniqueWallets24h - The number of unique wallets that traded the token over the last 24 hours.
 * @property {number} uniqueWallets24hChange - The percentage change in the number of unique wallets that traded the token over the last 24 hours.
 */
export interface TokenTradeData {
    price: number;
    priceChange24h: number;
    volume24h: number;
    volume24hUsd: string;
    uniqueWallets24h: number;
    uniqueWallets24hChange: number;
}

/**
 * Interface representing a pair on a decentralized exchange screener.
 * @typedef { Object } DexScreenerPair
 * @property { string } chainId - The chain ID where the pair is located.
 * @property { string } dexId - The ID of the decentralized exchange.
 * @property { string } url - The URL of the pair.
 * @property { string } pairAddress - The address of the pair.
 * @property { Object } baseToken - Information about the base token.
 * @property { string } baseToken.address - The address of the base token.
 * @property { string } baseToken.name - The name of the base token.
 * @property { string } baseToken.symbol - The symbol of the base token.
 * @property { Object } quoteToken - Information about the quote token.
 * @property { string } quoteToken.address - The address of the quote token.
 * @property { string } quoteToken.name - The name of the quote token.
 * @property { string } quoteToken.symbol - The symbol of the quote token.
 * @property { string } priceUsd - The price of the pair in USD.
 * @property { Object } priceChange - Object representing price changes.
 * @property { number } priceChange.m5 - Price change over the last 5 minutes.
 * @property { number } priceChange.h1 - Price change over the last hour.
 * @property { number } priceChange.h24 - Price change over the last 24 hours.
 * @property { Object } liquidity - Object representing liquidity.
 * @property { number } liquidity.usd - Liquidity in USD.
 * @property { number } liquidity.base - Liquidity in base tokens.
 * @property { number } liquidity.quote - Liquidity in quote tokens.
 * @property { Object } volume - Object representing volume.
 * @property { number } volume.h24 - Volume over the last 24 hours.
 * @property { Object } txns - Object representing transactions.
 * @property { Object } txns.h24 - Object representing transactions over the last 24 hours.
 * @property { number } txns.h24.buys - Number of buy transactions.
 * @property { number } txns.h24.sells - Number of sell transactions.
 * @property { number } fdv - Fully diluted valuation of the pair.
 * @property { number } marketCap - Market capitalization of the pair.
 */
export interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceUsd: string;
    priceChange: {
        m5: number;
        h1: number;
        h24: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    volume: {
        h24: number;
    };
    txns: {
        h24: {
            buys: number;
            sells: number;
        };
    };
    fdv: number;
    marketCap: number;
}

/**
 * Interface representing processed token data.
 * @typedef {Object} ProcessedTokenData
 * @property {TokenSecurityData} security - Security data of the token.
 * @property {TokenTradeData} tradeData - Trade data of the token.
 * @property {Object} dexScreenerData - Data from dex screener.
 * @property {DexScreenerPair[]} dexScreenerData.pairs - Array of pairs from dex screener.
 * @property {string} holderDistributionTrend - Trend of holder distribution.
 * @property {Array<{ holderAddress: string, balanceUsd: string }>} highValueHolders - Array of high value holders.
 * @property {boolean} recentTrades - Indicates if recent trades exist.
 * @property {number} highSupplyHoldersCount - Count of high supply holders.
 * @property {Object} [tokenCodex] - Optional token codex data.
 * @property {boolean} tokenCodex.isScam - Indicates if token is a scam on token codex.
 */
export interface ProcessedTokenData {
    security: TokenSecurityData;
    tradeData: TokenTradeData;
    dexScreenerData: {
        pairs: DexScreenerPair[];
    };
    holderDistributionTrend: string;
    highValueHolders: Array<{
        holderAddress: string;
        balanceUsd: string;
    }>;
    recentTrades: boolean;
    highSupplyHoldersCount: number;
    tokenCodex?: {
        isScam: boolean;
    };
}
