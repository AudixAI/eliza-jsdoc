import puppeteer from 'puppeteer';

/**
 * Response object for Dex Screener API
 * @typedef {Object} DexScreenerResponse
 * @property {string} schemaVersion - The version of the schema
 * @property {Array} pairs - Array of pairs with detailed information
 * @property {string} pairs[].chainId - The chain ID of the pair
 * @property {string} pairs[].dexId - The ID of the DEX
 * @property {string} pairs[].pairAddress - The address of the pair
 * @property {Object} pairs[].baseToken - Information about the base token
 * @property {string} pairs[].baseToken.address - The address of the base token
 * @property {string} pairs[].baseToken.name - The name of the base token
 * @property {string} pairs[].baseToken.symbol - The symbol of the base token
 * @property {number} pairs[].baseToken.decimals - The decimal places of the base token
 * @property {string} pairs[].price - The price of the pair
 * @property {string} pairs[].priceUsd - The price of the pair in USD
 * @property {Object} pairs[].txns - Transaction information
 * @property {Object} pairs[].txns.m5 - Transactions in the last 5 minutes
 * @property {number} pairs[].txns.m5.buys - Number of buys in the last 5 minutes
 * @property {number} pairs[].txns.m5.sells - Number of sells in the last 5 minutes
 * @property {Object} pairs[].txns.h1 - Transactions in the last 1 hour
 * @property {number} pairs[].txns.h1.buys - Number of buys in the last 1 hour
 * @property {number} pairs[].txns.h1.sells - Number of sells in the last 1 hour
 * @property {Object} pairs[].txns.h6 - Transactions in the last 6 hours
 * @property {number} pairs[].txns.h6.buys - Number of buys in the last 6 hours
 * @property {number} pairs[].txns.h6.sells - Number of sells in the last 6 hours
 * @property {Object} pairs[].txns.h24 - Transactions in the last 24 hours
 * @property {number} pairs[].txns.h24.buys - Number of buys in the last 24 hours
 * @property {number} pairs[].txns.h24.sells - Number of sells in the last 24 hours
 * @property {Object} pairs[].volume - Volume information
 * @property {number} pairs[].volume.m5 - Volume in the last 5 minutes
 * @property {number} pairs[].volume.h1 - Volume in the last 1 hour
 * @property {number} pairs[].volume.h6 - Volume in the last 6 hours
 * @property {number} pairs[].volume.h24 - Volume in the last 24 hours
 * @property {Object} pairs[].priceChange - Price change information
 * @property {number} pairs[].priceChange.m5 - Price change in the last 5 minutes
 * @property {number} pairs[].priceChange.h1 - Price change in the last 1 hour
 * @property {number} pairs[].priceChange.h6 - Price change in the last 6 hours
 * @property {number} pairs[].priceChange.h24 - Price change in the last 24 hours
 */
interface DexScreenerResponse {
    schemaVersion: string;
    pairs: Array<{
        chainId: string;
        dexId: string;
        pairAddress: string;
        baseToken: {
            address: string;
            name: string;
            symbol: string;
            decimals: number;
        };
        price: string;
        priceUsd: string;
        txns: {
            m5: { buys: number; sells: number; };
            h1: { buys: number; sells: number; };
            h6: { buys: number; sells: number; };
            h24: { buys: number; sells: number; };
        };
        volume: {
            m5: number;
            h1: number;
            h6: number;
            h24: number;
        };
        priceChange: {
            m5: number;
            h1: number;
            h6: number;
            h24: number;
        };
    }>;
}

/**
 * Retrieves data from DexScreener website using Puppeteer.
 * @returns {Promise<DexScreenerResponse>} Response data from DexScreener website.
 */
export async function getDexScreenerData(): Promise<DexScreenerResponse> {
    const browser = await puppeteer.launch({
        headless: 'new'
    });

    try {
        const page = await browser.newPage();

        // Navigate to DexScreener
        await page.goto('https://dexscreener.com');

        // Wait for the __SERVER_DATA to be available
        const serverData = await page.evaluate(() => {
            return (window as any).__SERVER_DATA;
        });

        return serverData;

    } catch (error) {
        console.error('Error fetching DexScreener data:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Analyzes a pair from a DexScreenerResponse to determine if it meets certain criteria.
 * @param {Object} pair - The pair to analyze.
 * @returns {Object|boolean} Returns false if pair does not meet criteria, or an object with pair information if it does.
 */
export function analyzePair(pair: DexScreenerResponse['pairs'][0]) {
    const volumeThreshold = 10000; // $10k minimum volume
    const priceChangeThreshold = 5; // 5% price change threshold

    // Check if pair meets basic criteria
    if (pair.volume.h24 < volumeThreshold) {
        return false;
    }

    // Check for significant price movement
    if (Math.abs(pair.priceChange.h1) > priceChangeThreshold) {
        return {
            symbol: pair.baseToken.symbol,
            price: parseFloat(pair.priceUsd),
            priceChange: pair.priceChange.h1,
            volume24h: pair.volume.h24,
            buyCount: pair.txns.h1.buys,
            sellCount: pair.txns.h1.sells
        };
    }

    return false;
}