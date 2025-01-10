import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

/**
 * Schema for Intiface environment variables
 * @type {import('zod').ZodObject}
 */
export const intifaceEnvSchema = z
    .object({
        INTIFACE_URL: z.string().default("ws://localhost:12345"),
        INTIFACE_NAME: z.string().default("Eliza Intiface Client"),
        DEVICE_NAME: z.string().default("Lovense Nora"),
    })
    .refine(
        (data) => {
            return (
                data.INTIFACE_URL.startsWith("ws://") ||
                data.INTIFACE_URL.startsWith("wss://")
            );
        },
        {
            message:
                "INTIFACE_URL must be a valid WebSocket URL (ws:// or wss://)",
        }
    );

/**
 * Type definition for IntifaceConfig, inferred from intifaceEnvSchema.
 */
export type IntifaceConfig = z.infer<typeof intifaceEnvSchema>;

/**
 * Validates the Intiface configuration based on the provided runtime object.
 * @param {IAgentRuntime} runtime - The runtime object containing settings and environment variables.
 * @returns {Promise<IntifaceConfig>} The validated Intiface configuration.
 */
export async function validateIntifaceConfig(
    runtime: IAgentRuntime
): Promise<IntifaceConfig> {
    try {
        const config = {
            INTIFACE_URL:
                runtime.getSetting("INTIFACE_URL") || process.env.INTIFACE_URL,
            INTIFACE_NAME:
                runtime.getSetting("INTIFACE_NAME") ||
                process.env.INTIFACE_NAME,
            DEVICE_NAME:
                runtime.getSetting("DEVICE_NAME") || process.env.DEVICE_NAME,
        };

        return intifaceEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Intiface configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
