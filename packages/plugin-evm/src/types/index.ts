import type { Token } from "@lifi/types";
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
 * Represents a type that is one of the elements in the _SupportedChainList array.
 */
export type SupportedChain = (typeof _SupportedChainList)[number];

// Transaction types
/**
 * Interface representing a transaction.
 * @typedef {object} Transaction
 * @property {Hash} hash - The hash of the transaction.
 * @property {Address} from - The address initiating the transaction.
 * @property {Address} to - The address receiving the transaction.
 * @property {bigint} value - The amount of tokens being sent in the transaction.
 * @property {`0x${string}`} [data] - Optional data attached to the transaction.
 * @property {number} [chainId] - The chain ID of the blockchain for the transaction.
 */
export interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    chainId?: number;
}

// Token types
/**
* Represents a token with its balance information and USD values.
* @typedef {Object} TokenWithBalance
* @property {Token} token - The token object.
* @property {bigint} balance - The balance of the token.
* @property {string} formattedBalance - The formatted balance as a string.
* @property {string} priceUSD - The price of the token in USD.
* @property {string} valueUSD - The value of the token in USD.
*/
export interface TokenWithBalance {
    token: Token;
    balance: bigint;
    formattedBalance: string;
    priceUSD: string;
    valueUSD: string;
}

/**
 * Interface representing the balance of a wallet.
 *
 * @property {SupportedChain} chain - The supported blockchain network.
 * @property {Address} address - The address of the wallet.
 * @property {string} totalValueUSD - The total value of the wallet in USD.
 * @property {TokenWithBalance[]} tokens - An array of tokens with their respective balances.
 */
export interface WalletBalance {
    chain: SupportedChain;
    address: Address;
    totalValueUSD: string;
    tokens: TokenWithBalance[];
}

// Chain configuration
/**
 * Interface representing metadata for a blockchain network.
 * @typedef {Object} ChainMetadata
 * @property {number} chainId - The unique identifier of the blockchain network.
 * @property {string} name - The name of the blockchain network.
 * @property {Chain} chain - The blockchain network itself.
 * @property {string} rpcUrl - The RPC URL for communication with the blockchain network.
 * @property {Object} nativeCurrency - Information about the native currency of the blockchain network.
 * @property {string} nativeCurrency.name - The name of the native currency.
 * @property {string} nativeCurrency.symbol - The symbol of the native currency.
 * @property {number} nativeCurrency.decimals - The number of decimal places for the native currency.
 * @property {string} blockExplorerUrl - The URL for the block explorer of the blockchain network.
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
 * Interface for defining configuration options for a chain, public client, and optional wallet client.
 *
 * @public
 */
export interface ChainConfig {
    chain: Chain;
    publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
    walletClient?: WalletClient;
}

// Action parameters
/**
 * Interface representing parameters for transferring assets between chains.
 * @typedef {Object} TransferParams
 * @property {SupportedChain} fromChain - The chain from which the assets are being transferred.
 * @property {Address} toAddress - The address to which the assets are being transferred.
 * @property {string} amount - The amount of assets being transferred.
 * @property {string} [data] - Optional additional data to include with the transfer.
 */
export interface TransferParams {
    fromChain: SupportedChain;
    toAddress: Address;
    amount: string;
    data?: `0x${string}`;
}

/**
 * Interface representing the parameters for a token swap.
 * @typedef {Object} SwapParams
 * @property {SupportedChain} chain - The chain for the swap.
 * @property {Address} fromToken - The token to swap from.
 * @property {Address} toToken - The token to swap to.
 * @property {string} amount - The amount of tokens to swap.
 * @property {number} [slippage] - Optional slippage percentage for the swap.
 */
export interface SwapParams {
    chain: SupportedChain;
    fromToken: Address;
    toToken: Address;
    amount: string;
    slippage?: number;
}

/**
 * Interface representing the parameters required for bridging tokens between two chains.
 * @typedef {Object} BridgeParams
 * @property {SupportedChain} fromChain - The chain from which the tokens will be bridged.
 * @property {SupportedChain} toChain - The chain to which the tokens will be bridged.
 * @property {Address} fromToken - The address of the token on the fromChain.
 * @property {Address} toToken - The address of the token on the toChain.
 * @property {string} amount - The amount of tokens to be bridged.
 * @property {Address} [toAddress] - The optional address to receive the bridged tokens on the toChain.
 */
export interface BridgeParams {
    fromChain: SupportedChain;
    toChain: SupportedChain;
    fromToken: Address;
    toToken: Address;
    amount: string;
    toAddress?: Address;
}

// Plugin configuration
/**
 * Interface for defining the configuration options for an EVM Plugin.
 * @typedef { Object } EvmPluginConfig
 * @property { Object } rpcUrl - Object containing optional RPC URLs for various EVM networks.
 * @property { string } rpcUrl.ethereum - RPC URL for Ethereum.
 * @property { string } rpcUrl.abstract - RPC URL for Abstract.
 * @property { string } rpcUrl.base - RPC URL for Base.
 * @property { string } rpcUrl.sepolia - RPC URL for Sepolia.
 * @property { string } rpcUrl.bsc - RPC URL for Binance Smart Chain.
 * @property { string } rpcUrl.arbitrum - RPC URL for Arbitrum.
 * @property { string } rpcUrl.avalanche - RPC URL for Avalanche.
 * @property { string } rpcUrl.polygon - RPC URL for Polygon.
 * @property { string } rpcUrl.optimism - RPC URL for Optimism.
 * @property { string } rpcUrl.cronos - RPC URL for Cronos.
 * @property { string } rpcUrl.gnosis - RPC URL for Gnosis.
 * @property { string } rpcUrl.fantom - RPC URL for Fantom.
 * @property { string } rpcUrl.fraxtal - RPC URL for Fraxtal.
 * @property { string } rpcUrl.klaytn - RPC URL for Klaytn.
 * @property { string } rpcUrl.celo - RPC URL for Celo.
 * @property { string } rpcUrl.moonbeam - RPC URL for Moonbeam.
 * @property { string } rpcUrl.aurora - RPC URL for Aurora.
 * @property { string } rpcUrl.harmonyOne - RPC URL for Harmony One.
 * @property { string } rpcUrl.moonriver - RPC URL for Moonriver.
 * @property { string } rpcUrl.arbitrumNova - RPC URL for Arbitrum Nova.
 * @property { string } rpcUrl.mantle - RPC URL for Mantle.
 * @property { string } rpcUrl.linea - RPC URL for Linea.
 * @property { string } rpcUrl.scroll - RPC URL for Scroll.
 * @property { string } rpcUrl.filecoin - RPC URL for Filecoin.
 * @property { string } rpcUrl.taiko - RPC URL for Taiko.
 * @property { string } rpcUrl.zksync - RPC URL for zkSync.
 * @property { string } rpcUrl.canto - RPC URL for Canto.
 * @property { string } rpcUrl.alienx - RPC URL for AlienX.
 * @property { Object } secrets - Object containing any necessary secrets.
 * @property { string } secrets.EVM_PRIVATE_KEY - Private key for the EVM.
 * @property { boolean } testMode - Flag indicating if the plugin is running in test mode.
 * @property { Object } multicall - Object containing options for multicall functionality.
 * @property { number } multicall.batchSize - Number of calls to batch in a multicall.
 * @property { number } multicall.wait - Time to wait between each multicall batch.
 */
export interface EvmPluginConfig {
    rpcUrl?: {
        ethereum?: string;
        abstract?: string;
        base?: string;
        sepolia?: string;
        bsc?: string;
        arbitrum?: string;
        avalanche?: string;
        polygon?: string;
        optimism?: string;
        cronos?: string;
        gnosis?: string;
        fantom?: string;
        fraxtal?: string;
        klaytn?: string;
        celo?: string;
        moonbeam?: string;
        aurora?: string;
        harmonyOne?: string;
        moonriver?: string;
        arbitrumNova?: string;
        mantle?: string;
        linea?: string;
        scroll?: string;
        filecoin?: string;
        taiko?: string;
        zksync?: string;
        canto?: string;
        alienx?: string;
    };
    secrets?: {
        EVM_PRIVATE_KEY: string;
    };
    testMode?: boolean;
    multicall?: {
        batchSize?: number;
        wait?: number;
    };
}

// LiFi types
/**
 * Represents the status of LiFi communication.
 * @typedef {object} LiFiStatus
 * @property {"PENDING" | "DONE" | "FAILED"} status - The status of the LiFi communication (PENDING, DONE, or FAILED).
 * @property {string} [substatus] - Optional substatus information.
 * @property {Error} [error] - Optional error information in case of a failure.
 */
export type LiFiStatus = {
    status: "PENDING" | "DONE" | "FAILED";
    substatus?: string;
    error?: Error;
};

/**
 * Represents a route in the LiFi network.
 * @typedef {object} LiFiRoute
 * @property {Hash} transactionHash - The hash of the transaction.
 * @property {`0x${string}`} transactionData - The data of the transaction.
 * @property {Address} toAddress - The address the transaction is sent to.
 * @property {LiFiStatus} status - The status of the transaction.
 */
export type LiFiRoute = {
    transactionHash: Hash;
    transactionData: `0x${string}`;
    toAddress: Address;
    status: LiFiStatus;
};

// Provider types
/**
 * Interface representing token data.
 * @template Token 
 * @property {string} symbol - The symbol of the token.
 * @property {number} decimals - The number of decimals for the token.
 * @property {Address} address - The address of the token.
 * @property {string} name - The name of the token.
 * @property {string} [logoURI] - The URI for the token's logo.
 * @property {number} chainId - The chain ID for the token.
 */
export interface TokenData extends Token {
    symbol: string;
    decimals: number;
    address: Address;
    name: string;
    logoURI?: string;
    chainId: number;
}

/**
 * Interface representing the response of token price.
 * @interface
 * @property {string} priceUSD - The price of the token in USD.
 * @property {TokenData} token - The data of the token.
 */
export interface TokenPriceResponse {
    priceUSD: string;
    token: TokenData;
}

/**
 * Interface representing a response object containing a list of tokens.
 * @interface
 */
export interface TokenListResponse {
    tokens: TokenData[];
}

/**
 * Interface for ProviderError that extends Error object.
 * 
 * @typedef {Object} ProviderError
 * @extends {Error}
 * @property {number} [code] - Optional error code.
 * @property {unknown} [data] - Optional additional data related to the error.
 */
export interface ProviderError extends Error {
    code?: number;
    data?: unknown;
}
