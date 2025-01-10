import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";
import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
import { DeriveKeyResponse, TappdClient } from "@phala/dstack-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { PrivateKeyAccount, keccak256 } from "viem";
import { RemoteAttestationProvider } from "./remoteAttestationProvider";
import { TEEMode, RemoteAttestationQuote } from "../types/tee";

/**
 * Interface for the data required to derive a key attestation.
 * @typedef {object} DeriveKeyAttestationData
 * @property {string} agentId - The identifier of the agent.
 * @property {string} publicKey - The public key to use for attestation.
 */
interface DeriveKeyAttestationData {
    agentId: string;
    publicKey: string;
}

/**
 * Class representing a DeriveKeyProvider for handling key derivation operations in a Trusted Execution Environment (TEE).
 */
class DeriveKeyProvider {
    private client: TappdClient;
    private raProvider: RemoteAttestationProvider;

/**
 * Constructor for TEEManager class.
 * Initializes the TEEManager with the specified teeMode.
 * @param {string} teeMode - The mode in which the TEEManager should operate (LOCAL, DOCKER, PRODUCTION).
 * @constructor
 */
    constructor(teeMode?: string) {
        let endpoint: string | undefined;

        // Both LOCAL and DOCKER modes use the simulator, just with different endpoints
        switch (teeMode) {
            case TEEMode.LOCAL:
                endpoint = "http://localhost:8090";
                elizaLogger.log(
                    "TEE: Connecting to local simulator at localhost:8090"
                );
                break;
            case TEEMode.DOCKER:
                endpoint = "http://host.docker.internal:8090";
                elizaLogger.log(
                    "TEE: Connecting to simulator via Docker at host.docker.internal:8090"
                );
                break;
            case TEEMode.PRODUCTION:
                endpoint = undefined;
                elizaLogger.log(
                    "TEE: Running in production mode without simulator"
                );
                break;
            default:
                throw new Error(
                    `Invalid TEE_MODE: ${teeMode}. Must be one of: LOCAL, DOCKER, PRODUCTION`
                );
        }

        this.client = endpoint ? new TappdClient(endpoint) : new TappdClient();
        this.raProvider = new RemoteAttestationProvider(teeMode);
    }

/**
 * Generates a remote attestation quote for deriving a key.
 *
 * @param {string} agentId - The ID of the agent.
 * @param {string} publicKey - The public key for the attestation.
 * @returns {Promise<RemoteAttestationQuote>} The generated remote attestation quote.
 */
    private async generateDeriveKeyAttestation(
        agentId: string,
        publicKey: string
    ): Promise<RemoteAttestationQuote> {
        const deriveKeyData: DeriveKeyAttestationData = {
            agentId,
            publicKey,
        };
        const reportdata = JSON.stringify(deriveKeyData);
        elizaLogger.log(
            "Generating Remote Attestation Quote for Derive Key..."
        );
        const quote = await this.raProvider.generateAttestation(reportdata);
        elizaLogger.log("Remote Attestation Quote generated successfully!");
        return quote;
    }

/**
 * Asynchronously derives a key based on the provided path and subject.
 * 
 * @param {string} path - The path used to derive the key.
 * @param {string} subject - The subject used to derive the key.
 * @returns {Promise<DeriveKeyResponse>} A promise that resolves with the derived key response.
 */
    async rawDeriveKey(
        path: string,
        subject: string
    ): Promise<DeriveKeyResponse> {
        try {
            if (!path || !subject) {
                elizaLogger.error(
                    "Path and Subject are required for key derivation"
                );
            }

            elizaLogger.log("Deriving Raw Key in TEE...");
            const derivedKey = await this.client.deriveKey(path, subject);

            elizaLogger.log("Raw Key Derived Successfully!");
            return derivedKey;
        } catch (error) {
            elizaLogger.error("Error deriving raw key:", error);
            throw error;
        }
    }

/**
 * Asynchronously derives an Ed25519 keypair using the provided path, subject, and agentId.
 * 
 * @param {string} path - The path used for key derivation.
 * @param {string} subject - The subject used for key derivation.
 * @param {string} agentId - The agent id associated with the key derivation process.
 * @returns {Promise<{ keypair: Keypair; attestation: RemoteAttestationQuote }>} A promise that resolves to an object containing the derived keypair and attestation.
 * @throws Error if an error occurs during the key derivation process.
 */
    async deriveEd25519Keypair(
        path: string,
        subject: string,
        agentId: string
    ): Promise<{ keypair: Keypair; attestation: RemoteAttestationQuote }> {
        try {
            if (!path || !subject) {
                elizaLogger.error(
                    "Path and Subject are required for key derivation"
                );
            }

            elizaLogger.log("Deriving Key in TEE...");
            const derivedKey = await this.client.deriveKey(path, subject);
            const uint8ArrayDerivedKey = derivedKey.asUint8Array();

            const hash = crypto.createHash("sha256");
            hash.update(uint8ArrayDerivedKey);
            const seed = hash.digest();
            const seedArray = new Uint8Array(seed);
            const keypair = Keypair.fromSeed(seedArray.slice(0, 32));

            // Generate an attestation for the derived key data for public to verify
            const attestation = await this.generateDeriveKeyAttestation(
                agentId,
                keypair.publicKey.toBase58()
            );
            elizaLogger.log("Key Derived Successfully!");

            return { keypair, attestation };
        } catch (error) {
            elizaLogger.error("Error deriving key:", error);
            throw error;
        }
    }

/**
 * Asynchronously derive an ECDSA keypair using a given path, subject, and agent ID.
 * 
 * @param {string} path - The path for key derivation.
 * @param {string} subject - The subject for key derivation.
 * @param {string} agentId - The agent ID for generating attestation.
 * @returns {Promise<{ keypair: PrivateKeyAccount, attestation: RemoteAttestationQuote }>} - Object containing the derived keypair and attestation.
 * @throws {Error} - If there is an error during the key derivation process.
 */
    async deriveEcdsaKeypair(
        path: string,
        subject: string,
        agentId: string
    ): Promise<{
        keypair: PrivateKeyAccount;
        attestation: RemoteAttestationQuote;
    }> {
        try {
            if (!path || !subject) {
                elizaLogger.error(
                    "Path and Subject are required for key derivation"
                );
            }

            elizaLogger.log("Deriving ECDSA Key in TEE...");
            const deriveKeyResponse: DeriveKeyResponse =
                await this.client.deriveKey(path, subject);
            const hex = keccak256(deriveKeyResponse.asUint8Array());
            const keypair: PrivateKeyAccount = privateKeyToAccount(hex);

            // Generate an attestation for the derived key data for public to verify
            const attestation = await this.generateDeriveKeyAttestation(
                agentId,
                keypair.address
            );
            elizaLogger.log("ECDSA Key Derived Successfully!");

            return { keypair, attestation };
        } catch (error) {
            elizaLogger.error("Error deriving ecdsa key:", error);
            throw error;
        }
    }
}

/**
 * A provider for deriving key pairs for Solana and EVM based on the TEE mode set in the runtime.
 * 
 * @param {IAgentRuntime} runtime - The runtime object containing the settings and agent ID.
 * @param {Memory} [_message] - Optional message data.
 * @param {State} [_state] - Optional state data.
 * @returns {Promise<string>} - A Promise that resolves to a JSON string containing the public keys of the derived key pairs.
 */
const deriveKeyProvider: Provider = {
    get: async (runtime: IAgentRuntime, _message?: Memory, _state?: State) => {
        const teeMode = runtime.getSetting("TEE_MODE");
        const provider = new DeriveKeyProvider(teeMode);
        const agentId = runtime.agentId;
        try {
            // Validate wallet configuration
            if (!runtime.getSetting("WALLET_SECRET_SALT")) {
                elizaLogger.error(
                    "Wallet secret salt is not configured in settings"
                );
                return "";
            }

            try {
                const secretSalt =
                    runtime.getSetting("WALLET_SECRET_SALT") || "secret_salt";
                const solanaKeypair = await provider.deriveEd25519Keypair(
                    "/",
                    secretSalt,
                    agentId
                );
                const evmKeypair = await provider.deriveEcdsaKeypair(
                    "/",
                    secretSalt,
                    agentId
                );
                return JSON.stringify({
                    solana: solanaKeypair.keypair.publicKey,
                    evm: evmKeypair.keypair.address,
                });
            } catch (error) {
                elizaLogger.error("Error creating PublicKey:", error);
                return "";
            }
        } catch (error) {
            elizaLogger.error("Error in derive key provider:", error.message);
            return `Failed to fetch derive key information: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    },
};

export { deriveKeyProvider, DeriveKeyProvider };
