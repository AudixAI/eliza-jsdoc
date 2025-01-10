/**
 * An enum representing the available types of Tees.
 * - `SGX_GRAMINE`: Indicates SGX Gramine type.
 * - `TDX_DSTACK`: Indicates TDX DStack type.
 */
export enum TeeType {
    SGX_GRAMINE = "sgx_gramine",
    TDX_DSTACK = "tdx_dstack",
}

// Represents a log entry in the TeeLog table, containing details about agent activities.
/**
 * Represents a log entry for a Telemetry system.
 * @typedef {object} TeeLog
 * @property {string} id - The unique identifier of the log entry.
 * @property {string} agentId - The identifier of the agent responsible for the log.
 * @property {string} roomId - The identifier of the room where the log was generated.
 * @property {string} userId - The identifier of the user associated with the log.
 * @property {string} type - The type of log entry.
 * @property {string} content - The content of the log entry.
 * @property {number} timestamp - The timestamp when the log was generated.
 * @property {string} signature - The signature of the log entry.
 */
   
export interface TeeLog {
    id: string;
    agentId: string;
    roomId: string;
    userId: string;
    type: string;
    content: string;
    timestamp: number;
    signature: string;
}

/**
 * Interface for querying log entries in the system.
 * @typedef {object} TeeLogQuery
 * @property {string} [agentId] - The ID of the agent associated with the log entry
 * @property {string} [roomId] - The ID of the room associated with the log entry
 * @property {string} [userId] - The ID of the user associated with the log entry
 * @property {string} [type] - The type of log entry
 * @property {string} [containsContent] - The content that the log entry contains
 * @property {number} [startTimestamp] - The start timestamp for filtering log entries
 * @property {number} [endTimestamp] - The end timestamp for filtering log entries
 */
export interface TeeLogQuery {
    agentId?: string;
    roomId?: string;
    userId?: string;
    type?: string;
    containsContent?: string;
    startTimestamp?: number;
    endTimestamp?: number;
}

// Represents an agent in the TeeAgent table, containing details about the agent.
/**
 * Interface representing a TeeAgent.
 * @interface
 * @property {string} id - Primary key
 * @property {string} agentId - Allow duplicate agentId. This is to support the case where the same agentId is registered multiple times. Each time the agent restarts, we will generate a new keypair and attestation.
 * @property {string} agentName - The name of the agent
 * @property {number} createdAt - The timestamp when the agent was created
 * @property {string} publicKey - The public key of the agent
 * @property {string} attestation - The attestation of the agent
 */
export interface TeeAgent {
    id: string; // Primary key
    // Allow duplicate agentId.
    // This is to support the case where the same agentId is registered multiple times.
    // Each time the agent restarts, we will generate a new keypair and attestation.
    agentId: string;
    agentName: string;
    createdAt: number;
    publicKey: string;
    attestation: string;
}

/**
 * Interface for defining the structure of a page query object.
 * @template Result The type of the data contained in the 'data' property.
 * @property { number } page The page number to retrieve.
 * @property { number } pageSize The number of items to retrieve per page.
 * @property { number } [total] The total number of items in the query (optional).
 * @property { Result } [data] The data retrieved for the given page query (optional).
 */
export interface PageQuery<Result = any> {
    page: number;
    pageSize: number;
    total?: number;
    data?: Result;
}

/**
 * Interface representing a data access object for interacting with TeeLog and TeeAgent data.
 * @template DB The type of the database connection used by the DAO.
 */
export abstract class TeeLogDAO<DB = any> {
    db: DB;

    abstract initialize(): Promise<void>;

    abstract addLog(log: TeeLog): Promise<boolean>;

    abstract getPagedLogs(
        query: TeeLogQuery,
        page: number,
        pageSize: number
    ): Promise<PageQuery<TeeLog[]>>;

    abstract addAgent(agent: TeeAgent): Promise<boolean>;

    abstract getAgent(agentId: string): Promise<TeeAgent>;

    abstract getAllAgents(): Promise<TeeAgent[]>;
}