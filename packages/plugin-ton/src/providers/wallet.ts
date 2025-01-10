import {
    IAgentRuntime,
    ICacheManager,
    Memory,
    Provider,
    State,
} from "@elizaos/core";

import { TonClient, WalletContractV4 } from "@ton/ton";
import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";

import NodeCache from "node-cache";
import * as path from "path";
import BigNumber from "bignumber.js";

const PROVIDER_CONFIG = {
    MAINNET_RPC: "https://toncenter.com/api/v2/jsonRPC",
    STONFI_TON_USD_POOL: "EQCGScrZe1xbyWqWDvdI6mzP-GAcAWFv6ZXuaJOuSqemxku4",
    CHAIN_NAME_IN_DEXSCREENER: "ton",
    // USD_DECIMAL=10^6
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    // 10^9
    TON_DECIMAL: BigInt(1000000000),
};
// settings
// TON_PRIVATE_KEY, TON_RPC_URL

/**
 * Interface representing a wallet portfolio with the total USD and total native token balances.
 *
 * @interface
 * @property {string} totalUsd - The total balance in USD.
 * @property {string} totalNativeToken - The total balance in native token.
 */
interface WalletPortfolio {
    totalUsd: string;
    totalNativeToken: string;
}

/**
 * Interface representing the prices of the native token in USD.
 * Contains a property for the USD value of the native token.
 */
interface Prices {
    nativeToken: { usd: string };
}

/**
 * A class representing a Wallet Provider for interacting with TON Wallets.
 */
export class WalletProvider {
    keypair: KeyPair;
    wallet: WalletContractV4;
    private cache: NodeCache;
    private cacheKey: string = "ton/wallet";

    // reqiure hex private key
/**
 * Constructor for creating a WalletClient.
 * 
 * @param {KeyPair} keypair The key pair to be used for the client.
 * @param {string} endpoint The endpoint for the client to communicate with.
 * @param {ICacheManager} cacheManager The cache manager for handling caching.
 */
    constructor(
        // mnemonic: string,
        keypair: KeyPair,
        private endpoint: string,
        private cacheManager: ICacheManager
    ) {
        this.keypair = keypair;
        this.cache = new NodeCache({ stdTTL: 300 });
        this.wallet = WalletContractV4.create({
            workchain: 0,
            publicKey: keypair.publicKey,
        });
    }

    // thanks to plugin-sui
/**
 * Reads a value from the cache based on the provided key.
 * 
 * @template T - The type of the value to be returned.
 * @param {string} key - The key used to retrieve the value from the cache.
 * @returns {Promise<T | null>} - The cached value if found, or null if not found.
 */
    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

/**
 * Writes the provided data to the cache with the specified key.
 * 
 * @template T
 * @param {string} key - The key to use for storing the data in the cache.
 * @param {T} data - The data to write to the cache.
 * @returns {Promise<void>} A Promise that resolves once the data has been successfully written to the cache.
 */
    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 5 * 60 * 1000,
        });
    }

/**
 * Retrieves data from the cache using the provided key.
 * Returns the cached data if found in the in-memory cache or file-based cache.
 * If the data is not found in either cache, returns null.
 * 
 * @template T The type of data to be retrieved from the cache
 * @param key The key used to retrieve the data from the cache
 * @returns A Promise that resolves to the cached data if found, or null if not found
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
 * Saves the given data to both in-memory cache and file-based cache.
 * 
 * @param {string} cacheKey - The key to store the data in the cache.
 * @param {T} data - The data to be stored in the cache.
 * @returns {Promise<void>} A Promise that resolves once the data is successfully saved in both caches.
 */
    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

/**
 * Fetches the latest prices for a specific pool from the Dexscreener API with retry logic.
 * @private
 * @async
 * @returns {Promise<Object>} The data retrieved from the API.
 */
    private async fetchPricesWithRetry() {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            try {
                const response = await fetch(
                    `https://api.dexscreener.com/latest/dex/pairs/${PROVIDER_CONFIG.CHAIN_NAME_IN_DEXSCREENER}/${PROVIDER_CONFIG.STONFI_TON_USD_POOL}`
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
 * Asynchronously fetches prices from a data source, with the option to retrieve cached data if available.
 * 
 * @returns {Promise<Prices>} A Promise that resolves to an object representing the fetched prices.
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

            const priceData = await this.fetchPricesWithRetry().catch(
                (error) => {
                    console.error(
                        `Error fetching ${PROVIDER_CONFIG.CHAIN_NAME_IN_DEXSCREENER.toUpperCase()} price:`,
                        error
                    );
                    throw error;
                }
            );
            const prices: Prices = {
                nativeToken: { usd: priceData.pair.priceUsd },
            };
            this.setCachedData(cacheKey, prices);
            return prices;
        } catch (error) {
            console.error("Error fetching prices:", error);
            throw error;
        }
    }

/**
 * Formats the portfolio information into a string with the character's name, wallet address,
 * total value in USD and native tokens.
 * 
 * @param {IAgentRuntime} runtime - The runtime of the agent.
 * @param {WalletPortfolio} portfolio - The portfolio object containing total USD and native token value.
 * @returns {string} Formatted string containing character's name, wallet address, total value in USD and native tokens.
 */
    private formatPortfolio(
        runtime: IAgentRuntime,
        portfolio: WalletPortfolio
    ): string {
        let output = `${runtime.character.name}\n`;
        output += `Wallet Address: ${this.getAddress()}\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalNativeTokenFormatted = new BigNumber(
            portfolio.totalNativeToken
        ).toFixed(4);

        output += `Total Value: $${totalUsdFormatted} (${totalNativeTokenFormatted} ${PROVIDER_CONFIG.CHAIN_NAME_IN_DEXSCREENER.toUpperCase()})\n`;

        return output;
    }

/**
 * Fetches the portfolio value of the wallet.
 * 
 * @returns {Promise<WalletPortfolio>} The portfolio value of the wallet.
 */
    private async fetchPortfolioValue(): Promise<WalletPortfolio> {
        try {
            const cacheKey = `portfolio-${this.getAddress()}`;
            const cachedValue =
                await this.getCachedData<WalletPortfolio>(cacheKey);

            if (cachedValue) {
                console.log("Cache hit for fetchPortfolioValue", cachedValue);
                return cachedValue;
            }
            console.log("Cache miss for fetchPortfolioValue");

            const prices = await this.fetchPrices().catch((error) => {
                console.error(
                    `Error fetching ${PROVIDER_CONFIG.CHAIN_NAME_IN_DEXSCREENER.toUpperCase()} price:`,
                    error
                );
                throw error;
            });
            const nativeTokenBalance = await this.getWalletBalance().catch(
                (error) => {
                    console.error(
                        `Error fetching ${PROVIDER_CONFIG.CHAIN_NAME_IN_DEXSCREENER.toUpperCase()} amount:`,
                        error
                    );
                    throw error;
                }
            );

            const amount =
                Number(nativeTokenBalance) /
                Number(PROVIDER_CONFIG.TON_DECIMAL);
            const totalUsd = new BigNumber(amount.toString()).times(
                prices.nativeToken.usd
            );

            const portfolio = {
                totalUsd: totalUsd.toString(),
                totalNativeToken: amount.toString(),
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
 * Asynchronously fetches the portfolio value and formats it using the provided runtime.
 * 
 * @param {IAgentRuntime} runtime - The runtime object used for formatting the portfolio value.
 * @returns {Promise<string>} A promise that resolves to the formatted portfolio value.
 */
    async getFormattedPortfolio(runtime: IAgentRuntime): Promise<string> {
        try {
            const portfolio = await this.fetchPortfolioValue();
            return this.formatPortfolio(runtime, portfolio);
        } catch (error) {
            console.error("Error generating portfolio report:", error);
            return "Unable to fetch wallet information. Please try again later.";
        }
    }

/**
 * Returns a formatted address in string format.
 * @returns {string} The formatted address
 */
    getAddress(): string {
        const formattedAddress = this.wallet.address.toString({
            bounceable: false,
            urlSafe: true,
        });
        return formattedAddress;
    }

/**
 * Get the TonClient instance for interacting with a wallet.
 * @returns {TonClient} The TonClient instance
 */
    getWalletClient(): TonClient {
        const client = new TonClient({
            endpoint: this.endpoint,
        });
        return client;
    }

/**
 * Asynchronously retrieves the balance of the wallet.
 * 
 * @returns {Promise<bigint | null>} The wallet balance if successful, otherwise null.
 */
    async getWalletBalance(): Promise<bigint | null> {
        try {
            const client = this.getWalletClient();
            const contract = client.open(this.wallet);
            const balance = await contract.getBalance();

            return balance;
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }
}

/**
 * Initializes a wallet provider for the given agent runtime.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime to use
 * @returns {Promise<WalletProvider>} - A promise that resolves with the initialized WalletProvider
 */
export const initWalletProvider = async (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("TON_PRIVATE_KEY");
    let mnemonics: string[];

    if (!privateKey) {
        throw new Error("TON_PRIVATE_KEY is missing");
    } else {
        mnemonics = privateKey.split(" ");
        if (mnemonics.length < 2) {
            throw new Error("TON_PRIVATE_KEY mnemonic seems invalid");
        }
    }
    const rpcUrl =
        runtime.getSetting("TON_RPC_URL") || PROVIDER_CONFIG.MAINNET_RPC;

    const keypair = await mnemonicToPrivateKey(mnemonics, "");
    return new WalletProvider(keypair, rpcUrl, runtime.cacheManager);
};

/**
 * Retrieve the formatted portfolio from the native wallet provider.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime.
 * @param {Memory} message - The message received.
 * @param {State} [state] - The optional state.
 * @returns {Promise<string | null>} A promise that resolves with the formatted portfolio, or null if an error occurs.
 */
export const nativeWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string | null> {
        try {
            const walletProvider = await initWalletProvider(runtime);
            return await walletProvider.getFormattedPortfolio(runtime);
        } catch (error) {
            console.error(
                `Error in ${PROVIDER_CONFIG.CHAIN_NAME_IN_DEXSCREENER.toUpperCase()} wallet provider:`,
                error
            );
            return null;
        }
    },
};
