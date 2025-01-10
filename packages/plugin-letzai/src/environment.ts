import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

/**
 * Schema definition for environment variables required for image generation.
 * @type {import('zod').ZodObject<{ LETZAI_API_KEY?: ZodString; }, "strict">}
 */
export const imageGenEnvSchema = z
    .object({
        LETZAI_API_KEY: z.string().optional(),
    })
    .refine(
        (data) => {
            return !!data.LETZAI_API_KEY;
        },
        {
            message: "The LetzAI API KEY has not been set.",
        },
    );

/**
 * The type definition for the configuration of image generation.
 */
export type ImageGenConfig = z.infer<typeof imageGenEnvSchema>;

/**
 * Validates the image generation configuration provided by the runtime
 * @async
 * @param {IAgentRuntime} runtime - The Agent Runtime
 * @returns {Promise<ImageGenConfig>} The validated image generation configuration
 */
export async function validateImageGenConfig(
    runtime: IAgentRuntime,
): Promise<ImageGenConfig> {
    try {
        const config = {
            LETZAI_API_KEY: runtime.getSetting("LETZAI_API_KEY"),
        };

        return imageGenEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Image generation configuration validation failed:\n${errorMessages}`,
            );
        }
        throw error;
    }
}
