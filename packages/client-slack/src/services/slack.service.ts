import { Service, IAgentRuntime, ServiceType } from "@elizaos/core";
import { WebClient } from "@slack/web-api";
import { ISlackService } from "../types/slack-types";

/**
 * Represents a service class for interacting with Slack API.
 * * @extends Service
 * @implements ISlackService
 */
export class SlackService extends Service implements ISlackService {
    public client: WebClient;

/**
 * Get the service type as Slack.
 * @returns {ServiceType} The service type as Slack.
 */
    static get serviceType(): ServiceType {
        return ServiceType.SLACK;
    }

/**
 * Get the type of service being used, which in this case is Slack.
 * 
 * @returns {ServiceType} The type of service, which is Slack.
 */
    get serviceType(): ServiceType {
        return ServiceType.SLACK;
    }

/**
 * Asynchronously initializes the Slack client with the given runtime and bot token.
 * 
 * @param {IAgentRuntime} runtime - The runtime object provided by the agent framework.
 * @returns {Promise<void>} A promise that resolves when the client has been successfully initialized.
 * @throws {Error} If the SLACK_BOT_TOKEN setting is missing.
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        const token = runtime.getSetting("SLACK_BOT_TOKEN");
        if (!token) {
            throw new Error("SLACK_BOT_TOKEN is required");
        }
        this.client = new WebClient(token);
    }
}
