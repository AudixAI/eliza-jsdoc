import type { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { Coin, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import type { assets, chains } from "chain-registry";

/**
 * Interface for defining custom chain data for a Cosmos plugin.
 * @typedef {Object} ICosmosPluginCustomChainData
 * @property {object} chainData - The custom chain data for the plugin.
 * @property {object} assets - The assets associated with the custom chain data.
 */
export interface ICosmosPluginCustomChainData {
    chainData: (typeof chains)[number];
    assets: (typeof assets)[number];
}

/**
 * Represents the options available for a Cosmos Plugin.
 * @typedef {Object} ICosmosPluginOptions
 * @property {ICosmosPluginCustomChainData[]} [customChainData] - An optional array of custom chain data objects.
 */
export interface ICosmosPluginOptions {
    customChainData?: ICosmosPluginCustomChainData[];
}

/**
 * Interface for Cosmos action service.
 * @interface
 */

export interface ICosmosActionService {
    execute: ((...params: unknown[]) => void) | (() => void);
}

/**
 * Interface for representing a Cosmos transaction.
 * @interface ICosmosTransaction
 * @property {string} from - The sender's address.
 * @property {string} to - The recipient's address.
 * @property {string} txHash - The transaction hash.
 * @property {number} gasPaid - The amount of gas paid for the transaction.
 */
export interface ICosmosTransaction {
    from: string;
    to: string;
    txHash: string;
    gasPaid: number;
}

/**
 * Interface representing a Cosmos Wallet.
 * @property {DirectSecp256k1HdWallet} directSecp256k1HdWallet - The direct secp256k1 HD wallet associated with the Cosmos Wallet.
 * @method getWalletAddress - Asynchronously retrieves the wallet address associated with the Cosmos Wallet.
 * @method getWalletBalances - Asynchronously retrieves the balances of the wallet in form of an array of Coins.
 */

export interface ICosmosWallet {
    directSecp256k1HdWallet: DirectSecp256k1HdWallet;

    getWalletAddress(): Promise<string>;
    getWalletBalances(): Promise<Coin[]>;
}

/**
 * Interface representing a Cosmos chain wallet, which includes a Cosmos wallet and a signing CosmWasm client.
 */
export interface ICosmosChainWallet {
    wallet: ICosmosWallet;
    signingCosmWasmClient: SigningCosmWasmClient;
}

/**
 * Interface for defining Cosmos wallet chains.
 * @interface
 */

export interface ICosmosWalletChains {
    walletChainsData: ICosmosWalletChainsData;

    getWalletAddress(chainName: string): Promise<string>;
    getSigningCosmWasmClient(chainName: string): SigningCosmWasmClient;
}

/**
 * Interface representing a collection of Cosmos chain wallets, indexed by the chain name.
 * @typedef {Object} ICosmosWalletChainsData
 * @property {ICosmosChainWallet} chainName - The Cosmos chain wallet associated with the specified chain name.
 */
export interface ICosmosWalletChainsData {
    [chainName: string]: ICosmosChainWallet;
}
