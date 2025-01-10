import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const stargazeEnvSchema = z.object({
    STARGAZE_ENDPOINT: z.string().min(1, "Stargaze API endpoint is required"),
});

/**
 * Represents the configuration for Stargaze, inferred from the stargazeEnvSchema.
 */
export type StargazeConfig = z.infer<typeof stargazeEnvSchema>;

/**
 * Validates the Stargaze configuration based on the provided runtime settings.
 * @param {IAgentRuntime} runtime - The runtime object that provides access to settings.
 * @returns {Promise<StargazeConfig>} A Promise that resolves to the validated Stargaze configuration.
 */
export async function validateStargazeConfig(
    runtime: IAgentRuntime
): Promise<StargazeConfig> {
    try {
        const config = {
            STARGAZE_ENDPOINT: runtime.getSetting("STARGAZE_ENDPOINT"),
        };
        return stargazeEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Stargaze configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}