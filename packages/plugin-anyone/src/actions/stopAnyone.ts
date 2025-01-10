import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { AnyoneClientService } from "../services/AnyoneClientService";
import { AnyoneProxyService } from "../services/AnyoneProxyService";

/**
 * Action to stop the Anyone client and proxy service.
 * 
 * @typedef {Object} Action
 * @property {string} name - The name of the action.
 * @property {string[]} similes - An array of similar actions.
 * @property {Function} validate - A function to validate the action.
 * @property {string} description - A description of the action.
 * @property {Function} handler - A function to handle the action logic.
 * @property {Object[][]} examples - An array of example interactions for the action.
 */
export const stopAnyone: Action = {
    name: "STOP_ANYONE",
    similes: ["STOP_PROXY"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "Stop the Anyone client and proxy service",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        _callback: HandlerCallback
    ): Promise<boolean> => {
        const proxyService = AnyoneProxyService.getInstance();
        proxyService.cleanup();

        await AnyoneClientService.stop();

        _callback({
            text: `Stopped Anyone and cleaned up proxy`,
        });

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Can you stop Anyone for me?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll stop Anyone right away",
                    action: "STOP_ANYONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Please shut down Anyone" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Stopping Anyone now",
                    action: "STOP_ANYONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "I need to stop using Anyone" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you stop Anyone",
                    action: "STOP_ANYONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Close Anyone for me" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll close Anyone for you now",
                    action: "STOP_ANYONE",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
