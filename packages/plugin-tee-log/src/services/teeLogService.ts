import { IAgentRuntime, Service, ServiceType, ITeeLogService } from "@elizaos/core";
import { TEEMode } from "@elizaos/plugin-tee";
import { SqliteTeeLogDAO } from "../adapters/sqliteDAO";
import { TeeType, TeeLogDAO, TeeAgent, TeeLog, TeeLogQuery, PageQuery } from "../types";
import { TeeLogManager } from "./teeLogManager";
import Database from "better-sqlite3";

/**
 * A service class for logging Tee data with various methods to interact with the TeeLogManager.
 * @implements { ITeeLogService }
 */
export class TeeLogService extends Service implements ITeeLogService {
    private readonly dbPath = "./data/tee_log.sqlite";

    private initialized: boolean = false;
    private enableTeeLog: boolean = false;
    private teeType: TeeType;
    private teeMode: TEEMode = TEEMode.OFF; // Only used for plugin-tee with TDX dstack

    private teeLogDAO: TeeLogDAO;
    private teeLogManager: TeeLogManager;


/**
 * Get the instance of TeeLogService.
 * @returns {TeeLogService} The instance of TeeLogService
 */
    getInstance(): TeeLogService {
        return this;
    }

/**
 * Returns the ServiceType of the TEE_LOG service.
 */
    static get serviceType(): ServiceType {
        return ServiceType.TEE_LOG;
    }

/**
 * Initializes the agent with the given runtime.
 * 
 * @param {IAgentRuntime} runtime - The runtime object for the agent.
 * @returns {Promise<void>} A Promise that resolves when the initialization is complete.
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        if (this.initialized) {
            return;
        }

        const enableValues = ["true", "1", "yes", "enable", "enabled", "on"];

        const enableTeeLog = runtime.getSetting("ENABLE_TEE_LOG");
        if (enableTeeLog === null) {
            throw new Error("ENABLE_TEE_LOG is not set.");
        }
        this.enableTeeLog = enableValues.includes(enableTeeLog.toLowerCase());
        if (!this.enableTeeLog) {
            console.log("TEE log is not enabled.");
            return;
        }

        const runInSgx = runtime.getSetting("SGX");
        const teeMode = runtime.getSetting("TEE_MODE");
        const walletSecretSalt = runtime.getSetting("WALLET_SECRET_SALT");

        const useSgxGramine = runInSgx && enableValues.includes(runInSgx.toLowerCase());
        const useTdxDstack = !teeMode && teeMode !== TEEMode.OFF && walletSecretSalt;

        if (useSgxGramine && useTdxDstack) {
            throw new Error("Cannot configure both SGX and TDX at the same time.");
        } else if (useSgxGramine) {
            this.teeType = TeeType.SGX_GRAMINE;
        } else if (useTdxDstack) {
            this.teeType = TeeType.TDX_DSTACK;
        } else {
            throw new Error("Invalid TEE configuration.");
        }

        const db = new Database(this.dbPath);
        this.teeLogDAO = new SqliteTeeLogDAO(db);
        await this.teeLogDAO.initialize();
        this.teeLogManager = new TeeLogManager(this.teeLogDAO, this.teeType, this.teeMode);

        const isRegistered = await this.teeLogManager.registerAgent(
            runtime?.agentId,
            runtime?.character?.name,
        );
        if (!isRegistered) {
            throw new Error(`Failed to register agent ${runtime.agentId}`);
        }

        this.initialized = true;
    }

/**
 * Logs a message for a given agent, room, user, type, and content.
 * 
 * @param {string} agentId - The ID of the agent.
 * @param {string} roomId - The ID of the room.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of the log message.
 * @param {string} content - The content of the log message.
 * @returns {Promise<boolean>} Returns a boolean indicating if the log was successful.
 */
    async log(agentId: string, roomId: string, userId: string, type: string, content: string): Promise<boolean> {
        if (!this.enableTeeLog) {
            return false;
        }

        return this.teeLogManager.log(agentId, roomId, userId, type, content);
    }

/**
 * Asynchronously retrieves all TeeAgents.
 * 
 * @returns {Promise<TeeAgent[]>} A Promise that resolves to an array of TeeAgents. If TeeLog is not enabled, an empty array is returned.
 */
    async getAllAgents(): Promise<TeeAgent[]> {
        if (!this.enableTeeLog) {
            return [];
        }

        return this.teeLogManager.getAllAgents();
    }

/**
 * Get agent information based on the agent ID.
 * 
 * @param {string} agentId - The ID of the agent to retrieve information for.
 * @returns {Promise<TeeAgent | undefined>} The agent information, or undefined if the TEE log is disabled.
 */
    async getAgent(agentId: string): Promise<TeeAgent | undefined> {
        if (!this.enableTeeLog) {
            return undefined;
        }

        return this.teeLogManager.getAgent(agentId);
    }

/**
 * Asynchronously retrieves Tee logs based on the provided query and pagination parameters.
 * 
 * @param {TeeLogQuery} query The query parameters to filter the Tee logs.
 * @param {number} page The page number for pagination.
 * @param {number} pageSize The number of items per page for pagination.
 * @returns {Promise<PageQuery<TeeLog[]>>} A promise that resolves with a PageQuery object containing an array of Tee logs,
 * the total count of Tee logs, the current page number, and the page size. If Tee logging is disabled, an empty PageQuery object is returned.
 */
    async getLogs(query: TeeLogQuery, page: number, pageSize: number): Promise<PageQuery<TeeLog[]>> {
        if (!this.enableTeeLog) {
            return {
                data: [],
                total: 0,
                page: page,
                pageSize: pageSize,
            };
        }

        return this.teeLogManager.getLogs(query, page, pageSize);
    }

/**
 * Asynchronously generates an attestation for the given user report.
 * 
 * @param {string} userReport The user report for which to generate the attestation.
 * @returns {Promise<string>} A promise that resolves with the generated attestation string.
 */
    async generateAttestation(userReport: string): Promise<string> {
        return this.teeLogManager.generateAttestation(userReport);
    }
}

export default TeeLogService;
