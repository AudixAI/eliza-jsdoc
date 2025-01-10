import { elizaLogger, IAgentRuntime, settings, State } from "@elizaos/core";
import { PublicKey } from "@solana/web3.js";
import { PROVIDER_CONFIG } from "./config";
import { ANALYSIS_HISTORY_EXPIRY } from "./constants";

/**
 * Check if the provided string is a valid Solana address by attempting to create a new PublicKey instance from it.
 * 
 * @param {string} address - The string to be validated as a Solana address
 * @returns {boolean} - True if the address is valid, false if it is not
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        // Check if it's a valid Solana public key format
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

/**
 * Asynchronous function that fetches data from a specified URL with retry logic.
 * @param {string} url - The URL to fetch data from.
 * @param {RequestInit} options - Optional additional options for the fetch request.
 * @param {"solana"|"base"} chain - The chain type for the request, default is "solana".
 * @returns {Promise<any>} A promise that resolves with the fetched data, or rejects with an error after multiple retries.
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    chain: "solana" | "base" = "solana"
): Promise<any> {
    let lastError: Error;

    for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
        try {
            elizaLogger.log(`Attempt ${i + 1} for ${url} with chain ${chain}`);

            // Ensure headers are properly initialized
            const headers = {
                Accept: "application/json",
                "x-chain": chain,
                "X-API-KEY": settings.BIRDEYE_API_KEY || "",
                ...options.headers,
            };

            const response = await fetch(url, {
                ...options,
                headers,
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${responseText}`
                );
            }

            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(
                    `Failed to parse response: ${responseText}, error: ${parseError.message}`
                );
            }
        } catch (error) {
            elizaLogger.error(`Attempt ${i + 1} failed:`, {
                error: error instanceof Error ? error.message : String(error),
                url,
                chain,
                attempt: i + 1,
            });
            lastError =
                error instanceof Error ? error : new Error(String(error));

            if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
                await new Promise((resolve) =>
                    setTimeout(
                        resolve,
                        PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i)
                    )
                );
                continue;
            }
        }
    }

    throw lastError;
}

/**
 * Decodes a Base58 encoded string into a Uint8Array.
 *
 * @param {string} str - The Base58 encoded string to decode.
 * @returns {Uint8Array} - The decoded Uint8Array.
 */
export function decodeBase58(str: string): Uint8Array {
    const ALPHABET =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const ALPHABET_MAP = new Map(
        ALPHABET.split("").map((c, i) => [c, BigInt(i)])
    );

    let result = BigInt(0);
    for (const char of str) {
        const value = ALPHABET_MAP.get(char);
        if (value === undefined) throw new Error("Invalid base58 character");
        result = result * BigInt(58) + value;
    }

    const bytes = [];
    while (result > 0n) {
        bytes.unshift(Number(result & 0xffn));
        result = result >> 8n;
    }

    for (let i = 0; i < str.length && str[i] === "1"; i++) {
        bytes.unshift(0);
    }

    return new Uint8Array(bytes);
}

/**
 * Interface representing an analyzed token with address, timestamp, and symbol properties.
 * @typedef {object} AnalyzedToken
 * @property {string} address - The address of the token.
 * @property {number} timestamp - The timestamp when the token was analyzed.
 * @property {string} symbol - The symbol representing the token.
 */
interface AnalyzedToken {
    address: string;
    timestamp: number;
    symbol: string;
}

/**
 * Manages the analyzed tokens history for the agent.
 * 
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @param {any} state - The current state of the agent.
 * @param {AnalyzedToken} [newToken] - The new analyzed token to add to the history.
 * @returns {Promise<AnalyzedToken[]>} The updated history of analyzed tokens.
 */
export async function manageAnalyzedTokens(
    runtime: IAgentRuntime,
    state: any,
    newToken?: AnalyzedToken
): Promise<AnalyzedToken[]> {
    try {
        const historyKey = "analyzed_tokens_history";
        let history: AnalyzedToken[] = [];

        if (!state) {
            state = {};
        }

        if (state[historyKey]) {
            try {
                const parsed = JSON.parse(state[historyKey]);
                if (Array.isArray(parsed)) {
                    history = parsed;
                }
            } catch (e) {
                elizaLogger.warn("Failed to parse history, resetting", e);
            }
        }

        const now = Date.now();
        history = history.filter(
            (token) =>
                token &&
                token.timestamp &&
                now - token.timestamp < ANALYSIS_HISTORY_EXPIRY
        );

        if (newToken) {
            history.push(newToken);
        }

        // Update state with roomId
        state = await runtime.updateRecentMessageState({
            ...state,
            userId: runtime.agentId,
            agentId: runtime.agentId,
            roomId: runtime.agentId,
            content: {
                ...state.content,
                [historyKey]: JSON.stringify(history),
            },
        } as State);

        return history;
    } catch (error) {
        elizaLogger.error("Failed to manage analyzed tokens history:", {
            error: error instanceof Error ? error.message : error,
        });
        return [];
    }
}
