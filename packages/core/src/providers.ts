import { IAgentRuntime, State, type Memory } from "./types.ts";

/**
 * Formats provider outputs into a string which can be injected into the context.
 * @param runtime The AgentRuntime object.
 * @param message The incoming message object.
 * @param state The current state object.
 * @returns A string that concatenates the outputs of each provider.
 */
/**
 * Retrieves data from all providers associated with the specified runtime, message, and optional state.
 * @param {IAgentRuntime} runtime - The agent runtime object containing providers to retrieve data from.
 * @param {Memory} message - The memory object containing message data.
 * @param {State} [state] - Optional state object containing additional context.
 * @returns {Promise<string>} A promise that resolves with the result of combining data from all providers, separated by new lines.
 */
export async function getProviders(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
) {
    const providerResults = (
        await Promise.all(
            runtime.providers.map(async (provider) => {
                return await provider.get(runtime, message, state);
            })
        )
    ).filter((result) => result != null && result !== "");

    return providerResults.join("\n");
}
