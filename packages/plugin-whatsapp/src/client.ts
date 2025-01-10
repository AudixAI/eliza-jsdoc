import axios, { AxiosInstance } from "axios";
import { WhatsAppConfig, WhatsAppMessage } from "./types";

/**
 * WhatsAppClient class to interact with the WhatsApp API.
 */

export class WhatsAppClient {
    private client: AxiosInstance;
    private config: WhatsAppConfig;

/**
 * Constructor function for creating a new instance of WhatsAppAPI.
 * @param {WhatsAppConfig} config - The configuration object containing the necessary details.
 */
    constructor(config: WhatsAppConfig) {
        this.config = config;
        this.client = axios.create({
            baseURL: "https://graph.facebook.com/v17.0",
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
                "Content-Type": "application/json",
            },
        });
    }

/**
 * Asynchronously sends a message via WhatsApp.
 * 
 * @param {WhatsAppMessage} message - The message object containing details like recipient, message type, and content.
 * @returns {Promise<any>} - A promise that resolves to the result of sending the message.
 */
    async sendMessage(message: WhatsAppMessage): Promise<any> {
        const endpoint = `/${this.config.phoneNumberId}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: message.to,
            type: message.type,
            ...(message.type === "text"
                ? { text: { body: message.content } }
                : { template: message.content }),
        };

        return this.client.post(endpoint, payload);
    }

/**
 * Verifies the webhook token by comparing it with the configured webhook verify token.
 * 
 * @param {string} token - The webhook token to verify.
 * @returns {Promise<boolean>} - A promise that resolves to true if the token matches the configured webhook verify token, otherwise false.
 */
    async verifyWebhook(token: string): Promise<boolean> {
        return token === this.config.webhookVerifyToken;
    }
}
