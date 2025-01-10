import {
    IAgentRuntime,
    ICacheManager,
    Memory,
    Provider,
    State,
} from "@elizaos/core";
import {
    Account,
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    Network,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";
import NodeCache from "node-cache";
import * as path from "path";
import { APT_DECIMALS } from "../constants";

// Provider configuration
const PROVIDER_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};

/**
 * Interface representing a user's wallet portfolio.
 * @property {string} totalUsd - The total amount of USD in the wallet.
 * @property {string} totalApt - The total amount of a specific cryptocurrency in the wallet (e.g. APT).
 */
interface WalletPortfolio {
    totalUsd: string;
    totalApt: string;
}

/**
 * Interface representing the prices for an apartment.
 * @typedef {Object} Prices
 * @property {Object} apt - The price information for an apartment.
 * @property {string} apt.usd - The price in USD for the apartment.
 */
interface Prices {
    apt: { usd: string };
}

/**
 * A class representing a Wallet Provider.
 */
export class WalletProvider {
    private cache: NodeCache;
    private cacheKey: string = "aptos/wallet";

/**
 * Constructor for creating a new instance of the class.
 * 
 * @param {Aptos} aptosClient - The Aptos client used for making API requests.
 * @param {string} address - The address associated with the instance.
 * @param {ICacheManager} cacheManager - The cache manager used for caching data.
 */
    constructor(
        private aptosClient: Aptos,
        private address: string,
        private cacheManager: ICacheManager
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
    }

/**
* Reads data from the cache for a specified key.
* 
* @template T - The type of data to be retrieved from the cache
* @param {string} key - The key used to retrieve data from the cache
* @returns {Promise<T | null>} - A promise that resolves with the cached data, or null if not found
*/
    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

/**
* Writes data to the cache with the specified key.
* @template T
* @param {string} key - The key to store the data under in the cache.
* @param {T} data - The data to be stored in the cache.
* @returns {Promise<void>} A Promise that resolves once the data is successfully written to the cache.
*/
    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 5 * 60 * 1000,
        });
    }

/**
 * Retrieves data from cache using the given key.
 * 
 * @param {string} key - The key to use for retrieving the data from cache.
 * @returns {Promise<T | null>} The cached data if found, otherwise null.
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
 * Saves the provided data to both in-memory cache and file-based cache.
 * 
 * @param {string} cacheKey - The key under which the data will be stored in the cache.
 * @param {T} data - The data to be stored in the cache.
 * @returns {Promise<void>} A Promise that resolves when the data has been successfully stored in both caches.
 */
    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

/**
 * Fetches the prices with retry mechanism.
 *
 * @private
 * @async
 * @returns {Promise<any>} The response data from the API.
 */
    private async fetchPricesWithRetry() {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            try {
                const cellanaAptUsdcPoolAddr =
                    "0x234f0be57d6acfb2f0f19c17053617311a8d03c9ce358bdf9cd5c460e4a02b7c";
                const response = await fetch(
                    `https://api.dexscreener.com/latest/dex/pairs/aptos/${cellanaAptUsdcPoolAddr}`
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
 * Asynchronously fetches the value of the wallet portfolio.
 * 
 * @returns {Promise<WalletPortfolio>} A promise that resolves to the wallet portfolio.
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
                console.error("Error fetching APT price:", error);
                throw error;
            });
            const aptAmountOnChain = await this.aptosClient
                .getAccountAPTAmount({
                    accountAddress: this.address,
                })
                .catch((error) => {
                    console.error("Error fetching APT amount:", error);
                    throw error;
                });

            const aptAmount = new BigNumber(aptAmountOnChain).div(
                new BigNumber(10).pow(APT_DECIMALS)
            );
            const totalUsd = new BigNumber(aptAmount).times(prices.apt.usd);

            const portfolio = {
                totalUsd: totalUsd.toString(),
                totalApt: aptAmount.toString(),
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
 * Asynchronously fetches prices and returns a Promise that resolves to Prices object.
 * 
 * @returns {Promise<Prices>} A Promise that resolves to Prices object containing APT price in USD.
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

            const aptPriceData = await this.fetchPricesWithRetry().catch(
                (error) => {
                    console.error("Error fetching APT price:", error);
                    throw error;
                }
            );
            const prices: Prices = {
                apt: { usd: aptPriceData.pair.priceUsd },
            };
            this.setCachedData(cacheKey, prices);
            return prices;
        } catch (error) {
            console.error("Error fetching prices:", error);
            throw error;
        }
    }

/**
 * Format the wallet portfolio information into a string with the character name,
 * wallet address, total value in USD and APT units.
 *
 * @param {Runtime} runtime - The runtime object containing character information.
 * @param {WalletPortfolio} portfolio - The portfolio containing total USD and APT values.
 * @returns {string} The formatted string with portfolio information.
 */
    formatPortfolio(runtime, portfolio: WalletPortfolio): string {
        let output = `${runtime.character.name}\n`;
        output += `Wallet Address: ${this.address}\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalAptFormatted = new BigNumber(portfolio.totalApt).toFixed(4);

        output += `Total Value: $${totalUsdFormatted} (${totalAptFormatted} APT)\n`;

        return output;
    }

/**
 * Asynchronously retrieves the portfolio value, formats it, and returns it as a promise.
 * 
 * @param {any} runtime - The runtime environment.
 * @returns {Promise<string>} A promise that resolves to the formatted portfolio value.
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
 * Retrieves the wallet information from the runtime settings and returns the formatted portfolio.
 *
 * @param {IAgentRuntime} runtime - The runtime context for the agent
 * @param {Memory} _message - The message passed to the provider (unused)
 * @param {State} [_state] - Optional state information (unused)
 * @returns {Promise<string | null>} The formatted portfolio information or null if there is an error
 */
const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        const privateKey = runtime.getSetting("APTOS_PRIVATE_KEY");
        const aptosAccount = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(
                PrivateKey.formatPrivateKey(
                    privateKey,
                    PrivateKeyVariants.Ed25519
                )
            ),
        });
        const network = runtime.getSetting("APTOS_NETWORK") as Network;

        try {
            const aptosClient = new Aptos(
                new AptosConfig({
                    network,
                })
            );
            const provider = new WalletProvider(
                aptosClient,
                aptosAccount.accountAddress.toStringLong(),
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
