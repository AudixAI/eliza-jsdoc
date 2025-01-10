import { Plugin } from "@elizaos/core";
import { WhatsAppClient } from "./client";
import { WhatsAppConfig, WhatsAppMessage, WhatsAppWebhookEvent } from "./types";
import { MessageHandler, WebhookHandler } from "./handlers";

/**
 * Represents a plugin for integrating WhatsApp Cloud API with an application.
 * @implements {Plugin}
 */
 
export class WhatsAppPlugin implements Plugin {
    private client: WhatsAppClient;
    private messageHandler: MessageHandler;
    private webhookHandler: WebhookHandler;

    name: string;
    description: string;

/**
 * Constructor for WhatsApp Cloud API Plugin.
 * @param {WhatsAppConfig} config - The configuration for the WhatsApp plugin.
 */
    constructor(private config: WhatsAppConfig) {
        this.name = "WhatsApp Cloud API Plugin";
        this.description =
            "A plugin for integrating WhatsApp Cloud API with your application.";
        this.client = new WhatsAppClient(config);
        this.messageHandler = new MessageHandler(this.client);
        this.webhookHandler = new WebhookHandler(this.client);
    }

/**
 * Asynchronously sends a WhatsApp message using the provided message. 
 * 
 * @param {WhatsAppMessage} message - The message to be sent.
 * @returns {Promise<any>} A promise that resolves when the message is sent.
 */
    async sendMessage(message: WhatsAppMessage): Promise<any> {
        return this.messageHandler.send(message);
    }

/**
 * Handle a WhatsApp webhook event asynchronously.
 * 
 * @param {WhatsAppWebhookEvent} event - The WhatsApp webhook event to handle.
 * @returns {Promise<void>} A promise that resolves when the event is handled.
 */
    async handleWebhook(event: WhatsAppWebhookEvent): Promise<void> {
        return this.webhookHandler.handle(event);
    }

/**
 * Verifies a webhook token.
 * 
 * @param {string} token - The webhook token to verify.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the token is valid.
 */
    async verifyWebhook(token: string): Promise<boolean> {
        return this.client.verifyWebhook(token);
    }
}

export * from "./types";
