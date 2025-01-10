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

/**
 * Type representing a supported blockchain chain.
 * Currently only supports the "odyssey" chain.
 */
export type SupportedChain = "odyssey";

// Transaction types
/**
 * Represents a transaction object.
 * @typedef {Object} Transaction
 * @property {Hash} hash - The hash of the transaction.
 * @property {Address} from - The sender address of the transaction.
 * @property {Address} to - The recipient address of the transaction.
 * @property {bigint} value - The value of the transaction.
 * @property {string} [data] - Optional additional data for the transaction.
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

// Token types
/**
 * Interface representing a token with its balance and related information.
 *
 * @typedef {Object} TokenWithBalance
 * @property {Token} token - The token object.
 * @property {bigint} balance - The balance of the token.
 * @property {string} formattedBalance - The balance of the token in a formatted string.
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
 * Represents the balance of a wallet.
 * @typedef {Object} WalletBalance
 * @property {SupportedChain} chain - The supported blockchain network.
 * @property {Address} address - The wallet address.
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
 * @property {number} chainId - The unique identifier for the blockchain network.
 * @property {string} name - The name of the blockchain network.
 * @property {Chain} chain - The type of blockchain network.
 * @property {string} rpcUrl - The URL for the RPC endpoint of the blockchain network.
 * @property {Object} nativeCurrency - Metadata related to the native currency of the blockchain network.
 * @property {string} nativeCurrency.name - The name of the native currency.
 * @property {string} nativeCurrency.symbol - The symbol of the native currency.
 * @property {number} nativeCurrency.decimals - The number of decimal places for the native currency.
 * @property {string} blockExplorerUrl - The URL for the blockchain network's block explorer.
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
 * Interface representing a chain configuration.
 * @property {Chain} chain - The chain being configured.
 * @property {PublicClient<HttpTransport, Chain, Account | undefined>} publicClient - The public client for the chain with specified transport, chain, and account types.
 * @property {WalletClient} [walletClient] - Optional wallet client for the chain configuration.
 */
export interface ChainConfig {
    chain: Chain;
    publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
    walletClient?: WalletClient;
}

// Action parameters
/**
 * Interface for registering an IP address.
 * @typedef {Object} RegisterIPParams
 * @property {string} title - The title of the IP address.
 * @property {string} description - The description of the IP address.
 * @property {string} ipType - The type of IP address.
 */
export interface RegisterIPParams {
    title: string;
    description: string;
    ipType: string;
}

/**
 * Interface representing the parameters required to create a license for an IP.
 * @typedef {object} LicenseIPParams
 * @property {Address} licensorIpId - The ID of the licensor IP.
 * @property {string} licenseTermsId - The ID of the license terms.
 * @property {number} amount - The amount of the license.
 */
export interface LicenseIPParams {
    licensorIpId: Address;
    licenseTermsId: string;
    amount: number;
}

/**
 * Interface representing parameters for attaching terms to an IP.
 * @typedef {Object} AttachTermsParams
 * @property {Address} ipId - The ID of the IP.
 * @property {number} mintingFee - The fee for minting the IP.
 * @property {boolean} commercialUse - Indicates if the IP can be used for commercial purposes.
 * @property {number} commercialRevShare - The percentage of revenue shared for commercial use of the IP.
 */ 
         
export interface AttachTermsParams {
    ipId: Address;
    mintingFee: number;
    commercialUse: boolean;
    commercialRevShare: number;
}

// Plugin configuration
/**
 * Interface for the configuration options of an EVM plugin.
 * @typedef { Object } EvmPluginConfig
 * @property { Object } rpcUrl - Object containing Ethereum and base RPC URLs.
 * @property { string } rpcUrl.ethereum - Ethereum RPC URL.
 * @property { string } rpcUrl.base - Base RPC URL.
 * @property { Object } secrets - Object containing EVM private key.
 * @property { string } secrets.EVM_PRIVATE_KEY - EVM private key.
 * @property { boolean } testMode - Flag indicating whether test mode is enabled.
 * @property { Object } multicall - Object containing batch size and wait settings for multicall.
 * @property { number } multicall.batchSize - Batch size for multicall requests.
 * @property { number } multicall.wait - Wait time for multicall requests.
 */
export interface EvmPluginConfig {
    rpcUrl?: {
        ethereum?: string;
        base?: string;
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

// Provider types
/**
 * Interface for TokenData representing a token with specific properties
 * @interface TokenData
 * @extends Token
 * @property { string } symbol - The symbol of the token
 * @property { number } decimals - The decimal places of the token
 * @property { Address } address - The address of the token
 * @property { string } name - The name of the token
 * @property { string } [logoURI] - Optional URI for the token's logo
 * @property { number } chainId - The chain ID of the token
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
 * Interface representing the response for token price.
 * @typedef {Object} TokenPriceResponse
 * @property {string} priceUSD - The price of the token in USD.
 * @property {TokenData} token - The data of the token.
 */
export interface TokenPriceResponse {
    priceUSD: string;
    token: TokenData;
}

/**
 * Interface representing a response containing a list of tokens.
 * @typedef {Object} TokenListResponse
 * @property {TokenData[]} tokens - An array of TokenData objects.
 */
export interface TokenListResponse {
    tokens: TokenData[];
}

/**
 * Interface representing an Error object specific to a provider.
 * @interface ProviderError
 * @extends Error
 * @property {number} [code] - Optional error code.
 * @property {unknown} [data] - Optional additional data related to the error.
 */
export interface ProviderError extends Error {
    code?: number;
    data?: unknown;
}
