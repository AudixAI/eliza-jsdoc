import { WhatsAppClient } from "../client";
import { WhatsAppMessage } from "../types";

/**
 * A class that handles sending WhatsApp messages using a WhatsAppClient instance.
 */
export class MessageHandler {
/**
 * Constructor for creating a new instance of a class with a specified WhatsAppClient.
 * @param {WhatsAppClient} client - The WhatsAppClient instance to be used by the class.
 */
    constructor(private client: WhatsAppClient) {}

/**
 * Sends a WhatsApp message using the provided message object.
 * 
 * @param {WhatsAppMessage} message The WhatsApp message to be sent.
 * @returns {Promise<any>} A promise that resolves to the response data.
 * @throws {Error} If there was an error sending the message.
 */
    async send(message: WhatsAppMessage): Promise<any> {
        try {
            const response = await this.client.sendMessage(message);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(
                    `Failed to send WhatsApp message: ${error.message}`
                );
            }
            throw new Error("Failed to send WhatsApp message");
        }
    }
}
