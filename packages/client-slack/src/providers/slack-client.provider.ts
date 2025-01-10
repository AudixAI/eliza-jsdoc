import { WebClient } from "@slack/web-api";
import { SlackConfig, SlackClientContext } from "../types/slack-types";
import { SlackUtils, RetryOptions } from "../utils/slack-utils";
import { elizaLogger } from "@elizaos/core";

/**
 * A class representing a Slack Client provider.
 */
export class SlackClientProvider {
    private client: WebClient;
    private config: SlackConfig;
    private retryOptions: RetryOptions;

/**
* Class constructor for creating a new SlackClient instance.
* @param {SlackConfig} config - The configuration object for the Slack client.
* @param {RetryOptions} [retryOptions={}] - Optional retry options for network requests.
*/
    constructor(config: SlackConfig, retryOptions: RetryOptions = {}) {
        this.config = config;
        this.client = new WebClient(config.botToken);
        this.retryOptions = {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            ...retryOptions,
        };
    }

/**
 * Get the Slack client context containing the client and configuration.
 * @returns {SlackClientContext} The Slack client context object with client and config properties.
 */
    public getContext(): SlackClientContext {
        return {
            client: this.client,
            config: this.config,
        };
    }

/**
 * Asynchronously validates the Slack connection by testing the authentication, applying rate limiting,
 * and setting the bot ID in the configuration. Returns a boolean indicating the success of the validation.
 * 
 * @returns {Promise<boolean>} A Promise that resolves to true if the connection is validated successfully,
 * and false otherwise.
 */
    public async validateConnection(): Promise<boolean> {
        try {
            const result = await SlackUtils.withRateLimit(
                () => this.client.auth.test(),
                this.retryOptions
            );

            if (result.ok) {
                this.config.botId = result.user_id || this.config.botId;
                elizaLogger.log("Bot ID:", this.config.botId);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Slack connection validation failed:", error);
            return false;
        }
    }

/**
 * Sends a message to the specified channel using the Slack client with retry options.
 * @param {string} channel - The channel to send the message to.
 * @param {string} text - The text content of the message.
 * @returns {Promise<any>} A promise that resolves when the message is sent.
 */
    public async sendMessage(channel: string, text: string): Promise<any> {
        return SlackUtils.sendMessageWithRetry(
            this.client,
            channel,
            text,
            this.retryOptions
        );
    }

/**
 * Reply to a message in a thread on Slack.
 * @param {string} channel - The channel to reply in.
 * @param {string} threadTs - The timestamp of the thread to reply in.
 * @param {string} text - The text of the reply.
 * @returns {Promise<any>} - A Promise that resolves with the response from Slack.
 */
    public async replyInThread(
        channel: string,
        threadTs: string,
        text: string
    ): Promise<any> {
        return SlackUtils.replyInThread(
            this.client,
            channel,
            threadTs,
            text,
            this.retryOptions
        );
    }

/**
 * Asynchronously validates a channel based on the given channelId using SlackUtils
 * @param {string} channelId - The ID of the channel to validate
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the channel is valid
 */
    public async validateChannel(channelId: string): Promise<boolean> {
        return SlackUtils.validateChannel(this.client, channelId);
    }

/**
 * Format a message using SlackUtils.
 * 
 * @param {string} text - The main text content of the message.
 * @param {object} options - Optional parameters for formatting the message.
 * @param {array} options.blocks - An array of additional blocks to include in the message.
 * @param {array} options.attachments - An array of attachments to include in the message.
 * @returns {string} The formatted message.
 */
    public formatMessage(
        text: string,
        options?: {
            blocks?: any[];
            attachments?: any[];
        }
    ) {
        return SlackUtils.formatMessage(text, options);
    }

/**
 * Asynchronously executes the provided function with rate limiting applied.
 * * @template T
 * @param {() => Promise<T>} fn - The function to be executed with rate limiting applied.
 * @returns {Promise<T>} A Promise that resolves with the result of the provided function.
 */
    public async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
        return SlackUtils.withRateLimit(fn, this.retryOptions);
    }
}
