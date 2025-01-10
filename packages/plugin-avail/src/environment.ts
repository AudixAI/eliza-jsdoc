import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const availEnvSchema = z.object({
    AVAIL_ADDRESS: z.string().min(1, "Avail address is required"),
    AVAIL_SEED: z.string().min(1, "Avail account seed phrase is required"),
});

/**
 * The type definition for the available configuration based on the inferred schema from availEnvSchema.
 */ 

export type availConfig = z.infer<typeof availEnvSchema>;

/**
 * Validates and parses the Avail configuration based on the provided runtime.
 * @param {IAgentRuntime} runtime - The runtime object containing environment settings.
 * @return {Promise<availConfig>} A promise that resolves with the parsed Avail configuration.
 */
export async function validateAvailConfig(
    runtime: IAgentRuntime
): Promise<availConfig> {
    try {
        const config = {
            AVAIL_ADDRESS:
                runtime.getSetting("AVAIL_ADDRESS") ||
                process.env.AVAIL_ADDRESS,
            AVAIL_SEED:
                runtime.getSetting("AVAIL_SEED") || process.env.AVAIL_SEED,
        };

        return availEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Avail configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
