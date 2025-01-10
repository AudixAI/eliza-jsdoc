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
import { MOVE_DECIMALS, MOVEMENT_NETWORK_CONFIG } from "../constants";

// Provider configuration
const PROVIDER_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};

/**
 * Interface representing a wallet portfolio.
 * @typedef {Object} WalletPortfolio
 * @property {string} totalUsd - The total amount in USD.
 * @property {string} totalMove - The total movement amount.
 */
interface WalletPortfolio {
    totalUsd: string;
    totalMove: string;
}

/**
 * Interface for prices containing move in USD
 * @property {string} Prices.move.usd - Price in USD
 */
interface Prices {
    move: { usd: string };
}

/**
 * Class representing a WalletProvider that manages wallet data and caching.
 */
export class WalletProvider {
    private cache: NodeCache;
    private cacheKey: string = "movement/wallet";

/**
 * Constructor for creating a new instance of a class with an Aptos client, address string, and cache manager.
 * Initializes a NodeCache with a standard TTL of 5 minutes.
 *
 * @param {Aptos} aptosClient - The Aptos client to use for API calls.
 * @param {string} address - The address to be used in API requests.
 * @param {ICacheManager} cacheManager - The cache manager to handle caching data.
 */
    constructor(
        private aptosClient: Aptos,
        private address: string,
        private cacheManager: ICacheManager
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
    }

/**
 * Reads data from the cache based on the specified key.
 * 
 * @param {string} key - The key to retrieve data from the cache.
 * @returns {Promise<T | null>} The cached data if found, or null if not found.
 */
    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

/**
 * Write data to the cache with the specified key.
 * @template T
 * @param {string} key - The key to store the data under in the cache.
 * @param {T} data - The data to be stored in the cache.
 * @returns {Promise<void>} A Promise that resolves when the data is successfully stored in the cache.
 */
    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 5 * 60 * 1000,
        });
    }

/**
 * Retrieves data from cache either from in-memory or file-based cache.
 * 
 * @param key - The key to retrieve the data from cache.
 * @returns Promise that resolves with the cached data or null if data is not found in cache.
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
 * Set cached data in both in-memory and file-based cache.
 * 
 * @param {string} cacheKey - The key for the cached data.
 * @param {T} data - The data to be cached.
 * @returns {Promise<void>} - A Promise that resolves once the data has been successfully cached.
 */
    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

/**
 * Fetches prices from a specific provider with retries in case of failures.
 * @private
 * @async
 * @returns {Promise<any>} The data fetched from the provider
 */
    private async fetchPricesWithRetry() {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            try {
                const MoveUsdcPoolAddr =
                    "0xA04d13F092f68F603A193832222898B0d9f52c71";
                const response = await fetch(
                    `https://api.dexscreener.com/latest/dex/pairs/ethereum/${MoveUsdcPoolAddr}`
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
 * Fetch the portfolio value for the wallet
 * 
 * @returns {Promise<WalletPortfolio>} The portfolio value of the wallet
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
                console.error("Error fetching Move price:", error);
                throw error;
            });
            const moveAmountOnChain = await this.aptosClient
                .getAccountAPTAmount({
                    accountAddress: this.address,
                })
                .catch((error) => {
                    console.error("Error fetching Move amount:", error);
                    throw error;
                });

            const moveAmount = new BigNumber(moveAmountOnChain).div(
                new BigNumber(10).pow(MOVE_DECIMALS)
            );
            const totalUsd = new BigNumber(moveAmount).times(prices.move.usd);

            const portfolio = {
                totalUsd: totalUsd.toString(),
                totalMove: moveAmount.toString(),
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
 * It first checks the cache for any cached data and returns it if found.
 * If cache miss, makes a call to fetchPricesWithRetry to get the latest prices data,
 * sets the fetched prices in the cache for future use, and returns the prices.
 * 
 * @returns {Promise<Prices>} A Promise that resolves with the fetched prices.
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

            const movePriceData = await this.fetchPricesWithRetry().catch(
                (error) => {
                    console.error("Error fetching Move price:", error);
                    throw error;
                }
            );
            const prices: Prices = {
                move: { usd: movePriceData.pair.priceUsd },
            };
            this.setCachedData(cacheKey, prices);
            return prices;
        } catch (error) {
            console.error("Error fetching prices:", error);
            throw error;
        }
    }

/**
 * Formats the wallet portfolio information to display character name, wallet address, total value in USD, and total value in Move.
 * 
 * @param {any} runtime - The runtime object containing character information
 * @param {WalletPortfolio} portfolio - The portfolio object containing total value in USD and Move
 * @returns {string} The formatted portfolio information
 */
    formatPortfolio(runtime, portfolio: WalletPortfolio): string {
        let output = `${runtime.character.name}\n`;
        output += `Wallet Address: ${this.address}\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalMoveFormatted = new BigNumber(portfolio.totalMove).toFixed(4);

        output += `Total Value: $${totalUsdFormatted} (${totalMoveFormatted} Move)\n`;

        return output;
    }

/**
 * Asynchronously fetches the portfolio value and formats it based on the specified runtime.
 * 
 * @param {any} runtime - The runtime to use for formatting the portfolio
 * @returns {Promise<string>} A Promise that resolves with the formatted portfolio value or an error message
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
 * Function to get wallet information from a provider.
 *
 * @param {IAgentRuntime} runtime - The agent runtime environment.
 * @param {Memory} _message - The memory object passed to the function.
 * @param {State} [_state] - The state object passed to the function (optional).
 * @returns {Promise<string | null>} The formatted portfolio string or null if an error occurs.
 */
const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        const privateKey = runtime.getSetting("MOVEMENT_PRIVATE_KEY");
        const movementAccount = Account.fromPrivateKey({
            privateKey: new Ed25519PrivateKey(
                PrivateKey.formatPrivateKey(
                    privateKey,
                    PrivateKeyVariants.Ed25519
                )
            ),
        });
        const network = runtime.getSetting("MOVEMENT_NETWORK") as Network;

        try {
            const aptosClient = new Aptos(
                new AptosConfig({
                    network: Network.CUSTOM,
                    fullnode: MOVEMENT_NETWORK_CONFIG[network].fullnode
                })
            );
            const provider = new WalletProvider(
                aptosClient,
                movementAccount.accountAddress.toStringLong(),
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
