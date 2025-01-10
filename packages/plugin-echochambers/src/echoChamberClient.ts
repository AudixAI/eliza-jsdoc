import { elizaLogger, IAgentRuntime } from "@elizaos/core";
import {
    ChatMessage,
    ChatRoom,
    EchoChamberConfig,
    ModelInfo,
    ListRoomsResponse,
    RoomHistoryResponse,
    MessageResponse,
} from "./types";

const MAX_RETRIES = 3;

const RETRY_DELAY = 5000;

/**
 * Class representing a client for interacting with the EchoChamber API.
 * @class
 */
export class EchoChamberClient {
    private runtime: IAgentRuntime;
    private config: EchoChamberConfig;
    private apiUrl: string;
    private modelInfo: ModelInfo;
    private pollInterval: NodeJS.Timeout | null = null;
    private watchedRoom: string | null = null;

/**
 * Constructor for EchoChamber class.
 * 
 * @param {IAgentRuntime} runtime - The Agent Runtime to use.
 * @param {EchoChamberConfig} config - The configuration object for EchoChamber.
 */
    constructor(runtime: IAgentRuntime, config: EchoChamberConfig) {
        this.runtime = runtime;
        this.config = config;
        this.apiUrl = `${config.apiUrl}/api/rooms`;
        this.modelInfo = {
            username: config.username || `agent-${runtime.agentId}`,
            model: config.model || runtime.modelProvider,
        };
    }

/**
 * Get the username from the model info.
 * @returns {string} The username from the model info.
 */
    public getUsername(): string {
        return this.modelInfo.username;
    }

/**
 * Retrieve information about the model.
 * @returns {ModelInfo} An object containing the model information.
 */ 

    public getModelInfo(): ModelInfo {
        return { ...this.modelInfo };
    }

/**
 * Returns a copy of the current configuration object.
 * 
 * @returns {EchoChamberConfig} A copy of the current configuration object.
 */
    public getConfig(): EchoChamberConfig {
        return { ...this.config };
    }

/**
 * Returns the authentication headers for the request.
 * @returns {Object} The authentication headers with keys as strings and values as strings.
 */
    private getAuthHeaders(): { [key: string]: string } {
        return {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
        };
    }

/**
 * Set the watched room for the user.
 * 
 * @param {string} roomId - The ID of the room to set as watched.
 * @returns {Promise<void>} - A Promise that resolves once the watched room is set.
 */
    public async setWatchedRoom(roomId: string): Promise<void> {
        try {
            // Verify room exists
            const rooms = await this.listRooms();
            const room = rooms.find((r) => r.id === roomId);

            if (!room) {
                throw new Error(`Room ${roomId} not found`);
            }

            // Set new watched room
            this.watchedRoom = roomId;

            elizaLogger.success(`Now watching room: ${room.name}`);
        } catch (error) {
            elizaLogger.error("Error setting watched room:", error);
            throw error;
        }
    }

/**
 * Retrieves the room that is currently being watched.
 * 
 * @returns The room that is being watched, or null if no room is being watched.
 */
    public getWatchedRoom(): string | null {
        return this.watchedRoom;
    }

/**
 * Retries the given asynchronous operation until it succeeds or the maximum number of retries is reached.
 * @template T
 * @param {() => Promise<T>} operation - The asynchronous operation to retry.
 * @param {number} retries - The maximum number of retries (default is MAX_RETRIES).
 * @returns {Promise<T>} - The result of the operation after successful completion.
 */
    private async retryOperation<T>(
        operation: () => Promise<T>,
        retries: number = MAX_RETRIES
    ): Promise<T> {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === retries - 1) throw error;
                const delay = RETRY_DELAY * Math.pow(2, i);
                elizaLogger.warn(`Retrying operation in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error("Max retries exceeded");
    }

/**
 * Asynchronous function to start the EchoChamber client.
 * 
 * @returns {Promise<void>} A Promise that resolves when the client is started.
 */
    public async start(): Promise<void> {
        elizaLogger.log("🚀 Starting EchoChamber client...");
        try {
            // Verify connection by listing rooms
            await this.retryOperation(() => this.listRooms());
            elizaLogger.success(
                `✅ EchoChamber client successfully started for ${this.modelInfo.username}`
            );

            // Join default room if specified and no specific room is being watched
            if (this.config.defaultRoom && !this.watchedRoom) {
                await this.setWatchedRoom(this.config.defaultRoom);
            }
        } catch (error) {
            elizaLogger.error("❌ Failed to start EchoChamber client:", error);
            throw error;
        }
    }

/**
 * Stops the EchoChamber client by clearing the polling interval and leaving the watched room if any.
 * 
 * @returns {Promise<void>} A Promise that resolves once the client is stopped.
 */
    public async stop(): Promise<void> {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        // Leave watched room if any
        if (this.watchedRoom) {
            try {
                this.watchedRoom = null;
            } catch (error) {
                elizaLogger.error(
                    `Error leaving room ${this.watchedRoom}:`,
                    error
                );
            }
        }

        elizaLogger.log("Stopping EchoChamber client...");
    }

/**
 * Retrieves a list of chat rooms based on the provided tags.
 * 
 * @param {string[]} [tags] - Optional array of tags to filter the chat rooms by.
 * @returns {Promise<ChatRoom[]>} A Promise that resolves to an array of ChatRoom objects.
 */
    public async listRooms(tags?: string[]): Promise<ChatRoom[]> {
        try {
            const url = new URL(this.apiUrl);
            if (tags?.length) {
                url.searchParams.append("tags", tags.join(","));
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to list rooms: ${response.statusText}`);
            }

            const data = (await response.json()) as ListRoomsResponse;
            return data.rooms;
        } catch (error) {
            elizaLogger.error("Error listing rooms:", error);
            throw error;
        }
    }

/**
 * Retrieves the history of messages for a specific room.
 * @param {string} roomId - The ID of the room to retrieve history for.
 * @returns {Promise<ChatMessage[]>} A promise that resolves to an array of ChatMessage objects representing the room history.
 */
    public async getRoomHistory(roomId: string): Promise<ChatMessage[]> {
        return this.retryOperation(async () => {
            const response = await fetch(`${this.apiUrl}/${roomId}/history`);
            if (!response.ok) {
                throw new Error(
                    `Failed to get room history: ${response.statusText}`
                );
            }

            const data = (await response.json()) as RoomHistoryResponse;
            return data.messages;
        });
    }

/**
 * Sends a message to a specific chat room.
 * @param {string} roomId - The ID of the chat room where the message will be sent.
 * @param {string} content - The content of the message to be sent.
 * @returns {Promise<ChatMessage>} A promise that resolves with the ChatMessage object representing the sent message.
 */
    public async sendMessage(
        roomId: string,
        content: string
    ): Promise<ChatMessage> {
        return this.retryOperation(async () => {
            const response = await fetch(`${this.apiUrl}/${roomId}/message`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    content,
                    sender: this.modelInfo,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to send message: ${response.statusText}`
                );
            }

            const data = (await response.json()) as MessageResponse;
            return data.message;
        });
    }
}
