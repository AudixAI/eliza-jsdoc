import Redis from "ioredis";
import { IDatabaseCacheAdapter, UUID, elizaLogger } from "@elizaos/core";

/**
 * Represents a Redis client that implements the IDatabaseCacheAdapter interface.
 * @class
 */
export class RedisClient implements IDatabaseCacheAdapter {
    private client: Redis;

/**
 * Constructor for creating a new instance of a RedisManager.
 * @param {string} redisUrl - The URL of the Redis server.
 */
    constructor(redisUrl: string) {
        this.client = new Redis(redisUrl);

        this.client.on("connect", () => {
            elizaLogger.success("Connected to Redis");
        });

        this.client.on("error", (err) => {
            elizaLogger.error("Redis error:", err);
        });
    }

/**
 * Retrieves a value from the cache based on the provided agent ID and key.
 * 
 * @param {Object} params - The parameters for retrieving the cache value.
 * @param {UUID} params.agentId - The ID of the agent.
 * @param {string} params.key - The key for the cache value.
 * @returns {Promise<string | undefined>} The value from the cache, or undefined if not found.
 */
    async getCache(params: {
        agentId: UUID;
        key: string;
    }): Promise<string | undefined> {
        try {
            const redisKey = this.buildKey(params.agentId, params.key);
            const value = await this.client.get(redisKey);
            return value || undefined;
        } catch (err) {
            elizaLogger.error("Error getting cache:", err);
            return undefined;
        }
    }

/**
 * Async function to set a key-value pair in the cache.
 * 
 * @param {Object} params - The parameters required to set the cache.
 * @param {UUID} params.agentId - The unique identifier of the agent.
 * @param {string} params.key - The key to set in the cache.
 * @param {string} params.value - The value to associate with the key in the cache.
 * 
 * @return {Promise<boolean>} - A promise that resolves to a boolean value indicating if the cache was successfully set.
 */
    async setCache(params: {
        agentId: UUID;
        key: string;
        value: string;
    }): Promise<boolean> {
        try {
            const redisKey = this.buildKey(params.agentId, params.key);
            await this.client.set(redisKey, params.value);
            return true;
        } catch (err) {
            elizaLogger.error("Error setting cache:", err);
            return false;
        }
    }

/**
 * Asynchronously deletes a cache entry from Redis based on the provided agent ID and key.
 * 
 * @param {object} params - The parameters for deleting the cache entry.
 * @param {UUID} params.agentId - The ID of the agent associated with the cache entry.
 * @param {string} params.key - The key identifying the cache entry to be deleted.
 * @returns {Promise<boolean>} A promise that resolves to true if the cache entry is deleted successfully, or false otherwise.
 */
    async deleteCache(params: {
        agentId: UUID;
        key: string;
    }): Promise<boolean> {
        try {
            const redisKey = this.buildKey(params.agentId, params.key);
            const result = await this.client.del(redisKey);
            return result > 0;
        } catch (err) {
            elizaLogger.error("Error deleting cache:", err);
            return false;
        }
    }

/**
 * Disconnects from the Redis client.
 * 
 * @returns {Promise<void>} A promise that resolves once the disconnection is completed.
 */
    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            elizaLogger.success("Disconnected from Redis");
        } catch (err) {
            elizaLogger.error("Error disconnecting from Redis:", err);
        }
    }

/**
 * Constructs a unique key based on agentId and key
 * 
 * @param {UUID} agentId - The agent Id
 * @param {string} key - The key to be incorporated into the unique key
 * @returns {string} A unique key based on the provided agentId and key
 */
    private buildKey(agentId: UUID, key: string): string {
        return `${agentId}:${key}`; // Constructs a unique key based on agentId and key
    }
}

export default RedisClient;
