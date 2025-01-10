import { Coinbase } from "@coinbase/coinbase-sdk";
import { z } from "zod";
import {
    WebhookEventType,
    WebhookEventFilter,
    WebhookEventTypeFilter,
} from "@coinbase/coinbase-sdk/dist/client";

export const ChargeSchema = z.object({
    id: z.string().nullable(),
    price: z.number(),
    type: z.string(),
    currency: z.string().min(3).max(3),
    name: z.string().min(1),
    description: z.string().min(1),
});

/**
 * Interface representing the content of a charge.
 * @property {string | null} id - The unique identifier of the charge.
 * @property {number} price - The price of the charge.
 * @property {string} type - The type of the charge.
 * @property {string} currency - The currency code (e.g., USD) of the charge.
 * @property {string} name - The name of the charge.
 * @property {string} description - The description of the charge.
 */
export interface ChargeContent {
    id: string | null;
    price: number;
    type: string;
    currency: string; // Currency code (e.g., USD)
    name: string; // Name of the charge
    description: string; // Description of the charge
}

export const isChargeContent = (object: any): object is ChargeContent => {
    if (ChargeSchema.safeParse(object).success) {
        return true;
    }
    console.error("Invalid content: ", object);
    return false;
};

export const TransferSchema = z.object({
    network: z.string().toLowerCase(),
    receivingAddresses: z.array(z.string()),
    transferAmount: z.number(),
    assetId: z.string().toLowerCase(),
});

/**
 * Interface for defining the content of a transfer, including network, receiving addresses, transfer amount, and asset ID.
 * @typedef {object} TransferContent
 * @property {string} network - The name of the network where the transfer will take place.
 * @property {string[]} receivingAddresses - An array of strings representing the addresses where the transfer will be received.
 * @property {number} transferAmount - The amount to be transferred.
 * @property {string} assetId - The identifier of the asset to be transferred.
 */
export interface TransferContent {
    network: string;
    receivingAddresses: string[];
    transferAmount: number;
    assetId: string;
}

export const isTransferContent = (object: any): object is TransferContent => {
    return TransferSchema.safeParse(object).success;
};

/**
 * Represents a transaction with the following properties:
 * @typedef {Object} Transaction
 * @property {string} address - The address of the transaction
 * @property {number} amount - The amount of the transaction
 * @property {string} status - The status of the transaction
 * @property {string | null} errorCode - The error code of the transaction, or null if no error
 * @property {string | null} transactionUrl - The URL of the transaction, or null if no URL is available
 */
export type Transaction = {
    address: string;
    amount: number;
    status: string;
    errorCode: string | null;
    transactionUrl: string | null;
};
const assetValues = Object.values(Coinbase.assets) as [string, ...string[]];
export const TradeSchema = z.object({
    network: z.string().toLowerCase(),
    amount: z.number(),
    sourceAsset: z.enum(assetValues),
    targetAsset: z.enum(assetValues),
    side: z.enum(["BUY", "SELL"]),
});

/**
 * Represents the details of a trade including the network, amount, source asset, target asset, and side of the trade (BUY or SELL).
 */ 
         
export interface TradeContent {
    network: string;
    amount: number;
    sourceAsset: string;
    targetAsset: string;
    side: "BUY" | "SELL";
}

export const isTradeContent = (object: any): object is TradeContent => {
    return TradeSchema.safeParse(object).success;
};

/**
 * Represents a trade transaction object.
 * @typedef TradeTransaction
 * @type {Object}
 * @property {string} network - The network on which the transaction occurred.
 * @property {number} amount - The amount involved in the transaction.
 * @property {string} sourceAsset - The asset used as the source in the transaction.
 * @property {string} targetAsset - The asset targeted in the transaction.
 * @property {string} status - The status of the transaction.
 * @property {string | null} errorCode - The error code associated with the transaction, if any.
 * @property {string | null} transactionUrl - The URL for viewing more details about the transaction, if available.
 */
  
export type TradeTransaction = {
    network: string;
    amount: number;
    sourceAsset: string;
    targetAsset: string;
    status: string;
    errorCode: string | null;
    transactionUrl: string | null;
};

/**
 * Interface representing the content of a token contract.
 * @typedef {object} TokenContractContent
 * @property {string} contractType - The type of the contract (ERC20, ERC721, ERC1155).
 * @property {string} name - The name of the token.
 * @property {string} symbol - The symbol of the token.
 * @property {string} network - The network on which the contract is deployed.
 * @property {string} [baseURI] - The base URI for token metadata.
 * @property {number} [totalSupply] - The total supply of the token.
 */
export interface TokenContractContent {
    contractType: "ERC20" | "ERC721" | "ERC1155";
    name: string;
    symbol: string;
    network: string;
    baseURI?: string;
    totalSupply?: number;
}

/**
 * Schema for token contract configuration.
 * @type {import("zod").ZodObject<{
 *   contractType: import("zod").ZodEnum<"ERC20" | "ERC721" | "ERC1155">;
 *   name: import("zod").ZodString;
 *   symbol: import("zod").ZodString;
 *   network: import("zod").ZodString;
 *   baseURI: import("zod").ZodString | undefined;
 *   totalSupply: import("zod").ZodNumber | undefined;
 * } & { contractType: "ERC20", totalSupply?: number } & { contractType: "ERC721" | "ERC1155", baseURI?: string }, {
 *   message: string;
 *   path: string[];
 * }>
 */
export const TokenContractSchema = z
    .object({
        contractType: z
            .enum(["ERC20", "ERC721", "ERC1155"])
            .describe("The type of token contract to deploy"),
        name: z.string().describe("The name of the token"),
        symbol: z.string().describe("The symbol of the token"),
        network: z.string().describe("The blockchain network to deploy on"),
        baseURI: z
            .string()
            .optional()
            .describe(
                "The base URI for token metadata (required for ERC721 and ERC1155)"
            ),
        totalSupply: z
            .number()
            .optional()
            .describe("The total supply of tokens (only for ERC20)"),
    })
    .refine(
        (data) => {
            if (data.contractType === "ERC20") {
                return (
                    typeof data.totalSupply === "number" ||
                    data.totalSupply === undefined
                );
            }
            if (["ERC721", "ERC1155"].includes(data.contractType)) {
                return (
                    typeof data.baseURI === "string" ||
                    data.baseURI === undefined
                );
            }
            return true;
        },
        {
            message: "Invalid token contract content",
            path: ["contractType"],
        }
    );

export const isTokenContractContent = (
    obj: any
): obj is TokenContractContent => {
    return TokenContractSchema.safeParse(obj).success;
};

// Add to types.ts
/**
 * Represents the content required for invoking a smart contract on a blockchain network.
 * @typedef {Object} ContractInvocationContent
 * @property {string} contractAddress - The address of the smart contract to be invoked.
 * @property {string} method - The name of the method to be called on the smart contract.
 * @property {Array} abi - The ABI (Application Binary Interface) of the smart contract.
 * @property {Object=} args - Optional arguments to be passed to the smart contract method.
 * @property {string=} amount - The amount of cryptocurrency to be sent along with the contract invocation.
 * @property {string} assetId - The ID of the asset (e.g. cryptocurrency) being used for the contract invocation.
 * @property {string} networkId - The ID of the blockchain network on which the contract is deployed.
 */
export interface ContractInvocationContent {
    contractAddress: string;
    method: string;
    abi: any[];
    args?: Record<string, any>;
    amount?: string;
    assetId: string;
    networkId: string;
}

/**
 * ContractInvocationSchema data schema.
 * 
 * @typedef {Object} ContractInvocationSchema
 * @property {string} contractAddress - The address of the contract to invoke
 * @property {string} method - The method to invoke on the contract
 * @property {Array<any>} abi - The ABI of the contract
 * @property {Object.<string, any>} [args] - The arguments to pass to the contract method
 * @property {string} [amount] - The amount of the asset to send (as string to handle large numbers)
 * @property {string} assetId - The ID of the asset to send (e.g., 'USDC')
 * @property {string} networkId - The network ID to use (e.g., 'ethereum-mainnet')
 */
export const ContractInvocationSchema = z.object({
    contractAddress: z
        .string()
        .describe("The address of the contract to invoke"),
    method: z.string().describe("The method to invoke on the contract"),
    abi: z.array(z.any()).describe("The ABI of the contract"),
    args: z
        .record(z.string(), z.any())
        .optional()
        .describe("The arguments to pass to the contract method"),
    amount: z
        .string()
        .optional()
        .describe(
            "The amount of the asset to send (as string to handle large numbers)"
        ),
    assetId: z.string().describe("The ID of the asset to send (e.g., 'USDC')"),
    networkId: z
        .string()
        .describe("The network ID to use (e.g., 'ethereum-mainnet')"),
});

export const isContractInvocationContent = (
    obj: any
): obj is ContractInvocationContent => {
    return ContractInvocationSchema.safeParse(obj).success;
};

export const WebhookSchema = z.object({
    networkId: z.string(),
    eventType: z.nativeEnum(WebhookEventType),
    eventTypeFilter: z.custom<WebhookEventTypeFilter>().optional(),
    eventFilters: z.array(z.custom<WebhookEventFilter>()).optional(),
});

/**
 * Type definition for the content of a webhook, inferred from the WebhookSchema.
 * @type {WebhookContent}
 */
export type WebhookContent = z.infer<typeof WebhookSchema>;

export const isWebhookContent = (object: any): object is WebhookContent => {
    return WebhookSchema.safeParse(object).success;
};

export const AdvancedTradeSchema = z.object({
    productId: z.string(),
    side: z.enum(["BUY", "SELL"]),
    amount: z.number(),
    orderType: z.enum(["MARKET", "LIMIT"]),
    limitPrice: z.number().optional(),
});

/**
 * Represents advanced trade content information.
 * @typedef {Object} AdvancedTradeContent
 * @property {string} productId - The identifier of the product.
 * @property {"BUY" | "SELL"} side - The side of the trade, either "BUY" or "SELL".
 * @property {number} amount - The amount being traded.
 * @property {"MARKET" | "LIMIT"} orderType - The type of order, either "MARKET" or "LIMIT".
 * @property {number} [limitPrice] - The limit price for a limit order.
 */
export interface AdvancedTradeContent {
    productId: string;
    side: "BUY" | "SELL";
    amount: number;
    orderType: "MARKET" | "LIMIT";
    limitPrice?: number;
}

export const isAdvancedTradeContent = (
    object: any
): object is AdvancedTradeContent => {
    return AdvancedTradeSchema.safeParse(object).success;
};

/**
 * Interface representing the content needed to read data from a smart contract.
 * @typedef {Object} ReadContractContent
 * @property {string} contractAddress - The address of the smart contract to read data from.
 * @property {string} method - The method to call on the smart contract.
 * @property {string} networkId - The network ID where the smart contract is deployed.
 * @property {Record<string, any>} args - The arguments to pass to the method.
 * @property {Array<any>} [abi] - The optional ABI (Application Binary Interface) of the smart contract.
 */
export interface ReadContractContent {
    contractAddress: `0x${string}`;
    method: string;
    networkId: string;
    args: Record<string, any>;
    abi?: any[];
}

export const ReadContractSchema = z.object({
    contractAddress: z
        .string()
        .describe("The address of the contract to read from"),
    method: z.string().describe("The view/pure method to call on the contract"),
    networkId: z.string().describe("The network ID to use"),
    args: z
        .record(z.string(), z.any())
        .describe("The arguments to pass to the contract method"),
    abi: z.array(z.any()).optional().describe("The contract ABI (optional)"),
});

export const isReadContractContent = (obj: any): obj is ReadContractContent => {
    return ReadContractSchema.safeParse(obj).success;
};
