import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const spheronEnvSchema = z.object({
    PRIVATE_KEY: z.string().min(1, "Private key is required"),
    PROVIDER_PROXY_URL: z
        .string()
        .url("Provider proxy URL must be a valid URL"),
    WALLET_ADDRESS: z.string().min(1, "Wallet address is required"),
    SPHERON_PROXY_PORT: z.string().optional(),
});

export const requiredEnvVars = [
    "SPHERON_PRIVATE_KEY",
    "SPHERON_WALLET_ADDRESS",
    "SPHERON_PROVIDER_PROXY_URL",
] as const;

/**
 * Represents the configuration object for a Spheron, inferred from the specified spheronEnvSchema.
 */
export type SpheronConfig = z.infer<typeof spheronEnvSchema>;

/**
 * Validates the Spheron configuration by retrieving settings from the runtime or environment variables,
 * and parsing them using the spheronEnvSchema. If the configuration is valid, it returns the parsed config.
 * If there is a validation error, it throws an error with the validation error messages.
 * 
 * @param {IAgentRuntime} runtime - The Agent runtime object used to retrieve settings.
 * @returns {Promise<SpheronConfig>} The validated Spheron configuration.
 */
export async function validateSpheronConfig(
    runtime: IAgentRuntime
): Promise<SpheronConfig> {
    try {
        const config = {
            PRIVATE_KEY:
                runtime.getSetting("PRIVATE_KEY") ||
                process.env.SPHERON_PRIVATE_KEY ||
                process.env.PRIVATE_KEY,
            PROVIDER_PROXY_URL:
                runtime.getSetting("PROVIDER_PROXY_URL") ||
                process.env.SPHERON_PROVIDER_PROXY_URL ||
                process.env.PROVIDER_PROXY_URL,
            WALLET_ADDRESS:
                runtime.getSetting("WALLET_ADDRESS") ||
                process.env.SPHERON_WALLET_ADDRESS ||
                process.env.WALLET_ADDRESS,
        };

        return spheronEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Spheron configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
