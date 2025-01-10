import { IAgentRuntime, Provider, Memory, State } from "@elizaos/core";
import {
    createPublicClient,
    createWalletClient,
    http,
    formatUnits,
    type PublicClient,
    type WalletClient,
    type Chain,
    type HttpTransport,
    type Address,
    Account,
    Transport,
} from "viem";
import { storyOdyssey } from "viem/chains";
import type { SupportedChain, ChainMetadata } from "../types";
import { privateKeyToAccount } from "viem/accounts";
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";

/**
 * Default chain configurations for supported chains.
 */
export const DEFAULT_CHAIN_CONFIGS: Record<SupportedChain, ChainMetadata> = {
    odyssey: {
        chainId: 1516,
        name: "Odyssey Testnet",
        chain: storyOdyssey,
        rpcUrl: "https://odyssey.storyrpc.io/",
        nativeCurrency: {
            name: "IP",
            symbol: "IP",
            decimals: 18,
        },
        blockExplorerUrl: "https://odyssey.storyscan.xyz",
    },
} as const;

/**
 * A class representing a Wallet Provider that interacts with blockchain clients.
 * @class
 */
export class WalletProvider {
    private storyClient: StoryClient;
    private publicClient: PublicClient<
        HttpTransport,
        Chain,
        Account | undefined
    >;
    private walletClient: WalletClient;
    private address: Address;
    runtime: IAgentRuntime;

/**
 * Constructor for StoryAgent class.
 * @param {IAgentRuntime} runtime - The runtime object containing the STORY_PRIVATE_KEY setting.
 * @throws {Error} Throws an error if STORY_PRIVATE_KEY is not configured.
 */
    constructor(runtime: IAgentRuntime) {
        const privateKey = runtime.getSetting("STORY_PRIVATE_KEY");
        if (!privateKey) throw new Error("STORY_PRIVATE_KEY not configured");

        this.runtime = runtime;

        const account = privateKeyToAccount(privateKey as Address);
        this.address = account.address;

        const config: StoryConfig = {
            // @ts-ignore
            account: account as Account,
            // @ts-ignore
            transport: hwttp(DEFAULT_CHAIN_CONFIGS.odyssey.rpcUrl) as Transport,
            chainId: "odyssey",
        };
        this.storyClient = StoryClient.newClient(config);

        const baseConfig = {
            chain: storyOdyssey,
            transport: http(DEFAULT_CHAIN_CONFIGS.odyssey.rpcUrl),
        } as const;
        this.publicClient = createPublicClient<HttpTransport>(
            baseConfig
        ) as PublicClient<HttpTransport, Chain, Account | undefined>;

        this.walletClient = createWalletClient<HttpTransport>({
            chain: storyOdyssey,
            transport: http(DEFAULT_CHAIN_CONFIGS.odyssey.rpcUrl),
            account: account,
        });
    }

/**
 * Retrieves the address associated with this object.
 * @returns {Address} The address object.
 */
    getAddress(): Address {
        return this.address;
    }

/**
 * Asynchronously retrieves the wallet balance for the specified address.
 * 
 * @returns {Promise<string | null>} A Promise that resolves to the wallet balance as a string formatted in units, or null if there was an error.
 */
    async getWalletBalance(): Promise<string | null> {
        try {
            const balance = await this.publicClient.getBalance({
                address: this.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

/**
 * Asynchronously connects and retrieves the private key for the story.
 * 
 * @returns {Promise<`0x${string}`>} The private key for the story fetched from the runtime settings.
 */
    async connect(): Promise<`0x${string}`> {
        return this.runtime.getSetting("STORY_PRIVATE_KEY") as `0x${string}`;
    }

/**
* Retrieves the public client of type PublicClient with HttpTransport, Chain, and Account or undefined as the generic types.
* @returns {PublicClient<HttpTransport, Chain, Account | undefined>} The public client
*/
    getPublicClient(): PublicClient<HttpTransport, Chain, Account | undefined> {
        return this.publicClient;
    }

/**
* Returns the connected WalletClient.
* 
* @returns {WalletClient} The connected WalletClient.
* @throws {Error} If the WalletClient is not connected.
*/
    getWalletClient(): WalletClient {
        if (!this.walletClient) throw new Error("Wallet not connected");
        return this.walletClient;
    }

/**
 * Get the StoryClient instance.
 * 
 * @returns {StoryClient} The StoryClient instance.
 * @throws {Error} Throws an error if the StoryClient is not connected.
 */
    getStoryClient(): StoryClient {
        if (!this.storyClient) throw new Error("StoryClient not connected");
        return this.storyClient;
    }
}

/**
 * Story wallet provider function that implements the Provider interface.
 *
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @param {Memory} message - The message data for processing.
 * @param {State} [state] - The optional state data for the agent.
 * @returns {Promise<string | null>} A string with Story wallet address and balance, or null if no wallet.
 */
export const storyWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string | null> {
        // Check if the user has a Story wallet
        if (!runtime.getSetting("STORY_PRIVATE_KEY")) {
            return null;
        }

        try {
            const walletProvider = new WalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getWalletBalance();
            return `Story Wallet Address: ${address}\nBalance: ${balance} IP`;
        } catch (error) {
            console.error("Error in Story wallet provider:", error);
            return null;
        }
    },
};
