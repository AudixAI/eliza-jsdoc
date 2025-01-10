import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

/**
 * Async function to retrieve the current UTC date and time in a human-readable format.
 *
 * @param {IAgentRuntime} _runtime - The runtime environment used by the agent.
 * @param {Memory} _message - The message containing information relevant to the agent's current state.
 * @param {State} [_state] - The optional state object that can be passed to the function.
 * @returns {string} A formatted string indicating the current date and time in UTC for reference.
 */
/**
 * Retrieves the current UTC date and time in a human-readable format.
 * 
 * @param _runtime - The agent runtime environment.
 * @param _message - The message received by the agent.
 * @param _state - Optional state object to store information across conversations.
 * @returns A message containing the current date and time in a human-readable format.
 */
const timeProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        const currentDate = new Date();

        // Get UTC time since bots will be communicating with users around the global
        const options = {
            timeZone: "UTC",
            dateStyle: "full" as const,
            timeStyle: "long" as const,
        };
        const humanReadable = new Intl.DateTimeFormat("en-US", options).format(
            currentDate
        );
        return `The current date and time is ${humanReadable}. Please use this as your reference for any time-based operations or responses.`;
    },
};
export { timeProvider };
