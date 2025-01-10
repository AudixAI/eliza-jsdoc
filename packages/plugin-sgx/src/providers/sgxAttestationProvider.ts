import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";
import { SgxAttestation } from "../types/attestation";
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

// Function to calculate SHA-256 and return a Buffer (32 bytes)
/**
 * Calculate the SHA256 hash of the given input string.
 * 
 * @param {string} input - The input string to calculate the SHA256 hash for.
 * @returns {Buffer} - The SHA256 hash result as a Buffer object.
 */
function calculateSHA256(input: string): Buffer {
    const hash = createHash('sha256');
    hash.update(input);
    return hash.digest();
}

/**
 * Class representing an SGX Attestation Provider.
 */

class SgxAttestationProvider {
    private readonly SGX_QUOTE_MAX_SIZE: number = 8192 * 4;
    private readonly SGX_TARGET_INFO_SIZE: number = 512;

    private readonly MY_TARGET_INFO_PATH: string = "/dev/attestation/my_target_info";
    private readonly TARGET_INFO_PATH: string = "/dev/attestation/target_info";
    private readonly USER_REPORT_DATA_PATH: string = "/dev/attestation/user_report_data";
    private readonly QUOTE_PATH: string = "/dev/attestation/quote";

/**
 * Constructor for creating a new instance.
 */
    constructor() {}

/**
 * Asynchronous function to generate SGX remote attestation based on the provided report data.
 * 
 * @param {string} reportData - The data to be hashed to generate the raw user report.
 * @returns {Promise<SgxAttestation>} - The generated SGX attestation object containing the quote and timestamp.
 * @throws {Error} - If there is an error while generating the SGX Quote.
 */
    async generateAttestation(
        reportData: string
    ): Promise<SgxAttestation> {
        // Hash the report data to generate the raw user report.
        // The resulting hash value is 32 bytes long.
        // Ensure that the length of the raw user report does not exceed 64 bytes.
        const rawUserReport = calculateSHA256(reportData);

        try {
            // Check if the gramine attestation device file exists
            await fs.access(this.MY_TARGET_INFO_PATH);

            const quote = await this.generateQuoteByGramine(rawUserReport);
            const attestation: SgxAttestation = {
                quote: quote,
                timestamp: Date.now(),
            };
            // console.log("SGX remote attestation: ", attestation);
            return attestation;
        } catch (error) {
            console.error("Error generating SGX remote attestation:", error);
            throw new Error(
                `Failed to generate SGX Quote: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

/**
 * Generates a quote by gramine.
 *
 * @param {Buffer} rawUserReport - The raw user report to generate the quote from.
 * @returns {Promise<string>} The generated quote as a hexadecimal string prefixed with '0x'.
 * @throws {Error} If the length of rawUserReport exceeds 64 bytes, if invalid my_target_info length,
 * if invalid quote length, or if quote without EOF.
 */
    async generateQuoteByGramine(
        rawUserReport: Buffer
    ): Promise<string> {
        if (rawUserReport.length > 64) {
            throw new Error("the length of rawUserReport exceeds 64 bytes");
        }

        const myTargetInfo = await fs.readFile(this.MY_TARGET_INFO_PATH);
        if (myTargetInfo.length !== this.SGX_TARGET_INFO_SIZE) {
            throw new Error("Invalid my_target_info length");
        }

        await fs.writeFile(this.TARGET_INFO_PATH, myTargetInfo);
        await fs.writeFile(this.USER_REPORT_DATA_PATH, rawUserReport);

        // Read quote
        const quoteData = await fs.readFile(this.QUOTE_PATH);
        if (quoteData.length > this.SGX_QUOTE_MAX_SIZE) {
            throw new Error("Invalid quote length");
        }

        const realLen = quoteData.lastIndexOf(0);
        if (realLen === -1) {
            throw new Error("quote without EOF");
        }

        return '0x' + quoteData.subarray(0, realLen + 1).toString('hex');
    }
}

/**
 * Function to retrieve the remote attestation for the SGX hardware security provider.
 * @param {IAgentRuntime} runtime - The runtime of the current agent.
 * @param {Memory} _message - The message to be used for attestation (not used in this implementation).
 * @param {State} [_state] - The optional state parameter (not used in this implementation).
 * @returns {Promise<string>} A Promise that resolves to a string containing the attestation information.
 */
const sgxAttestationProvider: Provider = {
    get: async (runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        const provider = new SgxAttestationProvider();
        const agentId = runtime.agentId;

        try {
            // console.log("Generating attestation for agent: ", agentId);
            const attestation = await provider.generateAttestation(agentId);
            return `Your Agent's remote attestation is: ${JSON.stringify(attestation)}`;
        } catch (error) {
            console.error("Error in remote attestation provider:", error);
            throw new Error(
                `Failed to generate SGX Quote: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    },
};

export { sgxAttestationProvider, SgxAttestationProvider };
