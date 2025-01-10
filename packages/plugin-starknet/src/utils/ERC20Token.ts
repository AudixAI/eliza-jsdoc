import {
    AccountInterface,
    cairo,
    CallData,
    Calldata,
    Contract,
    ProviderInterface,
} from "starknet";
import erc20Abi from "./erc20.json";

/**
 * Represents a structure for approving a call on a smart contract.
 *
 * @typedef {Object} ApproveCall
 * @property {string} contractAddress - The address of the smart contract.
 * @property {"approve"} entrypoint - The entrypoint to be called on the smart contract.
 * @property {Calldata} calldata - The calldata for the call.
 */
export type ApproveCall = {
    contractAddress: string;
    entrypoint: "approve";
    calldata: Calldata;
};

/**
 * Represents a transfer call object containing the contract address, entrypoint, and calldata.
 * @typedef {Object} TransferCall
 * @property {string} contractAddress - The address of the contract.
 * @property {"transfer"} entrypoint - The entrypoint for the transfer.
 * @property {Calldata} calldata - The data for the call.
 */
export type TransferCall = {
    contractAddress: string;
    entrypoint: "transfer";
    calldata: Calldata;
};

/**
 * Class representing an ERC20 token.
 */

export class ERC20Token {
    abi: any;
    contract: Contract;
    calldata: CallData;
/**
 * Constructor for creating a new instance of a class.
 * 
 * @param {string} token - The token address.
 * @param {ProviderInterface | AccountInterface} [providerOrAccount] - The provider or account interface.
 */
    constructor(
        token: string,
        providerOrAccount?: ProviderInterface | AccountInterface
    ) {
        this.contract = new Contract(erc20Abi, token, providerOrAccount);
        this.calldata = new CallData(this.contract.abi);
    }

/**
 * Retrieves the address of the contract.
 * 
 * @returns {string} The address of the contract.
 */
    public address() {
        return this.contract.address;
    }

/**
 * Asynchronously retrieves the balance of the specified account.
 * @param {string} account - The account for which to retrieve the balance.
 * @returns {Promise<bigint>} A promise that resolves to the balance of the account as a bigint.
 */
    public async balanceOf(account: string): Promise<bigint> {
        const result = await this.contract.call("balance_of", [account]);
        return result as bigint;
    }

/**
 * Asynchronously retrieves the number of decimal places used for token values.
 * @returns {Promise<bigint>} The number of decimal places as a BigInt.
 */
    public async decimals() {
        const result = await this.contract.call("decimals");
        return result as bigint;
    }

/**
 * Approves a spender to transfer a specified amount of tokens on behalf of the contract.
 * 
 * @param {string} spender - The address of the spender to approve.
 * @param {bigint} amount - The amount of tokens to approve for transfer.
 * @returns {ApproveCall} An object containing contract address, entrypoint, and calldata for the approval transaction.
 */
    public approveCall(spender: string, amount: bigint): ApproveCall {
        return {
            contractAddress: this.contract.address,
            entrypoint: "approve",
            calldata: this.calldata.compile("approve", {
                spender: spender,
                amount: cairo.uint256(amount),
            }),
        };
    }

/**
 * Transfers a specified amount of tokens to a recipient.
 * @param {string} recipient - The address of the recipient.
 * @param {bigint} amount - The amount of tokens to transfer.
 * @returns {TransferCall} - An object containing details for the transfer call.
 */
    public transferCall(recipient: string, amount: bigint): TransferCall {
        return {
            contractAddress: this.contract.address,
            entrypoint: "transfer",
            calldata: this.calldata.compile("transfer", {
                recipient: recipient,
                amount: cairo.uint256(amount),
            }),
        };
    }
}
