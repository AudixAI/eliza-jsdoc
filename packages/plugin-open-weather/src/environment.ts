import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const openWeatherEnvSchema = z.object({
    OPEN_WEATHER_API_KEY: z.string().min(1, "OpenWeather API key is required"),
});

/**
 * Type definition for the configuration object that is inferred from the 'openWeatherEnvSchema'.
 */
export type OpenWeatherConfig = z.infer<typeof openWeatherEnvSchema>;

/**
 * Validates the OpenWeather configuration based on the given runtime settings.
 * Retrieves the OpenWeather API key from the runtime settings and validates it using the openWeatherEnvSchema.
 * 
 * @param {IAgentRuntime} runtime - The runtime object containing the settings for the agent.
 * @returns {Promise<OpenWeatherConfig>} - A promise that resolves to the validated OpenWeather configuration.
 * @throws {Error} - If the OpenWeather configuration validation fails, an error with detailed error messages is thrown.
 */
export async function validateOpenWeatherConfig(
    runtime: IAgentRuntime
): Promise<OpenWeatherConfig> {
    try {
        const config = {
            OPEN_WEATHER_API_KEY: runtime.getSetting("OPEN_WEATHER_API_KEY"),
        };

        return openWeatherEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `OpenWeather configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
