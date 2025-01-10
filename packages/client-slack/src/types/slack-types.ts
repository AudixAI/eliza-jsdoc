import { WebClient } from "@slack/web-api";
import { Service, ServiceType } from "@elizaos/core";

/**
 * Interface representing the configuration settings for a Slack application.
 * @typedef {object} SlackConfig
 * @property {string} appId - The Slack application ID.
 * @property {string} clientId - The client ID for the Slack application.
 * @property {string} clientSecret - The client secret for the Slack application.
 * @property {string} signingSecret - The signing secret for verifying requests from Slack.
 * @property {string} verificationToken - The verification token for the Slack application.
 * @property {string} botToken - The bot token for the Slack application.
 * @property {string} botId - The bot ID for the Slack application.
 */
export interface SlackConfig {
    appId: string;
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    verificationToken: string;
    botToken: string;
    botId: string;
}

/**
 * Interface representing the context of a Slack client.
 * @typedef {object} SlackClientContext
 * @property {any} client - The Slack client object.
 * @property {SlackConfig} config - The configuration object for the Slack client.
 */
export interface SlackClientContext {
    client: any;
    config: SlackConfig;
}

/**
 * Interface for defining a Slack message.
 * @typedef {object} SlackMessage
 * @property {string} text - The text content of the message.
 * @property {string} userId - The ID of the user sending the message.
 * @property {string} channelId - The ID of the channel where the message is being sent.
 * @property {string} [threadTs] - Optional timestamp of the parent message if replying in a thread.
 * @property {Array<{ type: string, url: string, title: string, size: number }>} [attachments] - Optional array of attachments for the message.
 */
export interface SlackMessage {
    text: string;
    userId: string;
    channelId: string;
    threadTs?: string;
    attachments?: Array<{
        type: string;
        url: string;
        title: string;
        size: number;
    }>;
}

// We'll temporarily use TEXT_GENERATION as our service type
// This is not ideal but allows us to work within current constraints
export const SLACK_SERVICE_TYPE = ServiceType.TEXT_GENERATION;

// Interface extending core Service
/**
 * Interface representing a Slack service.
 * Extends Service interface.
 * Contains a property 'client' of type WebClient.
 */
export interface ISlackService extends Service {
    client: WebClient;
}
