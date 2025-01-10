/**
 * Interface representing the security data of a token.
 * @typedef {Object} TokenSecurityData
 * @property {string} ownerBalance - The balance of the token owner.
 * @property {string} creatorBalance - The balance of the token creator.
 * @property {number} ownerPercentage - The percentage owned by the token owner.
 * @property {number} creatorPercentage - The percentage owned by the token creator.
 * @property {string} top10HolderBalance - The balance of the top 10 token holders.
 * @property {number} top10HolderPercent - The percentage owned by the top 10 token holders.
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
 * Interface representing a token in a token codex.
 * @typedef {object} TokenCodex
 * @property {string} id - The unique identifier of the token.
 * @property {string} address - The address of the token on the blockchain.
 * @property {number} cmcId - The CoinMarketCap identifier of the token.
 * @property {number} decimals - The number of decimal places the token uses.
 * @property {string} name - The name of the token.
 * @property {string} symbol - The symbol of the token.
 * @property {string} totalSupply - The total supply of the token.
 * @property {string} circulatingSupply - The circulating supply of the token.
 * @property {string} imageThumbUrl - The URL of the token's thumbnail image.
 * @property {boolean} blueCheckmark - A flag indicating if the token has a blue checkmark on CoinMarketCap.
 * @property {boolean} isScam - A flag indicating if the token is considered a scam.
 */
export interface TokenCodex {
    id: string;
    address: string;
    cmcId: number;
    decimals: number;
    name: string;
    symbol: string;
    totalSupply: string;
    circulatingSupply: string;
    imageThumbUrl: string;
    blueCheckmark: boolean;
    isScam: boolean;
}

/**
 * Interface for Token Trade Data.
 * Contains various properties related to trading data for a specific token.
 */
export interface TokenTradeData {
    address: string;
    holder: number;
    market: number;
    last_trade_unix_time: number;
    last_trade_human_time: string;
    price: number;
    history_30m_price: number;
    price_change_30m_percent: number;
    history_1h_price: number;
    price_change_1h_percent: number;
    history_2h_price: number;
    price_change_2h_percent: number;
    history_4h_price: number;
    price_change_4h_percent: number;
    history_6h_price: number;
    price_change_6h_percent: number;
    history_8h_price: number;
    price_change_8h_percent: number;
    history_12h_price: number;
    price_change_12h_percent: number;
    history_24h_price: number;
    price_change_24h_percent: number;
    unique_wallet_30m: number;
    unique_wallet_history_30m: number;
    unique_wallet_30m_change_percent: number;
    unique_wallet_1h: number;
    unique_wallet_history_1h: number;
    unique_wallet_1h_change_percent: number;
    unique_wallet_2h: number;
    unique_wallet_history_2h: number;
    unique_wallet_2h_change_percent: number;
    unique_wallet_4h: number;
    unique_wallet_history_4h: number;
    unique_wallet_4h_change_percent: number;
    unique_wallet_8h: number;
    unique_wallet_history_8h: number | null;
    unique_wallet_8h_change_percent: number | null;
    unique_wallet_24h: number;
    unique_wallet_history_24h: number | null;
    unique_wallet_24h_change_percent: number | null;
    trade_30m: number;
    trade_history_30m: number;
    trade_30m_change_percent: number;
    sell_30m: number;
    sell_history_30m: number;
    sell_30m_change_percent: number;
    buy_30m: number;
    buy_history_30m: number;
    buy_30m_change_percent: number;
    volume_30m: number;
    volume_30m_usd: number;
    volume_history_30m: number;
    volume_history_30m_usd: number;
    volume_30m_change_percent: number;
    volume_buy_30m: number;
    volume_buy_30m_usd: number;
    volume_buy_history_30m: number;
    volume_buy_history_30m_usd: number;
    volume_buy_30m_change_percent: number;
    volume_sell_30m: number;
    volume_sell_30m_usd: number;
    volume_sell_history_30m: number;
    volume_sell_history_30m_usd: number;
    volume_sell_30m_change_percent: number;
    trade_1h: number;
    trade_history_1h: number;
    trade_1h_change_percent: number;
    sell_1h: number;
    sell_history_1h: number;
    sell_1h_change_percent: number;
    buy_1h: number;
    buy_history_1h: number;
    buy_1h_change_percent: number;
    volume_1h: number;
    volume_1h_usd: number;
    volume_history_1h: number;
    volume_history_1h_usd: number;
    volume_1h_change_percent: number;
    volume_buy_1h: number;
    volume_buy_1h_usd: number;
    volume_buy_history_1h: number;
    volume_buy_history_1h_usd: number;
    volume_buy_1h_change_percent: number;
    volume_sell_1h: number;
    volume_sell_1h_usd: number;
    volume_sell_history_1h: number;
    volume_sell_history_1h_usd: number;
    volume_sell_1h_change_percent: number;
    trade_2h: number;
    trade_history_2h: number;
    trade_2h_change_percent: number;
    sell_2h: number;
    sell_history_2h: number;
    sell_2h_change_percent: number;
    buy_2h: number;
    buy_history_2h: number;
    buy_2h_change_percent: number;
    volume_2h: number;
    volume_2h_usd: number;
    volume_history_2h: number;
    volume_history_2h_usd: number;
    volume_2h_change_percent: number;
    volume_buy_2h: number;
    volume_buy_2h_usd: number;
    volume_buy_history_2h: number;
    volume_buy_history_2h_usd: number;
    volume_buy_2h_change_percent: number;
    volume_sell_2h: number;
    volume_sell_2h_usd: number;
    volume_sell_history_2h: number;
    volume_sell_history_2h_usd: number;
    volume_sell_2h_change_percent: number;
    trade_4h: number;
    trade_history_4h: number;
    trade_4h_change_percent: number;
    sell_4h: number;
    sell_history_4h: number;
    sell_4h_change_percent: number;
    buy_4h: number;
    buy_history_4h: number;
    buy_4h_change_percent: number;
    volume_4h: number;
    volume_4h_usd: number;
    volume_history_4h: number;
    volume_history_4h_usd: number;
    volume_4h_change_percent: number;
    volume_buy_4h: number;
    volume_buy_4h_usd: number;
    volume_buy_history_4h: number;
    volume_buy_history_4h_usd: number;
    volume_buy_4h_change_percent: number;
    volume_sell_4h: number;
    volume_sell_4h_usd: number;
    volume_sell_history_4h: number;
    volume_sell_history_4h_usd: number;
    volume_sell_4h_change_percent: number;
    trade_8h: number;
    trade_history_8h: number | null;
    trade_8h_change_percent: number | null;
    sell_8h: number;
    sell_history_8h: number | null;
    sell_8h_change_percent: number | null;
    buy_8h: number;
    buy_history_8h: number | null;
    buy_8h_change_percent: number | null;
    volume_8h: number;
    volume_8h_usd: number;
    volume_history_8h: number;
    volume_history_8h_usd: number;
    volume_8h_change_percent: number | null;
    volume_buy_8h: number;
    volume_buy_8h_usd: number;
    volume_buy_history_8h: number;
    volume_buy_history_8h_usd: number;
    volume_buy_8h_change_percent: number | null;
    volume_sell_8h: number;
    volume_sell_8h_usd: number;
    volume_sell_history_8h: number;
    volume_sell_history_8h_usd: number;
    volume_sell_8h_change_percent: number | null;
    trade_24h: number;
    trade_history_24h: number;
    trade_24h_change_percent: number | null;
    sell_24h: number;
    sell_history_24h: number;
    sell_24h_change_percent: number | null;
    buy_24h: number;
    buy_history_24h: number;
    buy_24h_change_percent: number | null;
    volume_24h: number;
    volume_24h_usd: number;
    volume_history_24h: number;
    volume_history_24h_usd: number;
    volume_24h_change_percent: number | null;
    volume_buy_24h: number;
    volume_buy_24h_usd: number;
    volume_buy_history_24h: number;
    volume_buy_history_24h_usd: number;
    volume_buy_24h_change_percent: number | null;
    volume_sell_24h: number;
    volume_sell_24h_usd: number;
    volume_sell_history_24h: number;
    volume_sell_history_24h_usd: number;
    volume_sell_24h_change_percent: number | null;
}

/**
 * Interface representing data for a holder.
 * @typedef {Object} HolderData
 * @property {string} address - The address of the holder.
 * @property {string} balance - The balance of the holder.
 */
export interface HolderData {
    address: string;
    balance: string;
}

/**
 * Interface representing processed token data.
 * * @typedef { Object } ProcessedTokenData
 * @property { TokenSecurityData } security - The security data of the token.
 * @property { TokenTradeData } tradeData - The trade data of the token.
 * @property { string } holderDistributionTrend - The trend of holder distribution ('increasing', 'decreasing', 'stable').
 * @property {Array<{ holderAddress: string, balanceUsd: string }>} highValueHolders - Array of high value holders with their addresses and USD balance.
 * @property { boolean } recentTrades - Indicates if recent trades have been made with the token.
 * @property { number } highSupplyHoldersCount - The count of high supply holders.
 * @property { DexScreenerData } dexScreenerData - The data from Dex Screener.
 * @property { boolean } isDexScreenerListed - Indicates if the token is listed on Dex Screener.
 * @property { boolean } isDexScreenerPaid - Indicates if the token listing on Dex Screener is paid.
 * @property { TokenCodex } tokenCodex - The codex data of the token.
 */
export interface ProcessedTokenData {
    security: TokenSecurityData;
    tradeData: TokenTradeData;
    holderDistributionTrend: string; // 'increasing' | 'decreasing' | 'stable'
    highValueHolders: Array<{
        holderAddress: string;
        balanceUsd: string;
    }>;
    recentTrades: boolean;
    highSupplyHoldersCount: number;
    dexScreenerData: DexScreenerData;

    isDexScreenerListed: boolean;
    isDexScreenerPaid: boolean;
    tokenCodex: TokenCodex;
}

/**
 * Interface for representing information about a DexScreenerPair.
 * @interface DexScreenerPair
 * @property {string} chainId - The chain ID associated with the pair.
 * @property {string} dexId - The unique identifier for the DEX.
 * @property {string} url - The URL linking to more information about the pair.
 * @property {string} pairAddress - The address of the pair.
 * @property {Object} baseToken - Information about the base token.
 * @property {string} baseToken.address - The address of the base token.
 * @property {string} baseToken.name - The name of the base token.
 * @property {string} baseToken.symbol - The symbol of the base token.
 * @property {Object} quoteToken - Information about the quote token.
 * @property {string} quoteToken.address - The address of the quote token.
 * @property {string} quoteToken.name - The name of the quote token.
 * @property {string} quoteToken.symbol - The symbol of the quote token.
 * @property {string} priceNative - The native price of the pair.
 * @property {string} priceUsd - The price in USD.
 * @property {Object} txns - Information about transactions.
 * @property {Object} txns.m5 - Transaction information for the last 5 minutes.
 * @property {number} txns.m5.buys - The number of buys in the last 5 minutes.
 * @property {number} txns.m5.sells - The number of sells in the last 5 minutes.
 * @property {Object} volume - Information about volume.
 * @property {number} volume.h24 - The volume in the last 24 hours.
 * @property {number} volume.h6 - The volume in the last 6 hours.
 * @property {number} volume.h1 - The volume in the last hour.
 * @property {number} volume.m5 - The volume in the last 5 minutes.
 * @property {Object} priceChange - Information about price changes.
 * @property {number} priceChange.m5 - The price change in the last 5 minutes.
 * @property {number} priceChange.h1 - The price change in the last hour.
 * @property {number} priceChange.h6 - The price change in the last 6 hours.
 * @property {number} priceChange.h24 - The price change in the last 24 hours.
 * @property {Object} liquidity - Information about liquidity.
 * @property {number} liquidity.usd - The liquidity in USD.
 * @property {number} liquidity.base - The liquidity in the base token.
 * @property {number} liquidity.quote - The liquidity in the quote token.
 * @property {number} fdv - The fully diluted valuation.
 * @property {number} marketCap - The market capitalization.
 * @property {number} pairCreatedAt - The timestamp when the pair was created.
 * @property {Object} info - Additional information.
 * @property {string} info.imageUrl - The URL of the image associated with the pair.
 * @property {Array} info.websites - An array of objects containing website information.
 * @property {string} info.websites.label - The label for the website.
 * @property {string} info.websites.url - The URL of the website.
 * @property {Array} info.socials - An array of objects containing social media information.
 * @property {string} info.socials.type - The type of social media platform.
 * @property {string} info.socials.url - The URL of the social media profile.
 * @property {Object} boosts - Information about boosts.
 * @property {number} boosts.active - The active number of boosts.
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
    priceNative: string;
    priceUsd: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    marketCap: number;
    pairCreatedAt: number;
    info: {
        imageUrl: string;
        websites: { label: string; url: string }[];
        socials: { type: string; url: string }[];
    };
    boosts: {
        active: number;
    };
}

/**
 * Interface representing data returned from a Dex Screener.
 * @typedef {Object} DexScreenerData
 * @property {string} schemaVersion - The version of the schema.
 * @property {DexScreenerPair[]} pairs - An array of DexScreenerPair objects.
 */
export interface DexScreenerData {
    schemaVersion: string;
    pairs: DexScreenerPair[];
}

/**
 * Interface representing the prices of different cryptocurrencies.
 * @property {Object} solana - Object containing the price of Solana in USD.
 * @property {string} solana.usd - The price of Solana in USD.
 * @property {Object} bitcoin - Object containing the price of Bitcoin in USD.
 * @property {string} bitcoin.usd - The price of Bitcoin in USD.
 * @property {Object} ethereum - Object containing the price of Ethereum in USD.
 * @property {string} ethereum.usd - The price of Ethereum in USD.
 */
export interface Prices {
    solana: { usd: string };
    bitcoin: { usd: string };
    ethereum: { usd: string };
}

/**
 * Interface representing the calculated buy amounts.
 * @typedef {Object} CalculatedBuyAmounts
 * @property {number} none - The buy amount for when there are no items.
 * @property {number} low - The low buy amount.
 * @property {number} medium - The medium buy amount.
 * @property {number} high - The high buy amount.
 */
export interface CalculatedBuyAmounts {
    none: 0;
    low: number;
    medium: number;
    high: number;
}
