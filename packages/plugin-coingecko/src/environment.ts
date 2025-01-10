import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

const coingeckoConfigSchema = z.object({
    COINGECKO_API_KEY: z.string().nullable(),
    COINGECKO_PRO_API_KEY: z.string().nullable(),
}).refine(data => data.COINGECKO_API_KEY || data.COINGECKO_PRO_API_KEY, {
    message: "Either COINGECKO_API_KEY or COINGECKO_PRO_API_KEY must be provided"
});

/**
 * The CoingeckoConfig type is inferred from the coingeckoConfigSchema.
 */
export type CoingeckoConfig = z.infer<typeof coingeckoConfigSchema>;

/**
 * Validates the Coingecko configuration settings by retrieving the API keys from the runtime environment
 * @param {IAgentRuntime} runtime - The agent runtime instance
 * @returns {Promise<CoingeckoConfig>} - The validated Coingecko configuration object
 */
export async function validateCoingeckoConfig(runtime: IAgentRuntime): Promise<CoingeckoConfig> {
    const config = {
        COINGECKO_API_KEY: runtime.getSetting("COINGECKO_API_KEY"),
        COINGECKO_PRO_API_KEY: runtime.getSetting("COINGECKO_PRO_API_KEY"),
    };

    return coingeckoConfigSchema.parse(config);
}

/**
 * Function to get the API configuration based on the provided Coingecko configuration object.
 * @param {CoingeckoConfig} config - The Coingecko configuration object containing API keys.
 * @returns {Object} - An object containing the base URL, API key, and header key based on whether the configuration is for a pro account.
 */
export function getApiConfig(config: CoingeckoConfig) {
    const isPro = !!config.COINGECKO_PRO_API_KEY;
    return {
        baseUrl: isPro ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3",
        apiKey: isPro ? config.COINGECKO_PRO_API_KEY : config.COINGECKO_API_KEY,
        headerKey: isPro ? "x-cg-pro-api-key" : "x-cg-demo-api-key"
    };
}
