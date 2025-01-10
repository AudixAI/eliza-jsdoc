import {
    IAgentRuntime,
    ICacheManager,
    Memory,
    Provider,
    State,
} from "@elizaos/core";

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

import { MIST_PER_SUI } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import NodeCache from "node-cache";
import * as path from "path";
import { parseAccount } from "../utils";

// Provider configuration
const PROVIDER_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};

/**
 * Represents a user's wallet portfolio with total values in USD and SUI.
 * @typedef {Object} WalletPortfolio
 * @property {string} totalUsd - The total value in USD
 * @property {string} totalSui - The total value in SUI
 */
interface WalletPortfolio {
    totalUsd: string;
    totalSui: string;
}

/**
 * Interface representing prices for a specific item.
 * @interface
 * @property {object} sui - Prices for the item "sui"
 * @property {string} sui.usd - Price in USD for the item "sui"
 */
interface Prices {
    sui: { usd: string };
}

/**
 * Represents different types of networks such as mainnet, testnet, devnet, or localnet.
 */
type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

/**
 * A class representing a Wallet Provider that interacts with the
 * SUI wallet and caches data for efficient retrieval.
 * @class
 */
export class WalletProvider {
    private cache: NodeCache;
    private cacheKey: string = "sui/wallet";

/**
 * Constructor for initializing a new instance of the class.
 * 
 * @param {SuiClient} suiClient - The SuiClient object used for making requests.
 * @param {string} address - The address to be used in the requests.
 * @param {ICacheManager} cacheManager - The cache manager to be used for caching data.
 */
    constructor(
        private suiClient: SuiClient,
        private address: string,
        private cacheManager: ICacheManager
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
    }

/**
 * Reads the value from cache for the specified key.
 * @template T
 * @param {string} key - The key to read from cache.
 * @returns {Promise<T | null>} The cached value, or null if not found in cache.
 */
    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

/**
 * Write data to cache with specified key and expiration time.
 * 
 * @template T
 * @param {string} key - The key for the data in the cache.
 * @param {T} data - The data to be stored in the cache.
 * @returns {Promise<void>} A promise that resolves when the data is successfully saved to the cache.
 */
    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 5 * 60 * 1000,
        });
    }

/**
 * Retrieve data from cache with specified key.
 * Checks in-memory cache first, then file-based cache if data not found.
 * If data is found in file-based cache, it populates in-memory cache before returning the data.
 * @param {string} key - The key to identify the data in the cache.
 * @returns {Promise<T | null>} A promise that resolves with the cached data if found, otherwise null.
 */
    private async getCachedData<T>(key: string): Promise<T | null> {
        // Check in-memory cache first
        const cachedData = this.cache.get<T>(key);
        if (cachedData) {
            return cachedData;
        }

        // Check file-based cache
        const fileCachedData = await this.readFromCache<T>(key);
        if (fileCachedData) {
            // Populate in-memory cache
            this.cache.set(key, fileCachedData);
            return fileCachedData;
        }

        return null;
    }

/**
* Sets the provided data in the in-memory cache with the specified cache key.
* Additionally, the data is written to the file-based cache.
* 
* @template T The type of data being cached
* @param {string} cacheKey The key under which the data will be stored
* @param {T} data The data to be stored in the cache
* @returns {Promise<void>} A Promise that resolves once the data is successfully cached
*/
    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

/**
 * Fetches prices with retries in case of failure.
 * @returns {Promise} A promise that resolves with the fetched data or rejects with the last error encountered.
 */
    private async fetchPricesWithRetry() {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            try {
                const cetusSuiUsdcPoolAddr =
                    "0x51e883ba7c0b566a26cbc8a94cd33eb0abd418a77cc1e60ad22fd9b1f29cd2ab";
                const response = await fetch(
                    `https://api.dexscreener.com/latest/dex/pairs/sui/${cetusSuiUsdcPoolAddr}`
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `HTTP error! status: ${response.status}, message: ${errorText}`
                    );
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                lastError = error;
                if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
                    const delay = PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        console.error(
            "All attempts failed. Throwing the last error:",
            lastError
        );
        throw lastError;
    }

/**
 * Asynchronously fetches the portfolio value for the wallet.
 * If data is cached, returns the cached data.
 * Otherwise, fetches prices and SUI amount, calculates total USD value,
 * saves data to cache, and returns the portfolio data.
 * 
 * @returns {Promise<WalletPortfolio>} The portfolio data including total USD value and total SUI amount
 */
    async fetchPortfolioValue(): Promise<WalletPortfolio> {
        try {
            const cacheKey = `portfolio-${this.address}`;
            const cachedValue =
                await this.getCachedData<WalletPortfolio>(cacheKey);

            if (cachedValue) {
                console.log("Cache hit for fetchPortfolioValue", cachedValue);
                return cachedValue;
            }
            console.log("Cache miss for fetchPortfolioValue");

            const prices = await this.fetchPrices().catch((error) => {
                console.error("Error fetching SUI price:", error);
                throw error;
            });
            const suiAmountOnChain = await this.suiClient
                .getBalance({
                    owner: this.address,
                })
                .catch((error) => {
                    console.error("Error fetching SUI amount:", error);
                    throw error;
                });

            const suiAmount =
                Number.parseInt(suiAmountOnChain.totalBalance) /
                Number(MIST_PER_SUI);
            const totalUsd = new BigNumber(suiAmount).times(prices.sui.usd);

            const portfolio = {
                totalUsd: totalUsd.toString(),
                totalSui: suiAmount.toString(),
            };
            this.setCachedData(cacheKey, portfolio);
            console.log("Fetched portfolio:", portfolio);
            return portfolio;
        } catch (error) {
            console.error("Error fetching portfolio:", error);
            throw error;
        }
    }

/**
 * Fetches the current prices from a server. Checks cache first and returns cached value if available.
 * Otherwise makes a new API call to fetch prices, stores them in cache, and returns the fetched prices.
 * @returns {Promise<Prices>} The current prices fetched from the server.
 */
    async fetchPrices(): Promise<Prices> {
        try {
            const cacheKey = "prices";
            const cachedValue = await this.getCachedData<Prices>(cacheKey);

            if (cachedValue) {
                console.log("Cache hit for fetchPrices");
                return cachedValue;
            }
            console.log("Cache miss for fetchPrices");

            const suiPriceData = await this.fetchPricesWithRetry().catch(
                (error) => {
                    console.error("Error fetching SUI price:", error);
                    throw error;
                }
            );
            const prices: Prices = {
                sui: { usd: suiPriceData.pair.priceUsd },
            };
            this.setCachedData(cacheKey, prices);
            return prices;
        } catch (error) {
            console.error("Error fetching prices:", error);
            throw error;
        }
    }

/**
 * Formats the portfolio information for display.
 * 
 * @param {object} runtime - The current runtime environment.
 * @param {WalletPortfolio} portfolio - The portfolio to format.
 * @returns {string} The formatted portfolio information as a string.
 */
    formatPortfolio(runtime, portfolio: WalletPortfolio): string {
        let output = `${runtime.character.name}\n`;
        output += `Wallet Address: ${this.address}\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalSuiFormatted = new BigNumber(portfolio.totalSui).toFixed(4);

        output += `Total Value: $${totalUsdFormatted} (${totalSuiFormatted} SUI)\n`;

        return output;
    }

/**
     * Asynchronously retrieves the portfolio value and formats it based on the given runtime.
     * @param {any} runtime - The runtime used to format the portfolio.
     * @returns {Promise<string>} A promise that resolves to the formatted portfolio string.
     */
    async getFormattedPortfolio(runtime): Promise<string> {
        try {
            const portfolio = await this.fetchPortfolioValue();
            return this.formatPortfolio(runtime, portfolio);
        } catch (error) {
            console.error("Error generating portfolio report:", error);
            return "Unable to fetch wallet information. Please try again later.";
        }
    }
}

/**
 * A wallet provider that retrieves the formatted portfolio using SuiClient and WalletProvider.
 *
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @param {Memory} _message - The message object (not used in this method).
 * @param {State} [_state] - The optional state object (not used in this method).
 * @returns {Promise<string | null>} The formatted portfolio string or null if an error occurs.
 */
const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        const suiAccount = parseAccount(runtime);

        try {
            const suiClient = new SuiClient({
                url: getFullnodeUrl(
                    runtime.getSetting("SUI_NETWORK") as SuiNetwork
                ),
            });
            const provider = new WalletProvider(
                suiClient,
                suiAccount.toSuiAddress(),
                runtime.cacheManager
            );
            return await provider.getFormattedPortfolio(runtime);
        } catch (error) {
            console.error("Error in wallet provider:", error);
            return null;
        }
    },
};

// Module exports
export { walletProvider };
