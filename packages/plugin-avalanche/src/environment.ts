import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const avalancheEnvSchema = z.object({
    AVALANCHE_PRIVATE_KEY: z
        .string()
        .min(1, "Avalanche private key is required"),
});

/**
 * Represents the type of Avalanche configuration inferred from the 'avalancheEnvSchema'.
 */
export type AvalancheConfig = z.infer<typeof avalancheEnvSchema>;
/**
 * Validates the Avalanche configuration based on the runtime setting and environment variables.
 * 
 * @param {IAgentRuntime} runtime - The runtime object containing settings and environment variables.
 * @returns {Promise<AvalancheConfig>} The validated Avalanche configuration object.
 */
export async function validateAvalancheConfig(
    runtime: IAgentRuntime
): Promise<AvalancheConfig> {
    try {
        const config = {
            AVALANCHE_PRIVATE_KEY:
                runtime.getSetting("AVALANCHE_PRIVATE_KEY") ||
                process.env.AVALANCHE_PRIVATE_KEY,
        };

        return avalancheEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(errorMessages);
        }
        throw error;
    }
}
