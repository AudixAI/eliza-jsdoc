import { elizaLogger } from "@elizaos/core";

/**
 * Collection of functions to log debugging information related to API requests and responses.
 * * @type { Object }
 * @property { Function } request - Logs API request details including method, URL, and optional data.
 * @property { Function } response - Logs API response details including status and data.
 * @property { Function } error - Logs error details including message, response status, response data, configuration URL, method, and data.
 * @property { Function } validation - Logs configuration validation details.
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