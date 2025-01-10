import type {
    Account,
    Address,
    Chain,
    Hash,
    HttpTransport,
    PublicClient,
    WalletClient,
} from "viem";
import * as viemChains from "viem/chains";

const _SupportedChainList = Object.keys(viemChains) as Array<
    keyof typeof viemChains
>;
/**
 * A type representing a supported chain from a list of supported chains.
 */
export type SupportedChain = (typeof _SupportedChainList)[number];

// Transaction types
/**
 * Interface representing a transaction.
 * @typedef {Object} Transaction
 * @property {Hash} hash - The hash of the transaction.
 * @property {Address} from - The address the transaction is from.
 * @property {Address} to - The address the transaction is sent to.
 * @property {bigint} value - The value of the transaction.
 * @property {`0x${string}`} [data] - Optional data for the transaction.
 * @property {number} [chainId] - The chain ID of the transaction.
 */
export interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    chainId?: number;
}

// Chain configuration
/**
 * Interface representing metadata for a blockchain.
 * @property {number} chainId - The unique identifier for the blockchain.
 * @property {string} name - The name of the blockchain.
 * @property {Chain} chain - The blockchain instance.
 * @property {string} rpcUrl - The URL for the RPC endpoint of the blockchain.
 * @property {Object} nativeCurrency - The native currency information.
 * @property {string} nativeCurrency.name - The name of the native currency.
 * @property {string} nativeCurrency.symbol - The symbol of the native currency.
 * @property {number} nativeCurrency.decimals - The decimal places of the native currency.
 * @property {string} blockExplorerUrl - The URL for the blockchain explorer.
 */
export interface ChainMetadata {
    chainId: number;
    name: string;
    chain: Chain;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl: string;
}

/**
 * Interface representing a Chain configuration.
 * @typedef {Object} ChainConfig
 * @property {Chain} chain - The chain being configured.
 * @property {PublicClient} publicClient - The public client associated with the chain, using HttpTransport and interacting with Chain and optional Account.
 * @property {WalletClient} [walletClient] - Optional wallet client configuration.
 */
export interface ChainConfig {
    chain: Chain;
    publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
    walletClient?: WalletClient;
}

// Action parameters
/**
 * Interface for defining parameters for a transfer operation.
 * @typedef {Object} TransferParams
 * @property {SupportedChain} fromChain - The chain from which the transfer is being made.
 * @property {Address} toAddress - The address to which the transfer is being made.
 * @property {string} amount - The amount to be transferred.
 * @property {string} [data] - Optional data to include in the transfer operation.
 */
export interface TransferParams {
    fromChain: SupportedChain;
    toAddress: Address;
    amount: string;
    data?: `0x${string}`;
}

// Plugin configuration
/**
 * Interface for configuring a custom Arthera Plugin.
 * @typedef {Object} ArtheraPluginConfig
 * @property {Object} rpcUrl - Object containing Arthera RPC URLs.
 * @property {string} rpcUrl.arthera - URL for Arthera RPC.
 * @property {Object} secrets - Object containing Arthera private key.
 * @property {string} secrets.ARPTHERA_PRIVATE_KEY - Arthera private key.
 * @property {boolean} testMode - Flag indicating if plugin is in test mode.
 * @property {Object} multicall - Object containing settings for multicall operations.
 * @property {number} multicall.batchSize - Batch size for multicall operations.
 * @property {number} multicall.wait - Wait time for multicall operations.
 */
export interface ArtheraPluginConfig {
    rpcUrl?: {
        arthera?: string;
    };
    secrets?: {
        ARTHERA_PRIVATE_KEY: string;
    };
    testMode?: boolean;
    multicall?: {
        batchSize?: number;
        wait?: number;
    };
}

/**
 * Interface representing an error that may come from a provider.
 * Extends the built-in Error interface with optional properties.
 *
 * @property {number} [code] - Optional error code associated with the error.
 * @property {unknown} [data] - Optional additional data associated with the error.
 */
export interface ProviderError extends Error {
    code?: number;
    data?: unknown;
}
