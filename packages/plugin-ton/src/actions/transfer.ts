import {
    elizaLogger,
    composeContext,
    Content,
    HandlerCallback,
    ModelClass,
    generateObject,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { z } from "zod";

import {
    initWalletProvider,
    WalletProvider,
    nativeWalletProvider,
} from "../providers/wallet";
import { internal } from "@ton/ton";

/**
 * Interface representing content to be transferred, extending from Content.
 * @interface
 * @property {string} recipient - The recipient of the transfer.
 * @property {string|number} amount - The amount to be transferred, can be a string or a number.
 */
export interface TransferContent extends Content {
    recipient: string;
    amount: string | number;
}

/**
 * Check if the given content is of type TransferContent.
 * @param {Content} content - The content to be checked.
 * @returns {boolean} - Returns true if the content is of type TransferContent, false otherwise.
 */
function isTransferContent(content: Content): content is TransferContent {
    console.log("Content for transfer", content);
    return (
        typeof content.recipient === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number")
    );
}

/**
 * Transfer template for extracting recipient wallet address and amount to transfer from recent messages.
 * Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
 * 
 * Example response:
 * ```json
 * {
 *     "recipient": "EQCGScrZe1xbyWqWDvdI6mzP-GAcAWFv6ZXuaJOuSqemxku4",
 *     "amount": "1"
 * }
 * ```
 * 
 * {{recentMessages}}
 * 
 * Given the recent messages, extract the following information about the requested token transfer:
 * - Recipient wallet address
 * - Amount to transfer
 * 
 * Respond with a JSON markdown block containing only the extracted values.
 */
const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "EQCGScrZe1xbyWqWDvdI6mzP-GAcAWFv6ZXuaJOuSqemxku4",
    "amount": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Recipient wallet address
- Amount to transfer

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Class representing a transfer action.
 */
/**
 * Transfer tokens to a specified recipient.
 * @param { TransferContent } params - The content of the transfer.
 * @returns {Promise<string>} - The hash of the transfer.
 */
export class TransferAction {
/**
 * Constructor for creating an instance of the class with a wallet provider.
 * 
 * @param {WalletProvider} walletProvider - The wallet provider to be used by the class.
 */ 
      
    constructor(private walletProvider: WalletProvider) {}

/**
 * Transfer tokens to a recipient.
 * @param {TransferContent} params - The parameters for the transfer.
 * @returns {Promise<string>} - The hash of the transfer.
 */
    async transfer(params: TransferContent): Promise<string> {
        console.log(
            `Transferring: ${params.amount} tokens to (${params.recipient})`
        );

        const walletClient = this.walletProvider.getWalletClient();
        const contract = walletClient.open(this.walletProvider.wallet);

        try {
            // Create a transfer
            const seqno: number = await contract.getSeqno();
            const transfer = await contract.createTransfer({
                seqno,
                secretKey: this.walletProvider.keypair.secretKey,
                messages: [
                    internal({
                        value: params.amount.toString(),
                        to: params.recipient,
                        body: "eliza ton wallet plugin",
                    }),
                ],
            });

            await contract.send(transfer);

            // await this.waitForTransaction(seqno, contract);

            return transfer.hash().toString("hex");
        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }
}

/**
 * Builds transfer details using the provided runtime, message, and state.
 * 
 * @param {IAgentRuntime} runtime - The runtime object.
 * @param {Memory} message - The message object.
 * @param {State} state - The state object.
 * @returns {Promise<TransferContent>} - The transfer content object.
 */
const buildTransferDetails = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
): Promise<TransferContent> => {
    const walletInfo = await nativeWalletProvider.get(runtime, message, state);
    state.walletInfo = walletInfo;

    // Initialize or update state
    if (!state) {
        state = (await runtime.composeState(message)) as State;
    } else {
        state = await runtime.updateRecentMessageState(state);
    }

    // Define the schema for the expected output
    const transferSchema = z.object({
        recipient: z.string(),
        amount: z.union([z.string(), z.number()]),
    });

    // Compose transfer context
    const transferContext = composeContext({
        state,
        template: transferTemplate,
    });

    // Generate transfer content with the schema
    const content = await generateObject({
        runtime,
        context: transferContext,
        schema: transferSchema,
        modelClass: ModelClass.SMALL,
    });

    const transferContent = content.object as TransferContent;

    return transferContent;
};

export default {
    name: "SEND_TOKEN",
    similes: ["SEND_TOKENS", "TOKEN_TRANSFER", "MOVE_TOKENS", "SEND_TON"],
    description: "Transfer tokens from the agent's wallet to another",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting SEND_TOKEN handler...");

        const transferDetails = await buildTransferDetails(
            runtime,
            message,
            state
        );

        // Validate transfer content
        if (!isTransferContent(transferDetails)) {
            console.error("Invalid content for TRANSFER_TOKEN action.");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        try {
            const walletProvider = await initWalletProvider(runtime);
            const action = new TransferAction(walletProvider);
            const hash = await action.transfer(transferDetails);

            if (callback) {
                callback({
                    text: `Successfully transferred ${transferDetails.amount} TON to ${transferDetails.recipient}, Transaction: ${hash}`,
                    content: {
                        success: true,
                        hash: hash,
                        amount: transferDetails.amount,
                        recipient: transferDetails.recipient,
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
    template: transferTemplate,
    validate: async (runtime: IAgentRuntime) => {
        //console.log("Validating TON transfer from user:", message.userId);
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 TON tokens to EQCGScrZe1xbyWqWDvdI6mzP-GAcAWFv6ZXuaJOuSqemxku4",
                    action: "SEND_TOKENS",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 TON tokens now...",
                    action: "SEND_TOKENS",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully sent 1 TON tokens to EQCGScrZe1xbyWqWDvdI6mzP-GAcAWFv6ZXuaJOuSqemxku4, Transaction: c8ee4a2c1bd070005e6cd31b32270aa461c69b927c3f4c28b293c80786f78b43",
                },
            },
        ],
    ],
};
