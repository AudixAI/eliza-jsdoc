import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const giphyEnvSchema = z.object({
    GIPHY_API_KEY: z.string().min(1, "Giphy API key is required"),
});

/**
 * Represents the type inferred from the giphyEnvSchema schema,
 * which is used as the GiphyConfig data type.
 */
export type GiphyConfig = z.infer<typeof giphyEnvSchema>;

/**
 * Validates the Giphy configuration by retrieving the necessary settings from the runtime,
 * parsing the configuration using the giphyEnvSchema, and throwing an error if validation fails.
 * 
 * @param {IAgentRuntime} runtime The agent runtime to retrieve the settings from.
 * @returns {Promise<GiphyConfig>} The validated Giphy configuration.
 */
export async function validateGiphyConfig(
    runtime: IAgentRuntime
): Promise<GiphyConfig> {
    try {
        const config = {
            GIPHY_API_KEY: runtime.getSetting("GIPHY_API_KEY"),
        };
        return giphyEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Giphy configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
