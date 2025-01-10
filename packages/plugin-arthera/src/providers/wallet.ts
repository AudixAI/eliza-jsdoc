import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { IAgentRuntime, Provider, Memory, State } from "@elizaos/core";
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

import type { SupportedChain } from "../types";

/**
 * Class representing a WalletProvider that allows interaction with different blockchain networks.
 * @class
 */
export class WalletProvider {
    private currentChain: SupportedChain = "arthera";
    chains: Record<string, Chain> = { arthera: viemChains.arthera };
    account: PrivateKeyAccount;

/**
 * Constructor for creating an instance of a class with a private key and optional chains.
 * 
 * @param privateKey The private key in the format `0x${string}`.
 * @param chains Optional chains object containing key-value pairs of chain names and Chain objects.
 */
    constructor(privateKey: `0x${string}`, chains?: Record<string, Chain>) {
        this.setAccount(privateKey);
        this.setChains(chains);

        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }
    }

/**
 * Get the address associated with the account
 * @returns {Address} The address of the account
 */
    getAddress(): Address {
        return this.account.address;
    }

/**
 * Get the current chain from the list of chains.
 * @returns {Chain} The current chain.
 */
    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

/**
 * Creates and returns a public client with the specified chain name.
 * @param {SupportedChain} chainName - The name of the supported blockchain chain.
 * @returns {PublicClient<HttpTransport, Chain, Account | undefined>} The public client for the specified chain.
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
 * Retrieves a WalletClient for the specified chain.
 * 
 * @param {SupportedChain} chainName - The name of the supported chain.
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
 * Retrieves the configuration details for a specific blockchain based on the provided chain name.
 * @param {SupportedChain} chainName - The name of the blockchain for which configuration details are needed.
 * @returns {Chain} The configuration details of the specified blockchain.
 * @throws {Error} If the chain name is invalid.
 */
    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = viemChains[chainName];

        if (!chain?.id) {
            throw new Error("Invalid chain name");
        }

        return chain;
    }

/**
 * Asynchronously retrieves the wallet balance for the current account.
 * 
 * @returns A Promise that resolves to a string representing the balance in wei units,
 * or null if an error occurs.
 */
    async getWalletBalance(): Promise<string | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
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
 * Asynchronously retrieves the wallet balance for a specific blockchain chain.
 * 
 * @param {SupportedChain} chainName - The name of the blockchain chain to retrieve the wallet balance for.
 * @return {Promise<string | null>} The wallet balance as a string formatted in units or null if an error occurs.
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

    private setAccount = (pk: `0x${string}`) => {
        this.account = privateKeyToAccount(pk);
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
 * Generates a Chain object based on the provided chain name and custom RPC URL.
 * @param {string} chainName - The name of the chain to generate.
 * @param {string} [customRpcUrl] - The custom RPC URL to use. Use null or undefined to not include a custom RPC URL.
 * @returns {Chain} - The generated Chain object.
 * @throws {Error} - If the provided chain name is invalid.
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
 * Generate chains from runtime using the specified agent runtime.
 * @param {IAgentRuntime} runtime - The agent runtime used to retrieve settings.
 * @returns {Record<string, Chain>} An object containing the generated chains.
 */
const genChainsFromRuntime = (
    runtime: IAgentRuntime
): Record<string, Chain> => {
    const chainNames = ["arthera"];
    const chains = {};

    chainNames.forEach((chainName) => {
        const rpcUrl = runtime.getSetting(
            "ETHEREUM_PROVIDER_" + chainName.toUpperCase()
        );
        const chain = WalletProvider.genChainFromName(chainName, rpcUrl);
        chains[chainName] = chain;
    });

    return chains;
};

export const initWalletProvider = (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("ARTHERA_PRIVATE_KEY");
    if (!privateKey) {
        throw new Error("ARTHERA_PRIVATE_KEY is missing");
    }

    const chains = genChainsFromRuntime(runtime);

    return new WalletProvider(privateKey as `0x${string}`, chains);
};

/**
 * Arthera wallet provider
 * @param {IAgentRuntime} runtime - The Agent Runtime
 * @param {Memory} _message - The message object
 * @param {State} [_state] - The optional state object
 * @returns {Promise<string | null>} A promise that resolves to a string containing the wallet address, balance, chain information; or null if an error occurs
 */
export const artheraWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            const walletProvider = initWalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getWalletBalance();
            const chain = walletProvider.getCurrentChain();
            return `Arthera Wallet Address: ${address}\nBalance: ${balance} ${chain.nativeCurrency.symbol}\nChain ID: ${chain.id}, Name: ${chain.name}`;
        } catch (error) {
            console.error("Error in Arthera wallet provider:", error);
            return null;
        }
    },
};
