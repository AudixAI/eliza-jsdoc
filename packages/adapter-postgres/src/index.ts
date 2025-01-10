import { v4 } from "uuid";

// Import the entire module as default
import pg from "pg";
/**
 * Represents an alias for the pg.Pool type.
 */
type Pool = pg.Pool;

import {
    QueryConfig,
    QueryConfigValues,
    QueryResult,
    QueryResultRow,
} from "pg";
import {
    Account,
    Actor,
    GoalStatus,
    type Goal,
    type Memory,
    type Relationship,
    type UUID,
    type IDatabaseCacheAdapter,
    Participant,
    elizaLogger,
    getEmbeddingConfig,
    DatabaseAdapter,
    EmbeddingProvider,
    RAGKnowledgeItem
} from "@elizaos/core";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

/**
 * A database adapter for PostgreSQL that extends DatabaseAdapter<Pool> and implements IDatabaseCacheAdapter.
 * * @class PostgresDatabaseAdapter
 * @extends DatabaseAdapter<Pool>
 * @implements IDatabaseCacheAdapter
 */
export class PostgresDatabaseAdapter
    extends DatabaseAdapter<Pool>
    implements IDatabaseCacheAdapter
{
    private pool: Pool;
    private readonly maxRetries: number = 3;
    private readonly baseDelay: number = 1000; // 1 second
    private readonly maxDelay: number = 10000; // 10 seconds
    private readonly jitterMax: number = 1000; // 1 second
    private readonly connectionTimeout: number = 5000; // 5 seconds

/**
 * Constructs a new instance of the class with the provided connection configuration.
 * Initializes a connection pool using the provided configuration options and default values.
 * Sets up error handling for the pool and tests the connection upon initialization.
 * @param {any} connectionConfig - The configuration options to be used for establishing the connection pool.
 */
    constructor(connectionConfig: any) {
        super({
            //circuitbreaker stuff
            failureThreshold: 5,
            resetTimeout: 60000,
            halfOpenMaxAttempts: 3,
        });

        const defaultConfig = {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: this.connectionTimeout,
        };

        this.pool = new pg.Pool({
            ...defaultConfig,
            ...connectionConfig, // Allow overriding defaults
        });

        this.pool.on("error", (err) => {
            elizaLogger.error("Unexpected pool error", err);
            this.handlePoolError(err);
        });

        this.setupPoolErrorHandling();
        this.testConnection();
    }

/**
 * Sets up error handling for the connection pool.
 * 
 * Handles the "SIGINT", "SIGTERM", and "beforeExit" events by calling the cleanup method.
 * 
 * @private
 */
    private setupPoolErrorHandling() {
        process.on("SIGINT", async () => {
            await this.cleanup();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            await this.cleanup();
            process.exit(0);
        });

        process.on("beforeExit", async () => {
            await this.cleanup();
        });
    }

/**
 * Executes a given operation with circuit breaker and retry functionality.
 * @template T
 * @param {() => Promise<T>} operation - The operation to be executed.
 * @param {string} context - The context in which the operation is being executed.
 * @returns {Promise<T>} A Promise that resolves to the result of the operation.
 */ 

    private async withDatabase<T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T> {
        return this.withCircuitBreaker(async () => {
            return this.withRetry(operation);
        }, context);
    }

/**
 * Executes the provided asynchronous operation with retry logic.
 *
 * @template T - The type of the operation's return value.
 * @param {() => Promise<T>} operation - The asynchronous operation to be executed.
 * @returns {Promise<T>} - A promise that resolves with the result of the operation on success.
 * @throws {Error} - Throws the last encountered error if all retry attempts fail.
 */
    private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: Error = new Error("Unknown error"); // Initialize with default

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt < this.maxRetries) {
                    // Calculate delay with exponential backoff
                    const backoffDelay = Math.min(
                        this.baseDelay * Math.pow(2, attempt - 1),
                        this.maxDelay
                    );

                    // Add jitter to prevent thundering herd
                    const jitter = Math.random() * this.jitterMax;
                    const delay = backoffDelay + jitter;

                    elizaLogger.warn(
                        `Database operation failed (attempt ${attempt}/${this.maxRetries}):`,
                        {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                            nextRetryIn: `${(delay / 1000).toFixed(1)}s`,
                        }
                    );

                    await new Promise((resolve) => setTimeout(resolve, delay));
                } else {
                    elizaLogger.error("Max retry attempts reached:", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        totalAttempts: attempt,
                    });
                    throw error instanceof Error
                        ? error
                        : new Error(String(error));
                }
            }
        }

        throw lastError;
    }

/**
 * Handles a connection error with the pool by attempting to reconnect.
 * 
 * @param {Error} error - The error that triggered the reconnection attempt.
 * @throws {Error} If unable to reconnect the pool.
 */
    private async handlePoolError(error: Error) {
        elizaLogger.error("Pool error occurred, attempting to reconnect", {
            error: error.message,
        });

        try {
            // Close existing pool
            await this.pool.end();

            // Create new pool
            this.pool = new pg.Pool({
                ...this.pool.options,
                connectionTimeoutMillis: this.connectionTimeout,
            });

            await this.testConnection();
            elizaLogger.success("Pool reconnection successful");
        } catch (reconnectError) {
            elizaLogger.error("Failed to reconnect pool", {
                error:
                    reconnectError instanceof Error
                        ? reconnectError.message
                        : String(reconnectError),
            });
            throw reconnectError;
        }
    }

/**
 * Execute a SQL query on the database.
 * 
 * @param {string | QueryConfig<I>} queryTextOrConfig - The SQL query to execute or an object containing the query and parameters.
 * @param {QueryConfigValues<I>} [values] - The values to substitute in the query.
 * @returns {Promise<QueryResult<R>>} A promise that resolves to the result of the SQL query.
 */
    async query<R extends QueryResultRow = any, I = any[]>(
        queryTextOrConfig: string | QueryConfig<I>,
        values?: QueryConfigValues<I>
    ): Promise<QueryResult<R>> {
        return this.withDatabase(async () => {
            return await this.pool.query(queryTextOrConfig, values);
        }, "query");
    }

/**
 * Asynchronously validates the setup for the 'vector' extension in the database.
 * 
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating if the setup is valid.
 */
    private async validateVectorSetup(): Promise<boolean> {
        try {
            const vectorExt = await this.query(`
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            `);
            const hasVector = vectorExt.rows.length > 0;

            if (!hasVector) {
                elizaLogger.error("Vector extension not found in database");
                return false;
            }

            return true;
        } catch (error) {
            elizaLogger.error("Failed to validate vector extension:", {
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }

/**
 * Initializes the application by setting up the database connection, application settings, and database schema.
 * 
 * @returns {Promise<void>} A Promise that resolves once the initialization process is complete.
 */
    async init() {
        await this.testConnection();

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            // Set application settings for embedding dimension
            const embeddingConfig = getEmbeddingConfig();
            if (embeddingConfig.provider === EmbeddingProvider.OpenAI) {
                await client.query("SET app.use_openai_embedding = 'true'");
                await client.query("SET app.use_ollama_embedding = 'false'");
                await client.query("SET app.use_gaianet_embedding = 'false'");
            } else if (embeddingConfig.provider === EmbeddingProvider.Ollama) {
                await client.query("SET app.use_openai_embedding = 'false'");
                await client.query("SET app.use_ollama_embedding = 'true'");
                await client.query("SET app.use_gaianet_embedding = 'false'");
            } else if (embeddingConfig.provider === EmbeddingProvider.GaiaNet) {
                await client.query("SET app.use_openai_embedding = 'false'");
                await client.query("SET app.use_ollama_embedding = 'false'");
                await client.query("SET app.use_gaianet_embedding = 'true'");
            } else {
                await client.query("SET app.use_openai_embedding = 'false'");
                await client.query("SET app.use_ollama_embedding = 'false'");
            }

            // Check if schema already exists (check for a core table)
            const { rows } = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'rooms'
                );
            `);

            if (!rows[0].exists || !await this.validateVectorSetup()) {
                elizaLogger.info("Applying database schema - tables or vector extension missing");
                const schema = fs.readFileSync(
                    path.resolve(__dirname, "../schema.sql"),
                    "utf8"
                );
                await client.query(schema);
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

/**
 * Asynchronously closes the connection pool.
 */
    async close() {
        await this.pool.end();
    }

/**
 * Tests the database connection by executing a query to select the current date and time.
 * Logs success if the connection test is successful, otherwise logs the error.
 * @returns {Promise<boolean>} A Promise that resolves to true if the connection test is successful, otherwise rejects with an error message.
 */
    async testConnection(): Promise<boolean> {
        let client;
        try {
            client = await this.pool.connect();
            const result = await client.query("SELECT NOW()");
            elizaLogger.success(
                "Database connection test successful:",
                result.rows[0]
            );
            return true;
        } catch (error) {
            elizaLogger.error("Database connection test failed:", error);
            throw new Error(
                `Failed to connect to database: ${(error as Error).message}`
            );
        } finally {
            if (client) client.release();
        }
    }

/**
 * Asynchronously cleans up resources by ending the database pool. 
 * 
 * @returns {Promise<void>} A Promise that resolves once the database pool has been successfully closed.
 */
    async cleanup(): Promise<void> {
        try {
            await this.pool.end();
            elizaLogger.info("Database pool closed");
        } catch (error) {
            elizaLogger.error("Error closing database pool:", error);
        }
    }

/**
 * Retrieve the room ID from the database based on the specified room ID.
 *
 * @param {UUID} roomId - The UUID of the room to retrieve.
 * @returns {Promise<UUID | null>} The room ID if found in the database, otherwise null.
 */
    async getRoom(roomId: UUID): Promise<UUID | null> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                "SELECT id FROM rooms WHERE id = $1",
                [roomId]
            );
            return rows.length > 0 ? (rows[0].id as UUID) : null;
        }, "getRoom");
    }

/**
 * Asynchronously retrieves participants for a given account based on the provided user ID.
 * 
 * @param {UUID} userId - The unique identifier of the user account to retrieve participants for.
 * @returns {Promise<Participant[]>} A Promise that resolves to an array of Participant objects representing the participants associated with the specified user account.
 */
    async getParticipantsForAccount(userId: UUID): Promise<Participant[]> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                `SELECT id, "userId", "roomId", "last_message_read"
                FROM participants
                WHERE "userId" = $1`,
                [userId]
            );
            return rows as Participant[];
        }, "getParticipantsForAccount");
    }

/**
 * Retrieves the user state of a participant in a specific room.
 * @param {UUID} roomId - The UUID of the room.
 * @param {UUID} userId - The UUID of the user.
 * @returns {Promise<"FOLLOWED" | "MUTED" | null>} - The user state of the participant: "FOLLOWED", "MUTED", or null if not found.
 */
    async getParticipantUserState(
        roomId: UUID,
        userId: UUID
    ): Promise<"FOLLOWED" | "MUTED" | null> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                `SELECT "userState" FROM participants WHERE "roomId" = $1 AND "userId" = $2`,
                [roomId, userId]
            );
            return rows.length > 0 ? rows[0].userState : null;
        }, "getParticipantUserState");
    }

/**
 * Retrieves memories based on room IDs.
 * 
 * @param {Object} params - The parameters for fetching memories.
 * @param {UUID[]} params.roomIds - The list of room IDs to fetch memories for.
 * @param {UUID} [params.agentId] - The agent ID to filter memories by.
 * @param {string} params.tableName - The name of the table where memories are stored.
 * @returns {Promise<Memory[]>} - A promise that resolves to an array of memories.
 */
    async getMemoriesByRoomIds(params: {
        roomIds: UUID[];
        agentId?: UUID;
        tableName: string;
    }): Promise<Memory[]> {
        return this.withDatabase(async () => {
            if (params.roomIds.length === 0) return [];
            const placeholders = params.roomIds
                .map((_, i) => `$${i + 2}`)
                .join(", ");

            let query = `SELECT * FROM memories WHERE type = $1 AND "roomId" IN (${placeholders})`;
            let queryParams = [params.tableName, ...params.roomIds];

            if (params.agentId) {
                query += ` AND "agentId" = $${params.roomIds.length + 2}`;
                queryParams = [...queryParams, params.agentId];
            }

            const { rows } = await this.pool.query(query, queryParams);
            return rows.map((row) => ({
                ...row,
                content:
                    typeof row.content === "string"
                        ? JSON.parse(row.content)
                        : row.content,
            }));
        }, "getMemoriesByRoomIds");
    }

/**
 * Set the user state for a participant in a room.
 * 
 * @param {UUID} roomId - The ID of the room.
 * @param {UUID} userId - The ID of the user.
 * @param {"FOLLOWED" | "MUTED" | null} state - The state to set for the user ("FOLLOWED"/"MUTED" or null).
 * @returns {Promise<void>} - A Promise that resolves when the user state has been updated.
 */
    async setParticipantUserState(
        roomId: UUID,
        userId: UUID,
        state: "FOLLOWED" | "MUTED" | null
    ): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query(
                `UPDATE participants SET "userState" = $1 WHERE "roomId" = $2 AND "userId" = $3`,
                [state, roomId, userId]
            );
        }, "setParticipantUserState");
    }

/**
 * Retrieves a list of participant UUIDs for a given room ID from the database.
 *
 * @param {UUID} roomId - The UUID of the room to retrieve participants for.
 * @returns {Promise<UUID[]>} A Promise that resolves with an array of participant UUIDs.
 */
    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                'SELECT "userId" FROM participants WHERE "roomId" = $1',
                [roomId]
            );
            return rows.map((row) => row.userId);
        }, "getParticipantsForRoom");
    }

/**
 * Retrieves an account by the specified user ID.
 * @param {UUID} userId - The ID of the user account to retrieve.
 * @returns {Promise<Account | null>} The account object if found, otherwise null.
 */
    async getAccountById(userId: UUID): Promise<Account | null> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                "SELECT * FROM accounts WHERE id = $1",
                [userId]
            );
            if (rows.length === 0) {
                elizaLogger.debug("Account not found:", { userId });
                return null;
            }

            const account = rows[0];
            // elizaLogger.debug("Account retrieved:", {
            //     userId,
            //     hasDetails: !!account.details,
            // });

            return {
                ...account,
                details:
                    typeof account.details === "string"
                        ? JSON.parse(account.details)
                        : account.details,
            };
        }, "getAccountById");
    }

/**
 * Creates a new account in the database.
 * 
 * @param {Account} account - The account object to be created.
 * @returns {Promise<boolean>} A boolean representing whether the account was created successfully.
 */
    async createAccount(account: Account): Promise<boolean> {
        return this.withDatabase(async () => {
            try {
                const accountId = account.id ?? v4();
                await this.pool.query(
                    `INSERT INTO accounts (id, name, username, email, "avatarUrl", details)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        accountId,
                        account.name,
                        account.username || "",
                        account.email || "",
                        account.avatarUrl || "",
                        JSON.stringify(account.details),
                    ]
                );
                elizaLogger.debug("Account created successfully:", {
                    accountId,
                });
                return true;
            } catch (error) {
                elizaLogger.error("Error creating account:", {
                    error:
                        error instanceof Error ? error.message : String(error),
                    accountId: account.id,
                    name: account.name, // Only log non-sensitive fields
                });
                return false; // Return false instead of throwing to maintain existing behavior
            }
        }, "createAccount");
    }

/**
 * Retrieves actors associated with a specific room by roomId.
 * @param {object} params - The parameters for the query.
 * @param {string} params.roomId - The UUID of the room to retrieve actors for.
 * @returns {Promise<Actor[]>} A Promise that resolves with an array of Actor objects.
 */
    async getActorById(params: { roomId: UUID }): Promise<Actor[]> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                `SELECT a.id, a.name, a.username, a.details
                FROM participants p
                LEFT JOIN accounts a ON p."userId" = a.id
                WHERE p."roomId" = $1`,
                [params.roomId]
            );

            elizaLogger.debug("Retrieved actors:", {
                roomId: params.roomId,
                actorCount: rows.length,
            });

            return rows.map((row) => {
                try {
                    return {
                        ...row,
                        details:
                            typeof row.details === "string"
                                ? JSON.parse(row.details)
                                : row.details,
                    };
                } catch (error) {
                    elizaLogger.warn("Failed to parse actor details:", {
                        actorId: row.id,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                    return {
                        ...row,
                        details: {}, // Provide default empty details on parse error
                    };
                }
            });
        }, "getActorById").catch((error) => {
            elizaLogger.error("Failed to get actors:", {
                roomId: params.roomId,
                error: error.message,
            });
            throw error; // Re-throw to let caller handle database errors
        });
    }

/**
 * Retrieves a memory from the database by its unique identifier.
 * 
 * @param {UUID} id - The unique identifier of the memory to retrieve.
 * @returns {Promise<Memory | null>} The memory object if found, otherwise null.
 */
    async getMemoryById(id: UUID): Promise<Memory | null> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                "SELECT * FROM memories WHERE id = $1",
                [id]
            );
            if (rows.length === 0) return null;

            return {
                ...rows[0],
                content:
                    typeof rows[0].content === "string"
                        ? JSON.parse(rows[0].content)
                        : rows[0].content,
            };
        }, "getMemoryById");
    }

/**
     * Create a memory in the database.
     * @param {Memory} memory - The memory object to be created.
     * @param {string} tableName - The name of the table to insert the memory into.
     * @returns {Promise<void>} A Promise that resolves once the memory is created.
     */
    async createMemory(memory: Memory, tableName: string): Promise<void> {
        return this.withDatabase(async () => {
            elizaLogger.debug("PostgresAdapter createMemory:", {
                memoryId: memory.id,
                embeddingLength: memory.embedding?.length,
                contentLength: memory.content?.text?.length,
            });

            let isUnique = true;
            if (memory.embedding) {
                const similarMemories = await this.searchMemoriesByEmbedding(
                    memory.embedding,
                    {
                        tableName,
                        roomId: memory.roomId,
                        match_threshold: 0.95,
                        count: 1,
                    }
                );
                isUnique = similarMemories.length === 0;
            }

            await this.pool.query(
                `INSERT INTO memories (
                    id, type, content, embedding, "userId", "roomId", "agentId", "unique", "createdAt"
                ) VALUES ($1, $2, $3, $4, $5::uuid, $6::uuid, $7::uuid, $8, to_timestamp($9/1000.0))`,
                [
                    memory.id ?? v4(),
                    tableName,
                    JSON.stringify(memory.content),
                    memory.embedding ? `[${memory.embedding.join(",")}]` : null,
                    memory.userId,
                    memory.roomId,
                    memory.agentId,
                    memory.unique ?? isUnique,
                    Date.now(),
                ]
            );
        }, "createMemory");
    }

/**
 * Asynchronously search for memories with the specified parameters.
 * 
 * @param {Object} params - The parameters for the memory search.
 * @param {string} params.tableName - The name of the table to search in.
 * @param {UUID} params.agentId - The ID of the agent associated with the memories.
 * @param {UUID} params.roomId - The ID of the room associated with the memories.
 * @param {number[]} params.embedding - The embedding vector used for matching memories.
 * @param {number} params.match_threshold - The threshold for matching similarity.
 * @param {number} params.match_count - The maximum number of memories to match.
 * @param {boolean} params.unique - Flag indicating whether to return unique memories only.
 * @returns {Promise<Memory[]>} - A promise that resolves to an array of Memory objects matching the search criteria.
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
        return await this.searchMemoriesByEmbedding(params.embedding, {
            match_threshold: params.match_threshold,
            count: params.match_count,
            agentId: params.agentId,
            roomId: params.roomId,
            unique: params.unique,
            tableName: params.tableName,
        });
    }

/**
 * Asynchronously fetch memories from the database based on the provided parameters.
 * 
 * @param {Object} params - The parameters for fetching memories.
 * @param {UUID} params.roomId - The ID of the room for which memories are being fetched.
 * @param {number} [params.count] - The maximum number of memories to fetch.
 * @param {boolean} [params.unique] - Flag to fetch unique memories only.
 * @param {string} params.tableName - The name of the table containing the memories.
 * @param {UUID} [params.agentId] - The ID of the agent whose memories are being fetched.
 * @param {number} [params.start] - The start timestamp for fetching memories within a range.
 * @param {number} [params.end] - The end timestamp for fetching memories within a range.
 * @returns {Promise<Memory[]>} - A Promise that resolves to an array of Memory objects fetched from the database.
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
        // Parameter validation
        if (!params.tableName) throw new Error("tableName is required");
        if (!params.roomId) throw new Error("roomId is required");

        return this.withDatabase(async () => {
            // Build query
            let sql = `SELECT * FROM memories WHERE type = $1 AND "roomId" = $2`;
            const values: any[] = [params.tableName, params.roomId];
            let paramCount = 2;

            // Add time range filters
            if (params.start) {
                paramCount++;
                sql += ` AND "createdAt" >= to_timestamp($${paramCount})`;
                values.push(params.start / 1000);
            }

            if (params.end) {
                paramCount++;
                sql += ` AND "createdAt" <= to_timestamp($${paramCount})`;
                values.push(params.end / 1000);
            }

            // Add other filters
            if (params.unique) {
                sql += ` AND "unique" = true`;
            }

            if (params.agentId) {
                paramCount++;
                sql += ` AND "agentId" = $${paramCount}`;
                values.push(params.agentId);
            }

            // Add ordering and limit
            sql += ' ORDER BY "createdAt" DESC';

            if (params.count) {
                paramCount++;
                sql += ` LIMIT $${paramCount}`;
                values.push(params.count);
            }

            elizaLogger.debug("Fetching memories:", {
                roomId: params.roomId,
                tableName: params.tableName,
                unique: params.unique,
                agentId: params.agentId,
                timeRange:
                    params.start || params.end
                        ? {
                              start: params.start
                                  ? new Date(params.start).toISOString()
                                  : undefined,
                              end: params.end
                                  ? new Date(params.end).toISOString()
                                  : undefined,
                          }
                        : undefined,
                limit: params.count,
            });

            const { rows } = await this.pool.query(sql, values);
            return rows.map((row) => ({
                ...row,
                content:
                    typeof row.content === "string"
                        ? JSON.parse(row.content)
                        : row.content,
            }));
        }, "getMemories");
    }

/**
 * Retrieves goals based on the specified parameters.
 * 
 * @param {Object} params - The parameters for retrieving goals.
 * @param {UUID} params.roomId - The UUID of the room to retrieve goals from.
 * @param {UUID | null} [params.userId] - The UUID of the user to filter goals by. Optional.
 * @param {boolean} [params.onlyInProgress] - Flag to filter goals by those in progress. Optional.
 * @param {number} [params.count] - The maximum number of goals to retrieve. Optional.
 * @returns {Promise<Goal[]>} A promise that resolves with an array of goals matching the specified parameters.
 */
    async getGoals(params: {
        roomId: UUID;
        userId?: UUID | null;
        onlyInProgress?: boolean;
        count?: number;
    }): Promise<Goal[]> {
        return this.withDatabase(async () => {
            let sql = `SELECT * FROM goals WHERE "roomId" = $1`;
            const values: any[] = [params.roomId];
            let paramCount = 1;

            if (params.userId) {
                paramCount++;
                sql += ` AND "userId" = $${paramCount}`;
                values.push(params.userId);
            }

            if (params.onlyInProgress) {
                sql += " AND status = 'IN_PROGRESS'";
            }

            if (params.count) {
                paramCount++;
                sql += ` LIMIT $${paramCount}`;
                values.push(params.count);
            }

            const { rows } = await this.pool.query(sql, values);
            return rows.map((row) => ({
                ...row,
                objectives:
                    typeof row.objectives === "string"
                        ? JSON.parse(row.objectives)
                        : row.objectives,
            }));
        }, "getGoals");
    }

/**
 * Asynchronously updates a goal in the database.
 * 
 * @param {Goal} goal - The goal object to update.
 * @returns {Promise<void>} A Promise that resolves when the update operation is complete.
 */
    async updateGoal(goal: Goal): Promise<void> {
        return this.withDatabase(async () => {
            try {
                await this.pool.query(
                    `UPDATE goals SET name = $1, status = $2, objectives = $3 WHERE id = $4`,
                    [
                        goal.name,
                        goal.status,
                        JSON.stringify(goal.objectives),
                        goal.id,
                    ]
                );
            } catch (error) {
                elizaLogger.error("Failed to update goal:", {
                    goalId: goal.id,
                    error:
                        error instanceof Error ? error.message : String(error),
                    status: goal.status,
                });
                throw error;
            }
        }, "updateGoal");
    }

/**
 * Asynchronously creates a new goal in the database.
 * 
 * @param {Goal} goal - The goal object to be created.
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
    async createGoal(goal: Goal): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query(
                `INSERT INTO goals (id, "roomId", "userId", name, status, objectives)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    goal.id ?? v4(),
                    goal.roomId,
                    goal.userId,
                    goal.name,
                    goal.status,
                    JSON.stringify(goal.objectives),
                ]
            );
        }, "createGoal");
    }

/**
 * Asynchronously removes a goal from the database.
 * 
 * @param {UUID} goalId - The unique identifier of the goal to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the goal is successfully removed.
 * @throws {Error} - If the goalId is missing or if there is an error during the removal process.
 */
    async removeGoal(goalId: UUID): Promise<void> {
        if (!goalId) throw new Error("Goal ID is required");

        return this.withDatabase(async () => {
            try {
                const result = await this.pool.query(
                    "DELETE FROM goals WHERE id = $1 RETURNING id",
                    [goalId]
                );

                elizaLogger.debug("Goal removal attempt:", {
                    goalId,
                    removed: result?.rowCount ?? 0 > 0,
                });
            } catch (error) {
                elizaLogger.error("Failed to remove goal:", {
                    goalId,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }, "removeGoal");
    }

/**
 * Asynchronously creates a new room in the database with an optional room ID.
 * If no room ID is provided, a new UUID will be generated.
 * 
 * @param {UUID} roomId - The optional room ID for the new room.
 * @returns {Promise<UUID>} The UUID of the newly created room.
 */
    async createRoom(roomId?: UUID): Promise<UUID> {
        return this.withDatabase(async () => {
            const newRoomId = roomId || v4();
            await this.pool.query("INSERT INTO rooms (id) VALUES ($1)", [
                newRoomId,
            ]);
            return newRoomId as UUID;
        }, "createRoom");
    }

/**
 * Asynchronously removes a room and its related data from the database.
 * 
 * @param {UUID} roomId - The ID of the room to be removed.
 * @returns {Promise<void>} A Promise that resolves once the room and related data are successfully removed.
 * @throws {Error} If the provided roomId is empty or if there is an error during the removal process.
 */
    async removeRoom(roomId: UUID): Promise<void> {
        if (!roomId) throw new Error("Room ID is required");

        return this.withDatabase(async () => {
            const client = await this.pool.connect();
            try {
                await client.query("BEGIN");

                // First check if room exists
                const checkResult = await client.query(
                    "SELECT id FROM rooms WHERE id = $1",
                    [roomId]
                );

                if (checkResult.rowCount === 0) {
                    elizaLogger.warn("No room found to remove:", { roomId });
                    throw new Error(`Room not found: ${roomId}`);
                }

                // Remove related data first (if not using CASCADE)
                await client.query('DELETE FROM memories WHERE "roomId" = $1', [
                    roomId,
                ]);
                await client.query(
                    'DELETE FROM participants WHERE "roomId" = $1',
                    [roomId]
                );
                await client.query('DELETE FROM goals WHERE "roomId" = $1', [
                    roomId,
                ]);

                // Finally remove the room
                const result = await client.query(
                    "DELETE FROM rooms WHERE id = $1 RETURNING id",
                    [roomId]
                );

                await client.query("COMMIT");

                elizaLogger.debug(
                    "Room and related data removed successfully:",
                    {
                        roomId,
                        removed: result?.rowCount ?? 0 > 0,
                    }
                );
            } catch (error) {
                await client.query("ROLLBACK");
                elizaLogger.error("Failed to remove room:", {
                    roomId,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
                throw error;
            } finally {
                if (client) client.release();
            }
        }, "removeRoom");
    }

/**
 * Creates a relationship between two users in the database.
 * 
 * @param {Object} params - The parameters for creating the relationship.
 * @param {string} params.userA - The UUID of userA.
 * @param {string} params.userB - The UUID of userB.
 * @returns {Promise<boolean>} - A boolean indicating whether the relationship was successfully created.
 */
    async createRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<boolean> {
        // Input validation
        if (!params.userA || !params.userB) {
            throw new Error("userA and userB are required");
        }

        return this.withDatabase(async () => {
            try {
                const relationshipId = v4();
                await this.pool.query(
                    `INSERT INTO relationships (id, "userA", "userB", "userId")
                    VALUES ($1, $2, $3, $4)
                    RETURNING id`,
                    [relationshipId, params.userA, params.userB, params.userA]
                );

                elizaLogger.debug("Relationship created successfully:", {
                    relationshipId,
                    userA: params.userA,
                    userB: params.userB,
                });

                return true;
            } catch (error) {
                // Check for unique constraint violation or other specific errors
                if ((error as { code?: string }).code === "23505") {
                    // Unique violation
                    elizaLogger.warn("Relationship already exists:", {
                        userA: params.userA,
                        userB: params.userB,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                } else {
                    elizaLogger.error("Failed to create relationship:", {
                        userA: params.userA,
                        userB: params.userB,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                }
                return false;
            }
        }, "createRelationship");
    }

/**
 * Retrieve the relationship between two users.
 *
 * @param {Object} params - The parameters for fetching the relationship.
 * @param {UUID} params.userA - The UUID of user A.
 * @param {UUID} params.userB - The UUID of user B.
 * @returns {Promise<Relationship | null>} The relationship object if found, otherwise null.
 * @throws {Error} When userA or userB is missing.
 */
    async getRelationship(params: {
        userA: UUID;
        userB: UUID;
    }): Promise<Relationship | null> {
        if (!params.userA || !params.userB) {
            throw new Error("userA and userB are required");
        }

        return this.withDatabase(async () => {
            try {
                const { rows } = await this.pool.query(
                    `SELECT * FROM relationships
                    WHERE ("userA" = $1 AND "userB" = $2)
                    OR ("userA" = $2 AND "userB" = $1)`,
                    [params.userA, params.userB]
                );

                if (rows.length > 0) {
                    elizaLogger.debug("Relationship found:", {
                        relationshipId: rows[0].id,
                        userA: params.userA,
                        userB: params.userB,
                    });
                    return rows[0];
                }

                elizaLogger.debug("No relationship found between users:", {
                    userA: params.userA,
                    userB: params.userB,
                });
                return null;
            } catch (error) {
                elizaLogger.error("Error fetching relationship:", {
                    userA: params.userA,
                    userB: params.userB,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }, "getRelationship");
    }

/**
 * Retrieves relationships of a user based on their userID.
 * 
 * @param {Object} params - The parameters for the function.
 * @param {UUID} params.userId - The userID of the user to retrieve relationships for.
 * @returns {Promise<Relationship[]>} - A Promise that resolves to an array of Relationship objects.
 */
    async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
        if (!params.userId) {
            throw new Error("userId is required");
        }

        return this.withDatabase(async () => {
            try {
                const { rows } = await this.pool.query(
                    `SELECT * FROM relationships
                    WHERE "userA" = $1 OR "userB" = $1
                    ORDER BY "createdAt" DESC`, // Add ordering if you have this field
                    [params.userId]
                );

                elizaLogger.debug("Retrieved relationships:", {
                    userId: params.userId,
                    count: rows.length,
                });

                return rows;
            } catch (error) {
                elizaLogger.error("Failed to fetch relationships:", {
                    userId: params.userId,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }, "getRelationships");
    }

/**
 * Retrieves cached embeddings based on the provided query parameters.
 * 
 * @param {Object} opts - Options for fetching cached embeddings.
 * @param {string} opts.query_table_name - The name of the query table.
 * @param {number} opts.query_threshold - The threshold value for the query.
 * @param {string} opts.query_input - The input string for the query.
 * @param {string} opts.query_field_name - The field name for the query.
 * @param {string} opts.query_field_sub_name - The sub-field name for the query.
 * @param {number} opts.query_match_count - The match count for the query.
 * @returns {Promise<{ embedding: number[]; levenshtein_score: number }[]>} A promise that resolves to an array of objects containing the embeddings and Levenshtein scores.
 */
    async getCachedEmbeddings(opts: {
        query_table_name: string;
        query_threshold: number;
        query_input: string;
        query_field_name: string;
        query_field_sub_name: string;
        query_match_count: number;
    }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
        // Input validation
        if (!opts.query_table_name)
            throw new Error("query_table_name is required");
        if (!opts.query_input) throw new Error("query_input is required");
        if (!opts.query_field_name)
            throw new Error("query_field_name is required");
        if (!opts.query_field_sub_name)
            throw new Error("query_field_sub_name is required");
        if (opts.query_match_count <= 0)
            throw new Error("query_match_count must be positive");

        return this.withDatabase(async () => {
            try {
                elizaLogger.debug("Fetching cached embeddings:", {
                    tableName: opts.query_table_name,
                    fieldName: opts.query_field_name,
                    subFieldName: opts.query_field_sub_name,
                    matchCount: opts.query_match_count,
                    inputLength: opts.query_input.length,
                });

                const sql = `
                    WITH content_text AS (
                        SELECT
                            embedding,
                            COALESCE(
                                content->$2->>$3,
                                ''
                            ) as content_text
                        FROM memories
                        WHERE type = $4
                        AND content->$2->>$3 IS NOT NULL
                    )
                    SELECT
                        embedding,
                        levenshtein(
                            $1,
                            content_text
                        ) as levenshtein_score
                    FROM content_text
                    WHERE levenshtein(
                        $1,
                        content_text
                    ) <= $6  -- Add threshold check
                    ORDER BY levenshtein_score
                    LIMIT $5
                `;

                const { rows } = await this.pool.query(sql, [
                    opts.query_input,
                    opts.query_field_name,
                    opts.query_field_sub_name,
                    opts.query_table_name,
                    opts.query_match_count,
                    opts.query_threshold,
                ]);

                elizaLogger.debug("Retrieved cached embeddings:", {
                    count: rows.length,
                    tableName: opts.query_table_name,
                    matchCount: opts.query_match_count,
                });

                return rows
                    .map(
                        (
                            row
                        ): {
                            embedding: number[];
                            levenshtein_score: number;
                        } | null => {
                            if (!Array.isArray(row.embedding)) return null;
                            return {
                                embedding: row.embedding,
                                levenshtein_score: Number(
                                    row.levenshtein_score
                                ),
                            };
                        }
                    )
                    .filter(
                        (
                            row
                        ): row is {
                            embedding: number[];
                            levenshtein_score: number;
                        } => row !== null
                    );
            } catch (error) {
                elizaLogger.error("Error in getCachedEmbeddings:", {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tableName: opts.query_table_name,
                    fieldName: opts.query_field_name,
                });
                throw error;
            }
        }, "getCachedEmbeddings");
    }

/**
 * Logs an entry with the provided parameters into the database.
 *
 * @param {object} params - The parameters for logging.
 * @param {object} params.body - The body of the log entry.
 * @param {string} params.userId - The user ID associated with the log entry.
 * @param {string} params.roomId - The room ID associated with the log entry.
 * @param {string} params.type - The type of the log entry.
 * @returns {Promise<void>} A Promise that resolves when the logging is complete.
 */ 

    async log(params: {
        body: { [key: string]: unknown };
        userId: UUID;
        roomId: UUID;
        type: string;
    }): Promise<void> {
        // Input validation
        if (!params.userId) throw new Error("userId is required");
        if (!params.roomId) throw new Error("roomId is required");
        if (!params.type) throw new Error("type is required");
        if (!params.body || typeof params.body !== "object") {
            throw new Error("body must be a valid object");
        }

        return this.withDatabase(async () => {
            try {
                const logId = v4(); // Generate ID for tracking
                await this.pool.query(
                    `INSERT INTO logs (
                        id,
                        body,
                        "userId",
                        "roomId",
                        type,
                        "createdAt"
                    ) VALUES ($1, $2, $3, $4, $5, NOW())
                    RETURNING id`,
                    [
                        logId,
                        JSON.stringify(params.body), // Ensure body is stringified
                        params.userId,
                        params.roomId,
                        params.type,
                    ]
                );

                elizaLogger.debug("Log entry created:", {
                    logId,
                    type: params.type,
                    roomId: params.roomId,
                    userId: params.userId,
                    bodyKeys: Object.keys(params.body),
                });
            } catch (error) {
                elizaLogger.error("Failed to create log entry:", {
                    error:
                        error instanceof Error ? error.message : String(error),
                    type: params.type,
                    roomId: params.roomId,
                    userId: params.userId,
                });
                throw error;
            }
        }, "log");
    }

/**
 * Searches memories by given embedding vector
 * @param {number[]} embedding - The embedding vector to search for
 * @param {Object} params - Search parameters
 * @param {number} [params.match_threshold] - The similarity threshold to match against
 * @param {number} [params.count] - The maximum number of results to return
 * @param {UUID} [params.agentId] - The agent ID to filter by
 * @param {UUID} [params.roomId] - The room ID to filter by
 * @param {boolean} [params.unique] - Flag to return only unique results
 * @param {string} params.tableName - The table name to search in
 * @returns {Promise<Memory[]>} - An array of memories matching the search criteria
 */
    async searchMemoriesByEmbedding(
        embedding: number[],
        params: {
            match_threshold?: number;
            count?: number;
            agentId?: UUID;
            roomId?: UUID;
            unique?: boolean;
            tableName: string;
        }
    ): Promise<Memory[]> {
        return this.withDatabase(async () => {
            elizaLogger.debug("Incoming vector:", {
                length: embedding.length,
                sample: embedding.slice(0, 5),
                isArray: Array.isArray(embedding),
                allNumbers: embedding.every((n) => typeof n === "number"),
            });

            // Validate embedding dimension
            if (embedding.length !== getEmbeddingConfig().dimensions) {
                throw new Error(
                    `Invalid embedding dimension: expected ${getEmbeddingConfig().dimensions}, got ${embedding.length}`
                );
            }

            // Ensure vector is properly formatted
            const cleanVector = embedding.map((n) => {
                if (!Number.isFinite(n)) return 0;
                // Limit precision to avoid floating point issues
                return Number(n.toFixed(6));
            });

            // Format for Postgres pgvector
            const vectorStr = `[${cleanVector.join(",")}]`;

            elizaLogger.debug("Vector debug:", {
                originalLength: embedding.length,
                cleanLength: cleanVector.length,
                sampleStr: vectorStr.slice(0, 100),
            });

            let sql = `
                SELECT *,
                1 - (embedding <-> $1::vector(${getEmbeddingConfig().dimensions})) as similarity
                FROM memories
                WHERE type = $2
            `;

            const values: any[] = [vectorStr, params.tableName];

            // Log the query for debugging
            elizaLogger.debug("Query debug:", {
                sql: sql.slice(0, 200),
                paramTypes: values.map((v) => typeof v),
                vectorStrLength: vectorStr.length,
            });

            let paramCount = 2;

            if (params.unique) {
                sql += ` AND "unique" = true`;
            }

            if (params.agentId) {
                paramCount++;
                sql += ` AND "agentId" = $${paramCount}`;
                values.push(params.agentId);
            }

            if (params.roomId) {
                paramCount++;
                sql += ` AND "roomId" = $${paramCount}::uuid`;
                values.push(params.roomId);
            }

            if (params.match_threshold) {
                paramCount++;
                sql += ` AND 1 - (embedding <-> $1::vector) >= $${paramCount}`;
                values.push(params.match_threshold);
            }

            sql += ` ORDER BY embedding <-> $1::vector`;

            if (params.count) {
                paramCount++;
                sql += ` LIMIT $${paramCount}`;
                values.push(params.count);
            }

            const { rows } = await this.pool.query(sql, values);
            return rows.map((row) => ({
                ...row,
                content:
                    typeof row.content === "string"
                        ? JSON.parse(row.content)
                        : row.content,
                similarity: row.similarity,
            }));
        }, "searchMemoriesByEmbedding");
    }

/**
 * Add a new participant to a room in the database.
 * 
 * @param {UUID} userId - The unique identifier of the user to be added as a participant.
 * @param {UUID} roomId - The unique identifier of the room where the user will be added.
 * @returns {Promise<boolean>} A Promise that resolves to true if the participant is successfully added, and false otherwise.
 */
    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        return this.withDatabase(async () => {
            try {
                await this.pool.query(
                    `INSERT INTO participants (id, "userId", "roomId")
                    VALUES ($1, $2, $3)`,
                    [v4(), userId, roomId]
                );
                return true;
            } catch (error) {
                console.log("Error adding participant", error);
                return false;
            }
        }, "addParticpant");
    }

/**
 * Removes a participant from a room.
 * 
 * @param {UUID} userId - The unique identifier of the user to remove.
 * @param {UUID} roomId - The unique identifier of the room from which to remove the participant.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the participant was successfully removed, false otherwise.
 */
    async removeParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        return this.withDatabase(async () => {
            try {
                await this.pool.query(
                    `DELETE FROM participants WHERE "userId" = $1 AND "roomId" = $2`,
                    [userId, roomId]
                );
                return true;
            } catch (error) {
                console.log("Error removing participant", error);
                return false;
            }
        }, "removeParticipant");
    }

/**
 * Update the status of a goal in the database.
 * 
 * @param {Object} params - The parameters for updating the goal status.
 * @param {UUID} params.goalId - The UUID of the goal to update.
 * @param {GoalStatus} params.status - The new status of the goal.
 * @returns {Promise<void>} - A promise that resolves when the goal status is updated.
 */
    async updateGoalStatus(params: {
        goalId: UUID;
        status: GoalStatus;
    }): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query(
                "UPDATE goals SET status = $1 WHERE id = $2",
                [params.status, params.goalId]
            );
        }, "updateGoalStatus");
    }

/**
 * Remove a specific memory from the database.
 * 
 * @param {UUID} memoryId - The unique identifier of the memory to be removed.
 * @param {string} tableName - The name of the table where the memory is stored.
 * @return {Promise<void>} A promise that resolves once the memory is successfully removed.
 */
    async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query(
                "DELETE FROM memories WHERE type = $1 AND id = $2",
                [tableName, memoryId]
            );
        }, "removeMemory");
    }

/**
 * Removes all memories from a specified room that match the given type.
 * 
 * @param {UUID} roomId - The ID of the room from which memories will be removed.
 * @param {string} tableName - The type of memories to be removed.
 * @returns {Promise<void>} A promise that resolves once all memories have been successfully removed.
 */
    async removeAllMemories(roomId: UUID, tableName: string): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query(
                `DELETE FROM memories WHERE type = $1 AND "roomId" = $2`,
                [tableName, roomId]
            );
        }, "removeAllMemories");
    }

/**
 * Count the number of memories for a particular room in the database.
 * @param {UUID} roomId - The ID of the room to count memories for.
 * @param {boolean} [unique=true] - Flag indicating whether to count unique memories only. Default is true.
 * @param {string} [tableName=""] - The name of the table to query for memories. Required.
 * @returns {Promise<number>} - The number of memories for the specified room.
 */
    async countMemories(
        roomId: UUID,
        unique = true,
        tableName = ""
    ): Promise<number> {
        if (!tableName) throw new Error("tableName is required");

        return this.withDatabase(async () => {
            let sql = `SELECT COUNT(*) as count FROM memories WHERE type = $1 AND "roomId" = $2`;
            if (unique) {
                sql += ` AND "unique" = true`;
            }

            const { rows } = await this.pool.query(sql, [tableName, roomId]);
            return parseInt(rows[0].count);
        }, "countMemories");
    }

/**
 * Removes all goals associated with a specific room.
 * 
 * @param {UUID} roomId - The id of the room to remove goals from.
 * @returns {Promise<void>} A Promise that resolves when all goals have been removed.
 */
    async removeAllGoals(roomId: UUID): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query(`DELETE FROM goals WHERE "roomId" = $1`, [
                roomId,
            ]);
        }, "removeAllGoals");
    }

/**
 * Retrieve the list of room IDs that a participant is a part of.
 * 
 * @param {UUID} userId - The UUID of the participant to retrieve room IDs for.
 * @returns {Promise<UUID[]>} - A promise that resolves with an array of room IDs.
 */
    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        return this.withDatabase(async () => {
            const { rows } = await this.pool.query(
                `SELECT "roomId" FROM participants WHERE "userId" = $1`,
                [userId]
            );
            return rows.map((row) => row.roomId);
        }, "getRoomsForParticipant");
    }

/**
 * Retrieves all the room IDs where the provided array of user IDs are participants.
 *
 * @param {UUID[]} userIds - An array of user IDs to search for in the 'participants' table.
 * @returns {Promise<UUID[]>} - A Promise that resolves to an array of room IDs where the provided user IDs are participants.
 */
    async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
        return this.withDatabase(async () => {
            const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
            const { rows } = await this.pool.query(
                `SELECT DISTINCT "roomId" FROM participants WHERE "userId" IN (${placeholders})`,
                userIds
            );
            return rows.map((row) => row.roomId);
        }, "getRoomsForParticipants");
    }

/**
 * Retrieve details of actors associated with a specified room.
 * 
 * @param {Object} params - The parameters for retrieving actor details.
 * @param {string} params.roomId - The ID of the room for which actor details are being fetched.
 * @returns {Promise<Actor[]>} The details of actors in the specified room.
 * @throws {Error} When the roomId is not provided or if there is an error fetching actor details.
 */
    async getActorDetails(params: { roomId: string }): Promise<Actor[]> {
        if (!params.roomId) {
            throw new Error("roomId is required");
        }

        return this.withDatabase(async () => {
            try {
                const sql = `
                    SELECT
                        a.id,
                        a.name,
                        a.username,
                        a."avatarUrl",
                        COALESCE(a.details::jsonb, '{}'::jsonb) as details
                    FROM participants p
                    LEFT JOIN accounts a ON p."userId" = a.id
                    WHERE p."roomId" = $1
                    ORDER BY a.name
                `;

                const result = await this.pool.query<Actor>(sql, [
                    params.roomId,
                ]);

                elizaLogger.debug("Retrieved actor details:", {
                    roomId: params.roomId,
                    actorCount: result.rows.length,
                });

                return result.rows.map((row) => {
                    try {
                        return {
                            ...row,
                            details:
                                typeof row.details === "string"
                                    ? JSON.parse(row.details)
                                    : row.details,
                        };
                    } catch (parseError) {
                        elizaLogger.warn("Failed to parse actor details:", {
                            actorId: row.id,
                            error:
                                parseError instanceof Error
                                    ? parseError.message
                                    : String(parseError),
                        });
                        return {
                            ...row,
                            details: {}, // Fallback to empty object if parsing fails
                        };
                    }
                });
            } catch (error) {
                elizaLogger.error("Failed to fetch actor details:", {
                    roomId: params.roomId,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
                throw new Error(
                    `Failed to fetch actor details: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }, "getActorDetails");
    }

/**
 * Retrieves a value from the cache table based on the provided key and agentId.
 * 
 * @param {Object} params - The parameters for retrieving the cache value.
 * @param {string} params.key - The key to search for in the cache table.
 * @param {UUID} params.agentId - The agentId associated with the key.
 * @returns {Promise<string | undefined>} The value corresponding to the key and agentId, if found; otherwise undefined.
 */
    async getCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<string | undefined> {
        return this.withDatabase(async () => {
            try {
                const sql = `SELECT "value"::TEXT FROM cache WHERE "key" = $1 AND "agentId" = $2`;
                const { rows } = await this.query<{ value: string }>(sql, [
                    params.key,
                    params.agentId,
                ]);
                return rows[0]?.value ?? undefined;
            } catch (error) {
                elizaLogger.error("Error fetching cache", {
                    error:
                        error instanceof Error ? error.message : String(error),
                    key: params.key,
                    agentId: params.agentId,
                });
                return undefined;
            }
        }, "getCache");
    }

/**
 * Set data in the cache table with provided key, agentId, and value.
 * 
 * @param {Object} params - The parameters for setting cache.
 * @param {string} params.key - The key for the cache entry.
 * @param {UUID} params.agentId - The agentId for the cache entry.
 * @param {string} params.value - The value to be stored in the cache.
 * @returns {Promise<boolean>} A Promise that resolves to true if the cache was set successfully, false otherwise.
 */
    async setCache(params: {
        key: string;
        agentId: UUID;
        value: string;
    }): Promise<boolean> {
        return this.withDatabase(async () => {
            try {
                const client = await this.pool.connect();
                try {
                    await client.query("BEGIN");
                    await client.query(
                        `INSERT INTO cache ("key", "agentId", "value", "createdAt")
                         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                         ON CONFLICT ("key", "agentId")
                         DO UPDATE SET "value" = EXCLUDED.value, "createdAt" = CURRENT_TIMESTAMP`,
                        [params.key, params.agentId, params.value]
                    );
                    await client.query("COMMIT");
                    return true;
                } catch (error) {
                    await client.query("ROLLBACK");
                    elizaLogger.error("Error setting cache", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        key: params.key,
                        agentId: params.agentId,
                    });
                    return false;
                } finally {
                    if (client) client.release();
                }
            } catch (error) {
                elizaLogger.error(
                    "Database connection error in setCache",
                    error
                );
                return false;
            }
        }, "setCache");
    }

/**
 * Delete cache from the database for a specific key and agent ID.
 * @param {Object} params - The parameters for deleting cache.
 * @param {string} params.key - The key of the cache to delete.
 * @param {UUID} params.agentId - The agent ID associated with the cache.
 * @returns {Promise<boolean>} - A boolean indicating whether the cache was successfully deleted.
 */
    async deleteCache(params: {
        key: string;
        agentId: UUID;
    }): Promise<boolean> {
        return this.withDatabase(async () => {
            try {
                const client = await this.pool.connect();
                try {
                    await client.query("BEGIN");
                    await client.query(
                        `DELETE FROM cache WHERE "key" = $1 AND "agentId" = $2`,
                        [params.key, params.agentId]
                    );
                    await client.query("COMMIT");
                    return true;
                } catch (error) {
                    await client.query("ROLLBACK");
                    elizaLogger.error("Error deleting cache", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        key: params.key,
                        agentId: params.agentId,
                    });
                    return false;
                } finally {
                    client.release();
                }
            } catch (error) {
                elizaLogger.error(
                    "Database connection error in deleteCache",
                    error
                );
                return false;
            }
        }, "deleteCache");
    }

/**
 * Retrieves knowledge items from the database.
 * 
 * @param {Object} params - The parameters for fetching knowledge items.
 * @param {UUID} [params.id] - The ID of the knowledge item to retrieve.
 * @param {UUID} params.agentId - The ID of the agent associated with the knowledge items.
 * @param {number} [params.limit] - The maximum number of knowledge items to retrieve.
 * @param {string} [params.query] - The search query to filter knowledge items.
 * @returns {Promise<RAGKnowledgeItem[]>} - A promise that resolves to an array of RAGKnowledgeItem objects.
 */
    async getKnowledge(params: {
        id?: UUID;
        agentId: UUID;
        limit?: number;
        query?: string;
    }): Promise<RAGKnowledgeItem[]> {
        return this.withDatabase(async () => {
            let sql = `SELECT * FROM knowledge WHERE ("agentId" = $1 OR "isShared" = true)`;
            const queryParams: any[] = [params.agentId];
            let paramCount = 1;

            if (params.id) {
                paramCount++;
                sql += ` AND id = $${paramCount}`;
                queryParams.push(params.id);
            }

            if (params.limit) {
                paramCount++;
                sql += ` LIMIT $${paramCount}`;
                queryParams.push(params.limit);
            }

            const { rows } = await this.pool.query(sql, queryParams);

            return rows.map(row => ({
                id: row.id,
                agentId: row.agentId,
                content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
                embedding: row.embedding ? new Float32Array(row.embedding) : undefined,
                createdAt: row.createdAt.getTime()
            }));
        }, "getKnowledge");
    }

/**
 * Asynchronously search for relevant knowledge items based on given parameters.
 * 
 * @param {Object} params - The parameters for searching knowledge.
 * @param {UUID} params.agentId - The ID of the agent performing the search.
 * @param {Float32Array} params.embedding - The embedding vector used for similarity matching.
 * @param {number} params.match_threshold - The minimum threshold for similarity match.
 * @param {number} params.match_count - The number of matching results to retrieve.
 * @param {string} [params.searchText] - Optional search text to filter results.
 * @returns {Promise<RAGKnowledgeItem[]>} - A promise that resolves to an array of relevant knowledge items.
 */
    async searchKnowledge(params: {
        agentId: UUID;
        embedding: Float32Array;
        match_threshold: number;
        match_count: number;
        searchText?: string;
    }): Promise<RAGKnowledgeItem[]> {
        return this.withDatabase(async () => {
            const cacheKey = `embedding_${params.agentId}_${params.searchText}`;
            const cachedResult = await this.getCache({
                key: cacheKey,
                agentId: params.agentId
            });

            if (cachedResult) {
                return JSON.parse(cachedResult);
            }

            const vectorStr = `[${Array.from(params.embedding).join(",")}]`;

            const sql = `
                WITH vector_scores AS (
                    SELECT id,
                        1 - (embedding <-> $1::vector) as vector_score
                    FROM knowledge
                    WHERE ("agentId" IS NULL AND "isShared" = true) OR "agentId" = $2
                    AND embedding IS NOT NULL
                ),
                keyword_matches AS (
                    SELECT id,
                    CASE
                        WHEN content->>'text' ILIKE $3 THEN 3.0
                        ELSE 1.0
                    END *
                    CASE
                        WHEN (content->'metadata'->>'isChunk')::boolean = true THEN 1.5
                        WHEN (content->'metadata'->>'isMain')::boolean = true THEN 1.2
                        ELSE 1.0
                    END as keyword_score
                    FROM knowledge
                    WHERE ("agentId" IS NULL AND "isShared" = true) OR "agentId" = $2
                )
                SELECT k.*,
                    v.vector_score,
                    kw.keyword_score,
                    (v.vector_score * kw.keyword_score) as combined_score
                FROM knowledge k
                JOIN vector_scores v ON k.id = v.id
                LEFT JOIN keyword_matches kw ON k.id = kw.id
                WHERE ("agentId" IS NULL AND "isShared" = true) OR k."agentId" = $2
                AND (
                    v.vector_score >= $4
                    OR (kw.keyword_score > 1.0 AND v.vector_score >= 0.3)
                )
                ORDER BY combined_score DESC
                LIMIT $5
            `;

            const { rows } = await this.pool.query(sql, [
                vectorStr,
                params.agentId,
                `%${params.searchText || ''}%`,
                params.match_threshold,
                params.match_count
            ]);

            const results = rows.map(row => ({
                id: row.id,
                agentId: row.agentId,
                content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
                embedding: row.embedding ? new Float32Array(row.embedding) : undefined,
                createdAt: row.createdAt.getTime(),
                similarity: row.combined_score
            }));

            await this.setCache({
                key: cacheKey,
                agentId: params.agentId,
                value: JSON.stringify(results)
            });

            return results;
        }, "searchKnowledge");
    }

/**
 * Creates a new knowledge item in the database.
 * 
 * @param {RAGKnowledgeItem} knowledge - The knowledge item to be created
 * @returns {Promise<void>} - A promise that resolves when the knowledge item is successfully created
 */
    async createKnowledge(knowledge: RAGKnowledgeItem): Promise<void> {
        return this.withDatabase(async () => {
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');

                const sql = `
                    INSERT INTO knowledge (
                        id, "agentId", content, embedding, "createdAt",
                        "isMain", "originalId", "chunkIndex", "isShared"
                    ) VALUES ($1, $2, $3, $4, to_timestamp($5/1000.0), $6, $7, $8, $9)
                    ON CONFLICT (id) DO NOTHING
                `;

                const metadata = knowledge.content.metadata || {};
                const vectorStr = knowledge.embedding ?
                `[${Array.from(knowledge.embedding).join(",")}]` : null;

                await client.query(sql, [
                    knowledge.id,
                    metadata.isShared ? null : knowledge.agentId,
                    knowledge.content,
                    vectorStr,
                    knowledge.createdAt || Date.now(),
                    metadata.isMain || false,
                    metadata.originalId || null,
                    metadata.chunkIndex || null,
                    metadata.isShared || false
                ]);

                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }, "createKnowledge");
    }

/**
 * Removes knowledge from the database for a given ID.
 * 
 * @param {UUID} id - The ID of the knowledge to be removed.
 * @returns {Promise<void>} - A Promise that resolves once the knowledge has been successfully removed.
 */
    async removeKnowledge(id: UUID): Promise<void> {
        return this.withDatabase(async () => {
            await this.pool.query('DELETE FROM knowledge WHERE id = $1', [id]);
        }, "removeKnowledge");
    }

/**
 * Clears the knowledge data for a specific agent.
 * 
 * @param {UUID} agentId - The ID of the agent for which to clear knowledge.
 * @param {boolean} [shared] - Optional parameter to specify whether to clear shared knowledge as well.
 * @returns {Promise<void>} A promise that resolves when the knowledge data has been cleared.
 */
    async clearKnowledge(agentId: UUID, shared?: boolean): Promise<void> {
        return this.withDatabase(async () => {
            const sql = shared ?
                'DELETE FROM knowledge WHERE ("agentId" = $1 OR "isShared" = true)' :
                'DELETE FROM knowledge WHERE "agentId" = $1';

            await this.pool.query(sql, [agentId]);
        }, "clearKnowledge");
    }
}

export default PostgresDatabaseAdapter;
