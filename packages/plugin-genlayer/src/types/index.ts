import {
    Address,
    CalldataEncodable,
    TransactionHash,
    TransactionStatus,
} from "genlayer-js/types";

// Action parameters
/**
 * Interface representing parameters for reading from a smart contract.
 *
 * @typedef {Object} ReadContractParams
 * @property {Address} contractAddress - The address of the smart contract to read from.
 * @property {string} functionName - The name of the function to call.
 * @property {any[]} functionArgs - An array of arguments to pass to the function.
 */
export interface ReadContractParams {
    contractAddress: Address;
    functionName: string;
    functionArgs: any[];
}

/**
 * Interface representing the parameters needed to write to a contract.
 *
 * @property {Address} contractAddress - The address of the contract to write to.
 * @property {string} functionName - The name of the function to call on the contract.
 * @property {CalldataEncodable[]} functionArgs - An array of arguments to pass to the function.
 * @property {bigint} value - The amount of value to send with the transaction.
 * @property {boolean} [leaderOnly] - Optional flag indicating if only the leader should execute the transaction.
 */
export interface WriteContractParams {
    contractAddress: Address;
    functionName: string;
    functionArgs: CalldataEncodable[];
    value: bigint;
    leaderOnly?: boolean;
}

/**
 * Interface representing the parameters required to deploy a smart contract.
 *
 * @property {string} code_file - The file containing the code of the contract to be deployed.
 * @property {CalldataEncodable[]} args - The arguments to be passed when deploying the contract.
 * @property {boolean} [leaderOnly] - Flag indicating if only the leader is allowed to deploy the contract. Optional.
 */
export interface DeployContractParams {
    code_file: string;
    args: CalldataEncodable[];
    leaderOnly?: boolean;
}

/**
 * Interface representing the parameters for getting a transaction.
 * @typedef {Object} GetTransactionParams
 * @property {TransactionHash} hash - The hash of the transaction to retrieve.
 */
export interface GetTransactionParams {
    hash: TransactionHash;
}

/**
 * Interface representing the parameters for retrieving the current nonce for a specific address.
 * @property {string} address - The address for which to retrieve the nonce.
 */
export interface GetCurrentNonceParams {
    address: string;
}

/**
 * Interface for defining parameters for waiting for the transaction receipt.
 * * @param { TransactionHash } hash - The transaction hash to wait for.
 * @param { TransactionStatus } [status] - The status of the transaction to check for.
 * @param { number } [interval] - The interval in milliseconds for checking the transaction status.
 * @param { number } [retries] - The number of retries for checking the transaction status.
 */
export interface WaitForTransactionReceiptParams {
    hash: TransactionHash;
    status?: TransactionStatus;
    interval?: number;
    retries?: number;
}

/**
 * Interface for getting contract schema.
 * @param {string} address - The address of the contract.
 */
export interface GetContractSchemaParams {
    address: string;
}

/**
 * Interface representing the parameters for getting a contract schema based on contract code.
 * @typedef {object} GetContractSchemaForCodeParams
 * @property {string} contractCode - The contract code for which to retrieve the schema.
 */
export interface GetContractSchemaForCodeParams {
    contractCode: string;
}
