import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

/**
 * Interface for Slack events.
 * @interface
 * @property {string} channel - The channel the event occurred in.
 * @property {string} channel_type - The type of channel the event occurred in.
 * @property {string} [thread_ts] - The timestamp of the thread the event occurred in (optional).
 * @property {string} [user] - The user associated with the event (optional).
 * @property {string} [team] - The team associated with the event (optional).
 */
interface SlackEvent {
    channel: string;
    channel_type: string;
    thread_ts?: string;
    user?: string;
    team?: string;
}

/**
 * A provider for generating messages based on the state of a Slack channel.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime.
 * @param {Memory} message - The message memory.
 * @param {State} state - The current state of the channel.
 * @returns {string} A message describing the current state of the Slack channel.
 */
export const channelStateProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        const slackEvent = state?.slackEvent as SlackEvent | undefined;
        if (!slackEvent) {
            return "";
        }

        const agentName = state?.agentName || "The agent";
        const senderName = state?.senderName || "someone";
        const channelId = slackEvent.channel;
        const channelType = slackEvent.channel_type;

        // For direct messages
        if (channelType === "im") {
            return `${agentName} is currently in a direct message conversation with ${senderName}`;
        }

        // For channel messages
        let response = `${agentName} is currently having a conversation in the Slack channel <#${channelId}>`;

        // Add thread context if in a thread
        if (slackEvent.thread_ts) {
            response += ` in a thread`;
        }

        // Add team context if available
        if (slackEvent.team) {
            response += ` in the workspace ${slackEvent.team}`;
        }

        return response;
    },
};
