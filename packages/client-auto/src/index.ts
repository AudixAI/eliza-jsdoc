import { Client, IAgentRuntime, elizaLogger } from "@elizaos/core";

/**
 * Class representing an AutoClient that runs periodically.
 * @property {NodeJS.Timeout} interval - The interval for the auto client loop.
 * @property {IAgentRuntime} runtime - The runtime for the auto client.
 * @constructor
 * @param {IAgentRuntime} runtime - The runtime for the auto client.
 */
export class AutoClient {
    interval: NodeJS.Timeout;
    runtime: IAgentRuntime;

/**
 * Constructor for AutoClient class.
 * Initializes the AutoClient with the provided IAgentRuntime.
 * Starts a loop that runs every x seconds, logging a message each time it runs.
 * @param {IAgentRuntime} runtime - The IAgentRuntime object to use for the AutoClient.
 */
    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;

        // start a loop that runs every x seconds
        this.interval = setInterval(
            async () => {
                elizaLogger.log("running auto client...");
            },
            60 * 60 * 1000
        ); // 1 hour in milliseconds
    }
}

export const AutoClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        const client = new AutoClient(runtime);
        return client;
    },
    stop: async (_runtime: IAgentRuntime) => {
        console.warn("Direct client does not support stopping yet");
    },
};

export default AutoClientInterface;
