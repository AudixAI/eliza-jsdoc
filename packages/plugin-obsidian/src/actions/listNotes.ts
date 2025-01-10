import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import { getObsidian }  from "../helper";

/**
 * Represents an action to list all markdown notes in the Obsidian vault.
 * 
 * @type {Action}
 * @property {string} name - The name of the action ("LIST_NOTES").
 * @property {string[]} similes - Alternative phrases that trigger the action.
 * @property {string} description - Description of the action.
 * @property {Function} validate - Asynchronous function to validate the Obsidian connection.
 * @property {Function} handler - Asynchronous function to handle listing notes from the vault.
 * @property {Object[]} examples - Examples of user input and expected agent response for this action.
 */
export const listNotesAction: Action = {
    name: "LIST_NOTES",
    similes: [
        "LIST_NOTES",
        "SHOW_NOTES",
        "GET_NOTES",
        "FETCH_NOTES",
        "VIEW_NOTES",
        "DISPLAY_NOTES",
        "ENUMERATE_NOTES",
    ],
    description:
        "List all markdown notes in the Obsidian vault. Use format: 'List notes' or 'Show all notes'",
    validate: async (runtime: IAgentRuntime) => {
        try {
            elizaLogger.debug("Validating Obsidian connection");
            const obsidian = await getObsidian(runtime);
            await obsidian.connect();
            elizaLogger.debug("Obsidian connection validated successfully");
            return true;
        } catch (error) {
            elizaLogger.error("Failed to validate Obsidian connection:", error);
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ) => {
        elizaLogger.info("Starting list notes handler");
        const obsidian = await getObsidian(runtime);

        try {
            elizaLogger.info("Fetching list of notes from vault");
            const notes: string[] = await obsidian.listNotes();

            elizaLogger.info(`Successfully retrieved ${notes.length} notes`);

            // Format the notes list into a readable string
            const formattedNotes = notes.length > 0
                ? notes.map(note => `- ${note}`).join('\n')
                : "No notes found in the vault";

            if (callback) {
                callback({
                    text: `Found ${notes.length} notes in the vault:\n\n${formattedNotes}`,
                    metadata: {
                        count: notes.length,
                        notes: notes,
                    },
                });
            }
            return true;
        } catch (error) {
            elizaLogger.error("Error listing notes:", error);
            if (callback) {
                callback({
                    text: `Error listing notes: ${error.message}`,
                    error: true,
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
                    text: "List notes",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "LIST_NOTES",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show all notes in vault",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "LIST_NOTES",
                },
            },
        ],
    ],
};
