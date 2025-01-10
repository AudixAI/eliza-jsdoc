import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    elizaLogger,
    type Action,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { connect, keyStores, utils } from "near-api-js";
import { KeyPairString } from "near-api-js/lib/utils";
import { utils as nearUtils } from "near-api-js";
// import BigNumber from "bignumber.js";

/**
 * Interface representing the structure of transferring content.
 * Extends the Content interface.
 * @property {string} recipient - The recipient of the transfer.
 * @property {string | number} amount - The amount being transferred.
 * @property {string} [tokenAddress] - Optional token address for native NEAR transfers.
 */
export interface TransferContent extends Content {
    recipient: string;
    amount: string | number;
    tokenAddress?: string; // Optional for native NEAR transfers
}

/**
 * Check if the provided content is a TransferContent object.
 * @param {IAgentRuntime} runtime - The Agent Runtime object.
 * @param {any} content - The content to check.
 * @returns {boolean} True if the content is a TransferContent object, false otherwise.
 */
function isTransferContent(
    runtime: IAgentRuntime,
    content: any
): content is TransferContent {
    return (
        typeof content.recipient === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number")
    );
}

/**
 * Template for responding with a JSON markdown block containing only the extracted values of a requested token transfer.
 * Use null for any values that cannot be determined.
 * 
 * Example response:
 * {
 *     "recipient": "bob.near",
 *     "amount": "1.5",
 *     "tokenAddress": null
 * }
 * 
 * {{recentMessages}}
 * 
 * Given the recent messages and wallet information below:
 * 
 * {{walletInfo}}
 * 
 * Extract the following information about the requested token transfer:
 * - Recipient address (NEAR account)
 * - Amount to transfer
 * - Token contract address (null for native NEAR transfers)
 * 
 * Respond with a JSON markdown block containing only the extracted values.
 */
const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "bob.near",
    "amount": "1.5",
    "tokenAddress": null
}
\`\`\`

{{recentMessages}}

Given the recent messages and wallet information below:

{{walletInfo}}

Extract the following information about the requested token transfer:
- Recipient address (NEAR account)
- Amount to transfer
- Token contract address (null for native NEAR transfers)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Transfer NEAR tokens from the current account to a recipient.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime object.
 * @param {string} recipient - The NEAR account ID of the recipient.
 * @param {string} amount - The amount of NEAR tokens to transfer (in NEAR token format).
 * @returns {Promise<string>} - A Promise that resolves to the transaction hash of the transfer.
 * @throws {Error} - If NEAR wallet credentials are not configured.
 */
async function transferNEAR(
    runtime: IAgentRuntime,
    recipient: string,
    amount: string
): Promise<string> {
    const networkId = runtime.getSetting("NEAR_NETWORK") || "testnet";
    const nodeUrl =
        runtime.getSetting("NEAR_RPC_URL") || "https://rpc.testnet.near.org";
    const accountId = runtime.getSetting("NEAR_ADDRESS");
    const secretKey = runtime.getSetting("NEAR_WALLET_SECRET_KEY");

    if (!accountId || !secretKey) {
        throw new Error("NEAR wallet credentials not configured");
    }

    // Convert amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    // const yoctoAmount = new BigNumber(amount).multipliedBy(new BigNumber(10).pow(24)).toFixed(0);

    // Create keystore and connect to NEAR
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = utils.KeyPair.fromString(secretKey as KeyPairString);
    await keyStore.setKey(networkId, accountId, keyPair);

    const nearConnection = await connect({
        networkId,
        keyStore,
        nodeUrl,
    });

    const account = await nearConnection.account(accountId);

    // Execute transfer
    const result = await account.sendMoney(
        recipient,
        BigInt(nearUtils.format.parseNearAmount(amount)!)
    );

    return result.transaction.hash;
}

/**
 * Action to transfer NEAR tokens to another account.
 * 
 * @typedef {Object} Action
 * @property {string} name - The name of the action ("SEND_NEAR").
 * @property {string[]} similes - Array of similar actions.
 * @property {Function} validate - Validation function.
 * @property {string} description - Description of the action.
 * @property {Function} handler - The function to handle the action.
 * @property {ActionExample[][]} examples - Array of examples demonstrating the action.
 */
export const executeTransfer: Action = {
    name: "SEND_NEAR",
    similes: ["TRANSFER_NEAR", "SEND_TOKENS", "TRANSFER_TOKENS", "PAY_NEAR"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true; // Add your validation logic here
    },
    description: "Transfer NEAR tokens to another account",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        // Initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        // Compose transfer context
        const transferContext = composeContext({
            state,
            template: transferTemplate,
        });

        // Generate transfer content
        const content = await generateObject({
            runtime,
            context: transferContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate transfer content
        if (!isTransferContent(runtime, content)) {
            elizaLogger.error("Invalid content for TRANSFER_NEAR action.");
            if (callback) {
                callback({
                    text: "Unable to process transfer request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        try {
            const txHash = await transferNEAR(
                runtime,
                content.recipient,
                content.amount.toString()
            );

            if (callback) {
                callback({
                    text: `Successfully transferred ${content.amount} NEAR to ${content.recipient}\nTransaction: ${txHash}`,
                    content: {
                        success: true,
                        signature: txHash,
                        amount: content.amount,
                        recipient: content.recipient,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during NEAR transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring NEAR: ${error}`,
                    content: { error: error },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1.5 NEAR to bob.testnet",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1.5 NEAR now...",
                    action: "SEND_NEAR",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully sent 1.5 NEAR to bob.testnet\nTransaction: ABC123XYZ",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
