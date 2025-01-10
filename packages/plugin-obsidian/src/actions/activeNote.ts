import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    composeContext,
    ModelClass,
    splitChunks,
    trimTokens,
    generateText,
} from "@elizaos/core";
import { NoteContent } from "../types";
import { baseSummaryTemplate } from "../templates/summary";
import { getObsidian }  from "../helper";

/**
 * Action for retrieving and displaying the content of the currently active note in Obsidian.
 * @typedef {import('./types').Action} Action
 * @typedef {import('./types').IAgentRuntime} IAgentRuntime
 * @typedef {import('./types').NoteContent} NoteContent
 * @typedef {import('./types').State} State
 * @typedef {import('./types').Memory} Memory
 * @typedef {import('./types').HandlerCallback} HandlerCallback
 * @typedef {import('./Obsidian').Obsidian} Obsidian
 * 
 * @type {Action} getActiveNoteAction
 */
export const getActiveNoteAction: Action = {
    name: "GET_ACTIVE_NOTE",
    similes: [
        "FETCH_ACTIVE_NOTE",
        "READ_ACTIVE_NOTE",
        "CURRENT_NOTE",
        "ACTIVE_NOTE",
        "OPENED_NOTE",
        "CURRENT_FILE",
    ],
    description:
        "Retrieve and display the content of the currently active note in Obsidian",
    validate: async (runtime: IAgentRuntime) => {
        try {
            const obsidian = await getObsidian(runtime);
            await obsidian.connect();
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
        elizaLogger.info("Starting get active note handler");
        const obsidian = await getObsidian(runtime);

        try {
            elizaLogger.info("Fetching active note content");
            const noteContent: NoteContent = await obsidian.getActiveNote();

            elizaLogger.info(
                `Successfully retrieved active note: ${noteContent.path}`
            );

            if (callback) {
                callback({
                    text: noteContent.content,
                    metadata: {
                        path: noteContent.path,
                    },
                });
            }
            return true;
        } catch (error) {
            elizaLogger.error("Error getting active note:", error);
            if (callback) {
                callback({
                    text: `Error retrieving active note: ${error.message}`,
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
                    text: "What's in my current note?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "GET_ACTIVE_NOTE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me the active note",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "GET_ACTIVE_NOTE",
                },
            },
        ],
    ],
};

/**
 * Action to generate a focused summary of the currently active note in Obsidian.
 * @type {Action}
 * @property {string} name - The name of the action.
 * @property {string[]} similes - Possible alternative names for the action.
 * @property {string} description - Description of the action.
 * @property {Function} validate - Asynchronous function to validate the Obsidian connection.
 * @property {Function} handler - Asynchronous function to handle the action of summarizing the active note.
 * @property {Object[]} examples - Array of example objects demonstrating the usage of this action.
 */
export const summarizeActiveNoteAction: Action = {
    name: "SUMMARIZE_ACTIVE_NOTE",
    similes: [
        "SUMMARIZE_ACTIVE_NOTE",
        "SUMMARIZE_CURRENT_NOTE",
        "SUMMARIZE_OPEN_NOTE",
    ],
    description:
        "Generate a focused summary of the currently active note in Obsidian",
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
        elizaLogger.info("Starting summarize active note handler");
        const obsidian = await getObsidian(runtime);

        try {
            elizaLogger.info("Fetching active note content");
            const noteContent: NoteContent = await obsidian.getActiveNote();

            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }
            const chunkSize = 6500;

            const chunks = await splitChunks(noteContent.content, chunkSize, 0);
            let currentSummary = "";

            elizaLogger.info("Composing summary context");
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                state.currentSummary = currentSummary;
                state.currentChunk = chunk;

                const activeNoteTemplate = await trimTokens(
                    baseSummaryTemplate,
                    chunkSize,
                    runtime
                );

                const context = composeContext({
                    state,
                    template: activeNoteTemplate,
                });
                const summary = await generateText({
                    runtime,
                    context,
                    modelClass: ModelClass.MEDIUM,
                });

                currentSummary = currentSummary + "\n" + summary;
            }
            if (!currentSummary) {
                elizaLogger.error("Error: No summary found");
                return false;
            }
            if (callback) {
                if (
                    currentSummary.trim()?.split("\n").length < 4 ||
                    currentSummary.trim()?.split(" ").length < 100
                ) {
                    callback({
                        text: `Here is the summary:\n\`\`\`md\n${currentSummary.trim()}\n\`\`\``,
                        metadata: {
                            path: noteContent.path,
                        },
                    });
                } else {
                    callback({
                        text: currentSummary.trim(),
                        metadata: {
                            path: noteContent.path,
                        },
                    });
                }
            }
            return true;
        } catch (error) {
            elizaLogger.error("Error summarizing active note:", error);
            if (callback) {
                callback({
                    text: `Error summarizing active note: ${error.message}`,
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
                    text: "Summarize my current note",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "SUMMARIZE_ACTIVE_NOTE",
                },
            },
        ],
    ],
};
