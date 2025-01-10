import { IAgentRuntime } from "@elizaos/core";
import { isAddress } from "viem";
import { z } from "zod";

/**
 * Represents the abstract environment schema which enforces specific constraints on the ABSTRACT_ADDRESS and ABSTRACT_PRIVATE_KEY properties.
 * 
 * @constant
 * @type {import("zod").ZodObject<{ ABSTRACT_ADDRESS: import("zod").ZodString, ABSTRACT_PRIVATE_KEY: import("zod").ZodString }>}
 */
export const abstractEnvSchema = z.object({
    ABSTRACT_ADDRESS: z
        .string()
        .min(1, "Abstract address is required")
        .refine((address) => isAddress(address, { strict: false }), {
            message: "Abstract address must be a valid address",
        }),
    ABSTRACT_PRIVATE_KEY: z
        .string()
        .min(1, "Abstract private key is required")
        .refine((key) => /^[a-fA-F0-9]{64}$/.test(key), {
            message:
                "Abstract private key must be a 64-character hexadecimal string (32 bytes) without the '0x' prefix",
        }),
});

/**
 * Represents the type of configuration that is inferred from the abstractEnvSchema.
 */
export type AbstractConfig = z.infer<typeof abstractEnvSchema>;

/**
 * Validates the abstract configuration settings provided by the runtime.
 * @param {IAgentRuntime} runtime - The agent runtime object used to retrieve settings.
 * @returns {Promise<AbstractConfig>} The validated abstract configuration object.
 */
export async function validateAbstractConfig(
    runtime: IAgentRuntime
): Promise<AbstractConfig> {
    try {
        const config = {
            ABSTRACT_ADDRESS: runtime.getSetting("ABSTRACT_ADDRESS"),
            ABSTRACT_PRIVATE_KEY: runtime.getSetting("ABSTRACT_PRIVATE_KEY"),
        };

        return abstractEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Abstract configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
