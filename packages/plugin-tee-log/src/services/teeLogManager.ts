import {
    TEEMode,
    RemoteAttestationProvider as TdxAttestationProvider,
} from "@elizaos/plugin-tee";
import { SgxAttestationProvider } from "@elizaos/plugin-sgx";
import { TeeType, TeeLogDAO, TeeAgent, TeeLog, TeeLogQuery, PageQuery } from "../types";
import elliptic from "elliptic";
import { v4 } from "uuid";

/**
 * Manager class for handling TeeAgent logs and operations.
 */
export class TeeLogManager {
    private teeLogDAO: TeeLogDAO;
    private teeType: TeeType;
    private teeMode: TEEMode; // Only used for plugin-tee with TDX dstack

    // Map of agentId to its key pair
    // These keypairs only store in memory.
    // When the agent restarts, we will generate new keypair.
    private keyPairs: Map<string, elliptic.ec.KeyPair> = new Map();

/**
 * Constructor for creating a Tee object.
 * @param {TeeLogDAO} teeLogDAO - The data access object for TeeLog.
 * @param {TeeType} teeType - The type of Tee.
 * @param {TEEMode} teeMode - The mode of Tee.
 */
    constructor(teeLogDAO: TeeLogDAO, teeType: TeeType, teeMode: TEEMode) {
        this.teeLogDAO = teeLogDAO;
        this.teeType = teeType;
        this.teeMode = teeMode;
    }

/**
 * Creates a new agent with the provided agentId and agentName.
 *
 * @param {string} agentId - The ID of the agent to be registered.
 * @param {string} agentName - The name of the agent to be registered.
 * @returns {Promise<boolean>} - A boolean indicating the success of registering the agent.
 */
    public async registerAgent(agentId: string, agentName: string): Promise<boolean> {
        if (!agentId) {
            throw new Error("Agent ID is required");
        }

        const keyPair = this.generateKeyPair();
        this.keyPairs.set(agentId, keyPair);

        const publicKey = keyPair.getPublic().encode('hex', true);
        const attestation = await this.generateAttestation(publicKey);

        const new_agent = {
            id: v4(),
            agentId,
            agentName: agentName || "",
            createdAt: new Date().getTime(),
            publicKey,
            attestation,
        };

        console.log("registerAgent new_agent", new_agent);

        return this.teeLogDAO.addAgent(new_agent);
    }

/**
 * Retrieves all TeeAgents from the database.
 * 
 * @returns A Promise that resolves to an array of TeeAgent objects representing all agents.
 */ 

    public async getAllAgents(): Promise<TeeAgent[]> {
        return this.teeLogDAO.getAllAgents();
    }

/**
 * Retrieve a TeeAgent based on agentId
 * @param {string} agentId - The unique identifier of the TeeAgent
 * @returns {Promise<TeeAgent | undefined>} - The TeeAgent object if found, otherwise undefined
 */
    public async getAgent(agentId: string): Promise<TeeAgent | undefined> {
        return this.teeLogDAO.getAgent(agentId);
    }

/**
 * Logs the information provided by Agent to the database after signing it with the agent's key pair.
 * @param {string} agentId - The ID of the agent sending the log.
 * @param {string} roomId - The ID of the room where the log is being generated.
 * @param {string} userId - The ID of the user generating the log.
 * @param {string} type - The type of the log message.
 * @param {string} content - The content of the log message.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the log is successfully added to the database.
 */
    public async log(agentId: string, roomId: string, userId: string, type: string, content: string): Promise<boolean> {
        const keyPair = this.keyPairs.get(agentId);
        if (!keyPair) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const timestamp = new Date().getTime();

        // Join the information into a single string
        const messageToSign = `${agentId}|${roomId}|${userId}|${type}|${content}|${timestamp}`;

        // Sign the joined message
        const signature = "0x" + keyPair.sign(messageToSign).toDER('hex');

        return this.teeLogDAO.addLog({
            id: v4(),
            agentId,
            roomId,
            userId,
            type,
            content,
            timestamp,
            signature,
        });
    }

/**
 * Retrieves logs based on the specified query parameters.
 * @param {TeeLogQuery} query - The query parameters to filter logs.
 * @param {number} page - The page number of logs to retrieve.
 * @param {number} pageSize - The number of logs per page.
 * @returns {Promise<PageQuery<TeeLog[]>>} A promise that resolves to a page of logs.
 */
    public async getLogs(query: TeeLogQuery, page: number, pageSize: number): Promise<PageQuery<TeeLog[]>> {
        return this.teeLogDAO.getPagedLogs(query, page, pageSize);
    }

/**
 * Generates a new elliptic key pair using secp256k1 curve.
 * 
 * @returns {elliptic.ec.KeyPair} The newly generated key pair
 */
    public generateKeyPair(): elliptic.ec.KeyPair {
        const ec = new elliptic.ec('secp256k1');
        const key = ec.genKeyPair();
        return key;
    }

/**
 * Generates an attestation based on the TEE type.
 * @param {string} userReport - The user report to generate an attestation for.
 * @returns {Promise<string>} The generated attestation as a string.
 * @throws {Error} If the TEE type is not valid.
 */
    public async generateAttestation(userReport: string): Promise<string> {
        if (this.teeType === TeeType.SGX_GRAMINE) {
            const sgxAttestationProvider = new SgxAttestationProvider();
            const sgxAttestation = await sgxAttestationProvider.generateAttestation(userReport);
            return JSON.stringify(sgxAttestation);
        } else if (this.teeType === TeeType.TDX_DSTACK) {
            const tdxAttestationProvider = new TdxAttestationProvider();
            const tdxAttestation = await tdxAttestationProvider.generateAttestation(userReport);
            return JSON.stringify(tdxAttestation);
        } else {
            throw new Error("Invalid TEE type");
        }
    }
}
