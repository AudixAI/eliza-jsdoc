import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const binanceEnvSchema = z.object({
    BINANCE_API_KEY: z.string().min(1, "Binance API key is required"),
    BINANCE_SECRET_KEY: z.string().min(1, "Binance secret key is required"),
});

/**
 * Type definition for BinanceConfig inferred from binanceEnvSchema.
 */
export type BinanceConfig = z.infer<typeof binanceEnvSchema>;

/**
 * Validates the Binance configuration provided in the runtime settings
 * @param {IAgentRuntime} runtime - The runtime object containing settings
 * @returns {Promise<BinanceConfig>} Promise that resolves with the validated Binance configuration
 */
export async function validateBinanceConfig(
    runtime: IAgentRuntime
): Promise<BinanceConfig> {
    try {
        const config = {
            BINANCE_API_KEY: runtime.getSetting("BINANCE_API_KEY"),
            BINANCE_SECRET_KEY: runtime.getSetting("BINANCE_SECRET_KEY"),
        };

        return binanceEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Binance configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
