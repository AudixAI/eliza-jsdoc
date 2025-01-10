import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import { TransactionHash } from "genlayer-js/types";
import { ClientProvider } from "../providers/client";
import { getParamsWithLLM } from "../utils/llm";

/**
 * Function to get the transaction template with instructions on extracting the transaction hash from the user's message.
 * 
 * @returns {string} The transaction template with instructions formatted as a JSON block.
 */
const getTransactionTemplate = `
# Task: Extract the transaction hash from the user's message.

# Instructions: The user is requesting transaction details from the GenLayer protocol.

<latest user message>
{{userMessage}}
</latest user message>

<data from recent messages>
{{recentMessagesData}}
</data from recent messages>

# Your response must be formatted as a JSON block with this structure:
\`\`\`json
{
  "hash": "<Transaction Hash>"
}
\`\`\`
`;

/**
 * Represents the getTransactionAction object.
 *
 * @type {Action}
 * @property {string} name - The name of the action.
 * @property {string[]} similes - Array of similes associated with the action.
 * @property {string} description - Description of the action.
 * @property {Function} validate - Asynchronous function to validate if private key starts with "0x".
 * @property {Function} handler - Asynchronous function that handles the get transaction action.
 * @property {Array<Array<{ user: string, content: { text: string, action?: string } }>} examples - Array of examples demonstrating usage of the action.
 */
export const getTransactionAction: Action = {
    name: "GET_TRANSACTION",
    similes: ["GET_TRANSACTION"],
    description: "Get transaction details from the GenLayer protocol",
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("GENLAYER_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.info("Starting get transaction action");
        elizaLogger.debug("User message:", message.content.text);

        const clientProvider = new ClientProvider(runtime);

        const options = await getParamsWithLLM<{ hash: TransactionHash }>(
            runtime,
            message,
            getTransactionTemplate,
            state
        );

        if (
            !options ||
            !options.hash ||
            !/^0x[a-fA-F0-9]{64}$/.test(options.hash)
        ) {
            elizaLogger.error("No valid transaction hash found in message");
            throw new Error("No valid transaction hash found in message");
        }

        elizaLogger.info(
            `Getting transaction details for hash: ${options.hash}`
        );
        const result = await clientProvider.client.getTransaction({
            hash: options.hash,
        });

        elizaLogger.success("Successfully retrieved transaction details");
        elizaLogger.debug("Transaction details:", result);
        await callback(
            {
                text: `Transaction details: ${JSON.stringify(
                    result,
                    (_key, value) =>
                        typeof value === "bigint" ? Number(value) : value,
                    2
                )}`,
            },
            []
        );
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get transaction details for hash 0x1234567890123456789012345678901234567890123456789012345678901234",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here are the transaction details:",
                    action: "GET_TRANSACTION",
                },
            },
        ],
    ],
};
