import { elizaLogger } from "@elizaos/core";

/**
 * A collection of functions for logging various aspects of API interactions.
 * @namespace debugLog
 */
export const debugLog = {
    request: (method: string, url: string, data?: any) => {
        elizaLogger.log("🌐 API Request:", {
            method,
            url,
            data: data || "No data"
        });
    },

    response: (response: any) => {
        elizaLogger.log("✅ API Response:", {
            status: response?.status,
            data: response?.data || "No data"
        });
    },

    error: (error: any) => {
        elizaLogger.error("⛔ Error Details:", {
            message: error?.message,
            response: {
                status: error?.response?.status,
                data: error?.response?.data
            },
            config: {
                url: error?.config?.url,
                method: error?.config?.method,
                data: error?.config?.data
            }
        });
    },

    validation: (config: any) => {
        elizaLogger.log("🔍 Config Validation:", config);
    }
};
