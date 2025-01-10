/**
 * Represents the configuration options for WhatsApp integration.
 *
 * @typedef {Object} WhatsAppConfig
 * @property {string} accessToken - The access token for the WhatsApp API.
 * @property {string} phoneNumberId - The phone number ID associated with the WhatsApp account.
 * @property {string} [webhookVerifyToken] - An optional token used to verify webhooks.
 * @property {string} [businessAccountId] - An optional ID for the business account attached to the WhatsApp integration.
 */
export interface WhatsAppConfig {
    accessToken: string;
    phoneNumberId: string;
    webhookVerifyToken?: string;
    businessAccountId?: string;
}

/**
 * Interface representing a WhatsApp message.
 * @typedef {Object} WhatsAppMessage
 * @property {"text" | "template"} type - The type of message, can be either "text" or "template".
 * @property {string} to - The recipient of the message.
 * @property {string | WhatsAppTemplate} content - The content of the message, can be a string or a WhatsAppTemplate object.
 */
export interface WhatsAppMessage {
    type: "text" | "template";
    to: string;
    content: string | WhatsAppTemplate;
}

/**
 * Interface for defining a WhatsApp Template.
 * @typedef {Object} WhatsAppTemplate
 * @property {string} name - The name of the template.
 * @property {Object} language - The language settings of the template.
 * @property {string} language.code - The language code of the template.
 * @property {Array<Object>} [components] - Optional array of components in the template.
 * @property {string} components.type - The type of component.
 * @property {Array<Object>} components.parameters - Array of parameters for the component.
 * @property {string} components.parameters.type - The type of parameter.
 * @property {string} [components.parameters.text] - Optional text parameter for the component.
 */
export interface WhatsAppTemplate {
    name: string;
    language: {
        code: string;
    };
    components?: Array<{
        type: string;
        parameters: Array<{
            type: string;
            text?: string;
        }>;
    }>;
}

/**
 * Represents a WhatsApp Webhook event object.
 * @typedef {Object} WhatsAppWebhookEvent
 * @property {string} object - The type of object (e.g. "page").
 * @property {Array} entry - An array of webhook entry objects.
 * @property {string} entry.id - The unique identifier for the entry.
 * @property {Array} entry.changes - An array of change objects.
 * @property {Object} entry.changes.value - The value of the change.
 * @property {string} entry.changes.value.messaging_product - The messaging product type (e.g. "whatsapp").
 * @property {Object} entry.changes.value.metadata - Additional metadata.
 * @property {string} entry.changes.value.metadata.display_phone_number - The phone number displayed.
 * @property {string} entry.changes.value.metadata.phone_number_id - The ID of the phone number.
 * @property {Array} entry.changes.value.statuses - An array of status objects.
 * @property {string} entry.changes.value.statuses.id - The unique identifier for the status.
 * @property {string} entry.changes.value.statuses.status - The status of the message (e.g. "sent").
 * @property {string} entry.changes.value.statuses.timestamp - The timestamp of the status.
 * @property {string} entry.changes.value.statuses.recipient_id - The recipient ID for the status.
 * @property {Array} entry.changes.value.messages - An array of message objects.
 * @property {string} entry.changes.value.messages.from - The sender ID of the message.
 * @property {string} entry.changes.value.messages.id - The unique identifier for the message.
 * @property {string} entry.changes.value.messages.timestamp - The timestamp of the message.
 * @property {Object} entry.changes.value.messages.text - The text message contents.
 * @property {string} entry.changes.value.messages.text.body - The body of the text message.
 * @property {string} entry.changes.value.messages.type - The type of message (e.g. "text").
 * @property {string} entry.changes.field - The field that was changed.
 */
export interface WhatsAppWebhookEvent {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                statuses?: Array<{
                    id: string;
                    status: string;
                    timestamp: string;
                    recipient_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    text?: {
                        body: string;
                    };
                    type: string;
                }>;
            };
            field: string;
        }>;
    }>;
}
