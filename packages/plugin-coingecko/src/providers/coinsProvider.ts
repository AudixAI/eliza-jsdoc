import { IAgentRuntime, Memory, Provider, State, elizaLogger } from "@elizaos/core";
import axios from 'axios';
import { getApiConfig, validateCoingeckoConfig } from '../environment';

/**
 * Interface representing a coin item.
 * @property {string} id - The unique identifier of the coin item.
 * @property {string} symbol - The symbol representing the coin.
 * @property {string} name - The name of the coin.
 */
interface CoinItem {
    id: string;
    symbol: string;
    name: string;
}

const CACHE_KEY = 'coingecko:coins';
const CACHE_TTL = 5 * 60; // 5 minutes
const MAX_RETRIES = 3;

/**
 * Fetches a list of coins from the CoinGecko API based on the provided runtime and optional inclusion of platform coins.
 * 
 * @param {IAgentRuntime} runtime - The runtime object for communication and configuration
 * @param {boolean} includePlatform - Flag to include platform coins in the response (default is false)
 * @returns {Promise<CoinItem[]>} A promise that resolves with an array of CoinItem objects representing the fetched coins
 * @throws {Error} If the response data is empty or invalid
 */
async function fetchCoins(runtime: IAgentRuntime, includePlatform: boolean = false): Promise<CoinItem[]> {
    const config = await validateCoingeckoConfig(runtime);
    const { baseUrl, apiKey } = getApiConfig(config);

    const response = await axios.get<CoinItem[]>(
        `${baseUrl}/coins/list`,
        {
            params: {
                include_platform: includePlatform
            },
            headers: {
                'accept': 'application/json',
                'x-cg-pro-api-key': apiKey
            },
            timeout: 5000 // 5 second timeout
        }
    );

    if (!response.data?.length) {
        throw new Error("Invalid coins data received");
    }

    return response.data;
}

/**
 * Fetches coin items with retry mechanism.
 * 
 * @param {IAgentRuntime} runtime - The runtime context for the agent.
 * @param {boolean} includePlatform - Indicates if platform should be included in the fetch.
 * @returns {Promise<CoinItem[]>} - A promise that resolves with an array of CoinItem objects.
 */
async function fetchWithRetry(runtime: IAgentRuntime, includePlatform: boolean = false): Promise<CoinItem[]> {
    let lastError: Error | null = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await fetchCoins(runtime, includePlatform);
        } catch (error) {
            lastError = error;
            elizaLogger.error(`Coins fetch attempt ${i + 1} failed:`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }

    throw lastError || new Error("Failed to fetch coins after multiple attempts");
}

/**
 * Asynchronously retrieves a list of coins from the runtime's cache or fetches fresh data if cache is empty.
 * 
 * @param {IAgentRuntime} runtime - The runtime object used to interact with the agent environment.
 * @param {boolean} [includePlatform=false] - Flag indicating whether to include platform coins in the result.
 * @returns {Promise<CoinItem[]>} A promise that resolves to an array of CoinItem objects.
 * @throws {Error} If an error occurs during the operation.
 */
async function getCoins(runtime: IAgentRuntime, includePlatform: boolean = false): Promise<CoinItem[]> {
    try {
        // Try to get from cache first
        const cached = await runtime.cacheManager.get<CoinItem[]>(CACHE_KEY);
        if (cached) {
            return cached;
        }

        // Fetch fresh data
        const coins = await fetchWithRetry(runtime, includePlatform);

        // Cache the result
        await runtime.cacheManager.set(CACHE_KEY, coins, { expires: CACHE_TTL });

        return coins;
    } catch (error) {
        elizaLogger.error("Error fetching coins:", error);
        throw error;
    }
}

/**
 * Formats the given array of CoinItems into a readable string context,
 * showing popular coins and total available coins.
 * 
 * @param {CoinItem[]} coins - The array of CoinItems to format
 * @returns {string} A formatted string context displaying popular coins and total available coins
 */
function formatCoinsContext(coins: CoinItem[]): string {
    const popularCoins = [
        'bitcoin', 'ethereum', 'binancecoin', 'ripple',
        'cardano', 'solana', 'polkadot', 'dogecoin'
    ];

    const popular = coins
        .filter(c => popularCoins.includes(c.id))
        .map(c => `${c.name} (${c.symbol.toUpperCase()}) - ID: ${c.id}`);

    return `
Available cryptocurrencies:

Popular coins:
${popular.map(c => `- ${c}`).join('\n')}

Total available coins: ${coins.length}

You can use these coin IDs when querying specific cryptocurrency data.
`.trim();
}

export const coinsProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<string> => {
        try {
            const coins = await getCoins(runtime);
            return formatCoinsContext(coins);
        } catch (error) {
            elizaLogger.error("Coins provider error:", error);
            return "Cryptocurrency list is temporarily unavailable. Please try again later.";
        }
    }
};

// Helper function for actions to get raw coins data
/**
 * Asynchronously retrieves coin data using the provided Agent Runtime.
 * @param {IAgentRuntime} runtime - The Agent Runtime to use for making the request.
 * @param {boolean} [includePlatform=false] - Whether to include platform information in the response.
 * @returns {Promise<CoinItem[]>} A Promise that resolves to an array of CoinItem objects representing the retrieved coin data.
 */
export async function getCoinsData(runtime: IAgentRuntime, includePlatform: boolean = false): Promise<CoinItem[]> {
    return getCoins(runtime, includePlatform);
}