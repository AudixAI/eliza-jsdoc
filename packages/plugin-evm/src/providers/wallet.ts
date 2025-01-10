import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    type IAgentRuntime,
    type Provider,
    type Memory,
    type State,
    type ICacheManager,
    elizaLogger,
} from "@elizaos/core";
import type {
    Address,
    WalletClient,
    PublicClient,
    Chain,
    HttpTransport,
    Account,
    PrivateKeyAccount,
} from "viem";
import * as viemChains from "viem/chains";
import { DeriveKeyProvider, TEEMode } from "@elizaos/plugin-tee";
import NodeCache from "node-cache";
import * as path from "path";

import type { SupportedChain } from "../types";

/**
 * Class representing a Wallet Provider.
 * @class
 */
       
export class WalletProvider {
    private cache: NodeCache;
    private cacheKey: string = "evm/wallet";
    private currentChain: SupportedChain = "mainnet";
    private CACHE_EXPIRY_SEC = 5;
    chains: Record<string, Chain> = { ...viemChains };
    account: PrivateKeyAccount;

/**
 * Constructor for creating a new instance of ConfigManager.
 * @param {PrivateKeyAccount | `0x${string}`} accountOrPrivateKey - The account or private key to use.
 * @param {ICacheManager} cacheManager - The cache manager to use.
 * @param {Record<string, Chain>} [chains] - Optional parameter for an object of chains.
 */
    constructor(
        accountOrPrivateKey: PrivateKeyAccount | `0x${string}`,
        private cacheManager: ICacheManager,
        chains?: Record<string, Chain>
    ) {
        this.setAccount(accountOrPrivateKey);
        this.setChains(chains);

        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }

        this.cache = new NodeCache({ stdTTL: this.CACHE_EXPIRY_SEC });
    }

/**
* Returns the address of the account.
* @returns {Address} The address of the account.
*/
    getAddress(): Address {
        return this.account.address;
    }

/**
 * Returns the current chain from the list of chains.
 * 
 * @returns {Chain} The current chain
 */
    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

/**
 * Returns a PublicClient instance for the specified chain.
 * 
 * @param {SupportedChain} chainName - The name of the chain for which to retrieve the PublicClient.
 * @returns {PublicClient<HttpTransport, Chain, Account | undefined>} The PublicClient instance for the specified chain.
 */
    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        const transport = this.createHttpTransport(chainName);

        const publicClient = createPublicClient({
            chain: this.chains[chainName],
            transport,
        });
        return publicClient;
    }

/**
 * Retrieves a WalletClient instance for the specified chain.
 * 
 * @param {SupportedChain} chainName - The name of the chain to get the WalletClient for.
 * @returns {WalletClient} The WalletClient instance for the specified chain.
 */
    getWalletClient(chainName: SupportedChain): WalletClient {
        const transport = this.createHttpTransport(chainName);

        const walletClient = createWalletClient({
            chain: this.chains[chainName],
            transport,
            account: this.account,
        });

        return walletClient;
    }

/**
 * Gets the configuration for a specified chain.
 *
 * @param {SupportedChain} chainName - The name of the chain to retrieve configuration for.
 * @returns {Chain} The configuration object for the specified chain.
 * @throws {Error} If the chain name is invalid or no configuration is found.
 */
    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = viemChains[chainName];

        if (!chain?.id) {
            throw new Error("Invalid chain name");
        }

        return chain;
    }

/**
 * Asynchronously retrieves the wallet balance for the current chain.
 * If the balance is already cached, it returns the cached data.
 * Otherwise, it fetches the balance from the public client for the current chain,
 * formats the balance, caches it, and returns it.
 * If there is an error fetching the balance, it logs the error and returns null.
 * @returns A Promise that resolves to a string representing the wallet balance or null if an error occurs.
 */
    async getWalletBalance(): Promise<string | null> {
        const cacheKey = "walletBalance_" + this.currentChain;
        const cachedData = await this.getCachedData<string>(cacheKey);
        if (cachedData) {
            elizaLogger.log(
                "Returning cached wallet balance for chain: " +
                    this.currentChain
            );
            return cachedData;
        }

        try {
            const client = this.getPublicClient(this.currentChain);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            const balanceFormatted = formatUnits(balance, 18);
            this.setCachedData<string>(cacheKey, balanceFormatted);
            elizaLogger.log(
                "Wallet balance cached for chain: ",
                this.currentChain
            );
            return balanceFormatted;
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

/**
 * Gets the wallet balance for a specific blockchain chain.
 * 
 * @param {SupportedChain} chainName - The name of the blockchain chain to get the wallet balance for.
 * @returns {Promise<string | null>} The wallet balance in string format if successful, otherwise returns null.
 */
    async getWalletBalanceForChain(
        chainName: SupportedChain
    ): Promise<string | null> {
        try {
            const client = this.getPublicClient(chainName);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

/**
 * Add a chain to the existing chains.
 * 
 * @param {Record<string, Chain>} chain - The chain to be added.
 */
    addChain(chain: Record<string, Chain>) {
        this.setChains(chain);
    }

/**
 * Switches to the specified chain and adds it to the list of supported chains if it doesn't already exist.
 *
 * @param {SupportedChain} chainName - The name of the chain to switch to.
 * @param {string} [customRpcUrl] - Optional custom RPC URL for the chain.
 */
    switchChain(chainName: SupportedChain, customRpcUrl?: string) {
        if (!this.chains[chainName]) {
            const chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );
            this.addChain({ [chainName]: chain });
        }
        this.setCurrentChain(chainName);
    }

/**
 * Reads a value from the cache for a given key.
 * 
 * @template T - The type of the value to retrieve from the cache
 * @param {string} key - The key for the value to read from the cache
 * @returns {Promise<T | null>} - A Promise that resolves with the cached value if found, or null if not found
 */

    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

/**
 * Writes data to the cache with the specified key.
 * @param {string} key - The key identifier for the data in the cache.
 * @param {T} data - The data to be stored in the cache.
 * @returns {Promise<void>} A Promise that resolves when the data is successfully written to the cache.
 */
    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + this.CACHE_EXPIRY_SEC * 1000,
        });
    }

/**
 * Retrieves data from cache. First checks in-memory cache, then file-based cache.
 * @param {string} key - The key to use to retrieve the data from cache.
 * @returns {Promise<T | null>} The cached data if found, or null if not found in any cache.
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
 * @template T - The type of data being cached
 * @param {string} cacheKey - The key to store the data with
 * @param {T} data - The data to be stored in the cache
 * @returns {Promise<void>} - A Promise that resolves once the data is successfully stored in both caches
 */
    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

    private setAccount = (
        accountOrPrivateKey: PrivateKeyAccount | `0x${string}`
    ) => {
        if (typeof accountOrPrivateKey === "string") {
            this.account = privateKeyToAccount(accountOrPrivateKey);
        } else {
            this.account = accountOrPrivateKey;
        }
    };

    private setChains = (chains?: Record<string, Chain>) => {
        if (!chains) {
            return;
        }
        Object.keys(chains).forEach((chain: string) => {
            this.chains[chain] = chains[chain];
        });
    };

    private setCurrentChain = (chain: SupportedChain) => {
        this.currentChain = chain;
    };

    private createHttpTransport = (chainName: SupportedChain) => {
        const chain = this.chains[chainName];

        if (chain.rpcUrls.custom) {
            return http(chain.rpcUrls.custom.http[0]);
        }
        return http(chain.rpcUrls.default.http[0]);
    };

/**
 * Generate a chain object based on the specified chain name. If a custom RPC URL is provided, it will be included in the resulting chain object.
 * @param {string} chainName - The name of the chain to generate.
 * @param {string | null} customRpcUrl - Optional custom RPC URL to include in the chain object.
 * @returns {Chain} The generated chain object.
 */
    static genChainFromName(
        chainName: string,
        customRpcUrl?: string | null
    ): Chain {
        const baseChain = viemChains[chainName];

        if (!baseChain?.id) {
            throw new Error("Invalid chain name");
        }

        const viemChain: Chain = customRpcUrl
            ? {
                  ...baseChain,
                  rpcUrls: {
                      ...baseChain.rpcUrls,
                      custom: {
                          http: [customRpcUrl],
                      },
                  },
              }
            : baseChain;

        return viemChain;
    }
}

/**
 * Generate chains from the runtime based on the provided IAgentRuntime.
 * @param {IAgentRuntime} runtime - The runtime to generate chains from
 * @returns {Record<string, Chain>} - A Record object containing Chain instances
 */
const genChainsFromRuntime = (
    runtime: IAgentRuntime
): Record<string, Chain> => {
    const chainNames =
        (runtime.character.settings.chains?.evm as SupportedChain[]) || [];
    const chains = {};

    chainNames.forEach((chainName) => {
        const rpcUrl = runtime.getSetting(
            "ETHEREUM_PROVIDER_" + chainName.toUpperCase()
        );
        const chain = WalletProvider.genChainFromName(chainName, rpcUrl);
        chains[chainName] = chain;
    });

    const mainnet_rpcurl = runtime.getSetting("EVM_PROVIDER_URL");
    if (mainnet_rpcurl) {
        const chain = WalletProvider.genChainFromName(
            "mainnet",
            mainnet_rpcurl
        );
        chains["mainnet"] = chain;
    }

    return chains;
};

/**
 * Initializes the wallet provider based on the given agent runtime.
 * @param {IAgentRuntime} runtime - The agent runtime to use for initialization.
 * @returns {Promise<WalletProvider>} The initialized wallet provider.
 */
export const initWalletProvider = async (runtime: IAgentRuntime) => {
    const teeMode = runtime.getSetting("TEE_MODE") || TEEMode.OFF;

    const chains = genChainsFromRuntime(runtime);

    if (teeMode !== TEEMode.OFF) {
        const walletSecretSalt = runtime.getSetting("WALLET_SECRET_SALT");
        if (!walletSecretSalt) {
            throw new Error(
                "WALLET_SECRET_SALT required when TEE_MODE is enabled"
            );
        }

        const deriveKeyProvider = new DeriveKeyProvider(teeMode);
        const deriveKeyResult = await deriveKeyProvider.deriveEcdsaKeypair(
            "/",
            walletSecretSalt,
            runtime.agentId
        );
        return new WalletProvider(
            deriveKeyResult.keypair,
            runtime.cacheManager,
            chains
        );
    } else {
        const privateKey = runtime.getSetting(
            "EVM_PRIVATE_KEY"
        ) as `0x${string}`;
        if (!privateKey) {
            throw new Error("EVM_PRIVATE_KEY is missing");
        }
        return new WalletProvider(privateKey, runtime.cacheManager, chains);
    }
};

/**
 * EVM wallet provider that allows retrieving the EVM wallet address, balance, and chain details.
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @param {Memory} _message - The message to process (not used in this function).
 * @param {State} [state] - Optional state object containing agent name.
 * @returns {Promise<string | null>} A string containing the agent's EVM wallet address, balance, and chain details, or null if an error occurs.
 */
export const evmWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        state?: State
    ): Promise<string | null> {
        try {
            const walletProvider = await initWalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getWalletBalance();
            const chain = walletProvider.getCurrentChain();
            const agentName = state?.agentName || "The agent";
            return `${agentName}'s EVM Wallet Address: ${address}\nBalance: ${balance} ${chain.nativeCurrency.symbol}\nChain ID: ${chain.id}, Name: ${chain.name}`;
        } catch (error) {
            console.error("Error in EVM wallet provider:", error);
            return null;
        }
    },
};
