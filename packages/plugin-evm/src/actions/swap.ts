import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";
import {
    createConfig,
    executeRoute,
    ExtendedChain,
    getRoutes,
} from "@lifi/sdk";

import { initWalletProvider, WalletProvider } from "../providers/wallet";
import { swapTemplate } from "../templates";
import type { SwapParams, Transaction } from "../types";
import { parseEther } from "viem";

export { swapTemplate };

/**
 * Represents a Swap Action for interacting with multiple chains for token swapping.
 * @class
 */
export class SwapAction {
    private config;

/**
 * Constructor for initializing the configuration object based on the wallet provider information.
 * @param {WalletProvider} walletProvider - The wallet provider to retrieve chain information from
 */
    constructor(private walletProvider: WalletProvider) {
        this.config = createConfig({
            integrator: "eliza",
            chains: Object.values(this.walletProvider.chains).map((config) => ({
                id: config.id,
                name: config.name,
                key: config.name.toLowerCase(),
                chainType: "EVM" as const,
                nativeToken: {
                    ...config.nativeCurrency,
                    chainId: config.id,
                    address: "0x0000000000000000000000000000000000000000",
                    coinKey: config.nativeCurrency.symbol,
                    priceUSD: "0",
                    logoURI: "",
                    symbol: config.nativeCurrency.symbol,
                    decimals: config.nativeCurrency.decimals,
                    name: config.nativeCurrency.name,
                },
                rpcUrls: {
                    public: { http: [config.rpcUrls.default.http[0]] },
                },
                blockExplorerUrls: [config.blockExplorers.default.url],
                metamask: {
                    chainId: `0x${config.id.toString(16)}`,
                    chainName: config.name,
                    nativeCurrency: config.nativeCurrency,
                    rpcUrls: [config.rpcUrls.default.http[0]],
                    blockExplorerUrls: [config.blockExplorers.default.url],
                },
                coin: config.nativeCurrency.symbol,
                mainnet: true,
                diamondAddress: "0x0000000000000000000000000000000000000000",
            })) as ExtendedChain[],
        });
    }

/**
 * Function to swap tokens from one chain to another.
 *
 * @param {SwapParams} params - The parameters for the swap transaction.
 * @returns {Promise<Transaction>} - A promise that resolves with the transaction details.
 */
    async swap(params: SwapParams): Promise<Transaction> {
        const walletClient = this.walletProvider.getWalletClient(params.chain);
        const [fromAddress] = await walletClient.getAddresses();

        const routes = await getRoutes({
            fromChainId: this.walletProvider.getChainConfigs(params.chain).id,
            toChainId: this.walletProvider.getChainConfigs(params.chain).id,
            fromTokenAddress: params.fromToken,
            toTokenAddress: params.toToken,
            fromAmount: parseEther(params.amount).toString(),
            fromAddress: fromAddress,
            options: {
                slippage: params.slippage || 0.5,
                order: "RECOMMENDED",
            },
        });

        if (!routes.routes.length) throw new Error("No routes found");

        const execution = await executeRoute(routes.routes[0], this.config);
        const process = execution.steps[0]?.execution?.process[0];

        if (!process?.status || process.status === "FAILED") {
            throw new Error("Transaction failed");
        }

        return {
            hash: process.txHash as `0x${string}`,
            from: fromAddress,
            to: routes.routes[0].steps[0].estimate
                .approvalAddress as `0x${string}`,
            value: 0n,
            data: process.data as `0x${string}`,
            chainId: this.walletProvider.getChainConfigs(params.chain).id,
        };
    }
}

/**
 * Object representing a swap action.
 *
 * This action allows users to swap tokens on the same chain.
 *
 * @typedef {Object} swapAction
 * @property {string} name - The name of the action ("swap").
 * @property {string} description - A brief description of the action.
 * @property {Function} handler - The function that handles the swap action.
 * @property {Function} validate - The function that validates the swap action.
 * @property {Array<Object>} examples - Examples of how to use the swap action.
 *
 * @type {Object}
 */
export const swapAction = {
    name: "swap",
    description: "Swap tokens on the same chain",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        console.log("Swap action handler called");
        const walletProvider = await initWalletProvider(runtime);
        const action = new SwapAction(walletProvider);

        // Compose swap context
        const swapContext = composeContext({
            state,
            template: swapTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.LARGE,
        });

        const swapOptions: SwapParams = {
            chain: content.chain,
            fromToken: content.inputToken,
            toToken: content.outputToken,
            amount: content.amount,
            slippage: content.slippage,
        };

        try {
            const swapResp = await action.swap(swapOptions);
            if (callback) {
                callback({
                    text: `Successfully swap ${swapOptions.amount} ${swapOptions.fromToken} tokens to ${swapOptions.toToken}\nTransaction Hash: ${swapResp.hash}`,
                    content: {
                        success: true,
                        hash: swapResp.hash,
                        recipient: swapResp.to,
                        chain: content.chain,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error in swap handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: swapTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Swap 1 ETH for USDC on Base",
                    action: "TOKEN_SWAP",
                },
            },
        ],
    ],
    similes: ["TOKEN_SWAP", "EXCHANGE_TOKENS", "TRADE_TOKENS"],
}; // TODO: add more examples
