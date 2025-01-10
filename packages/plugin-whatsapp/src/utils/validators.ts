import { WhatsAppMessage, WhatsAppTemplate, WhatsAppConfig } from "../types";

/**
 * Validates the WhatsApp configuration object.
 * @param {WhatsAppConfig} config - The configuration object to be validated
 * @throws {Error} If access token or phone number ID is missing
 */
export function validateConfig(config: WhatsAppConfig): void {
    if (!config.accessToken) {
        throw new Error("WhatsApp access token is required");
    }
    if (!config.phoneNumberId) {
        throw new Error("WhatsApp phone number ID is required");
    }
}

/**
 * Validates a WhatsApp message object.
 * 
 * @param {WhatsAppMessage} message - The WhatsApp message to validate.
 * @throws {Error} Throws an error if recipient phone number, message type, or message content is missing.
 * @throws {Error} Throws an error if the message type is "template" and the template content is invalid.
 */
export function validateMessage(message: WhatsAppMessage): void {
    if (!message.to) {
        throw new Error("Recipient phone number is required");
    }

    if (!message.type) {
        throw new Error("Message type is required");
    }

    if (!message.content) {
        throw new Error("Message content is required");
    }

    if (message.type === "template") {
        validateTemplate(message.content as WhatsAppTemplate);
    }
}

/**
 * Validates a WhatsApp template.
 * @param {WhatsAppTemplate} template - The WhatsApp template to validate.
 * @throws {Error} If template name is missing or if language code is missing.
 */
export function validateTemplate(template: WhatsAppTemplate): void {
    if (!template.name) {
        throw new Error("Template name is required");
    }

    if (!template.language || !template.language.code) {
        throw new Error("Template language code is required");
    }
}

/**
 * Validates a phone number based on a basic regex pattern.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} - Returns true if the phone number is valid, otherwise false.
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - can be enhanced based on requirements
    const phoneRegex = /^\d{1,15}$/;
    return phoneRegex.test(phoneNumber);
}
