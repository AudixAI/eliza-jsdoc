/**
 * Interface representing information about a model.
 * @typedef {Object} ModelInfo
 * @property {string} username - Unique username for the model/agent
 * @property {string} model - Type/name of the model being used
 */
export interface ModelInfo {
    username: string; // Unique username for the model/agent
    model: string; // Type/name of the model being used
}

/**
 * Represents a chat message.
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message identifier
 * @property {string} content - Message content/text
 * @property {ModelInfo} sender - Information about who sent the message
 * @property {string} timestamp - ISO timestamp of when message was sent
 * @property {string} roomId - ID of the room this message belongs to
 */
export interface ChatMessage {
    id: string; // Unique message identifier
    content: string; // Message content/text
    sender: ModelInfo; // Information about who sent the message
    timestamp: string; // ISO timestamp of when message was sent
    roomId: string; // ID of the room this message belongs to
}

/**
 * Represents a chat room.
 * @interface
 * @property {string} id - Unique room identifier
 * @property {string} name - Display name of the room
 * @property {string} topic - Room's current topic/description
 * @property {string[]} tags - Tags associated with the room for categorization
 * @property {ModelInfo[]} participants - List of current room participants
 * @property {string} createdAt - ISO timestamp of room creation
 * @property {number} messageCount - Total number of messages in the room
 */
export interface ChatRoom {
    id: string; // Unique room identifier
    name: string; // Display name of the room
    topic: string; // Room's current topic/description
    tags: string[]; // Tags associated with the room for categorization
    participants: ModelInfo[]; // List of current room participants
    createdAt: string; // ISO timestamp of room creation
    messageCount: number; // Total number of messages in the room
}

/**
 * Interface for configuring the EchoChamber client.
 * @typedef {Object} EchoChamberConfig
 * @property {string} apiUrl - Base URL for the EchoChambers API
 * @property {string} apiKey - Required API key for authenticated endpoints
 * @property {string} [defaultRoom] - Optional default room to join on startup
 * @property {string} [username] - Optional custom username (defaults to agent-{agentId})
 * @property {string} [model] - Optional model name (defaults to runtime.modelProvider)
 */
export interface EchoChamberConfig {
    apiUrl: string; // Base URL for the EchoChambers API
    apiKey: string; // Required API key for authenticated endpoints
    defaultRoom?: string; // Optional default room to join on startup
    username?: string; // Optional custom username (defaults to agent-{agentId})
    model?: string; // Optional model name (defaults to runtime.modelProvider)
}

/**
 * Interface for the response when listing chat rooms.
 * @typedef {Object} ListRoomsResponse
 * @property {ChatRoom[]} rooms - Array of chat rooms
 */
export interface ListRoomsResponse {
    rooms: ChatRoom[];
}

/**
 * Interface for representing the response containing the history of a chat room.
 * @typedef {Object} RoomHistoryResponse
 * @property {ChatMessage[]} messages - Array of chat messages representing the history of the room.
 */
export interface RoomHistoryResponse {
    messages: ChatMessage[];
}

/**
 * Represents a response containing a chat message.
 * @typedef {Object} MessageResponse
 * @property {ChatMessage} message - The chat message included in the response.
 */
export interface MessageResponse {
    message: ChatMessage;
}

/**
 * Interface representing the response object when creating a room.
 * @typedef {object} CreateRoomResponse
 * @property {ChatRoom} room - The created chat room object.
 */
export interface CreateRoomResponse {
    room: ChatRoom;
}

/**
 * Interface for the response when clearing messages.
 * 
 * @typedef {Object} ClearMessagesResponse
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - The message associated with the response.
 */
export interface ClearMessagesResponse {
    success: boolean;
    message: string;
}

/**
 * Represents the possible events that can occur in a chat room.
 */
export enum RoomEvent {
    MESSAGE_CREATED = "message_created",
    ROOM_CREATED = "room_created",
    ROOM_UPDATED = "room_updated",
    ROOM_JOINED = "room_joined",
    ROOM_LEFT = "room_left",
}

/**
 * Interface representing a message transformer.
 * 
 * @interface
 */

export interface MessageTransformer {
    transformIncoming(content: string): Promise<string>;
    transformOutgoing?(content: string): Promise<string>;
}

/**
 * Interface for a content moderator service.
 */

export interface ContentModerator {
    validateContent(content: string): Promise<boolean>;
}
