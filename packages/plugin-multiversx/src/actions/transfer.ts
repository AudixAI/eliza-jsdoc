import {
    elizaLogger,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    generateObject,
    type Action,
} from "@elizaos/core";
import { WalletProvider } from "../providers/wallet";
import { validateMultiversxConfig } from "../enviroment";
import { transferSchema } from "../utils/schemas";
/**
 * Interface representing transfer content, which extends Content.
 * @interface
 * @extends Content
 * @property {string} tokenAddress - The address of the token.
 * @property {string} amount - The amount of tokens being transferred.
 * @property {string} [tokenIdentifier] - An optional identifier for the token.
 */
export interface TransferContent extends Content {
    tokenAddress: string;
    amount: string;
    tokenIdentifier?: string;
}

/**
 * Checks if the provided content is valid for a transfer.
 * 
 * @param {_runtime: IAgentRuntime} _runtime - The runtime of the agent.
 * @param {TransferContent} content - The content to be checked for transfer.
 * @returns {boolean} Returns true if the content is valid for transfer, otherwise false.
 */
function isTransferContent(_runtime: IAgentRuntime, content: TransferContent) {
    console.log("Content for transfer", content);
    return (
        typeof content.tokenAddress === "string" &&
        typeof content.amount === "string"
    );
}

/**
 * Transfer template function that extracts token transfer information from recent messages.
 * Responds with a JSON markdown block containing the extracted values.
 * Use null for any values that cannot be determined.
 * 
 * Example response:
 * ```json
 * {
 *    "tokenAddress": "erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
 *    "amount": "1",
 *    "tokenIdentifier": "PEPE-3eca7c"
 * }
 * ```
 * 
 * @param {string} recentMessages - The recent messages to extract information from.
 * @returns {string} - JSON markdown block containing extracted values (tokenAddress, amount, tokenIdentifier).
 */
const transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenAddress": "erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
    "amount": "1",
    "tokenIdentifier": "PEPE-3eca7c"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Token address
- Amount to transfer
- Token identifier

Respond with a JSON markdown block containing only the extracted values.`;

export default {
    name: "SEND_TOKEN",
    similes: [
        "TRANSFER_TOKEN",
        "TRANSFER_TOKENS",
        "SEND_TOKENS",
        "SEND_EGLD",
        "PAY",
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        console.log("Validating config for user:", message.userId);
        await validateMultiversxConfig(runtime);
        return true;
    },
    description: "Transfer tokens from the agent wallet to another address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting SEND_TOKEN handler...");

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
            schema: transferSchema,
        });

        const payload = content.object as TransferContent;

        // Validate transfer content
        if (!isTransferContent(runtime, payload)) {
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
            const privateKey = runtime.getSetting("MVX_PRIVATE_KEY");
            const network = runtime.getSetting("MVX_NETWORK");

            const walletProvider = new WalletProvider(privateKey, network);

            if (
                payload.tokenIdentifier &&
                payload.tokenIdentifier.toLowerCase() !== "egld"
            ) {
                await walletProvider.sendESDT({
                    receiverAddress: payload.tokenAddress,
                    amount: payload.amount,
                    identifier: payload.tokenIdentifier,
                });
                return true;
            }

            await walletProvider.sendEGLD({
                receiverAddress: payload.tokenAddress,
                amount: payload.amount,
            });
            return true;
        } catch (error) {
            console.error("Error during token transfer:", error);
            if (callback) {
                callback({
                    text: `Error transferring tokens: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return "";
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 EGLD to erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 EGLD tokens now...",
                    action: "SEND_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 TST-a8b23d to erd12r22hx2q4jjt8e0gukxt5shxqjp9ys5nwdtz0gpds25zf8qwtjdqyzfgzm",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 1 TST-a8b23d tokens now...",
                    action: "SEND_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
