import { SlackClientContext, SlackMessage } from "../types/slack-types";

// Cache to store recently sent messages
const recentMessages = new Map<string, { text: string; timestamp: number }>();
const MESSAGE_CACHE_TTL = 5000; // 5 seconds TTL

/**
 * Represents an action to send a message to a Slack channel.
 */

export class SendMessageAction {
/**
 * Constructor for initializing a new instance of the class.
 * 
 * @param context - The Slack client context to be used by the instance
 */
    constructor(private context: SlackClientContext) {}

/**
 * Function to cleanup old messages from recentMessages cache based on MESSAGE_CACHE_TTL
 */
    private cleanupOldMessages() {
        const now = Date.now();
        for (const [key, value] of recentMessages.entries()) {
            if (now - value.timestamp > MESSAGE_CACHE_TTL) {
                recentMessages.delete(key);
            }
        }
    }

/**
 * Checks if a Slack message is a duplicate based on the combination of channelId, threadTs (or "main" if threadTs is null), and text.
 * If the message is considered a duplicate, it returns true; otherwise, it stores the message in the recentMessages map and returns false.
 * @param {SlackMessage} message - The Slack message to check for duplication.
 * @returns {boolean} True if the message is a duplicate, false otherwise.
 */
    private isDuplicate(message: SlackMessage): boolean {
        this.cleanupOldMessages();

        // Create a unique key for the message
        const messageKey = `${message.channelId}:${message.threadTs || "main"}:${message.text}`;

        // Check if we've seen this message recently
        const recentMessage = recentMessages.get(messageKey);
        if (recentMessage) {
            return true;
        }

        // Store the new message
        recentMessages.set(messageKey, {
            text: message.text,
            timestamp: Date.now(),
        });

        return false;
    }

/**
 * Executes the command to send a message in the Slack channel.
 * 
 * @param {SlackMessage} message The Slack message to be sent.
 * @returns {Promise<boolean>} A promise that resolves to true if the message was successfully sent, false otherwise.
 */
    public async execute(message: SlackMessage): Promise<boolean> {
        try {
            // Skip duplicate messages
            if (this.isDuplicate(message)) {
                console.debug("Skipping duplicate message:", message.text);
                return true; // Return true to indicate "success" since we're intentionally skipping
            }

            const result = await this.context.client.chat.postMessage({
                channel: message.channelId,
                text: message.text,
                thread_ts: message.threadTs,
            });

            return result.ok === true;
        } catch (error) {
            console.error("Failed to send message:", error);
            return false;
        }
    }
}
