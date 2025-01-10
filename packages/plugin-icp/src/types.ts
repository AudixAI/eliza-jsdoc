import type { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
/**
 * Interface for representing a payment configuration object.
 * @typedef {object} ICPConfig
 * @property {string} privateKey - The private key used for payment.
 * @property {"mainnet" | "testnet"} [network] - The network type (optional, default is "mainnet").
 */
export interface ICPConfig {
    privateKey: string;
    network?: "mainnet" | "testnet";
}

/**
 * Interface representing parameters for a transfer transaction.
 * @property {Principal | string} to - The recipient of the transfer.
 * @property {bigint} amount - The amount to be transferred.
 * @property {bigint} [memo] - Optional memo for the transfer.
 */
export interface TransferParams {
    to: Principal | string;
    amount: bigint;
    memo?: bigint;
}

/**
 * Interface representing a CP balance with a specific amount in e8s.
 */
export interface ICPBalance {
    e8s: bigint;
}

/**
 * Interface representing the result of a transfer operation.
 * @typedef {Object} TransferResult
 * @property {bigint} [Ok] - The value returned if the transfer operation was successful.
 * @property {string} [Err] - The error message returned if the transfer operation failed.
 */
export interface TransferResult {
    Ok?: bigint;
    Err?: string;
}

/**
 * Interface for an ICP Provider.
 * 
 * @interface
 */

export interface ICPProvider {
    getBalance(principal: string): Promise<ICPBalance>;
    transfer(params: TransferParams): Promise<TransferResult>;
}

// Credentials obtained after login, used to create an actor with the logged-in identity. The actor can call canister methods
/**
 * Represents a function that creates an actor subclass.
 * 
 * @template T The type of the actor subclass being created.
 * @param {IDL.InterfaceFactory} idlFactory The Candid interface factory used to generate the actor subclass.
 * @param {string} canister_id The ID of the target canister for the actor.
 * @returns {Promise<ActorSubclass<T>>} A promise that resolves with the created actor subclass.
 */

export type ActorCreator = <T>(
    idlFactory: IDL.InterfaceFactory, // Candid interface
    canister_id: string // Target canister
) => Promise<ActorSubclass<T>>;

/**
 * Definition for the arguments needed to create a Meme Token.
 * @typedef CreateMemeTokenArg
 * @type {object}
 * @property {string} name - The name of the Meme Token.
 * @property {string} symbol - The symbol of the Meme Token.
 * @property {string} description - The description of the Meme Token.
 * @property {string} logo - The logo URL of the Meme Token.
 * @property {string} [twitter] - The Twitter URL associated with the Meme Token (optional).
 * @property {string} [website] - The website URL associated with the Meme Token (optional).
 * @property {string} [telegram] - The Telegram URL associated with the Meme Token (optional).
 */
export type CreateMemeTokenArg = {
    name: string;
    symbol: string;
    description: string;
    logo: string;
    twitter?: string;
    website?: string;
    telegram?: string;
};
