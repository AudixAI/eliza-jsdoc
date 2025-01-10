import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const telegramEnvSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
});

/**
 * Represents the type of the Telegram configuration inferred from the telegramEnvSchema.
 */
export type TelegramConfig = z.infer<typeof telegramEnvSchema>;

/**
 * Validates the Telegram configuration by retrieving the TELEGRAM_BOT_TOKEN setting from the runtime or environment variables
 * and parsing it using the telegramEnvSchema.
 * 
 * @param {IAgentRuntime} runtime The Agent Runtime interface.
 * @returns {Promise<TelegramConfig>} A promise that resolves with the validated Telegram configuration.
 */
export async function validateTelegramConfig(
    runtime: IAgentRuntime
): Promise<TelegramConfig> {
    try {
        const config = {
            TELEGRAM_BOT_TOKEN:
                runtime.getSetting("TELEGRAM_BOT_TOKEN") ||
                process.env.TELEGRAM_BOT_TOKEN,
        };

        return telegramEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Telegram configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
