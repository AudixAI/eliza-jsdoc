export * from "./sqliteTables.ts";
export * from "./sqlite_vec.ts";

import {
    DatabaseAdapter,
    elizaLogger,
    IDatabaseCacheAdapter,
} from "@elizaos/core";
import {
    Account,
    Actor,
    GoalStatus,
    Participant,
    type Goal,
    type Memory,
    type Relationship,
    type UUID,
    RAGKnowledgeItem,
} from "@elizaos/core";
import { Database } from "better-sqlite3";
import { v4 } from "uuid";
import { load } from "./sqlite_vec.ts";
import { sqliteTables } from "./sqliteTables.ts";

/**
 * Class representing a database adapter for SQLite databases.
 * Extends the DatabaseAdapter class and implements the IDatabaseCacheAdapter interface.
 * 
 * @extends DatabaseAdapter
 * @implements IDatabaseCacheAdapter
 */
export class SqliteDatabaseAdapter
    extends DatabaseAdapter<Database>
    implements IDatabaseCacheAdapter
{
/**
 * Retrieves the room ID based on the given room ID.
 * @param {UUID} roomId - The ID of the room to retrieve.
 * @returns {Promise<UUID | null>} The ID of the room if found, otherwise null.
 */
    async getRoom(roomId: UUID): Promise<UUID | null> {
        const sql = "SELECT id FROM rooms WHERE id = ?";
        const room = this.db.prepare(sql).get(roomId) as
            | { id: string }
            | undefined;
        return room ? (room.id as UUID) : null;
    }

/**
 * Retrieve participants for a specific user account from the database.
 * 
 * @param {UUID} userId - The unique identifier of the user account to retrieve participants for.
 * @returns {Promise<Participant[]>} - A promise that resolves to an array of Participant objects representing the participants associated with the user account.
 */
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        const sql = `
      SELECT p.id, p.userId, p.roomId, p.last_message_read
      FROM participants p
      WHERE p.userId = ?
    `;
        const rows = this.db.prepare(sql).all(userId) as Participant[];
        return rows;
    }

/**
 * Retrieves the list of participants for a specific room identified by the given roomId.
 * @param {UUID} roomId - The unique identifier of the room.
 * @returns {Promise<UUID[]>} Returns a Promise that resolves with an array of UUIDs representing the participants of the room.
 */
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        const sql = "SELECT userId FROM participants WHERE roomId = ?";
        const rows = this.db.prepare(sql).all(roomId) as { userId: string }[];
        return rows.map((row) => row.userId as UUID);
    }

/**
 * Retrieves the user state for a specific participant in a room.
 * @param {UUID} roomId - The unique identifier of the room.
 * @param {UUID} userId - The unique identifier of the user.
 * @returns {Promise<"FOLLOWED" | "MUTED" | null>} The user state of the participant ('FOLLOWED', 'MUTED', or null if not found).
 */
    async getParticipantUserState(
        roomId: UUID,
        userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null> {
        const stmt = this.db.prepare(
            "SELECT userState FROM participants WHERE roomId = ? AND userId = ?"
        );
        const res = stmt.get(roomId, userId) as
            | { userState: "FOLLOWED" | "MUTED" | null }
            | undefined;
        return res?.userState ?? null;
    }

/**
 * Sets the user state for a participant in a specific room.
 * 
 * @param {UUID} roomId - The unique identifier for the room.
 * @param {UUID} userId - The unique identifier for the user.
 * @param {"FOLLOWED" | "MUTED" | null} state - The state to set for the user (either "FOLLOWED", "MUTED", or null).
 * @returns {Promise<void>} - A Promise that resolves when the user state has been updated.
 */
    async setParticipantUserState(
        roomId: UUID,
        userId: UUID,
        state: "FOLLOWED" | "MUTED" | null
    ): Promise<void> {
        const stmt = this.db.prepare(
            "UPDATE participants SET userState = ? WHERE roomId = ? AND userId = ?"
        );
        stmt.run(state, roomId, userId);
    }

/**
 * Constructor for creating a new instance of a class.
 * 
 * @param {Database} db - The database object to be used by the class.
 */
    constructor(db: Database) {
        super();
        this.db = db;
        load(db);
    }

/**
 * Initialize the database by executing the provided SQL commands.
 */
    async init() {
        this.db.exec(sqliteTables);
    }

/**
 * Closes the connection to the database.
 */
    async close() {
        this.db.close();
    }

/**
 * Retrieves an account by the provided user ID.
 * @param {UUID} userId - The unique identifier of the user account.
 * @returns {Promise<Account | null>} The account associated with the provided user ID,
 * or null if no account is found.
 */
    async getAccountById(userId: UUID): Promise<Account | null> {
        const sql = "SELECT * FROM accounts WHERE id = ?";
        const account = this.db.prepare(sql).get(userId) as Account;
        if (!account) return null;
        if (account) {
            if (typeof account.details === "string") {
                account.details = JSON.parse(
                    account.details as unknown as string
                );
            }
        }
        return account;
    }

/**
 * Creates a new account in the database.
 * 
 * @param {Account} account - The account object to be created.
 * @returns {Promise<boolean>} - A boolean indicating whether the account was created successfully or not.
 */
    async createAccount(account: Account): Promise<boolean> {
        try {
            const sql =
                "INSERT INTO accounts (id, name, username, email, avatarUrl, details) VALUES (?, ?, ?, ?, ?, ?)";
            this.db
                .prepare(sql)
                .run(
                    account.id ?? v4(),
                    account.name,
                    account.username,
                    account.email,
                    account.avatarUrl,
                    JSON.stringify(account.details)
                );
            return true;
        } catch (error) {
            console.log("Error creating account", error);
            return false;
        }
    }

/**
 * Retrieves details of actors in a given room
 * 
 * @param {Object} params - The parameters for the query
 * @param {UUID} params.roomId - The ID of the room to fetch actor details for
 * @returns {Promise<Actor[]>} - The list of actors in the room with their details
 */
    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        const sql = `
      SELECT a.id, a.name, a.username, a.details
      FROM participants p
      LEFT JOIN accounts a ON p.userId = a.id
      WHERE p.roomId = ?
    `;
        const rows = this.db
            .prepare(sql)
            .all(params.roomId) as (Actor | null)[];

        return rows
            .map((row) => {
                if (row === null) {
                    return null;
                }
                return {
                    ...row,
                    details:
                        typeof row.details === "string"
                            ? JSON.parse(row.details)
                            : row.details,
                };
            })
            .filter((row): row is Actor => row !== null);
    }

/**
 * Retrieves memories based on room IDs.
 * 
 * @param {Object} params - The parameters for querying memories.
 * @param {string} params.agentId - The UUID of the agent.
 * @param {string[]} params.roomIds - The list of room IDs.
 * @param {string} params.tableName - The name of the table to query (default to 'messages' if not provided).
 * @returns {Promise<Memory[]>} - A promise that resolves to an array of memories.
 */
    async getMemoriesByRoomIds(params: {
        agentId: UUID;
        roomIds: UUID[];
        tableName: string;
    }): Promise<Memory[]> {
        if (!params.tableName) {
            // default to messages
            params.tableName = "messages";
        }
        const placeholders = params.roomIds.map(() => "?").join(", ");
        const sql = `SELECT * FROM memories WHERE type = ? AND agentId = ? AND roomId IN (${placeholders})`;
        const queryParams = [
            params.tableName,
            params.agentId,
            ...params.roomIds,
        ];

        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...queryParams) as (Memory & {
            content: string;
        })[];

        return rows.map((row) => ({
            ...row,
            content: JSON.parse(row.content),
        }));
    }

/**
 * Retrieve a memory object from the database based on the specified memory ID.
 * 
 * @param {UUID} memoryId - The unique identifier of the memory to retrieve.
 * @returns {Promise<Memory | null>} A Promise that resolves to the Memory object if found, or null if not found.
 */
    async getMemoryById(memoryId: UUID): Promise<Memory | null> {
        const sql = "SELECT * FROM memories WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([memoryId]);
        const memory = stmt.get() as Memory | undefined;

        if (memory) {
            return {
                ...memory,
                content: JSON.parse(memory.content as unknown as string),
            };
        }

        return null;
    }

/**
 * Creates a new memory in the specified table.
 * 
 * @param {Memory} memory - The memory to be created.
 * @param {string} tableName - The name of the table in which the memory should be stored.
 * @returns {Promise<void>} - A promise that resolves when the memory creation is complete.
 */
    async createMemory(memory: Memory, tableName: string): Promise<void> {
        // Delete any existing memory with the same ID first
        // const deleteSql = `DELETE FROM memories WHERE id = ? AND type = ?`;
        // this.db.prepare(deleteSql).run(memory.id, tableName);

        let isUnique = true;

        if (memory.embedding) {
            // Check if a similar memory already exists
            const similarMemories = await this.searchMemoriesByEmbedding(
                memory.embedding,
                {
                    tableName,
                    agentId: memory.agentId,
                    roomId: memory.roomId,
                    match_threshold: 0.95, // 5% similarity threshold
                    count: 1,
                }
            );

            isUnique = similarMemories.length === 0;
        }

        const content = JSON.stringify(memory.content);
        const createdAt = memory.createdAt ?? Date.now();

        let embeddingValue: Float32Array = new Float32Array(384);
        // If embedding is not available, we just load an array with a length of 384
        if (memory?.embedding && memory?.embedding?.length > 0) {
            embeddingValue = new Float32Array(memory.embedding);
        }

        // Insert the memory with the appropriate 'unique' value
        const sql = `INSERT OR REPLACE INTO memories (id, type, content, embedding, userId, roomId, agentId, \`unique\`, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        this.db
            .prepare(sql)
            .run(
                memory.id ?? v4(),
                tableName,
                content,
                embeddingValue,
                memory.userId,
                memory.roomId,
                memory.agentId,
                isUnique ? 1 : 0,
                createdAt
            );
    }

/**
 * Asynchronously searches for memories based on the provided parameters.
 * 
 * @param {object} params - The parameters for searching memories.
 * @param {string} params.tableName - The name of the table to search in.
 * @param {UUID} params.roomId - The UUID of the room to search memories for.
 * @param {UUID} [params.agentId] - Optional UUID of the agent associated with the memories.
 * @param {number[]} params.embedding - The embedding vector to compare with existing memories.
 * @param {number} params.match_threshold - The threshold for matching memories based on similarity.
 * @param {number} params.match_count - The maximum number of matching memories to retrieve.
 * @param {boolean} params.unique - Flag indicating if only unique memories should be returned.
 * 
 * @returns {Promise<Memory[]>} The memories that match the search criteria, with additional metadata including similarity and parsed content.
 */
 
    async searchMemories(params: {
        tableName: string;
        roomId: UUID;
        agentId?: UUID;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]> {
        // Build the query and parameters carefully
        const queryParams = [
            new Float32Array(params.embedding), // Ensure embedding is Float32Array
            params.tableName,
            params.roomId,
        ];

        let sql = `
            SELECT *, vec_distance_L2(embedding, ?) AS similarity
            FROM memories
            WHERE type = ?
            AND roomId = ?`;

        if (params.unique) {
            sql += " AND `unique` = 1";
        }

        if (params.agentId) {
            sql += " AND agentId = ?";
            queryParams.push(params.agentId);
        }
        sql += ` ORDER BY similarity ASC LIMIT ?`; // ASC for lower distance
        queryParams.push(params.match_count.toString()); // Convert number to string

        // Execute the prepared statement with the correct number of parameters
        const memories = this.db.prepare(sql).all(...queryParams) as (Memory & {
            similarity: number;
        })[];

        return memories.map((memory) => ({
            ...memory,
            createdAt:
                typeof memory.createdAt === "string"
                    ? Date.parse(memory.createdAt as string)
                    : memory.createdAt,
            content: JSON.parse(memory.content as unknown as string),
        }));
    }

/**
 * Asynchronously searches for memories based on an embedding and specified parameters.
 * @param {number[]} embedding - The embedding to search for in memories.
 * @param {Object} params - The parameters for the search.
 * @param {number} [params.match_threshold] - The threshold for similarity matching.
 * @param {number} [params.count] - The maximum number of memories to return.
 * @param {UUID} [params.roomId] - The ID of the room to search in.
 * @param {UUID} params.agentId - The ID of the agent associated with the memories.
 * @param {boolean} [params.unique] - Whether to only return unique memories.
 * @param {string} params.tableName - The name of the table to search in.
 * @returns {Promise<Memory[]>} - A promise that resolves to an array of matching memories.
 */
    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            agentId: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        const queryParams = [
            // JSON.stringify(embedding),
            new Float32Array(embedding),
            params.tableName,
            params.agentId,
        ];

        let sql = `
      SELECT *, vec_distance_L2(embedding, ?) AS similarity
      FROM memories
      WHERE embedding IS NOT NULL AND type = ? AND agentId = ?`;

        if (params.unique) {
            sql += " AND `unique` = 1";
        }

        if (params.roomId) {
            sql += " AND roomId = ?";
            queryParams.push(params.roomId);
        }
        sql += ` ORDER BY similarity DESC`;

        if (params.count) {
            sql += " LIMIT ?";
            queryParams.push(params.count.toString());
        }

        const memories = this.db.prepare(sql).all(...queryParams) as (Memory & {
            similarity: number;
        })[];
        return memories.map((memory) => ({
            ...memory,
            createdAt:
                typeof memory.createdAt === "string"
                    ? Date.parse(memory.createdAt as string)
                    : memory.createdAt,
            content: JSON.parse(memory.content as unknown as string),
        }));
    }

/**
 * Retrieves cached embeddings based on the specified options
 * @param {Object} opts - The options for retrieving cached embeddings
 * @param {string} opts.query_table_name - The name of the table to query
 * @param {number} opts.query_threshold - The threshold for the query
 * @param {string} opts.query_input - The input for the query
 * @param {string} opts.query_field_name - The name of the field to query
 * @param {string} opts.query_field_sub_name - The subfield name to query
 * @param {number} opts.query_match_count - The number of matches to retrieve
 * @returns {Promise<{ embedding: number[]; levenshtein_score: number }[]>} - The promise that resolves to an array of objects containing embedding and Levenshtein score
 */
    async getCachedEmbeddings(opts: {
        query_table_name: string;
        query_threshold: number;
        query_input: string;
        query_field_name: string;
        query_field_sub_name: string;
        query_match_count: number;
    }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
        // First get content text and calculate Levenshtein distance
        const sql = `
            WITH content_text AS (
                SELECT
                    embedding,
                    json_extract(
                        json(content),
                        '$.' || ? || '.' || ?
                    ) as content_text
                FROM memories
                WHERE type = ?
                AND json_extract(
                    json(content),
                    '$.' || ? || '.' || ?
                ) IS NOT NULL
            )
            SELECT
                embedding,
                length(?) + length(content_text) - (
                    length(?) + length(content_text) - (
                        length(replace(lower(?), lower(content_text), '')) +
                        length(replace(lower(content_text), lower(?), ''))
                    ) / 2
                ) as levenshtein_score
            FROM content_text
            ORDER BY levenshtein_score ASC
            LIMIT ?
        `;

        const rows = this.db
            .prepare(sql)
            .all(
                opts.query_field_name,
                opts.query_field_sub_name,
                opts.query_table_name,
                opts.query_field_name,
                opts.query_field_sub_name,
                opts.query_input,
                opts.query_input,
                opts.query_input,
                opts.query_input,
                opts.query_match_count
            ) as { embedding: Buffer; levenshtein_score: number }[];

        return rows.map((row) => ({
            embedding: Array.from(new Float32Array(row.embedding as Buffer)),
            levenshtein_score: row.levenshtein_score,
        }));
    }

/**
 * Update the status of a goal in the database.
 * @param {Object} params - The parameters for updating the goal status.
 * @param {string} params.goalId - The UUID of the goal to update.
 * @param {string} params.status - The new status to set for the goal.
 * @returns {Promise<void>} A promise that resolves once the status has been updated in the database.
 */
    async updateGoalStatus(params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void> {
        const sql = "UPDATE goals SET status = ? WHERE id = ?";
        this.db.prepare(sql).run(params.status, params.goalId);
    }

/**
 * Logs the given information into the database.
 *
 * @param {Object} params - The parameters for logging.
 * @param {Object.<string, unknown>} params.body - The body of the log entry.
 * @param {string} params.userId - The ID of the user associated with the log entry.
 * @param {string} params.roomId - The ID of the room associated with the log entry.
 * @param {string} params.type - The type of the log entry.
 * @returns {Promise<void>}
 */
    async log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        const sql =
            "INSERT INTO logs (body, userId, roomId, type) VALUES (?, ?, ?, ?)";
        this.db
            .prepare(sql)
            .run(
                JSON.stringify(params.body),
                params.userId,
                params.roomId,
                params.type
            );
    }

/**
 * Retrieves memories from the database based on the provided parameters.
 * 
 * @param {Object} params - The parameters for retrieving memories.
 * @param {UUID} params.roomId - The ID of the room where memories are stored.
 * @param {number} [params.count] - The maximum number of memories to retrieve.
 * @param {boolean} [params.unique] - Flag to indicate whether to retrieve unique memories.
 * @param {string} params.tableName - The name of the table where memories are stored.
 * @param {UUID} params.agentId - The ID of the agent associated with the memories.
 * @param {number} [params.start] - The start date for retrieving memories.
 * @param {number} [params.end] - The end date for retrieving memories.
 * @returns {Promise<Memory[]>} An array of memories that meet the criteria.
 */
    async getMemories(params: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
        agentId: UUID;
        start?: number;
        end?: number;
    }): Promise<Memory[]> {
        if (!params.tableName) {
            throw new Error("tableName is required");
        }
        if (!params.roomId) {
            throw new Error("roomId is required");
        }
        let sql = `SELECT * FROM memories WHERE type = ? AND agentId = ? AND roomId = ?`;

        const queryParams = [
            params.tableName,
            params.agentId,
            params.roomId,
        ] as any[];

        if (params.unique) {
            sql += " AND `unique` = 1";
        }

        if (params.start) {
            sql += ` AND createdAt >= ?`;
            queryParams.push(params.start);
        }

        if (params.end) {
            sql += ` AND createdAt <= ?`;
            queryParams.push(params.end);
        }

        sql += " ORDER BY createdAt DESC";

        if (params.count) {
            sql += " LIMIT ?";
            queryParams.push(params.count);
        }

        const memories = this.db.prepare(sql).all(...queryParams) as Memory[];

        return memories.map((memory) => ({
            ...memory,
            createdAt:
                typeof memory.createdAt === "string"
                    ? Date.parse(memory.createdAt as string)
                    : memory.createdAt,
            content: JSON.parse(memory.content as unknown as string),
        }));
    }

/**
 * Removes a memory from the database table based on the provided memory ID and table name.
 * 
 * @param {UUID} memoryId - The ID of the memory to be removed.
 * @param {string} tableName - The name of the table where the memory should be removed from.
 * @returns {Promise<void>} A promise that resolves once the memory is successfully removed.
 */ 
           
    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
        const sql = `DELETE FROM memories WHERE type = ? AND id = ?`;
        this.db.prepare(sql).run(tableName, memoryId);
    }

/**
 * Removes all memories from the database that match the given room ID and table name.
 * 
 * @param {UUID} roomId - The ID of the room to delete memories from.
 * @param {string} tableName - The name of the table where memories are stored.
 * @returns {Promise<void>} A promise that resolves when the memories are successfully removed.
 */
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        const sql = `DELETE FROM memories WHERE type = ? AND roomId = ?`;
        this.db.prepare(sql).run(tableName, roomId);
    }

/**
 * Counts the number of memories in a specified room based on type and unique condition.
 * 
 * @param {UUID} roomId - The unique identifier of the room where memories are counted.
 * @param {boolean} unique - Optional flag to indicate if only unique memories should be counted. Default is true.
 * @param {string} tableName - Optional name of the table to specify the type of memories. Defaults to an empty string.
 * @returns {Promise<number>} - A promise that resolves to the count of memories based on the specified conditions.
 * @throws {Error} - Throws an error if tableName is not provided.
 */
    async countMemories(
        roomId: UUID,
        unique = true,
        tableName = ""
    ): Promise<number> {
        if (!tableName) {
            throw new Error("tableName is required");
        }

        let sql = `SELECT COUNT(*) as count FROM memories WHERE type = ? AND roomId = ?`;
        const queryParams = [tableName, roomId] as string[];

        if (unique) {
            sql += " AND `unique` = 1";
        }

        return (this.db.prepare(sql).get(...queryParams) as { count: number })
            .count;
    }

/**
 * Retrieves goals based on the specified parameters.
 * @param {Object} params - The parameters for retrieving goals.
 * @param {UUID} params.roomId - The ID of the room.
 * @param {UUID | null} [params.userId] - The ID of the user (optional).
 * @param {boolean} [params.onlyInProgress] - Flag to only retrieve goals that are in progress.
 * @param {number} [params.count] - The maximum number of goals to retrieve.
 * @returns {Promise<Goal[]>} An array of goals that match the specified parameters.
 */
    async getGoals(params: {
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        let sql = "SELECT * FROM goals WHERE roomId = ?";
        const queryParams = [params.roomId];

        if (params.userId) {
            sql += " AND userId = ?";
            queryParams.push(params.userId);
        }

        if (params.onlyInProgress) {
            sql += " AND status = 'IN_PROGRESS'";
        }

        if (params.count) {
            sql += " LIMIT ?";
            // @ts-expect-error - queryParams is an array of strings
            queryParams.push(params.count.toString());
        }

        const goals = this.db.prepare(sql).all(...queryParams) as Goal[];
        return goals.map((goal) => ({
            ...goal,
            objectives:
                typeof goal.objectives === "string"
                    ? JSON.parse(goal.objectives)
                    : goal.objectives,
        }));
    }

/**
 * Updates a goal in the database with the given information.
 * @param {Goal} goal - The goal object containing the updated information.
 * @returns {Promise<void>} A promise that resolves when the goal is successfully updated.
 */
    async updateGoal(goal: Goal): Promise<void> {
        const sql =
            "UPDATE goals SET name = ?, status = ?, objectives = ? WHERE id = ?";
        this.db
            .prepare(sql)
            .run(
                goal.name,
                goal.status,
                JSON.stringify(goal.objectives),
                goal.id
            );
    }

/**
 * Create a new goal in the database.
 * 
 * @param {Goal} goal - The goal object to be inserted into the database.
 * @returns {Promise<void>} - A Promise that resolves once the goal has been created in the database.
 */
    async createGoal(goal: Goal): Promise<void> {
        const sql =
            "INSERT INTO goals (id, roomId, userId, name, status, objectives) VALUES (?, ?, ?, ?, ?, ?)";
        this.db
            .prepare(sql)
            .run(
                goal.id ?? v4(),
                goal.roomId,
                goal.userId,
                goal.name,
                goal.status,
                JSON.stringify(goal.objectives)
            );
    }

/**
 * Removes a goal from the database.
 * @param {UUID} goalId - The unique identifier of the goal to be removed.
 * @returns {Promise<void>} A promise that resolves when the goal is successfully removed.
 */
    async removeGoal(goalId: UUID): Promise<void> {
        const sql = "DELETE FROM goals WHERE id = ?";
        this.db.prepare(sql).run(goalId);
    }

/**
 * Removes all goals belonging to a specific room from the database.
 * 
 * @param {UUID} roomId - The ID of the room whose goals should be removed.
 * @returns {Promise<void>} A Promise that resolves when the goals are successfully removed.
 */
    async removeAllGoals(roomId: UUID): Promise<void> {
        const sql = "DELETE FROM goals WHERE roomId = ?";
        this.db.prepare(sql).run(roomId);
    }

/**
 * Asynchronously creates a new room with the given roomId or generates a new UUID if roomId is not provided.
 * 
 * @param {UUID} [roomId] - The optional roomId to use for the new room. If not provided, a new UUID will be generated.
 * @returns {Promise<UUID>} - A Promise that resolves with the roomId of the created room.
 */
    async createRoom(roomId?: UUID): Promise<UUID> {
        roomId = roomId || (v4() as UUID);
        try {
            const sql = "INSERT INTO rooms (id) VALUES (?)";
            this.db.prepare(sql).run(roomId ?? (v4() as UUID));
        } catch (error) {
            console.log("Error creating room", error);
        }
        return roomId as UUID;
    }

/**
 * Asynchronously removes a room from the database.
 * 
 * @param {UUID} roomId - The unique identifier of the room to be removed.
 * @returns {Promise<void>} A Promise that resolves when the room is successfully removed.
 */
    async removeRoom(roomId: UUID): Promise<void> {
        const sql = "DELETE FROM rooms WHERE id = ?";
        this.db.prepare(sql).run(roomId);
    }

/**
 * Retrieves a list of room IDs for a given participant based on the provided userId.
 * 
 * @param {UUID} userId - The unique identifier of the participant.
 * @returns {Promise<UUID[]>} A promise that resolves to an array of room IDs associated with the participant.
 */
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        const sql = "SELECT roomId FROM participants WHERE userId = ?";
        const rows = this.db.prepare(sql).all(userId) as { roomId: string }[];
        return rows.map((row) => row.roomId as UUID);
    }

/**
 * Asynchronously retrieves a list of room IDs associated with the provided user IDs.
 *
 * @param {UUID[]} userIds - An array of UUID strings representing user IDs.
 * @returns {Promise<UUID[]>} A promise that resolves to an array of UUID strings representing room IDs.
 */
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        // Assuming userIds is an array of UUID strings, prepare a list of placeholders
        const placeholders = userIds.map(() => "?").join(", ");
        // Construct the SQL query with the correct number of placeholders
        const sql = `SELECT DISTINCT roomId FROM participants WHERE userId IN (${placeholders})`;
        // Execute the query with the userIds array spread into arguments
        const rows = this.db.prepare(sql).all(...userIds) as {
            roomId: string;
        }[];
        // Map and return the roomId values as UUIDs
        return rows.map((row) => row.roomId as UUID);
    }

/**
 * Add a new participant to a room.
 * 
 * @param {string} userId - The ID of the user to add as a participant.
 * @param {string} roomId - The ID of the room to add the participant to.
 * @returns {Promise<boolean>} - A promise that resolves to true if the participant was successfully added, or false if there was an error.
 */
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            const sql =
                "INSERT INTO participants (id, userId, roomId) VALUES (?, ?, ?)";
            this.db.prepare(sql).run(v4(), userId, roomId);
            return true;
        } catch (error) {
            console.log("Error adding participant", error);
            return false;
        }
    }

/**
 * Removes a participant from the database.
 * 
 * @param {UUID} userId - The user ID of the participant to be removed.
 * @param {UUID} roomId - The room ID from which the participant is being removed.
 * @returns {Promise<boolean>} A boolean indicating if the participant was successfully removed.
 */
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            const sql =
                "DELETE FROM participants WHERE userId = ? AND roomId = ?";
            this.db.prepare(sql).run(userId, roomId);
            return true;
        } catch (error) {
            console.log("Error removing participant", error);
            return false;
        }
    }

/**
 * Creates a new relationship between two users in the database.
 * @param {Object} params - The parameters for creating the relationship.
 * @param {UUID} params.userA - The UUID of the first user.
 * @param {UUID} params.userB - The UUID of the second user.
 * @returns {Promise<boolean>} A promise that resolves to true if the relationship is created successfully.
 * @throws {Error} If userA or userB are not provided.
 */
    async createRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<boolean> {
        if (!params.userA || !params.userB) {
            throw new Error("userA and userB are required");
        }
        const sql =
            "INSERT INTO relationships (id, userA, userB, userId) VALUES (?, ?, ?, ?)";
        this.db
            .prepare(sql)
            .run(v4(), params.userA, params.userB, params.userA);
        return true;
    }

/**
 * Asynchronously retrieves the relationship between two users from the database.
 * @param {Object} params - The parameters for the relationship query.
 * @param {UUID} params.userA - The UUID of the first user.
 * @param {UUID} params.userB - The UUID of the second user.
 * @returns {Promise<Relationship | null>} A Promise that resolves with the Relationship object if found, or null if not found.
 */
    async getRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null> {
        const sql =
            "SELECT * FROM relationships WHERE (userA = ? AND userB = ?) OR (userA = ? AND userB = ?)";
        return (
            (this.db
                .prepare(sql)
                .get(
                    params.userA,
                    params.userB,
                    params.userB,
                    params.userA
                ) as Relationship) || null
        );
    }

/**
 * Retrieves relationships for a specific user based on the provided user ID.
 * @param {Object} params - The parameters for the query.
 * @param {string} params.userId - The UUID of the user.
 * @returns {Promise<Relationship[]>} - An array of Relationship objects representing the relationships of the user.
 */
    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        const sql =
            "SELECT * FROM relationships WHERE (userA = ? OR userB = ?)";
        return this.db
            .prepare(sql)
            .all(params.userId, params.userId) as Relationship[];
    }

/**
 * Retrieves a value from the cache table based on the provided key and agentId.
 * 
 * @param {Object} params - The parameters for retrieving the value from the cache table.
 * @param {string} params.key - The key to search for in the cache table.
 * @param {UUID} params.agentId - The agentId associated with the key in the cache table.
 * @returns {Promise<string | undefined>} The value corresponding to the key and agentId in the cache table, or undefined if not found.
 */
    async getCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<string | undefined> {
        const sql = "SELECT value FROM cache WHERE (key = ? AND agentId = ?)";
        const cached = this.db
            .prepare<[string, UUID], { value: string }>(sql)
            .get(params.key, params.agentId);

        return cached?.value ?? undefined;
    }

/**
 * Asynchronously sets a value in the cache for a specific key and agentId.
 * 
 * @param {Object} params - The parameters for setting the cache value
 * @param {string} params.key - The key for the cache value
 * @param {UUID} params.agentId - The agentId associated with the cache value
 * @param {string} params.value - The value to be stored in the cache
 * @returns {Promise<boolean>} - A promise that resolves to true if the cache value was successfully set
 */
    async setCache(params: {
        key: string;
        agentId: UUID;
        value: string;
    }): Promise<boolean> {
        const sql =
            "INSERT OR REPLACE INTO cache (key, agentId, value, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
        this.db.prepare(sql).run(params.key, params.agentId, params.value);
        return true;
    }

/**
    * Delete cache from the database based on specified key and agent ID.
    * 
    * @param {Object} params - The parameters for deleting cache.
    * @param {string} params.key - The key of the cache to be deleted.
    * @param {UUID} params.agentId - The ID of the agent associated with the cache.
    * @returns {Promise<boolean>} - A Promise that resolves to true if cache is successfully deleted, false otherwise.
    */
    async deleteCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<boolean> {
        try {
            const sql = "DELETE FROM cache WHERE key = ? AND agentId = ?";
            this.db.prepare(sql).run(params.key, params.agentId);
            return true;
        } catch (error) {
            console.log("Error removing cache", error);
            return false;
        }
    }

/**
 * Retrieves knowledge items from the database based on the provided parameters.
 * @param {Object} params - The parameters for the knowledge retrieval.
 * @param {UUID} params.id - The unique identifier of the knowledge item (optional).
 * @param {UUID} params.agentId - The unique identifier of the agent who owns the knowledge items.
 * @param {number} params.limit - The maximum number of knowledge items to retrieve (optional).
 * @param {string} params.query - The search query to filter the knowledge items (optional).
 * @returns {Promise<RAGKnowledgeItem[]>} - A Promise that resolves to an array of knowledge items.
 */
    async getKnowledge(params: {
        id?: UUID;
        agentId: UUID;
        limit?: number;
        query?: string;
    }): Promise<RAGKnowledgeItem[]> {
        let sql = `SELECT * FROM knowledge WHERE (agentId = ? OR isShared = 1)`;
        const queryParams: any[] = [params.agentId];

        if (params.id) {
            sql += ` AND id = ?`;
            queryParams.push(params.id);
        }

        if (params.limit) {
            sql += ` LIMIT ?`;
            queryParams.push(params.limit);
        }

        interface KnowledgeRow {
            id: UUID;
            agentId: UUID;
            content: string;
            embedding: Buffer | null;
            createdAt: string | number;
        }

        const rows = this.db.prepare(sql).all(...queryParams) as KnowledgeRow[];

        return rows.map((row) => ({
            id: row.id,
            agentId: row.agentId,
            content: JSON.parse(row.content),
            embedding: row.embedding
                ? new Float32Array(row.embedding)
                : undefined,
            createdAt:
                typeof row.createdAt === "string"
                    ? Date.parse(row.createdAt)
                    : row.createdAt,
        }));
    }

/**
 * Searches for knowledge items based on the provided parameters.
 * @param {Object} params - The search parameters
 * @param {UUID} params.agentId - The UUID of the agent
 * @param {Float32Array} params.embedding - The embedding to compare against
 * @param {number} params.match_threshold - The threshold for vector score matching
 * @param {number} params.match_count - The number of results to return
 * @param {string} [params.searchText] - The optional search text
 * @returns {Promise<RAGKnowledgeItem[]>} An array of RAGKnowledgeItem objects that match the search criteria
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
            agentId: params.agentId,
        });

        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        interface KnowledgeSearchRow {
            id: UUID;
            agentId: UUID;
            content: string;
            embedding: Buffer | null;
            createdAt: string | number;
            vector_score: number;
            keyword_score: number;
            combined_score: number;
        }

        const sql = `
            WITH vector_scores AS (
                SELECT id,
                        1 / (1 + vec_distance_L2(embedding, ?)) as vector_score
                FROM knowledge
                WHERE (agentId IS NULL AND isShared = 1) OR agentId = ?
                AND embedding IS NOT NULL
            ),
            keyword_matches AS (
                SELECT id,
                CASE
                    WHEN lower(json_extract(content, '$.text')) LIKE ? THEN 3.0
                    ELSE 1.0
                END *
                CASE
                    WHEN json_extract(content, '$.metadata.isChunk') = 1 THEN 1.5
                    WHEN json_extract(content, '$.metadata.isMain') = 1 THEN 1.2
                    ELSE 1.0
                END as keyword_score
                FROM knowledge
                WHERE (agentId IS NULL AND isShared = 1) OR agentId = ?
            )
            SELECT k.*,
                v.vector_score,
                kw.keyword_score,
                (v.vector_score * kw.keyword_score) as combined_score
            FROM knowledge k
            JOIN vector_scores v ON k.id = v.id
            LEFT JOIN keyword_matches kw ON k.id = kw.id
            WHERE (k.agentId IS NULL AND k.isShared = 1) OR k.agentId = ?
            AND (
                v.vector_score >= ?  -- Using match_threshold parameter
                OR (kw.keyword_score > 1.0 AND v.vector_score >= 0.3)
            )
            ORDER BY combined_score DESC
            LIMIT ?
        `;

        const searchParams = [
            params.embedding,
            params.agentId,
            `%${params.searchText?.toLowerCase() || ""}%`,
            params.agentId,
            params.agentId,
            params.match_threshold,
            params.match_count,
        ];

        try {
            const rows = this.db
                .prepare(sql)
                .all(...searchParams) as KnowledgeSearchRow[];
            const results = rows.map((row) => ({
                id: row.id,
                agentId: row.agentId,
                content: JSON.parse(row.content),
                embedding: row.embedding
                    ? new Float32Array(row.embedding)
                    : undefined,
                createdAt:
                    typeof row.createdAt === "string"
                        ? Date.parse(row.createdAt)
                        : row.createdAt,
                similarity: row.combined_score,
            }));

            await this.setCache({
                key: cacheKey,
                agentId: params.agentId,
                value: JSON.stringify(results),
            });

            return results;
        } catch (error) {
            elizaLogger.error("Error in searchKnowledge:", error);
            throw error;
        }
    }

/**
 * Creates a new knowledge item in the database.
 * 
 * @param {RAGKnowledgeItem} knowledge The knowledge item to be created.
 * @returns {Promise<void>} A Promise that resolves when the knowledge item is successfully created.
 */
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        try {
            this.db.transaction(() => {
                const sql = `
                    INSERT INTO knowledge (
                    id, agentId, content, embedding, createdAt,
                    isMain, originalId, chunkIndex, isShared
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const embeddingArray = knowledge.embedding || null;

                const metadata = knowledge.content.metadata || {};
                const isShared = metadata.isShared ? 1 : 0;

                this.db
                    .prepare(sql)
                    .run(
                        knowledge.id,
                        metadata.isShared ? null : knowledge.agentId,
                        JSON.stringify(knowledge.content),
                        embeddingArray,
                        knowledge.createdAt || Date.now(),
                        metadata.isMain ? 1 : 0,
                        metadata.originalId || null,
                        metadata.chunkIndex || null,
                        isShared
                    );
            })();
        } catch (error: any) {
            const isShared = knowledge.content.metadata?.isShared;
            const isPrimaryKeyError =
                error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY";

            if (isShared && isPrimaryKeyError) {
                elizaLogger.info(
                    `Shared knowledge ${knowledge.id} already exists, skipping`
                );
                return;
            } else if (
                !isShared &&
                !error.message?.includes("SQLITE_CONSTRAINT_PRIMARYKEY")
            ) {
                elizaLogger.error(`Error creating knowledge ${knowledge.id}:`, {
                    error,
                    embeddingLength: knowledge.embedding?.length,
                    content: knowledge.content,
                });
                throw error;
            }

            elizaLogger.debug(
                `Knowledge ${knowledge.id} already exists, skipping`
            );
        }
    }

/**
 * Removes a knowledge entry from the database based on the given ID.
 * @param {UUID} id - The ID of the knowledge entry to be removed.
 * @returns {Promise<void>} A promise that resolves once the knowledge entry is successfully removed.
 */
    async removeKnowledge(id: UUID): Promise<void> {
        const sql = `DELETE FROM knowledge WHERE id = ?`;
        this.db.prepare(sql).run(id);
    }

/**
 * Clear knowledge entries for a specific agent from the database.
 * 
 * @param {UUID} agentId - The unique identifier of the agent whose knowledge entries will be cleared.
 * @param {boolean} [shared] - Optional parameter to indicate whether to clear shared knowledge entries as well. Defaults to false.
 * @returns {Promise<void>} A Promise that resolves once the knowledge entries have been cleared.
 * @throws {Error} If there is an error while clearing the knowledge entries.
 */
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        const sql = shared
            ? `DELETE FROM knowledge WHERE (agentId = ? OR isShared = 1)`
            : `DELETE FROM knowledge WHERE agentId = ?`;
        try {
            this.db.prepare(sql).run(agentId);
        } catch (error) {
            elizaLogger.error(
                `Error clearing knowledge for agent ${agentId}:`,
                error
            );
            throw error;
        }
    }
}
