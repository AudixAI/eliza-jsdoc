/**
 * Enumeration representing the modes for running the TEE (Trusted Execution Environment).
 * - `OFF`: The TEE is turned off.
 * - `LOCAL`: Used for local development with a simulator.
 * - `DOCKER`: Used for development with Docker and a simulator.
 * - `PRODUCTION`: Used for production without a simulator.
 */
export enum TEEMode {
    OFF = "OFF",
    LOCAL = "LOCAL", // For local development with simulator
    DOCKER = "DOCKER", // For docker development with simulator
    PRODUCTION = "PRODUCTION", // For production without simulator
}

/**
 * Interface representing a remote attestation quote.
 * @property {string} quote - The quote generated during remote attestation.
 * @property {number} timestamp - The timestamp indicating when the quote was generated.
 */
export interface RemoteAttestationQuote {
    quote: string;
    timestamp: number;
}
