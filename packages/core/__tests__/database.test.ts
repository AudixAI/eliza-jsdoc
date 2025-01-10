/* eslint-disable no-dupe-class-members */
import { DatabaseAdapter } from "../src/database.ts";
import {
    Memory,
    Actor,
    Account,
    Goal,
    GoalStatus,
    Participant,
    Relationship,
    UUID,
} from "../src/types.ts";

/**
 * MockDatabaseAdapter class that extends DatabaseAdapter.
 * Contains methods for interacting with a mock database.
 */
class MockDatabaseAdapter extends DatabaseAdapter {
/**
 * Retrieves a memory by its ID.
 *
 * @param {_id: UUID} _id The unique identifier of the memory to retrieve.
 * @returns {Promise<Memory | null>} A promise that resolves to the retrieved memory, or null if not found.
 */
    getMemoryById(_id: UUID): Promise<Memory | null> {
        throw new Error("Method not implemented.");
    }
/**
 * Logs the specified parameters and throws an error indicating that the method is not implemented.
 * 
 * @param {object} _params - The parameters to be logged.
 * @param {object} _params.body - The body of the log entry.
 * @param {string} _params.userId - The user ID associated with the log entry.
 * @param {string} _params.roomId - The room ID associated with the log entry.
 * @param {string} _params.type - The type of log entry.
 * @returns {Promise<void>} - A promise that resolves when the logging is completed.
 */
    log(_params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieves details of actors in a specific room.
 * @param {Object} _params - The parameters object containing the room ID.
 * @param {string} _params.roomId - The ID of the room to retrieve actor details for.
 * @returns {Promise<Actor[]>} - A Promise that resolves to an array of Actor objects representing the details of the actors in the specified room.
 */
    getActorDetails(_params: { roomId: UUID }): Promise<Actor[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Search memories by embedding
 * @param {number[]} _embedding - The embedding to search for
 * @param {Object} _params - The parameters for the search
 * @param {number} [_params.match_threshold] - The threshold for matching
 * @param {number} [_params.count] - The number of memories to return
 * @param {UUID} [_params.roomId] - The room ID to search within
 * @param {UUID} [_params.agentId] - The agent ID to filter by
 * @param {boolean} [_params.unique] - Flag to return only unique memories
 * @param {string} _params.tableName - The name of the table to search in
 * @returns {Promise<Memory[]>} - A Promise that resolves to an array of Memory objects
 */
    searchMemoriesByEmbedding(
        _embedding: number[],
        _params: {
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            agentId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Creates a new memory in the specified table.
 * 
 * @param _memory The memory object to be created.
 * @param _tableName The name of the table where the memory will be created.
 * @param _unique Optional parameter indicating if the memory should be unique.
 * 
 * @returns A Promise that resolves once the memory is created.
 */
    createMemory(
        _memory: Memory,
        _tableName: string,
        _unique?: boolean
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Remove a memory with the specified ID from the specified table.
 * 
 * @param {_memoryId} UUID - The ID of the memory to be removed.
 * @param {_tableName} string - The name of the table from which the memory is to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the memory is successfully removed.
 */
    removeMemory(_memoryId: UUID, _tableName: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Removes all memories associated with a specific room.
 * 
 * @param {UUID} _roomId - The unique identifier of the room.
 * @param {string} _tableName - The name of the table storing the memories.
 * @returns {Promise<void>} A promise that resolves once all memories are removed.
 */
    removeAllMemories(_roomId: UUID, _tableName: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Count the number of memories in a specific room.
 * @param {UUID} _roomId - The ID of the room to count memories for.
 * @param {boolean} [_unique] - Specify if only unique memories should be counted.
 * @param {string} [_tableName] - The name of the table to query for the memories.
 * @returns {Promise<number>} - A promise that resolves to the number of memories counted.
 */
    countMemories(
        _roomId: UUID,
        _unique?: boolean,
        _tableName?: string
    ): Promise<number> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieve a list of goals based on the parameters provided.
 * * @param { Object } _params - The parameters for filtering the goals
 * @param { string } _params.roomId - The unique identifier of the room
 * @param { string } [_params.userId] - The unique identifier of the user (optional)
 * @param { boolean } [_params.onlyInProgress] - Flag to filter goals that are in progress only (optional)
 * @param { number } [_params.count] - The maximum number of goals to retrieve (optional)
 * @returns {Promise<Goal[]>} - A promise that resolves to an array of goals
 */
    getGoals(_params: {
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Updates the specified goal.
 * 
 * @param {Goal} _goal - The goal object to update.
 * @returns {Promise<void>} A promise that resolves when the goal has been successfully updated.
 * @throws {Error} Method not implemented error.
 */
    updateGoal(_goal: Goal): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Creates a new goal.
 * 
 * @param {Goal} _goal - The goal object to create.
 * @returns {Promise<void>} A Promise that resolves when the goal is created.
 */
    createGoal(_goal: Goal): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Removes a goal from the database.
 *
 * @param {UUID} _goalId - The ID of the goal to be removed.
 * @returns {Promise<void>}
 */
    removeGoal(_goalId: UUID): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Remove all goals for a specific room.
 * 
 * @param {UUID} _roomId - The unique identifier of the room
 * @returns {Promise<void>}
 */
    removeAllGoals(_roomId: UUID): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieve the UUID of a room using its ID.
 * 
 * @param {UUID} _roomId - The ID of the room to retrieve.
 * @returns {Promise<UUID | null>} - The UUID of the room, or null if not found.
 */
    getRoom(_roomId: UUID): Promise<UUID | null> {
        throw new Error("Method not implemented.");
    }
/**
 * Creates a new room with the provided room ID.
 * 
 * @param _roomId Optional UUID for the room ID
 * @returns Promise<UUID> A promise that resolves with the UUID of the created room
 */
    createRoom(_roomId?: UUID): Promise<UUID> {
        throw new Error("Method not implemented.");
    }
/**
 * Remove a room with the specified ID.
 * 
 * @param {UUID} _roomId - The ID of the room to remove.
 * @returns {Promise<void>} Promise that resolves once the room is removed.
 */
    removeRoom(_roomId: UUID): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieve the list of room UUIDs in which the specified user is a participant.
 *
 * @param {UUID} _userId - The user ID for which to get the rooms.
 * @returns {Promise<UUID[]>} - A promise that resolves with an array of room UUIDs.
 */
    getRoomsForParticipant(_userId: UUID): Promise<UUID[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieve the list of room IDs for the given participants.
 * @param {_userIds} Array of UUIDs representing the user IDs of the participants
 * @returns A Promise that resolves to an array of UUIDs representing the room IDs
 */
    getRoomsForParticipants(_userIds: UUID[]): Promise<UUID[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Adds a participant to a specific room.
 * 
 * @param {_userId} The UUID of the user to be added to the room.
 * @param {_roomId} The UUID of the room to add the user to.
 * @returns A Promise that resolves to a boolean value indicating if the participant was successfully added.
 */
    addParticipant(_userId: UUID, _roomId: UUID): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
/**
 * Removes a participant from a room.
 * 
 * @param {_userId} UUID - The unique identifier of the user to be removed from the room.
 * @param {_roomId} UUID - The unique identifier of the room from which the user will be removed.
 * @returns A Promise that resolves to a boolean indicating whether the participant was successfully removed.
 */
    removeParticipant(_userId: UUID, _roomId: UUID): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieve a list of participants associated with a specific user account.
 * 
 * @param {UUID} userId - The unique identifier of the user account
 * @returns {Promise<Participant[]>} - A Promise that resolves to an array of Participant objects
 */
    getParticipantsForAccount(userId: UUID): Promise<Participant[]>;
/**
 * Retrieve a list of participants for a specific user account.
 * @param {UUID} userId - The unique identifier of the user account.
 * @returns {Promise<Participant[]>} A promise that resolves with an array of Participant objects belonging to the user account.
 */
    getParticipantsForAccount(userId: UUID): Promise<Participant[]>;
/**
 * Retrieves participants for a specific account based on the user ID.
 * 
 * @param {unknown} _userId - The user ID used to fetch participants for the account.
 * @returns {Promise<import("../src/types.ts").Participant[]>} - A Promise that resolves to an array of Participant objects.
 */
    getParticipantsForAccount(
        _userId: unknown
    ): Promise<import("../src/types.ts").Participant[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieves the list of participants for a specified room.
 * 
 * @param {UUID} _roomId - The unique identifier of the room to retrieve participants for.
 * @returns {Promise<UUID[]>} - A promise that resolves to an array of UUIDs representing the participants in the room.
 */

    getParticipantsForRoom(_roomId: UUID): Promise<UUID[]> {
        throw new Error("Method not implemented.");
    }
/**
 * Retrieves the state of a participant user in a specific room.
 * @param {UUID} _roomId - The ID of the room.
 * @param {UUID} _userId - The ID of the user.
 * @returns {Promise<"FOLLOWED" | "MUTED" | null>} The state of the participant user: "FOLLOWED" if the user is followed, "MUTED" if the user is muted, or null if the state is unknown.
 */
    getParticipantUserState(
        _roomId: UUID,
        _userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null> {
        throw new Error("Method not implemented.");
    }
/**
 * Set the state of a specific participant in a room.
 * @param {UUID} _roomId - The ID of the room.
 * @param {UUID} _userId - The ID of the user/participant.
 * @param {"FOLLOWED" | "MUTED" | null} _state - The state to set for the participant (FOLLOWED, MUTED, or null).
 * @returns {Promise<void>} - A promise that resolves once the participant's state is set.
 */
    setParticipantUserState(
        _roomId: UUID,
        _userId: UUID,
        _state: "FOLLOWED" | "MUTED" | null
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
/**
 * Create a relationship between two users.
 *
 * @param {Object} _params - The parameters for creating relationship.
 * @param {UUID} _params.userA - The UUID of the first user.
 * @param {UUID} _params.userB - The UUID of the second user.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the relationship was created successfully.
 */
    createRelationship(_params: {
        userA: UUID;
        userB: UUID;
    }): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
/**
 * Method to retrieve the relationship between two users.
 * @param {Object} _params - The parameters for the query.
 * @param {string} _params.userA - The UUID of userA.
 * @param {string} _params.userB - The UUID of userB.
 * @returns {Promise<Relationship | null>} - The relationship between userA and userB, or null if no relationship found.
 */
    getRelationship(_params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null> {
        throw new Error("Method not implemented.");
    }
/**
* Retrieve all relationships for a given user ID.
*
* @param {Object} _params - The parameters for fetching relationships.
* @param {UUID} _params.userId - The user ID for which relationships are being fetched.
* @returns {Promise<Relationship[]>} - A promise that resolves to an array of Relationship objects.
* @throws {Error} - If the method is not implemented.
*/
    getRelationships(_params: { userId: UUID }): Promise<Relationship[]> {
        throw new Error("Method not implemented.");
    }
    db: any = {};

    // Mock method for getting memories by room IDs
/**
 * Retrieves memories by room IDs.
 * 
 * @param {Object} params - The parameters for retrieving memories.
 * @param {string[]} params.roomIds - The room IDs to filter memories by.
 * @param {string} [params.agentId] - The optional agent ID to filter memories by.
 * @param {string} params.tableName - The table name where memories are stored.
 * @returns {Promise<Memory[]>} - An array of memories that match the provided parameters.
 */
    async getMemoriesByRoomIds(params: {
        roomIds: `${string}-${string}-${string}-${string}-${string}`[];
        agentId?: `${string}-${string}-${string}-${string}-${string}`;
        tableName: string;
    }): Promise<Memory[]> {
        return [
            {
                id: "memory-id" as UUID,
                content: "Test Memory",
                roomId: params.roomIds[0],
                userId: "user-id" as UUID,
                agentId: params.agentId ?? ("agent-id" as UUID),
            },
        ] as unknown as Memory[];
    }

    // Mock method for getting cached embeddings
/**
 * Asynchronously retrieves cached embeddings based on the provided parameters
 * @param {object} _params - The parameters for the query
 * @param {string} _params.query_table_name - The name of the table to query
 * @param {number} _params.query_threshold - The threshold for the query
 * @param {string} _params.query_input - The input for the query
 * @param {string} _params.query_field_name - The name of the field to query
 * @param {string} _params.query_field_sub_name - The sub name of the field to query
 * @param {number} _params.query_match_count - The number of matches to return
 * @returns {Promise<any[]>} The array of objects containing the embedding and Levenshtein distance
 */
    async getCachedEmbeddings(_params: {
        query_table_name: string;
        query_threshold: number;
        query_input: string;
        query_field_name: string;
        query_field_sub_name: string;
        query_match_count: number;
    }): Promise<any[]> {
        return [
            {
                embedding: [0.1, 0.2, 0.3],
                levenshtein_distance: 0.4,
            },
        ];
    }

    // Mock method for searching memories
/**
 * Searches memories based on specified parameters.
 * @param {Object} params - The parameters for the search.
 * @param {string} params.tableName - The name of the table to search in.
 * @param {string} params.roomId - The unique room identifier in the format `${string}-${string}-${string}-${string}-${string}`.
 * @param {number[]} params.embedding - The embedding to match memories against.
 * @param {number} params.match_threshold - The threshold for a match to be considered valid.
 * @param {number} params.match_count - The number of matches to retrieve.
 * @param {boolean} params.unique - Flag indicating if only unique memories should be returned.
 * @returns {Promise<Memory[]>} The memories that match the search criteria.
 */
    async searchMemories(params: {
        tableName: string;
        roomId: `${string}-${string}-${string}-${string}-${string}`;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]> {
        return [
            {
                id: "memory-id" as UUID,
                content: "Test Memory",
                roomId: params.roomId,
                userId: "user-id" as UUID,
                agentId: "agent-id" as UUID,
            },
        ] as unknown as Memory[];
    }

    // Mock method for getting account by ID
/**
 * Retrieve an account by its user ID.
 * @param {UUID} userId - The unique identifier of the user account.
 * @returns {Promise<Account|null>} The account information if found, otherwise null.
 */
    async getAccountById(userId: UUID): Promise<Account | null> {
        return {
            id: userId,
            username: "testuser",
            name: "Test Account",
        } as Account;
    }

    // Other methods stay the same...
/**
 * Asynchronously creates a new account.
 * 
 * @param _account The account object to be created.
 * @returns A promise that resolves to a boolean indicating if the account was successfully created.
 */
    async createAccount(_account: Account): Promise<boolean> {
        return true;
    }

/**
 * Retrieve memories from a specific room based on provided parameters.
 *
 * @param {Object} params - The parameters for retrieving memories.
 * @param {UUID} params.roomId - The ID of the room to retrieve memories from.
 * @param {number} [params.count] - The maximum number of memories to retrieve.
 * @param {boolean} [params.unique] - Whether to retrieve unique memories.
 * @param {string} params.tableName - The name of the table containing memories.
 * @returns {Promise<Memory[]>} The memories retrieved based on the provided parameters.
 */
    async getMemories(params: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
    }): Promise<Memory[]> {
        return [
            {
                id: "memory-id" as UUID,
                content: "Test Memory",
                roomId: params.roomId,
                userId: "user-id" as UUID,
                agentId: "agent-id" as UUID,
            },
        ] as unknown as Memory[];
    }

/**
 * Asynchronously retrieves a list of actors based on the specified room ID.
 * 
 * @param {Object} _params - The parameters for the request.
 * @param {UUID} _params.roomId - The ID of the room to retrieve actors from.
 * @returns {Promise<Actor[]>} - A promise that resolves to an array of Actor objects.
 */
    async getActors(_params: { roomId: UUID }): Promise<Actor[]> {
        return [
            {
                id: "actor-id" as UUID,
                name: "Test Actor",
                username: "testactor",
                roomId: "room-id" as UUID, // Ensure roomId is provided
            },
        ] as unknown as Actor[];
    }

/**
 * Update the status of a goal.
 * @param {Object} _params - The parameters for updating the goal status.
 * @param {string} _params.goalId - The unique identifier of the goal.
 * @param {GoalStatus} _params.status - The new status to update the goal to.
 * @returns {Promise<void>} A promise that resolves once the goal status has been updated.
 */
    async updateGoalStatus(_params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void> {
        return Promise.resolve();
    }

/**
 * Retrieve a goal by its ID.
 * 
 * @param {UUID} goalId - The ID of the goal to retrieve.
 * @returns {Promise<Goal | null>} The retrieved goal, or null if no goal is found.
 */
    async getGoalById(goalId: UUID): Promise<Goal | null> {
        return {
            id: goalId,
            status: GoalStatus.IN_PROGRESS,
            roomId: "room-id" as UUID,
            userId: "user-id" as UUID,
            name: "Test Goal",
            objectives: [],
        } as Goal;
    }
}

// Now, let’s fix the test suite.

describe("DatabaseAdapter Tests", () => {
    let adapter: MockDatabaseAdapter;
    const roomId = "room-id" as UUID;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });

    it("should return memories by room ID", async () => {
        const memories = await adapter.getMemoriesByRoomIds({
            roomIds: [
                "room-id" as `${string}-${string}-${string}-${string}-${string}`,
            ],
            tableName: "test_table",
        });
        expect(memories).toHaveLength(1);
        expect(memories[0].roomId).toBe("room-id");
    });

    it("should return cached embeddings", async () => {
        const embeddings = await adapter.getCachedEmbeddings({
            query_table_name: "test_table",
            query_threshold: 0.5,
            query_input: "test query",
            query_field_name: "field",
            query_field_sub_name: "subfield",
            query_match_count: 5,
        });
        expect(embeddings).toHaveLength(1);
        expect(embeddings[0].embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it("should search memories based on embedding", async () => {
        const memories = await adapter.searchMemories({
            tableName: "test_table",
            roomId: "room-id" as `${string}-${string}-${string}-${string}-${string}`,
            embedding: [0.1, 0.2, 0.3],
            match_threshold: 0.5,
            match_count: 3,
            unique: true,
        });
        expect(memories).toHaveLength(1);
        expect(memories[0].roomId).toBe("room-id");
    });

    it("should get an account by user ID", async () => {
        const account = await adapter.getAccountById("test-user-id" as UUID);
        expect(account).not.toBeNull();
        expect(account.username).toBe("testuser");
    });

    it("should create a new account", async () => {
        const newAccount: Account = {
            id: "new-user-id" as UUID,
            username: "newuser",
            name: "New Account",
        };
        const result = await adapter.createAccount(newAccount);
        expect(result).toBe(true);
    });

    it("should update the goal status", async () => {
        const goalId = "goal-id" as UUID;
        await expect(
            adapter.updateGoalStatus({ goalId, status: GoalStatus.IN_PROGRESS })
        ).resolves.toBeUndefined();
    });

    it("should return actors by room ID", async () => {
        const actors = await adapter.getActors({ roomId });
        expect(actors).toHaveLength(1);
    });

    it("should get a goal by ID", async () => {
        const goalId = "goal-id" as UUID;
        const goal = await adapter.getGoalById(goalId);
        expect(goal).not.toBeNull();
        expect(goal?.status).toBe(GoalStatus.IN_PROGRESS);
    });
});
