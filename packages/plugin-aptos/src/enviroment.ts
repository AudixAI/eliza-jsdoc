import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const aptosEnvSchema = z.object({
    APTOS_PRIVATE_KEY: z.string().min(1, "Aptos private key is required"),
    APTOS_NETWORK: z.enum(["mainnet", "testnet"]),
});

/**
 * Type definition for the configuration object of Aptos, inferred from the aptosEnvSchema.
 */
export type AptosConfig = z.infer<typeof aptosEnvSchema>;

/**
 * Validates the configuration for Aptos by checking if the required settings are provided and in the correct format.
 *
 * @param {IAgentRuntime} runtime - The current Agent runtime.
 * @returns {Promise<AptosConfig>} - A Promise that resolves to the validated Aptos configuration.
 */
export async function validateAptosConfig(
    runtime: IAgentRuntime
): Promise<AptosConfig> {
    try {
        const config = {
            APTOS_PRIVATE_KEY:
                runtime.getSetting("APTOS_PRIVATE_KEY") ||
                process.env.APTOS_PRIVATE_KEY,
            APTOS_NETWORK:
                runtime.getSetting("APTOS_NETWORK") ||
                process.env.APTOS_NETWORK,
        };

        return aptosEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Aptos configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
