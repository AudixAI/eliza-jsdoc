import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const envSchema = z.object({
    TON_PRIVATE_KEY: z.string().min(1, "Ton private key is required"),
    TON_RPC_URL: z.string(),
});

/**
 * Represents the inferred type of the 'envSchema'.
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates the environment configuration by checking the required environment variables
 * specified in the runtime settings or process environment variables. Returns a parsed
 * EnvConfig object if the configuration is valid, otherwise throws an error with details
 * on the validation failures.
 * 
 * @param {IAgentRuntime} runtime The agent runtime object used to retrieve settings
 * @returns {Promise<EnvConfig>} Parsed configuration object
 */
export async function validateEnvConfig(
    runtime: IAgentRuntime
): Promise<EnvConfig> {
    try {
        const config = {
            TON_PRIVATE_KEY:
                runtime.getSetting("TON_PRIVATE_KEY") ||
                process.env.TON_PRIVATE_KEY,
            TON_RPC_URL:
                runtime.getSetting("TON_RPC_URL") || process.env.TON_RPC_URL,
        };

        return envSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Ton configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
