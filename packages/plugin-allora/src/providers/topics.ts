import {
    elizaLogger,
    IAgentRuntime,
    Memory,
    Provider,
    State,
} from "@elizaos/core";
import NodeCache from "node-cache";
import { AlloraAPIClient, AlloraTopic, ChainSlug } from "@alloralabs/allora-sdk";

/**
 * Class representing a Topics Provider that implements the Provider interface.
 */
 
export class TopicsProvider implements Provider {
    private cache: NodeCache;

/**
 * Constructor for initializing the cache with a standard TTL of 30 minutes.
 */
    constructor() {
        this.cache = new NodeCache({ stdTTL: 30 * 60 }); // Cache TTL set to 30 minutes
    }

/**
 * Retrieves all Allora Network topics and formats them into a string.
 * @param {IAgentRuntime} runtime - The runtime information for the agent.
 * @param {Memory} _message - The message object.
 * @param {State} [_state] - Optional state object.
 * @returns {Promise<string | null>} - A string containing formatted information about all Allora Network topics.
 */
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        const alloraTopics = await this.getAlloraTopics(runtime);

        // Format the topics into a string to be added to the prompt context
        let output = `Allora Network Topics: \n`;
        for (const topic of alloraTopics) {
            output += `Topic Name: ${topic.topic_name}\n`;
            output += `Topic Description: ${topic.description}\n`;
            output += `Topic ID: ${topic.topic_id}\n`;
            output += `Topic is Active: ${topic.is_active}\n`;
            output += `Topic Updated At: ${topic.updated_at}\n`;
            output += `\n`;
        }

        return output;
    }

/**
 * Retrieves Allora topics either from cache or from the Allora API.
 * @param {IAgentRuntime} runtime - The runtime object used to access settings and services.
 * @returns {Promise<AlloraTopic[]>} - A promise that resolves to an array of Allora topics.
 */
    private async getAlloraTopics(
        runtime: IAgentRuntime
    ): Promise<AlloraTopic[]> {
        const cacheKey = "allora-topics";
        const cachedValue = this.cache.get<AlloraTopic[]>(cacheKey);

        // If the topics are aready cached, return them
        if (cachedValue) {
            elizaLogger.info("Retrieving Allora topics from cache");
            return cachedValue;
        }

        // If the topics are not cached, retrieve them from the Allora API
        const alloraApiKey = runtime.getSetting("ALLORA_API_KEY");
        const alloraChainSlug = runtime.getSetting("ALLORA_CHAIN_SLUG");

        const alloraApiClient = new AlloraAPIClient({
            chainSlug: alloraChainSlug as ChainSlug,
            apiKey: alloraApiKey as string,
        });
        const alloraTopics = await alloraApiClient.getAllTopics();

        // Cache the retrieved topics
        this.cache.set(cacheKey, alloraTopics);

        return alloraTopics;
    }
}

export const topicsProvider = new TopicsProvider();
