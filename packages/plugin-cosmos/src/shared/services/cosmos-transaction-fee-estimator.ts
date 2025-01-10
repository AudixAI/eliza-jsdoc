import type { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { EncodeObject } from "@cosmjs/proto-signing";
import type { Coin, MsgSendEncodeObject } from "@cosmjs/stargate";

/**
 * Class for estimating gas fees for Cosmos transactions.
 */
export class CosmosTransactionFeeEstimator {
/**
 * Estimate the gas needed for a transaction based on the provided parameters.
 * 
 * @template Message - The type of message to be encoded.
 * @param {SigningCosmWasmClient} signingCosmWasmClient - The client used for signing and interacting with the CosmWasm blockchain.
 * @param {string} senderAddress - The address of the sender of the transaction.
 * @param {Message} message - The message to be included in the transaction.
 * @param {string} memo - Memo to be included in the transaction (default is an empty string).
 * @returns {Promise<number>} - Estimated gas needed for the transaction with a 20% buffer added to ensure coverage.
 */
    private static async estimateGasForTransaction<
        Message extends readonly EncodeObject[],
    >(
        signingCosmWasmClient: SigningCosmWasmClient,
        senderAddress: string,
        message: Message,
        memo = ""
    ): Promise<number> {
        const estimatedGas = await signingCosmWasmClient.simulate(
            senderAddress,
            message,
            memo
        );

        // Add 20% to the estimated gas to make sure we have enough gas to cover the transaction
        const safeEstimatedGas = Math.ceil(estimatedGas * 1.2);

        return safeEstimatedGas;
    }

/**
 * Estimate the gas required for transferring a certain amount of coins from one address to another.
 *
 * @param {SigningCosmWasmClient} signingCosmWasmClient - The client for signing and sending messages to the CosmWasm chain.
 * @param {string} senderAddress - The address of the sender.
 * @param {string} recipientAddress - The address of the recipient.
 * @param {readonly Coin[]} amount - The amount of coins to transfer.
 * @param {string} memo - (Optional) Additional information for the transaction.
 * @returns {Promise<number>} The estimated gas required for the coin transfer transaction.
 */
    static estimateGasForCoinTransfer(
        signingCosmWasmClient: SigningCosmWasmClient,
        senderAddress: string,
        recipientAddress: string,
        amount: readonly Coin[],
        memo = ""
    ): Promise<number> {
        return this.estimateGasForTransaction<MsgSendEncodeObject[]>(
            signingCosmWasmClient,
            senderAddress,
            [
                {
                    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                    value: {
                        fromAddress: senderAddress,
                        toAddress: recipientAddress,
                        amount: [...amount],
                    },
                },
            ],
            memo
        );
    }
}
