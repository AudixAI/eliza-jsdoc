import {
    Action,
    composeContext,
    generateObjectDeprecated,
    IAgentRuntime,
    ModelClass,
    State,
} from "@elizaos/core";
import { initWalletProvider, WalletProvider } from "../providers/wallet";
import { bn } from "fuels";
import { transferTemplate } from "../templates";

/**
 * Type representing transfer parameters.
 * @typedef {object} TransferParams
 * @property {string} toAddress - The address to which the transfer is made.
 * @property {string} amount - The amount being transferred.
 */
type TransferParams = {
    toAddress: string;
    amount: string;
};

/**
 * Class representing a TransferAction.
 */

export class TransferAction {
/**
 * Constructor for the class, which accepts a wallet provider as a parameter.
 * 
 * @param {WalletProvider} walletProvider - The wallet provider to be used by the class.
 */
    constructor(private walletProvider: WalletProvider) {}

/**
 * Asynchronously transfers a specified amount of cryptocurrency to a specified address.
 * 
 * @param {TransferParams} params - The parameters for the transfer, including the recipient's address and the amount to be transferred.
 * @returns {Promise<Transaction>} A promise that resolves to the transaction object representing the transfer.
 * @throws {Error} If the transfer fails, an error message indicating the reason for the failure.
 */
    async transfer(params: TransferParams) {
        try {
            const { toAddress, amount } = params;
            const res = await this.walletProvider.wallet.transfer(
                toAddress,
                bn.parseUnits(amount)
            );
            const tx = await res.waitForResult();
            return tx;
        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }
}

/**
 * Asynchronously builds transfer details based on the provided state and runtime.
 * 
 * @param {State} state - The state object containing necessary information.
 * @param {IAgentRuntime} runtime - The runtime object for the agent.
 * @returns {Promise<TransferParams>} The transfer details generated based on the state and runtime.
 */
const buildTransferDetails = async (state: State, runtime: IAgentRuntime) => {
    const context = composeContext({
        state,
        template: transferTemplate,
    });

    const transferDetails = (await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    })) as TransferParams;

    return transferDetails;
};

/**
 * Represents a transfer action that allows transferring Fuel ETH between addresses on Fuel Ignition.
 * @typedef {Object} Action
 * @property {string} name - The name of the action ("transfer").
 * @property {string} description - A description of the action.
 * @property {Function} handler - An async function that handles the transfer action.
 * @property {Function} validate - An async function that validates the action.
 * @property {Array<Array<Object>>} examples - An array of examples demonstrating the action.
 * @property {Array<string>} similes - An array of similar actions.
 */
export const transferAction: Action = {
    name: "transfer",
    description: "Transfer Fuel ETH between addresses on Fuel Ignition",
    handler: async (runtime, message, state, options, callback) => {
        const walletProvider = await initWalletProvider(runtime);
        const action = new TransferAction(walletProvider);

        const paramOptions = await buildTransferDetails(state, runtime);

        try {
            const transferResp = await action.transfer(paramOptions);
            if (callback) {
                callback({
                    text: `Successfully transferred ${paramOptions.amount} ETH to ${paramOptions.toAddress}\nTransaction Hash: ${transferResp.id}`,
                    content: {
                        success: true,
                        hash: transferResp.id,
                        amount: paramOptions.amount,
                        recipient: paramOptions.toAddress,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error during token transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    // template: transferTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("FUEL_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "I'll help you transfer 1 ETH to 0x8F8afB12402C9a4bD9678Bec363E51360142f8443FB171655eEd55dB298828D1",
                    action: "SEND_TOKENS",
                },
            },
            {
                user: "user",
                content: {
                    text: "Transfer 1 ETH to 0x8F8afB12402C9a4bD9678Bec363E51360142f8443FB171655eEd55dB298828D1",
                    action: "SEND_TOKENS",
                },
            },
        ],
    ],
    similes: ["TRANSFER_FUEL_ETH"],
};
