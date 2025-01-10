import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { createClient } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import { GenLayerClient, SimulatorChain } from "genlayer-js/types";
import { privateKeyToAccount } from "viem/accounts";

import { Account } from "viem";

/**
 * Instantiates a new client with the given account and RPC URL.
 * @param {Account} [account] - The account to use for the client.
 * @param {string} [rpcUrl] - The RPC URL to use. Defaults to "https://studio.genlayer.com:8443/api".
 * @returns {Client} A new client instance.
 */
function instantiateClient(account?: Account, rpcUrl?: string) {
    const rpcUrlToUse = rpcUrl ?? "https://studio.genlayer.com:8443/api";
    return createClient({
        chain: {
            ...simulator,
            rpcUrls: {
                default: {
                    http: [rpcUrlToUse],
                },
            },
        },
        account,
    });
}

/**
 * Represents a Client Provider that allows for interacting with a GenLayerClient.
 */
export class ClientProvider {
    readonly client: GenLayerClient<SimulatorChain>;
    readonly account: Account;

/**
 * Constructor for creating a new instance of a class.
 * 
 * @param {IAgentRuntime} runtime The runtime context for the agent
 * @throws {Error} If GENLAYER_PRIVATE_KEY is not configured
 */
    constructor(runtime: IAgentRuntime) {
        const privateKey = runtime.getSetting(
            "GENLAYER_PRIVATE_KEY"
        ) as `0x${string}`;
        if (!privateKey) throw new Error("GENLAYER_PRIVATE_KEY not configured");

        const rpcUrl = runtime.getSetting("GENLAYER_RPC_URL");
        this.account = privateKeyToAccount(privateKey);

        this.client = instantiateClient(this.account, rpcUrl ?? undefined);
    }
}

/**
 * Function to fetch a string containing the account address from the ClientProvider
 *
 * @param {IAgentRuntime} runtime - The runtime environment for the agent
 * @param {Memory} _message - The memory object containing the message for processing
 * @param {State} [_state] - Optional state object for storing and retrieving agent state
 * @returns {Promise<string | null>} A string containing the account address, or null if an error occurs
 */
export const clientProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        try {
            const provider = new ClientProvider(runtime);

            return `GenLayer Account Address: ${provider.account.address}`;
        } catch (error) {
            console.error("Error in client provider:", error);
            return null;
        }
    },
};
