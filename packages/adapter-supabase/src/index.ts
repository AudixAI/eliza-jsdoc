import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
    type Memory,
    type Goal,
    type Relationship,
    Actor,
    GoalStatus,
    Account,
    type UUID,
    Participant,
    Room,
    RAGKnowledgeItem,
    elizaLogger
} from "@elizaos/core";
import { DatabaseAdapter } from "@elizaos/core";
import { v4 as uuid } from "uuid";
/**
 * Represents a database adapter for interacting with Supabase.
 * @extends DatabaseAdapter
 */
export class SupabaseDatabaseAdapter extends DatabaseAdapter {
/**
 * Retrieves the ID of a room from the database based on the provided room ID.
 * @param {UUID} roomId - The unique identifier of the room to retrieve.
 * @returns {Promise<UUID | null>} The ID of the room if found, otherwise null.
 */
    async getRoom(roomId: UUID): Promise<UUID | null> {
        const { data, error } = await this.supabase
            .from("rooms")
            .select("id")
            .eq("id", roomId)
            .single();

        if (error) {
            throw new Error(`Error getting room: ${error.message}`);
        }

        return data ? (data.id as UUID) : null;
    }

/**
 * Retrieves participants for a specific user account.
 *
 * @param {UUID} userId The unique identifier for the user account.
 * @returns {Promise<Participant[]>} A promise that resolves with an array of participants associated with the user account.
 * @throws {Error} Throws an error if there is an issue retrieving the participants from the database.
 */
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        const { data, error } = await this.supabase
            .from("participants")
            .select("*")
            .eq("userId", userId);

        if (error) {
            throw new Error(
                `Error getting participants for account: ${error.message}`
            );
        }

        return data as Participant[];
    }

/**
 * Retrieves the user state (FOLLOWED or MUTED) of a participant in a specific room.
 * @param {UUID} roomId - The ID of the room
 * @param {UUID} userId - The ID of the user
 * @returns {Promise<"FOLLOWED" | "MUTED" | null>} The user state of the participant in the specified room, or null if there was an error
 */
    async getParticipantUserState(
        roomId: UUID,
        userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null> {
        const { data, error } = await this.supabase
            .from("participants")
            .select("userState")
            .eq("roomId", roomId)
            .eq("userId", userId)
            .single();

        if (error) {
            console.error("Error getting participant user state:", error);
            return null;
        }

        return data?.userState as "FOLLOWED" | "MUTED" | null;
    }

/**
 * Updates the user state of a participant in a specific room.
 * @param {UUID} roomId - The ID of the room where the participant belongs.
 * @param {UUID} userId - The ID of the participant whose state will be updated.
 * @param {"FOLLOWED" | "MUTED" | null} state - The new state of the participant ('FOLLOWED', 'MUTED', or null).
 * @returns {Promise<void>} A Promise that resolves when the participant's user state is successfully updated.
 */
    async setParticipantUserState(
        roomId: UUID,
        userId: UUID,
        state: "FOLLOWED" | "MUTED" | null
    ): Promise<void> {
        const { error } = await this.supabase
            .from("participants")
            .update({ userState: state })
            .eq("roomId", roomId)
            .eq("userId", userId);

        if (error) {
            console.error("Error setting participant user state:", error);
            throw new Error("Failed to set participant user state");
        }
    }

/**
 * Retrieves the list of participant IDs for a specific room.
 *
 * @param {UUID} roomId - The ID of the room to retrieve participants for.
 * @returns {Promise<UUID[]>} An array of participant IDs.
 * @throws {Error} If there is an error fetching the participants.
 */
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        const { data, error } = await this.supabase
            .from("participants")
            .select("userId")
            .eq("roomId", roomId);

        if (error) {
            throw new Error(
                `Error getting participants for room: ${error.message}`
            );
        }

        return data.map((row) => row.userId as UUID);
    }

    supabase: SupabaseClient;

/**
 * Create a new instance of the Supabase client.
 * @param {string} supabaseUrl - The base URL of the Supabase project.
 * @param {string} supabaseKey - The API key for accessing the Supabase project.
 */
    constructor(supabaseUrl: string, supabaseKey: string) {
        super();
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

/**
 * Asynchronous method to initialize the class.
 */
    async init() {
        // noop
    }

/**
 * Asynchronous function to close the operation.
 * This function performs no operation (noop).
 */
    async close() {
        // noop
    }

/**
 * Retrieves memories based on specified room IDs and optional agent ID from a given table
 * @param {Object} params - The parameters for the query
 * @param {UUID[]} params.roomIds - The IDs of the rooms to retrieve memories for
 * @param {UUID} [params.agentId] - The optional agent ID to filter memories by
 * @param {string} params.tableName - The name of the table where the memories are stored
 * @returns {Promise<Memory[]>} A promise that resolves to an array of memories that match the criteria
 */
    async getMemoriesByRoomIds(params: {
        roomIds: UUID[];
        agentId?: UUID;
        tableName: string;
    }): Promise<Memory[]> {
        let query = this.supabase
            .from(params.tableName)
            .select("*")
            .in("roomId", params.roomIds);

        if (params.agentId) {
            query = query.eq("agentId", params.agentId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error retrieving memories by room IDs:", error);
            return [];
        }

        // map createdAt to Date
        const memories = data.map((memory) => ({
            ...memory,
        }));

        return memories as Memory[];
    }

/**
 * Asynchronously retrieves an account from the database by its ID.
 * @param {UUID} userId - The ID of the account to retrieve.
 * @returns {Promise<Account | null>} The account object if found, or null if no account is found.
 */
    async getAccountById(userId: UUID): Promise<Account | null> {
        const { data, error } = await this.supabase
            .from("accounts")
            .select("*")
            .eq("id", userId);
        if (error) {
            throw new Error(error.message);
        }
        return (data?.[0] as Account) || null;
    }

/**
 * Creates a new account in the database.
 * 
 * @param {Account} account - The account object to be created.
 * @return {Promise<boolean>} - A promise that resolves to a boolean value indicating the success of the operation.
 */
    async createAccount(account: Account): Promise<boolean> {
        const { error } = await this.supabase
            .from("accounts")
            .upsert([account]);
        if (error) {
            console.error(error.message);
            return false;
        }
        return true;
    }

/**
 * Retrieves details of actors associated with a specific room.
 * @param {Object} params - The parameters for the query.
 * @param {UUID} params.roomId - The ID of the room to get actor details from.
 * @returns {Promise<Actor[]>} - A promise that resolves to an array of Actor objects containing name, details, ID, and username.
 */
    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        try {
            const response = await this.supabase
                .from("rooms")
                .select(
                    `
          participants:participants(
            account:accounts(id, name, username, details)
          )
      `
                )
                .eq("id", params.roomId);

            if (response.error) {
                console.error("Error!" + response.error);
                return [];
            }
            const { data } = response;

            return data
                .map((room) =>
                    room.participants.map((participant) => {
                        const user = participant.account as unknown as Actor;
                        return {
                            name: user?.name,
                            details: user?.details,
                            id: user?.id,
                            username: user?.username,
                        };
                    })
                )
                .flat();
        } catch (error) {
            console.error("error", error);
            throw error;
        }
    }

/**
 * Asynchronously search for memories based on the specified parameters.
 * 
 * @param {Object} params - The parameters for the search query.
 * @param {string} params.tableName - The name of the table to search memories in.
 * @param {UUID} params.roomId - The ID of the room to search memories in.
 * @param {number[]} params.embedding - The embedding vector used for matching memories.
 * @param {number} params.match_threshold - The match threshold for similarity.
 * @param {number} params.match_count - The number of matches to retrieve.
 * @param {boolean} params.unique - Flag to indicate if only unique memories should be retrieved.
 * @returns {Promise<Memory[]>} - A Promise that resolves with an array of Memory objects that match the criteria.
 */
    async searchMemories(params: {
        tableName: string;
        roomId: UUID;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]> {
        const result = await this.supabase.rpc("search_memories", {
            query_table_name: params.tableName,
            query_roomId: params.roomId,
            query_embedding: params.embedding,
            query_match_threshold: params.match_threshold,
            query_match_count: params.match_count,
            query_unique: params.unique,
        });
        if (result.error) {
            throw new Error(JSON.stringify(result.error));
        }
        return result.data.map((memory) => ({
            ...memory,
        }));
    }

/**
 * Asynchronously retrieves cached embeddings based on the given options.
 * 
 * @param {Object} opts - The options for fetching cached embeddings.
 * @param {string} opts.query_table_name - The name of the table to query.
 * @param {number} opts.query_threshold - The threshold for the query.
 * @param {string} opts.query_input - The input for the query.
 * @param {string} opts.query_field_name - The name of the field for the query.
 * @param {string} opts.query_field_sub_name - The sub-name of the field for the query.
 * @param {number} opts.query_match_count - The match count for the query.
 * @returns {Promise<{ embedding: number[]; levenshtein_score: number; }[]>} The list of embeddings with their respective Levenshtein scores.
 */
    async getCachedEmbeddings(opts: {
        query_table_name: string;
        query_threshold: number;
        query_input: string;
        query_field_name: string;
        query_field_sub_name: string;
        query_match_count: number;
    }): Promise<
        {
            embedding: number[];
            levenshtein_score: number;
        }[]
    > {
        const result = await this.supabase.rpc("get_embedding_list", opts);
        if (result.error) {
            throw new Error(JSON.stringify(result.error));
        }
        return result.data;
    }

/**
 * Update the status of a goal in the database
 * @param {Object} params - The parameters for updating the goal status
 * @param {string} params.goalId - The UUID of the goal to update
 * @param {string} params.status - The new status of the goal
 * @returns {Promise<void>} - A Promise that resolves when the update is complete
 */ 
    async updateGoalStatus(params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void> {
        await this.supabase
            .from("goals")
            .update({ status: params.status })
            .match({ id: params.goalId });
    }

/**
 * Asynchronously inserts a log entry into the "logs" table in the Supabase database.
 * @param {Object} params - The parameters for the log entry.
 * @param {Object} params.body - The body of the log entry.
 * @param {string} params.userId - The user ID associated with the log entry.
 * @param {string} params.roomId - The room ID associated with the log entry.
 * @param {string} params.type - The type of the log entry.
 * @returns {Promise<void>} - A Promise that resolves when the log entry is successfully inserted.
 */
    async log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        const { error } = await this.supabase.from("logs").insert({
            body: params.body,
            userId: params.userId,
            roomId: params.roomId,
            type: params.type,
        });

        if (error) {
            console.error("Error inserting log:", error);
            throw new Error(error.message);
        }
    }

/**
 * Retrieves memories based on the given parameters.
 * 
 * @param {Object} params - The parameters object
 * @param {UUID} params.roomId - The UUID of the room to retrieve memories for
 * @param {number} [params.count] - The number of memories to retrieve
 * @param {boolean} [params.unique] - Flag to retrieve only unique memories
 * @param {string} params.tableName - The name of the table to retrieve memories from
 * @param {UUID} [params.agentId] - The UUID of the agent to filter memories by
 * @param {number} [params.start] - The start timestamp to filter memories by
 * @param {number} [params.end] - The end timestamp to filter memories by
 * @returns {Promise<Memory[]>} - An array of Memory objects that match the parameters
 */
    async getMemories(params: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
        agentId?: UUID;
        start?: number;
        end?: number;
    }): Promise<Memory[]> {
        const query = this.supabase
            .from(params.tableName)
            .select("*")
            .eq("roomId", params.roomId);

        if (params.start) {
            query.gte("createdAt", params.start);
        }

        if (params.end) {
            query.lte("createdAt", params.end);
        }

        if (params.unique) {
            query.eq("unique", true);
        }

        if (params.agentId) {
            query.eq("agentId", params.agentId);
        }

        query.order("createdAt", { ascending: false });

        if (params.count) {
            query.limit(params.count);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Error retrieving memories: ${error.message}`);
        }

        return data as Memory[];
    }

/**
 * Search for memories by embedding and additional parameters.
 * 
 * @param {number[]} embedding The embedding to search for.
 * @param {object} params The additional parameters for the search.
 * @param {number} [params.match_threshold] The threshold for matching the embedding.
 * @param {number} [params.count] The number of memories to return.
 * @param {UUID} [params.roomId] The ID of the room to search in.
 * @param {UUID} [params.agentId] The ID of the agent to search for memories.
 * @param {boolean} [params.unique] Flag to indicate if only unique memories should be returned.
 * @param {string} params.tableName The name of the table to search in.
 * @returns {Promise<Memory[]>} A promise that resolves to an array of memories matching the search criteria.
 */
    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            agentId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        const queryParams = {
            query_table_name: params.tableName,
            query_roomId: params.roomId,
            query_embedding: embedding,
            query_match_threshold: params.match_threshold,
            query_match_count: params.count,
            query_unique: !!params.unique,
        };
        if (params.agentId) {
            (queryParams as any).query_agentId = params.agentId;
        }

        const result = await this.supabase.rpc("search_memories", queryParams);
        if (result.error) {
            throw new Error(JSON.stringify(result.error));
        }
        return result.data.map((memory) => ({
            ...memory,
        }));
    }

/**
 * Retrieves a memory from the database by its ID.
 * 
 * @param {UUID} memoryId - The ID of the memory to retrieve.
 * @returns {Promise<Memory | null>} - A Promise that resolves with the retrieved memory object, or null if an error occurred.
 */
    async getMemoryById(memoryId: UUID): Promise<Memory | null> {
        const { data, error } = await this.supabase
            .from("memories")
            .select("*")
            .eq("id", memoryId)
            .single();

        if (error) {
            console.error("Error retrieving memory by ID:", error);
            return null;
        }

        return data as Memory;
    }

/**
 * Creates a memory entry in the database.
 * 
 * @param {Memory} memory - The memory object to be created.
 * @param {string} tableName - The name of the table where the memory will be stored.
 * @param {boolean} [unique=false] - Flag indicating if the memory should be checked for uniqueness before creation.
 * @returns {Promise<void>} A promise that resolves once the memory is successfully created in the database.
 */
    async createMemory(
        memory: Memory,
        tableName: string,
        unique = false
    ): Promise<void> {
        const createdAt = memory.createdAt ?? Date.now();
        if (unique) {
            const opts = {
                // TODO: Add ID option, optionally
                query_table_name: tableName,
                query_userId: memory.userId,
                query_content: memory.content.text,
                query_roomId: memory.roomId,
                query_embedding: memory.embedding,
                query_createdAt: createdAt,
                similarity_threshold: 0.95,
            };

            const result = await this.supabase.rpc(
                "check_similarity_and_insert",
                opts
            );

            if (result.error) {
                throw new Error(JSON.stringify(result.error));
            }
        } else {
            const result = await this.supabase
                .from("memories")
                .insert({ ...memory, createdAt, type: tableName });
            const { error } = result;
            if (error) {
                throw new Error(JSON.stringify(error));
            }
        }
    }

/**
 * Removes a memory with the specified ID from the database using Supabase.
 * 
 * @param {string} memoryId - The ID of the memory to be removed.
 * @returns {Promise<void>} - A promise that resolves once the memory is successfully removed.
 * @throws {Error} - If there is an error during the deletion process, an error is thrown with details.
 */
    async removeMemory(memoryId: UUID): Promise<void> {
        const result = await this.supabase
            .from("memories")
            .delete()
            .eq("id", memoryId);
        const { error } = result;
        if (error) {
            throw new Error(JSON.stringify(error));
        }
    }

/**
 * Remove all memories associated with a specific room from a given table.
 * 
 * @param {UUID} roomId - The ID of the room for which memories will be removed.
 * @param {string} tableName - The name of the table where memories will be removed.
 * @returns {Promise<void>} - A Promise that resolves when all memories are removed successfully.
 * @throws {Error} - Throws an error if there is an issue removing memories.
 */
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        const result = await this.supabase.rpc("remove_memories", {
            query_table_name: tableName,
            query_roomId: roomId,
        });

        if (result.error) {
            throw new Error(JSON.stringify(result.error));
        }
    }

/**
 * Asynchronously counts the number of memories in a room based on the provided parameters.
 * 
 * @param {UUID} roomId - The UUID of the room for which memories are counted.
 * @param {boolean} [unique=true] - Flag to specify whether only unique memories should be counted. Defaults to true.
 * @param {string} tableName - The name of the table where memories are stored.
 * @returns {Promise<number>} - A Promise that resolves to the number of memories counted.
 * @throws {Error} If tableName is not provided or if there is an error during the counting process.
 */
    async countMemories(
        roomId: UUID,
        unique = true,
        tableName: string
    ): Promise<number> {
        if (!tableName) {
            throw new Error("tableName is required");
        }
        const query = {
            query_table_name: tableName,
            query_roomId: roomId,
            query_unique: !!unique,
        };
        const result = await this.supabase.rpc("count_memories", query);

        if (result.error) {
            throw new Error(JSON.stringify(result.error));
        }

        return result.data;
    }

/**
 * Asynchronously retrieves goals based on specified parameters.
 *
 * @param {Object} params - Object containing parameters
 * @param {UUID} params.roomId - The UUID of the room
 * @param {UUID} [params.userId] - Optional UUID of the user
 * @param {boolean} [params.onlyInProgress] - Indicates if only in-progress goals should be returned
 * @param {number} [params.count] - Number of goals to retrieve
 * @returns {Promise<Goal[]>} - A promise that resolves to an array of Goal objects
 */
    async getGoals(params: {
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        const opts = {
            query_roomId: params.roomId,
            query_userId: params.userId,
            only_in_progress: params.onlyInProgress,
            row_count: params.count,
        };

        const { data: goals, error } = await this.supabase.rpc(
            "get_goals",
            opts
        );

        if (error) {
            throw new Error(error.message);
        }

        return goals;
    }

/**
 * Asynchronously updates a goal in the "goals" table of Supabase.
 * 
 * @param {Goal} goal - The goal object to be updated.
 * @returns {Promise<void>} A promise that resolves when the update is successful or rejects with an error message.
 */
    async updateGoal(goal: Goal): Promise<void> {
        const { error } = await this.supabase
            .from("goals")
            .update(goal)
            .match({ id: goal.id });
        if (error) {
            throw new Error(`Error creating goal: ${error.message}`);
        }
    }

/**
 * Asynchronously creates a new goal in the 'goals' table.
 * 
 * @param {Goal} goal - The goal object to be inserted into the table.
 * @returns {Promise<void>} A promise that resolves once the goal is successfully created.
 * @throws {Error} If there is an error creating the goal, an error with a message will be thrown.
 */
    async createGoal(goal: Goal): Promise<void> {
        const { error } = await this.supabase.from("goals").insert(goal);
        if (error) {
            throw new Error(`Error creating goal: ${error.message}`);
        }
    }

/**
 * Removes a goal from the goals table in Supabase by the specified goal ID.
 * * @param { UUID } goalId - The ID of the goal to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the goal is successfully removed.
 * @throws { Error } - If there is an error removing the goal, an error with a message describing the issue is thrown.
 */
    async removeGoal(goalId: UUID): Promise<void> {
        const { error } = await this.supabase
            .from("goals")
            .delete()
            .eq("id", goalId);
        if (error) {
            throw new Error(`Error removing goal: ${error.message}`);
        }
    }

/**
 * Removes all goals associated with a specific room.
 *
 * @param {UUID} roomId - The unique identifier of the room to remove goals from.
 * @returns {Promise<void>} - A promise that resolves once all goals are successfully removed.
 * @throws {Error} - If there was an error while removing goals, an Error with the specific message will be thrown.
 */
    async removeAllGoals(roomId: UUID): Promise<void> {
        const { error } = await this.supabase
            .from("goals")
            .delete()
            .eq("roomId", roomId);
        if (error) {
            throw new Error(`Error removing goals: ${error.message}`);
        }
    }

/**
 * Asynchronously retrieves the list of room IDs associated with a specific participant based on their user ID.
 * 
 * @param {UUID} userId - The unique identifier of the participant whose room IDs are being retrieved
 * @returns {Promise<UUID[]>} - A Promise that resolves to an array of room IDs associated with the specified participant
 * @throws {Error} - If there is an error retrieving the rooms by participant, an Error will be thrown with a descriptive message
 */
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        const { data, error } = await this.supabase
            .from("participants")
            .select("roomId")
            .eq("userId", userId);

        if (error) {
            throw new Error(
                `Error getting rooms by participant: ${error.message}`
            );
        }

        return data.map((row) => row.roomId as UUID);
    }

/**
 * Retrieves rooms associated with the provided participants' user IDs from the participants table.
 * 
 * @param {UUID[]} userIds - An array of user IDs for participants to retrieve rooms for.
 * @returns {Promise<UUID[]>} - A Promise that resolves to an array of unique room IDs.
 * @throws {Error} - If there is an error retrieving rooms by participants.
 */
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        const { data, error } = await this.supabase
            .from("participants")
            .select("roomId")
            .in("userId", userIds);

        if (error) {
            throw new Error(
                `Error getting rooms by participants: ${error.message}`
            );
        }

        return [...new Set(data.map((row) => row.roomId as UUID))] as UUID[];
    }

/**
 * Asynchronously creates a new room with the given roomId or generates a new UUID if none is provided.
 * 
 * @param {UUID} [roomId] - The optional roomId of the room to be created.
 * @returns {Promise<UUID>} The UUID of the newly created room.
 * @throws {Error} If there is an error creating the room or no data is returned from the creation process.
 */
    async createRoom(roomId?: UUID): Promise<UUID> {
        roomId = roomId ?? (uuid() as UUID);
        const { data, error } = await this.supabase.rpc("create_room", {
            roomId,
        });

        if (error) {
            throw new Error(`Error creating room: ${error.message}`);
        }

        if (!data || data.length === 0) {
            throw new Error("No data returned from room creation");
        }

        return data[0].id as UUID;
    }

/**
 * Removes a room from the database.
 * 
 * @param {UUID} roomId - The ID of the room to be removed
 * @returns {Promise<void>} - A Promise that resolves once the room has been successfully removed
 */
    async removeRoom(roomId: UUID): Promise<void> {
        const { error } = await this.supabase
            .from("rooms")
            .delete()
            .eq("id", roomId);

        if (error) {
            throw new Error(`Error removing room: ${error.message}`);
        }
    }

/**
 * Add a participant to a room.
 * 
 * @param {UUID} userId - The ID of the user to be added as a participant.
 * @param {UUID} roomId - The ID of the room that the user will be added to.
 * @returns {Promise<boolean>} - A boolean value indicating if the participant was successfully added.
 */
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        const { error } = await this.supabase
            .from("participants")
            .insert({ userId: userId, roomId: roomId });

        if (error) {
            console.error(`Error adding participant: ${error.message}`);
            return false;
        }
        return true;
    }

/**
 * Removes a participant from a room.
 * 
 * @param {UUID} userId - The ID of the user to remove from the room.
 * @param {UUID} roomId - The ID of the room from which to remove the participant.
 * @returns {Promise<boolean>} - A boolean indicating whether the participant was successfully removed.
 */
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        const { error } = await this.supabase
            .from("participants")
            .delete()
            .eq("userId", userId)
            .eq("roomId", roomId);

        if (error) {
            console.error(`Error removing participant: ${error.message}`);
            return false;
        }
        return true;
    }

/**
 * Creates a relationship between two users by either creating a new room or using an existing room,
 * then inserts the users as participants in the room and updates their relationship status. 
 * 
 * @param {Object} params - The parameters for creating the relationship.
 * @param {UUID} params.userA - The UUID of the first user.
 * @param {UUID} params.userB - The UUID of the second user.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the relationship was successfully created.
 */
    async createRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<boolean> {
        const allRoomData = await this.getRoomsForParticipants([
            params.userA,
            params.userB,
        ]);

        let roomId: UUID;

        if (!allRoomData || allRoomData.length === 0) {
            // If no existing room is found, create a new room
            const { data: newRoomData, error: roomsError } = await this.supabase
                .from("rooms")
                .insert({})
                .single();

            if (roomsError) {
                throw new Error("Room creation error: " + roomsError.message);
            }

            roomId = (newRoomData as Room)?.id as UUID;
        } else {
            // If an existing room is found, use the first room's ID
            roomId = allRoomData[0];
        }

        const { error: participantsError } = await this.supabase
            .from("participants")
            .insert([
                { userId: params.userA, roomId },
                { userId: params.userB, roomId },
            ]);

        if (participantsError) {
            throw new Error(
                "Participants creation error: " + participantsError.message
            );
        }

        // Create or update the relationship between the two users
        const { error: relationshipError } = await this.supabase
            .from("relationships")
            .upsert({
                userA: params.userA,
                userB: params.userB,
                userId: params.userA,
                status: "FRIENDS",
            })
            .eq("userA", params.userA)
            .eq("userB", params.userB);

        if (relationshipError) {
            throw new Error(
                "Relationship creation error: " + relationshipError.message
            );
        }

        return true;
    }

/**
 * Asynchronously retrieves the relationship between two users based on their UUIDs.
 * 
 * @param {Object} params - The parameters for the relationship query.
 * @param {string} params.userA - The UUID of the first user.
 * @param {string} params.userB - The UUID of the second user.
 * 
 * @returns {Promise<Relationship | null>} The relationship object between the two users, or null if no relationship exists.
 */
    async getRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null> {
        const { data, error } = await this.supabase.rpc("get_relationship", {
            usera: params.userA,
            userb: params.userB,
        });

        if (error) {
            throw new Error(error.message);
        }

        return data[0];
    }

/**
 * Asynchronously retrieves relationships for a given user ID from the database.
 * 
 * @param {Object} params - The parameters for this operation.
 * @param {UUID} params.userId - The ID of the user to get relationships for.
 * @returns {Promise<Relationship[]>} A promise that resolves to an array of Relationship objects.
 * @throws {Error} If there is an error retrieving the relationships.
 */
    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        const { data, error } = await this.supabase
            .from("relationships")
            .select("*")
            .or(`userA.eq.${params.userId},userB.eq.${params.userId}`)
            .eq("status", "FRIENDS");

        if (error) {
            throw new Error(error.message);
        }

        return data as Relationship[];
    }

/**
 * Retrieve a value from the cache table based on the provided key and agentId.
 * @param {Object} params - The parameters for fetching cache.
 * @param {string} params.key - The key used to identify the cached value.
 * @param {UUID} params.agentId - The unique identifier of the agent associated with the cached value.
 * @returns {Promise<string | undefined>} The cached value corresponding to the provided key and agentId, or undefined if an error occurs.
 */
    async getCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<string | undefined> {
        const { data, error } = await this.supabase
            .from('cache')
            .select('value')
            .eq('key', params.key)
            .eq('agentId', params.agentId)
            .single();

        if (error) {
            console.error('Error fetching cache:', error);
            return undefined;
        }

        return data?.value;
    }

/**
 * Set a value in the cache table.
 * 
 * @param {Object} params - The parameters for setting the cache value.
 * @param {string} params.key - The key of the cache value.
 * @param {UUID} params.agentId - The agent ID associated with the cache value.
 * @param {string} params.value - The value to be set in the cache.
 * @returns {Promise<boolean>} - A promise that resolves to true if the value was successfully set, and false if there was an error.
 */
    async setCache(params: {
        key: string;
        agentId: UUID;
        value: string;
    }): Promise<boolean> {
        const { error } = await this.supabase
            .from('cache')
            .upsert({
                key: params.key,
                agentId: params.agentId,
                value: params.value,
                createdAt: new Date()
            });

        if (error) {
            console.error('Error setting cache:', error);
            return false;
        }

        return true;
    }

/**
 * Asynchronously deletes a cache entry from the database.
 * 
 * @param {Object} params - The parameters for deleting the cache entry.
 * @param {string} params.key - The key of the cache entry to be deleted.
 * @param {UUID} params.agentId - The agentId associated with the cache entry.
 * @returns {Promise<boolean>} A promise that resolves to true if the cache entry is successfully deleted, false otherwise.
 */
    async deleteCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('cache')
                .delete()
                .eq('key', params.key)
                .eq('agentId', params.agentId);

            if (error) {
                elizaLogger.error("Error deleting cache", {
                    error: error.message,
                    key: params.key,
                    agentId: params.agentId,
                });
                return false;
            }
            return true;
        } catch (error) {
            elizaLogger.error(
                "Database connection error in deleteCache",
                error instanceof Error ? error.message : String(error)
            );
            return false;
        }
    }

/**
 * Get knowledge items based on the specified parameters.
 * 
 * @param {Object} params - The parameters for fetching knowledge items.
 * @param {UUID} [params.id] - The optional ID of the knowledge item to retrieve.
 * @param {UUID} params.agentId - The ID of the agent for which knowledge items are retrieved.
 * @param {number} [params.limit] - The optional limit of knowledge items to retrieve.
 * @param {string} [params.query] - The optional query string for filtering knowledge items.
 * @returns {Promise<RAGKnowledgeItem[]>} - A promise that resolves with an array of RAGKnowledgeItem objects.
 */
    async getKnowledge(params: {
        id?: UUID;
        agentId: UUID;
        limit?: number;
        query?: string;
    }): Promise<RAGKnowledgeItem[]> {
        let query = this.supabase
            .from('knowledge')
            .select('*')
            .or(`agentId.eq.${params.agentId},isShared.eq.true`);

        if (params.id) {
            query = query.eq('id', params.id);
        }

        if (params.limit) {
            query = query.limit(params.limit);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Error getting knowledge: ${error.message}`);
        }

        return data.map(row => ({
            id: row.id,
            agentId: row.agentId,
            content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
            embedding: row.embedding ? new Float32Array(row.embedding) : undefined,
            createdAt: new Date(row.createdAt).getTime()
        }));
    }

/**
 * Search for knowledge items based on the provided parameters.
 * 
 * @param {Object} params - The search parameters.
 * @param {UUID} params.agentId - The ID of the agent.
 * @param {Float32Array} params.embedding - The embedding data for the search.
 * @param {number} params.match_threshold - The threshold for the match.
 * @param {number} params.match_count - The number of matches to retrieve.
 * @param {string=} params.searchText - The optional search text.
 * @returns {Promise<RAGKnowledgeItem[]>} - A promise that resolves to an array of RAGKnowledgeItem objects.
 */
    async searchKnowledge(params: {
        agentId: UUID;
        embedding: Float32Array;
        match_threshold: number;
        match_count: number;
        searchText?: string;
    }): Promise<RAGKnowledgeItem[]> {
        const cacheKey = `embedding_${params.agentId}_${params.searchText}`;
        const cachedResult = await this.getCache({
            key: cacheKey,
            agentId: params.agentId
        });

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        // Convert Float32Array to array for Postgres vector
        const embedding = Array.from(params.embedding);

        const { data, error } = await this.supabase.rpc('search_knowledge', {
            query_embedding: embedding,
            query_agent_id: params.agentId,
            match_threshold: params.match_threshold,
            match_count: params.match_count,
            search_text: params.searchText || ''
        });

        if (error) {
            throw new Error(`Error searching knowledge: ${error.message}`);
        }

        const results = data.map(row => ({
            id: row.id,
            agentId: row.agentId,
            content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
            embedding: row.embedding ? new Float32Array(row.embedding) : undefined,
            createdAt: new Date(row.createdAt).getTime(),
            similarity: row.similarity
        }));

        await this.setCache({
            key: cacheKey,
            agentId: params.agentId,
            value: JSON.stringify(results)
        });

        return results;
    }

/**
 * Asynchronously creates a knowledge item in the database.
 * 
 * @param {RAGKnowledgeItem} knowledge - The knowledge item to be created in the database.
 * @returns {Promise<void>} A Promise that resolves when the knowledge item is successfully created.
 */
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        try {
            const metadata = knowledge.content.metadata || {};

            const { error } = await this.supabase
                .from('knowledge')
                .insert({
                    id: knowledge.id,
                    agentId: metadata.isShared ? null : knowledge.agentId,
                    content: knowledge.content,
                    embedding: knowledge.embedding ? Array.from(knowledge.embedding) : null,
                    createdAt: knowledge.createdAt || new Date(),
                    isMain: metadata.isMain || false,
                    originalId: metadata.originalId || null,
                    chunkIndex: metadata.chunkIndex || null,
                    isShared: metadata.isShared || false
                });

            if (error) {
                if (metadata.isShared && error.code === '23505') { // Unique violation
                    elizaLogger.info(`Shared knowledge ${knowledge.id} already exists, skipping`);
                    return;
                }
                throw error;
            }
        } catch (error: any) {
            elizaLogger.error(`Error creating knowledge ${knowledge.id}:`, {
                error,
                embeddingLength: knowledge.embedding?.length,
                content: knowledge.content
            });
            throw error;
        }
    }

/**
 * Removes knowledge with the specified ID from the database.
 * 
 * @param {UUID} id - The ID of the knowledge to be removed.
 * @returns {Promise<void>} - A Promise that resolves once the knowledge has been successfully removed.
 * @throws {Error} - If an error occurs while removing the knowledge from the database.
 */
    async removeKnowledge(id: UUID): Promise<void> {
        const { error } = await this.supabase
            .from('knowledge')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error removing knowledge: ${error.message}`);
        }
    }

/**
 * Clear knowledge entries related to a specific agent.
 * 
 * @param {UUID} agentId - The ID of the agent to clear knowledge for.
 * @param {boolean} [shared] - Optional parameter to specify if shared knowledge should be cleared. Defaults to false.
 * @returns {Promise<void>} - A Promise that resolves once the knowledge entries are cleared.
 */
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        if (shared) {
            const { error } = await this.supabase
                .from('knowledge')
                .delete()
                .filter('agentId', 'eq', agentId)
                .filter('isShared', 'eq', true);

            if (error) {
                elizaLogger.error(`Error clearing shared knowledge for agent ${agentId}:`, error);
                throw error;
            }
        } else {
            const { error } = await this.supabase
                .from('knowledge')
                .delete()
                .eq('agentId', agentId);

            if (error) {
                elizaLogger.error(`Error clearing knowledge for agent ${agentId}:`, error);
                throw error;
            }
        }
    }
}
