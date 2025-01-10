export * from "./sqliteTables.ts";
export * from "./types.ts";

import {
    Account,
    Actor,
    DatabaseAdapter,
    GoalStatus,
    IDatabaseCacheAdapter,
    Participant,
    type Goal,
    type Memory,
    type Relationship,
    type UUID,
    RAGKnowledgeItem,
    elizaLogger
} from "@elizaos/core";
import { v4 } from "uuid";
import { sqliteTables } from "./sqliteTables.ts";
import { Database } from "./types.ts";

/**
 * SqlJsDatabaseAdapter class to adapt SQL.js database with caching capabilities.
 * @extends DatabaseAdapter<Database>
 * @implements IDatabaseCacheAdapter
 */
export class SqlJsDatabaseAdapter
    extends DatabaseAdapter<Database>
    implements IDatabaseCacheAdapter
{
/**
* Constructor for initializing the class with a database instance.
* @param {Database} db - The database instance to be used.
*/
    constructor(db: Database) {
        super();
        this.db = db;
    }

/**
 * Initialize the database by executing the SQLite tables.
 */
    async init() {
        this.db.exec(sqliteTables);
    }

/**
 * Asynchronously closes the database connection.
 */
    async close() {
        this.db.close();
    }

/**
 * Get a room by its ID from the database.
 * @param {UUID} roomId - The ID of the room to retrieve.
 * @returns {Promise<UUID | null>} The ID of the room if found, otherwise null.
 */
    async getRoom(roomId: UUID): Promise<UUID | null> {
        const sql = "SELECT id FROM rooms WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([roomId]);
        const room = stmt.getAsObject() as { id: string } | undefined;
        stmt.free();
        return room ? (room.id as UUID) : null;
    }

/**
 * Fetches all participants for a given user account.
 * 
 * @param {UUID} userId - The ID of the user account to get participants for.
 * @returns {Promise<Participant[]>} - An array of Participant objects representing the participants for the user account.
 */
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        const sql = `
      SELECT p.id, p.userId, p.roomId, p.last_message_read
      FROM participants p
      WHERE p.userId = ?
    `;
        const stmt = this.db.prepare(sql);
        stmt.bind([userId]);
        const participants: Participant[] = [];
        while (stmt.step()) {
            const participant = stmt.getAsObject() as unknown as Participant;
            participants.push(participant);
        }
        stmt.free();
        return participants;
    }

/**
 * Retrieves the state of a participant in a specific room.
 * @param {UUID} roomId - The ID of the room.
 * @param {UUID} userId - The ID of the user/participant.
 * @returns {Promise<"FOLLOWED" | "MUTED" | null>} The user state, which can be "FOLLOWED", "MUTED", or null.
 */
    async getParticipantUserState(
        roomId: UUID,
        userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null> {
        const sql =
            "SELECT userState FROM participants WHERE roomId = ? AND userId = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([roomId, userId]);
        const result = stmt.getAsObject() as {
            userState: "FOLLOWED" | "MUTED" | null;
        };
        stmt.free();
        return result.userState ?? null;
    }

/**
 * Retrieves memories based on room IDs.
 * @param {Object} params - The parameters for the query.
 * @param {UUID} params.agentId - The ID of the agent.
 * @param {UUID[]} params.roomIds - An array of room IDs.
 * @param {string} params.tableName - The name of the table to query.
 * @returns {Promise<Memory[]>} - A promise that resolves to an array of memories.
 */
    async getMemoriesByRoomIds(params: {
        agentId: UUID;
        roomIds: UUID[];
        tableName: string;
    }): Promise<Memory[]> {
        const placeholders = params.roomIds.map(() => "?").join(", ");
        const sql = `SELECT * FROM memories WHERE 'type' = ? AND agentId = ? AND roomId IN (${placeholders})`;
        const stmt = this.db.prepare(sql);
        const queryParams = [
            params.tableName,
            params.agentId,
            ...params.roomIds,
        ];
        elizaLogger.log({ queryParams });
        stmt.bind(queryParams);
        elizaLogger.log({ queryParams });

        const memories: Memory[] = [];
        while (stmt.step()) {
            const memory = stmt.getAsObject() as unknown as Memory;
            memories.push({
                ...memory,
                content: JSON.parse(memory.content as unknown as string),
            });
        }
        stmt.free();
        return memories;
    }

/**
 * Updates the user state for a specific participant in a given room.
 * 
 * @param {UUID} roomId - The unique identifier of the room.
 * @param {UUID} userId - The unique identifier of the user.
 * @param {"FOLLOWED" | "MUTED" | null} state - The new state to set for the user ('FOLLOWED', 'MUTED', or null).
 * @returns {Promise<void>} - A Promise that resolves when the user state has been updated.
 */
    async setParticipantUserState(
        roomId: UUID,
        userId: UUID,
        state: "FOLLOWED" | "MUTED" | null
    ): Promise<void> {
        const sql =
            "UPDATE participants SET userState = ? WHERE roomId = ? AND userId = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([state, roomId, userId]);
        stmt.step();
        stmt.free();
    }

/**
 * Async function to fetch participant IDs for a given room ID.
 * 
 * @param {UUID} roomId - The ID of the room to fetch participants for.
 * @returns {Promise<UUID[]>} - A promise that resolves with an array of participant IDs.
 */
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        const sql = "SELECT userId FROM participants WHERE roomId = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([roomId]);
        const userIds: UUID[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as { userId: string };
            userIds.push(row.userId as UUID);
        }
        stmt.free();
        return userIds;
    }

/**
 * Retrieves an account from the database based on the provided user ID.
 *
 * @param {UUID} userId - The unique identifier of the user account to retrieve.
 * @returns {Promise<Account | null>} A Promise that resolves to the retrieved Account object, or null if no account is found.
 */
    async getAccountById(userId: UUID): Promise<Account | null> {
        const sql = "SELECT * FROM accounts WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([userId]);
        const account = stmt.getAsObject() as unknown as Account | undefined;

        if (account && typeof account.details === "string") {
            account.details = JSON.parse(account.details);
        }

        stmt.free();
        return account || null;
    }

/**
 * Creates a new account in the database.
 * 
 * @param {Account} account The account object to be created.
 * @returns {Promise<boolean>} A Promise that resolves to true if the account is successfully created, false otherwise.
 */
    async createAccount(account: Account): Promise<boolean> {
        try {
            const sql = `
      INSERT INTO accounts (id, name, username, email, avatarUrl, details)
      VALUES (?, ?, ?, ?, ?, ?)
      `;
            const stmt = this.db.prepare(sql);
            stmt.run([
                account.id ?? v4(),
                account.name,
                account.username || "",
                account.email || "",
                account.avatarUrl || "",
                JSON.stringify(account.details),
            ]);
            stmt.free();
            return true;
        } catch (error) {
            elizaLogger.error("Error creating account", error);
            return false;
        }
    }

/**
 * Asynchronously retrieves actors by roomId.
 * 
 * @param {Object} params - The parameters object.
 * @param {UUID} params.roomId - The roomId to query by.
 * @returns {Promise<Actor[]>} - An array of actors matching the roomId.
 */
    async getActorById(params: { roomId: UUID }): Promise<Actor[]> {
        const sql = `
      SELECT a.id, a.name, a.username, a.details
      FROM participants p
      LEFT JOIN accounts a ON p.userId = a.id
      WHERE p.roomId = ?
    `;
        const stmt = this.db.prepare(sql);
        stmt.bind([params.roomId]);
        const rows: Actor[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as unknown as Actor;
            rows.push({
                ...row,
                details:
                    typeof row.details === "string"
                        ? JSON.parse(row.details)
                        : row.details,
            });
        }
        stmt.free();
        return rows;
    }

/**
 * Retrieve details of actors in a specified room
 * @param {Object} params - The parameters for the query
 * @param {string} params.roomId - The UUID of the room to retrieve actor details from
 * @returns {Promise<Actor[]>} - An array of Actor objects with their details parsed if in string format
 */
    async getActorDetails(params: { roomId: UUID }): Promise<Actor[]> {
        const sql = `
      SELECT a.id, a.name, a.username, a.details
      FROM participants p
      LEFT JOIN accounts a ON p.userId = a.id
      WHERE p.roomId = ?
    `;
        const stmt = this.db.prepare(sql);
        stmt.bind([params.roomId]);
        const rows: Actor[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as unknown as Actor;
            rows.push({
                ...row,
                details:
                    typeof row.details === "string"
                        ? JSON.parse(row.details)
                        : row.details,
            });
        }
        stmt.free();
        return rows;
    }

/**
 * Retrieves a memory from the database based on its unique identifier.
 * @param {UUID} id - The unique identifier of the memory to retrieve.
 * @returns {Promise<Memory | null>} A Promise that resolves to the retrieved memory if found, otherwise null.
 */
    async getMemoryById(id: UUID): Promise<Memory | null> {
        const sql = "SELECT * FROM memories WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([id]);
        const memory = stmt.getAsObject() as unknown as Memory | undefined;
        stmt.free();
        return memory || null;
    }

/**
 * Asynchronously creates a new memory entry in the database table.
 * If the memory has an embedding property, it checks if a similar memory already exists
 * by searching for memories with similar embeddings. If no similar memory is found,
 * the memory is inserted into the database with a unique flag.
 * 
 * @param memory The memory object to be created
 * @param tableName The name of the database table where the memory will be stored
 * @returns A promise that resolves once the memory has been successfully created
 */
    async createMemory(memory: Memory, tableName: string): Promise<void> {
        let isUnique = true;
        if (memory.embedding) {
            // Check if a similar memory already exists
            const similarMemories = await this.searchMemoriesByEmbedding(
                memory.embedding,
                {
                    agentId: memory.agentId,
                    tableName,
                    roomId: memory.roomId,
                    match_threshold: 0.95, // 5% similarity threshold
                    count: 1,
                }
            );

            isUnique = similarMemories.length === 0;
        }

        // Insert the memory with the appropriate 'unique' value
        const sql = `INSERT INTO memories (id, type, content, embedding, userId, roomId, agentId, \`unique\`, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const stmt = this.db.prepare(sql);

        const createdAt = memory.createdAt ?? Date.now();

        stmt.run([
            memory.id ?? v4(),
            tableName,
            JSON.stringify(memory.content),
            JSON.stringify(memory.embedding),
            memory.userId,
            memory.roomId,
            memory.agentId,
            isUnique ? 1 : 0,
            createdAt,
        ]);
        stmt.free();
    }

/**
 * Searches for memories based on the provided parameters.
 * 
 * @param {object} params - Object containing search parameters.
 * @param {string} params.tableName - The name of the table to search in.
 * @param {UUID} params.agentId - The ID of the agent associated with the memories.
 * @param {UUID} params.roomId - The ID of the room associated with the memories.
 * @param {number[]} params.embedding - An array representing the memory embedding.
 * @param {number} params.match_threshold - The threshold for matching memories.
 * @param {number} params.match_count - The number of memories to match.
 * @param {boolean} params.unique - Flag to indicate if only unique memories should be selected.
 * @returns {Promise<Memory[]>} - A Promise that resolves to an array of memories matching the search criteria.
 */
    async searchMemories(params: {
        tableName: string;
        agentId: UUID;
        roomId: UUID;
        embedding: number[];
        match_threshold: number;
        match_count: number;
        unique: boolean;
    }): Promise<Memory[]> {
        let sql =
            `
  SELECT *` +
            // TODO: Uncomment when we compile sql.js with vss
            // `, (1 - vss_distance_l2(embedding, ?)) AS similarity` +
            ` FROM memories
  WHERE type = ? AND agentId = ?
  AND roomId = ?`;

        if (params.unique) {
            sql += " AND `unique` = 1";
        }
        // TODO: Uncomment when we compile sql.js with vss
        // sql += ` ORDER BY similarity DESC LIMIT ?`;
        const stmt = this.db.prepare(sql);
        stmt.bind([
            // JSON.stringify(params.embedding),
            params.tableName,
            params.agentId,
            params.roomId,
            // params.match_count,
        ]);
        const memories: (Memory & { similarity: number })[] = [];
        while (stmt.step()) {
            const memory = stmt.getAsObject() as unknown as Memory & {
                similarity: number;
            };
            memories.push({
                ...memory,
                content: JSON.parse(memory.content as unknown as string),
            });
        }
        stmt.free();
        return memories;
    }

/**
 * Function to search memories by embedding
 * * @param {number[]} _embedding - The embedding to search memories with
 * @param { object } params - The parameters for the search
 * @param { UUID } params.agentId - The agent ID to search memories for
 * @param { number } [params.match_threshold] - The match threshold for similarity
 * @param { number } [params.count] - The count of memories to retrieve
 * @param { UUID } [params.roomId] - The room ID to filter memories by
 * @param { boolean } [params.unique] - Flag to retrieve only unique memories
 * @param { string } params.tableName - The table name to search memories in
 * @returns {Promise<Memory[]>} - The memories found based on the search criteria
 */
    async searchMemoriesByEmbedding(
        _embedding: number[],
        params: {
            agentId: UUID;
            match_threshold?: number;
            count?: number;
            roomId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        let sql =
            `SELECT *` +
            // TODO: Uncomment when we compile sql.js with vss
            // `, (1 - vss_distance_l2(embedding, ?)) AS similarity`+
            ` FROM memories
        WHERE type = ? AND agentId = ?`;

        if (params.unique) {
            sql += " AND `unique` = 1";
        }
        if (params.roomId) {
            sql += " AND roomId = ?";
        }
        // TODO: Test this
        if (params.agentId) {
            sql += " AND userId = ?";
        }
        // TODO: Uncomment when we compile sql.js with vss
        // sql += ` ORDER BY similarity DESC`;

        if (params.count) {
            sql += " LIMIT ?";
        }

        const stmt = this.db.prepare(sql);
        const bindings = [
            // JSON.stringify(embedding),
            params.tableName,
            params.agentId,
        ];
        if (params.roomId) {
            bindings.push(params.roomId);
        }
        if (params.count) {
            bindings.push(params.count.toString());
        }

        stmt.bind(bindings);
        const memories: (Memory & { similarity: number })[] = [];
        while (stmt.step()) {
            const memory = stmt.getAsObject() as unknown as Memory & {
                similarity: number;
            };
            memories.push({
                ...memory,
                content: JSON.parse(memory.content as unknown as string),
            });
        }
        stmt.free();
        return memories;
    }

/**
 * Retrieves cached embeddings based on specified query parameters.
 * @param {Object} opts - Options for the query.
 * @param {string} opts.query_table_name - Name of the table for the query.
 * @param {number} opts.query_threshold - Threshold value for the query.
 * @param {string} opts.query_input - Input for the query.
 * @param {string} opts.query_field_name - Field name for the query.
 * @param {string} opts.query_field_sub_name - Sub field name for the query.
 * @param {number} opts.query_match_count - Number of matches for the query.
 * @returns {Promise<Object[]>} Array of objects with embedding and levenshtein score.
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
        const sql =
            `
        SELECT *
        FROM memories
        WHERE type = ?` +
            // `AND vss_search(${opts.query_field_name}, ?)
            // ORDER BY vss_search(${opts.query_field_name}, ?) DESC` +
            ` LIMIT ?
      `;
        const stmt = this.db.prepare(sql);
        stmt.bind([
            opts.query_table_name,
            // opts.query_input,
            // opts.query_input,
            opts.query_match_count,
        ]);
        const memories: Memory[] = [];
        while (stmt.step()) {
            const memory = stmt.getAsObject() as unknown as Memory;
            memories.push(memory);
        }
        stmt.free();

        return memories.map((memory) => ({
            ...memory,
            createdAt: memory.createdAt ?? Date.now(),
            embedding: JSON.parse(memory.embedding as unknown as string),
            levenshtein_score: 0,
        }));
    }

/**
 * Update the status of a goal in the database.
 * @param {Object} params - The parameters for updating the goal status.
 * @param {UUID} params.goalId - The ID of the goal to update.
 * @param {GoalStatus} params.status - The new status for the goal.
 * @returns {Promise<void>} - A promise that resolves when the status is updated.
 */
    async updateGoalStatus(params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void> {
        const sql = "UPDATE goals SET status = ? WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.run([params.status, params.goalId]);
        stmt.free();
    }

/**
 * Logs the provided data into the database.
 * 
 * @param {Object} params - The parameters for logging.
 * @param {Object} params.body - The data to be logged.
 * @param {UUID} params.userId - The ID of the user associated with the log.
 * @param {UUID} params.roomId - The ID of the room associated with the log.
 * @param {string} params.type - The type of the log.
 * @returns {Promise<void>} - A promise that resolves once the data is logged.
 */
    async log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        const sql =
            "INSERT INTO logs (body, userId, roomId, type) VALUES (?, ?, ?, ?)";
        const stmt = this.db.prepare(sql);
        stmt.run([
            JSON.stringify(params.body),
            params.userId,
            params.roomId,
            params.type,
        ]);
        stmt.free();
    }

/**
 * Retrieves memories based on the provided parameters.
 * 
 * @param {Object} params - The parameters for retrieving memories.
 * @param {UUID} params.roomId - The ID of the room for which memories are being retrieved.
 * @param {number} [params.count] - The maximum number of memories to retrieve.
 * @param {boolean} [params.unique] - Flag indicating whether to retrieve unique memories.
 * @param {string} params.tableName - The name of the table from which memories will be retrieved.
 * @param {UUID} [params.agentId] - The ID of the agent for filtering memories.
 * @param {number} [params.start] - The start timestamp for filtering memories.
 * @param {number} [params.end] - The end timestamp for filtering memories.
 * @returns {Promise<Memory[]>} - A Promise that resolves to an array of Memory objects based on the provided parameters.
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
        if (!params.tableName) {
            throw new Error("tableName is required");
        }
        if (!params.roomId) {
            throw new Error("roomId is required");
        }
        let sql = `SELECT * FROM memories WHERE type = ? AND roomId = ?`;

        if (params.start) {
            sql += ` AND createdAt >= ?`;
        }

        if (params.end) {
            sql += ` AND createdAt <= ?`;
        }

        if (params.unique) {
            sql += " AND `unique` = 1";
        }

        if (params.agentId) {
            sql += " AND agentId = ?";
        }

        sql += " ORDER BY createdAt DESC";

        if (params.count) {
            sql += " LIMIT ?";
        }

        const stmt = this.db.prepare(sql);
        stmt.bind([
            params.tableName,
            params.roomId,
            ...(params.start ? [params.start] : []),
            ...(params.end ? [params.end] : []),
            ...(params.agentId ? [params.agentId] : []),
            ...(params.count ? [params.count] : []),
        ]);
        const memories: Memory[] = [];
        while (stmt.step()) {
            const memory = stmt.getAsObject() as unknown as Memory;
            memories.push({
                ...memory,
                content: JSON.parse(memory.content as unknown as string),
            });
        }
        stmt.free();
        return memories;
    }

/**
 * Removes a memory from the database based on its ID and table name.
 * @param {UUID} memoryId - The ID of the memory to be removed.
 * @param {string} tableName - The name of the table where the memory is stored.
 * @returns {Promise<void>} - A Promise that resolves when the memory is successfully removed.
 */
    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
        const sql = `DELETE FROM memories WHERE type = ? AND id = ?`;
        const stmt = this.db.prepare(sql);
        stmt.run([tableName, memoryId]);
        stmt.free();
    }

/**
 * Removes all memories associated with a specific room.
 * 
 * @param {UUID} roomId - The ID of the room from which memories should be removed.
 * @param {string} tableName - The table name specifying the type of memories to be removed.
 * @returns {Promise<void>} A Promise that resolves when memories are successfully removed.
 */
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        const sql = `DELETE FROM memories WHERE type = ? AND roomId = ?`;
        const stmt = this.db.prepare(sql);
        stmt.run([tableName, roomId]);
        stmt.free();
    }

/**
 * Counts the number of memories with a given type and roomId in the database.
 * If unique is set to true, it will only count unique memories.
 * 
 * @param {UUID} roomId - The UUID of the room where memories are stored.
 * @param {boolean} [unique=true] - Flag to indicate whether to count unique memories only.
 * @param {string} [tableName=""] - The name of the table where memories are stored.
 * @returns {Promise<number>} The number of memories that match the criteria.
 * @throws {Error} If tableName is not provided.
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
        if (unique) {
            sql += " AND `unique` = 1";
        }

        const stmt = this.db.prepare(sql);
        stmt.bind([tableName, roomId]);

        let count = 0;
        if (stmt.step()) {
            const result = stmt.getAsObject() as { count: number };
            count = result.count;
        }

        stmt.free();
        return count;
    }

/**
 * Retrieves goals based on specified parameters.
 * 
 * @param {Object} params - The parameters for filtering goals.
 * @param {UUID} params.roomId - The room ID to filter goals by.
 * @param {UUID | null} [params.userId] - The optional user ID to filter goals by.
 * @param {boolean} [params.onlyInProgress] - Indicates whether only goals in progress should be returned.
 * @param {number} [params.count] - The maximum number of goals to return.
 * @returns {Promise<Goal[]>} An array of goals that match the specified parameters.
 */
    async getGoals(params: {
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        let sql = "SELECT * FROM goals WHERE roomId = ?";
        const bindings: (string | number)[] = [params.roomId];

        if (params.userId) {
            sql += " AND userId = ?";
            bindings.push(params.userId);
        }

        if (params.onlyInProgress) {
            sql += " AND status = 'IN_PROGRESS'";
        }

        if (params.count) {
            sql += " LIMIT ?";
            bindings.push(params.count.toString());
        }

        const stmt = this.db.prepare(sql);
        stmt.bind(bindings);
        const goals: Goal[] = [];
        while (stmt.step()) {
            const goal = stmt.getAsObject() as unknown as Goal;
            goals.push({
                ...goal,
                objectives:
                    typeof goal.objectives === "string"
                        ? JSON.parse(goal.objectives)
                        : goal.objectives,
            });
        }
        stmt.free();
        return goals;
    }

/**
* Asynchronously updates a goal in the database.
* @param {Goal} goal - The goal object to be updated.
* @returns {Promise<void>} - A promise that resolves when the update is complete.
*/
    async updateGoal(goal: Goal): Promise<void> {
        const sql =
            "UPDATE goals SET name = ?, status = ?, objectives = ? WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.run([
            goal.name,
            goal.status,
            JSON.stringify(goal.objectives),
            goal.id as string,
        ]);
        stmt.free();
    }

/**
 * Asynchronously creates a new goal in the database.
 * 
 * @param {Goal} goal - The goal object to be created.
 * @returns {Promise<void>} A promise that resolves when the goal is successfully created.
 */
    async createGoal(goal: Goal): Promise<void> {
        const sql =
            "INSERT INTO goals (id, roomId, userId, name, status, objectives) VALUES (?, ?, ?, ?, ?, ?)";
        const stmt = this.db.prepare(sql);
        stmt.run([
            goal.id ?? v4(),
            goal.roomId,
            goal.userId,
            goal.name,
            goal.status,
            JSON.stringify(goal.objectives),
        ]);
        stmt.free();
    }

/**
 * Remove a goal from the database based on its ID.
 * @param {UUID} goalId - The ID of the goal to be removed.
 * @returns {Promise<void>} A promise that resolves when the goal is successfully removed.
 */
    async removeGoal(goalId: UUID): Promise<void> {
        const sql = "DELETE FROM goals WHERE id = ?";
        const stmt = this.db.prepare(sql);
        stmt.run([goalId]);
        stmt.free();
    }

/**
 * Removes all goals associated with a specific room from the database.
 * @param {UUID} roomId - The unique identifier of the room to remove goals from.
 * @returns {Promise<void>} A Promise that resolves when the goals have been successfully removed.
 */
    async removeAllGoals(roomId: UUID): Promise<void> {
        const sql = "DELETE FROM goals WHERE roomId = ?";
        const stmt = this.db.prepare(sql);
        stmt.run([roomId]);
        stmt.free();
    }

/**
 * Asynchronously creates a new room in the database with the provided roomId, or generates a new UUID if none is provided. 
 * 
 * @param {UUID} [roomId] - The UUID of the room to be created. If not provided, a new UUID will be generated.
 * @returns {Promise<UUID>} - The UUID of the newly created room.
 */
    async createRoom(roomId?: UUID): Promise<UUID> {
        roomId = roomId || (v4() as UUID);
        try {
            const sql = "INSERT INTO rooms (id) VALUES (?)";
            const stmt = this.db.prepare(sql);
            stmt.run([roomId ?? (v4() as UUID)]);
            stmt.free();
        } catch (error) {
            elizaLogger.error("Error creating room", error);
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
        const stmt = this.db.prepare(sql);
        stmt.run([roomId]);
        stmt.free();
    }

/**
 * Asynchronously retrieves the list of room IDs that a particular user is a participant of.
 * 
 * @param {UUID} userId - The unique identifier of the user.
 * @returns {Promise<UUID[]>} A promise that resolves to an array of room IDs that the user is a participant of.
 */
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        const sql = "SELECT roomId FROM participants WHERE userId = ?";
        const stmt = this.db.prepare(sql);
        stmt.bind([userId]);
        const rows: { roomId: string }[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as unknown as { roomId: string };
            rows.push(row);
        }
        stmt.free();
        return rows.map((row) => row.roomId as UUID);
    }

/**
 * Retrieves a list of room IDs for the given participants' user IDs.
 * @param {UUID[]} userIds - An array of UUID strings representing user IDs.
 * @returns {Promise<UUID[]>} - A Promise resolving to an array of UUID strings representing room IDs.
 */
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        // Assuming userIds is an array of UUID strings, prepare a list of placeholders
        const placeholders = userIds.map(() => "?").join(", ");
        // Construct the SQL query with the correct number of placeholders
        const sql = `SELECT roomId FROM participants WHERE userId IN (${placeholders})`;
        const stmt = this.db.prepare(sql);
        // Execute the query with the userIds array spread into arguments
        stmt.bind(userIds);
        const rows: { roomId: string }[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as unknown as { roomId: string };
            rows.push(row);
        }
        stmt.free();
        // Map and return the roomId values as UUIDs
        return rows.map((row) => row.roomId as UUID);
    }

/**
 * Asynchronously adds a participant to a room.
 * 
 * @param {UUID} userId The UUID of the user to be added as a participant.
 * @param {UUID} roomId The UUID of the room to add the user as a participant.
 * @returns {Promise<boolean>} A Promise that resolves to true if the participant was successfully added, or false if an error occurred.
 */
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            const sql =
                "INSERT INTO participants (id, userId, roomId) VALUES (?, ?, ?)";
            const stmt = this.db.prepare(sql);
            stmt.run([v4(), userId, roomId]);
            stmt.free();
            return true;
        } catch (error) {
            elizaLogger.error("Error adding participant", error);
            return false;
        }
    }

/**
 * Removes a participant from a room.
 * 
 * @param {UUID} userId - The ID of the user to remove.
 * @param {UUID} roomId - The ID of the room from which to remove the participant.
 * @returns {Promise<boolean>} - Returns a boolean indicating whether the participant was successfully removed.
 */
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            const sql =
                "DELETE FROM participants WHERE userId = ? AND roomId = ?";
            const stmt = this.db.prepare(sql);
            stmt.run([userId, roomId]);
            stmt.free();
            return true;
        } catch (error) {
            elizaLogger.error("Error removing participant", error);
            return false;
        }
    }

/**
 * Create a new relationship between two users in the database.
 * 
 * @param {Object} params - The parameters for creating the relationship.
 * @param {UUID} params.userA - The ID of the first user.
 * @param {UUID} params.userB - The ID of the second user.
 * @returns {Promise<boolean>} - Indicates if the relationship creation was successful.
 * @throws {Error} - If userA or userB are not provided.
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
        const stmt = this.db.prepare(sql);
        stmt.run([v4(), params.userA, params.userB, params.userA]);
        stmt.free();
        return true;
    }

/**
 * Asynchronously retrieves the relationship between two users from the database.
 * 
 * @param {Object} params - The parameters object.
 * @param {UUID} params.userA - The UUID of the first user.
 * @param {UUID} params.userB - The UUID of the second user.
 * @returns {Promise<Relationship | null>} The relationship between the two users, or null if not found.
 */
    async getRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null> {
        let relationship: Relationship | null = null;
        try {
            const sql =
                "SELECT * FROM relationships WHERE (userA = ? AND userB = ?) OR (userA = ? AND userB = ?)";
            const stmt = this.db.prepare(sql);
            stmt.bind([params.userA, params.userB, params.userB, params.userA]);

            if (stmt.step()) {
                relationship = stmt.getAsObject() as unknown as Relationship;
            }
            stmt.free();
        } catch (error) {
            elizaLogger.error("Error fetching relationship", error);
        }
        return relationship;
    }

/**
 * Retrieves relationships for a specific user based on the provided userId.
 * @param {Object} params - The parameters for the query.
 * @param {UUID} params.userId - The UUID of the user to retrieve relationships for.
 * @returns {Promise<Relationship[]>} The relationships associated with the provided userId.
 */
    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        const sql =
            "SELECT * FROM relationships WHERE (userA = ? OR userB = ?)";
        const stmt = this.db.prepare(sql);
        stmt.bind([params.userId, params.userId]);
        const relationships: Relationship[] = [];
        while (stmt.step()) {
            const relationship = stmt.getAsObject() as unknown as Relationship;
            relationships.push(relationship);
        }
        stmt.free();
        return relationships;
    }

/**
 * Asynchronously retrieves the value from the cache with the specified key and agentId.
 * 
 * @param {Object} params - The parameters for retrieving the cache value.
 * @param {string} params.key - The key of the cache entry to retrieve.
 * @param {UUID} params.agentId - The ID of the agent associated with the cache entry.
 * @returns {Promise<string | undefined>} The value of the cache entry, or undefined if not found.
 */
    async getCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<string | undefined> {
        const sql = "SELECT value FROM cache WHERE (key = ? AND agentId = ?)";
        const stmt = this.db.prepare(sql);

        stmt.bind([params.key, params.agentId]);

        let cached: { value: string } | undefined = undefined;
        if (stmt.step()) {
            cached = stmt.getAsObject() as unknown as { value: string };
        }
        stmt.free();

        return cached?.value ?? undefined;
    }

/**
 * Async function to set a value in the cache table.
 * 
 * @param {object} params - The parameters for setting the cache value.
 * @param {string} params.key - The key for the cache entry.
 * @param {UUID} params.agentId - The agent ID associated with the cache entry.
 * @param {string} params.value - The value to cache.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the cache value was successfully set.
 */
    async setCache(params: {
        key: string;
        agentId: UUID;
        value: string;
    }): Promise<boolean> {
        const sql =
            "INSERT OR REPLACE INTO cache (key, agentId, value, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
        const stmt = this.db.prepare(sql);

        stmt.run([params.key, params.agentId, params.value]);
        stmt.free();

        return true;
    }

/**
 * Asynchronously deletes a cache entry from the database.
 * 
 * @param {Object} params - The parameters for deleting the cache entry.
 * @param {string} params.key - The key of the cache entry to be deleted.
 * @param {UUID} params.agentId - The ID of the agent associated with the cache entry.
 * @returns {Promise<boolean>} A promise that resolves to true if the cache entry was successfully deleted, false otherwise.
 */
    async deleteCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<boolean> {
        try {
            const sql = "DELETE FROM cache WHERE key = ? AND agentId = ?";
            const stmt = this.db.prepare(sql);
            stmt.run([params.key, params.agentId]);
            stmt.free();
            return true;
        } catch (error) {
            elizaLogger.error("Error removing cache", error);
            return false;
        }
    }

/**
 * Retrieves knowledge items from the database based on the provided criteria.
 * @param {Object} params - The parameters for fetching knowledge items.
 * @param {UUID} [params.id] - The optional ID of the knowledge item to retrieve.
 * @param {UUID} params.agentId - The ID of the agent to retrieve knowledge items for.
 * @param {number} [params.limit] - The maximum number of knowledge items to retrieve.
 * @param {string} [params.query] - The optional query string to filter knowledge items.
 * @returns {Promise<RAGKnowledgeItem[]>} - A Promise that resolves to an array of knowledge items matching the criteria.
 */
    async getKnowledge(params: {
        id?: UUID;
        agentId: UUID;
        limit?: number;
        query?: string;
    }): Promise<RAGKnowledgeItem[]> {
        let sql = `SELECT * FROM knowledge WHERE ("agentId" = ? OR "isShared" = 1)`;
        const queryParams: any[] = [params.agentId];

        if (params.id) {
            sql += ` AND id = ?`;
            queryParams.push(params.id);
        }

        if (params.limit) {
            sql += ` LIMIT ?`;
            queryParams.push(params.limit);
        }

        const stmt = this.db.prepare(sql);
        stmt.bind(queryParams);
        const results: RAGKnowledgeItem[] = [];

        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
            results.push({
                id: row.id,
                agentId: row.agentId,
                content: JSON.parse(row.content),
                embedding: row.embedding ? new Float32Array(row.embedding) : undefined, // Convert Uint8Array back to Float32Array
                createdAt: row.createdAt
            });
        }
        stmt.free();
        return results;
    }

/**
 * Asynchronously search for knowledge items based on the provided parameters.
 * @param {Object} params - The search parameters.
 * @param {UUID} params.agentId - The ID of the agent performing the search.
 * @param {Float32Array} params.embedding - The embedding for similarity comparison.
 * @param {number} params.match_threshold - The threshold for matching similarity.
 * @param {number} params.match_count - The maximum number of matching results to return.
 * @param {string} [params.searchText] - The optional search text to filter results.
 * @returns {Promise<RAGKnowledgeItem[]>} The array of knowledge items matching the search criteria.
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

        let sql = `
            WITH vector_scores AS (
                SELECT id,
                        1 / (1 + vec_distance_L2(embedding, ?)) as vector_score
                FROM knowledge
                WHERE ("agentId" IS NULL AND "isShared" = 1) OR "agentId" = ?
                AND embedding IS NOT NULL
            ),
            keyword_matches AS (
                SELECT id,
                CASE
                    WHEN json_extract(content, '$.text') LIKE ? THEN 3.0
                    ELSE 1.0
                END *
                CASE
                    WHEN json_extract(content, '$.metadata.isChunk') = 1 THEN 1.5
                    WHEN json_extract(content, '$.metadata.isMain') = 1 THEN 1.2
                    ELSE 1.0
                END as keyword_score
                FROM knowledge
                WHERE ("agentId" IS NULL AND "isShared" = 1) OR "agentId" = ?
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

        const stmt = this.db.prepare(sql);
        stmt.bind([
            new Uint8Array(params.embedding.buffer),
            params.agentId,
            `%${params.searchText || ''}%`,
            params.agentId,
            params.agentId,
            params.match_threshold,
            params.match_count
        ]);

        const results: RAGKnowledgeItem[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject() as any;
            results.push({
                id: row.id,
                agentId: row.agentId,
                content: JSON.parse(row.content),
                embedding: row.embedding ? new Float32Array(row.embedding) : undefined,
                createdAt: row.createdAt,
                similarity: row.keyword_score
            });
        }
        stmt.free();

        await this.setCache({
            key: cacheKey,
            agentId: params.agentId,
            value: JSON.stringify(results)
        });

        return results;
    }

/**
 * Creates a new knowledge item in the database.
 * 
 * @param {RAGKnowledgeItem} knowledge The knowledge item to be created.
 * @returns {Promise<void>} A promise that resolves when the knowledge item is successfully created.
 */
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        try {
            const sql = `
                INSERT INTO knowledge (
                    id, "agentId", content, embedding, "createdAt",
                    "isMain", "originalId", "chunkIndex", "isShared"
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const stmt = this.db.prepare(sql);
            const metadata = knowledge.content.metadata || {};

            stmt.run([
                knowledge.id,
                metadata.isShared ? null : knowledge.agentId,
                JSON.stringify(knowledge.content),
                knowledge.embedding ? new Uint8Array(knowledge.embedding.buffer) : null,
                knowledge.createdAt || Date.now(),
                metadata.isMain ? 1 : 0,
                metadata.originalId || null,
                metadata.chunkIndex || null,
                metadata.isShared ? 1 : 0
            ]);
            stmt.free();
        } catch (error: any) {
            const isShared = knowledge.content.metadata?.isShared;
            const isPrimaryKeyError = error?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY';

            if (isShared && isPrimaryKeyError) {
                elizaLogger.info(`Shared knowledge ${knowledge.id} already exists, skipping`);
                return;
            } else if (!isShared && !error.message?.includes('SQLITE_CONSTRAINT_PRIMARYKEY')) {
                elizaLogger.error(`Error creating knowledge ${knowledge.id}:`, {
                    error,
                    embeddingLength: knowledge.embedding?.length,
                    content: knowledge.content
                });
                throw error;
            }

            elizaLogger.debug(`Knowledge ${knowledge.id} already exists, skipping`);
        }
    }

/**
 * Removes knowledge by its ID from the database.
 * 
 * @param {UUID} id - The ID of the knowledge to be removed.
 * @returns {Promise<void>} A Promise that resolves when the knowledge is successfully removed.
 */
    async removeKnowledge(id: UUID): Promise<void> {
        const sql = `DELETE FROM knowledge WHERE id = ?`;
        const stmt = this.db.prepare(sql);
        stmt.run([id]);
        stmt.free();
    }

/**
 * Clear knowledge from the database for a specific agent.
 * @param {UUID} agentId - The unique identifier of the agent.
 * @param {boolean} [shared] - Optional parameter to specify whether to clear shared knowledge as well.
 * @returns {Promise<void>} A Promise that resolves once the knowledge is cleared.
 */
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        const sql = shared ?
            `DELETE FROM knowledge WHERE ("agentId" = ? OR "isShared" = 1)` :
            `DELETE FROM knowledge WHERE "agentId" = ?`;

        const stmt = this.db.prepare(sql);
        stmt.run([agentId]);
        stmt.free();
    }
}
