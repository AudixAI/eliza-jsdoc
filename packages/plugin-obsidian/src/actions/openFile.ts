import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass
} from "@elizaos/core";
import { fileSchema, isValidFile } from "../types";
import { getObsidian } from "../helper";
import { fileTemplate } from "../templates/file";

/**
 * Action to open a file in the Obsidian interface.
 * - Name: OPEN_FILE
 * - Similes: OPEN, LAUNCH_FILE, DISPLAY_FILE, SHOW_FILE, VIEW_FILE
 * - Description: Open a file in the Obsidian interface. Use format: 'Open FOLDER/SUBFOLDER/filename'
 * * @typedef { Object } Action
 * @property { string } name - The name of the action
 * @property {string[]} similes - The similar actions
 * @property { string } description - The description of the action
 * @property { Function } validate - Asynchronous function to validate the connection to Obsidian
 * @param { IAgentRuntime } runtime - The agent runtime interface
 * @returns {Promise<boolean>}
 * @property { Function } handler - Asynchronous function to handle opening a file in Obsidian
 * @param { IAgentRuntime } runtime - The agent runtime interface
 * @param { Memory } message - The message object
 * @param { State } state - The state object
 * @param { any } options - Additional options
 * @param { HandlerCallback } [callback] - Optional callback function
 * @returns {Promise<boolean>}
 * @property {Object[]} examples - Array of example input-output pairs
 */
export const openFileAction: Action = {
    name: "OPEN_FILE",
    similes: [
        "OPEN",
        "LAUNCH_FILE",
        "DISPLAY_FILE",
        "SHOW_FILE",
        "VIEW_FILE"
    ],
    description:
        "Open a file in the Obsidian interface. Use format: 'Open FOLDER/SUBFOLDER/filename'",
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
        elizaLogger.info("Starting open file handler");
        const obsidian = await getObsidian(runtime);

        try {
            // Initialize or update state for context generation
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const context = composeContext({
                state,
                template: fileTemplate(message.content.text),
            });

            const fileContext = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.MEDIUM,
                schema: fileSchema,
                stop: ["\n"]
            }) as any;

            if (!isValidFile(fileContext.object)) {
                elizaLogger.error(
                    "Invalid file path. Format: 'Open FOLDER/SUBFOLDER/filename' - ",
                    fileContext.object
                );

                if (callback) {
                    callback({
                        text: `Invalid file path. Format: 'Open FOLDER/SUBFOLDER/filename' - ${fileContext.object}`,
                        error: true,
                    });
                }
                return false;
            }

            const { path } = fileContext.object;

            elizaLogger.info(`Opening file at path: ${path}`);
            await obsidian.openFile(path);
            elizaLogger.info(`Successfully opened file: ${path}`);

            if (callback) {
                callback({
                    text: `Successfully opened file: ${path}`,
                    metadata: {
                        path: path,
                        operation: "OPEN",
                        success: true
                    },
                });
            }
            return true;
        } catch (error) {
            elizaLogger.error("Error opening file:", error);
            if (callback) {
                callback({
                    text: `Error opening file: ${error.message}`,
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
                    text: "Open DOCUMENTS/report.txt",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "OPEN_FILE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show PROJECTS/src/config.json",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "{{responseData}}",
                    action: "OPEN_FILE",
                },
            },
        ],
    ],
};