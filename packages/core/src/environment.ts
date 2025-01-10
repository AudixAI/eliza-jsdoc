import { z } from "zod";
import { ModelProviderName, Clients } from "./types";
import elizaLogger from "./logger";

// TODO: TO COMPLETE
/**
 * Schema for environment variables containing API keys with specific formats
 * 
 * @type {import("zod").ZodObject<{
 *  OPENAI_API_KEY: import("zod").ZodString;
 *  REDPILL_API_KEY: import("zod").ZodString;
 *  GROK_API_KEY: import("zod").ZodString;
 *  GROQ_API_KEY: import("zod").ZodString;
 *  OPENROUTER_API_KEY: import("zod").ZodString;
 *  GOOGLE_GENERATIVE_AI_API_KEY: import("zod").ZodString;
 *  ELEVENLABS_XI_API_KEY: import("zod").ZodString;
 * }>
 */
export const envSchema = z.object({
    // API Keys with specific formats
    OPENAI_API_KEY: z
        .string()
        .startsWith("sk-", "OpenAI API key must start with 'sk-'"),
    REDPILL_API_KEY: z.string().min(1, "REDPILL API key is required"),
    GROK_API_KEY: z.string().min(1, "GROK API key is required"),
    GROQ_API_KEY: z
        .string()
        .startsWith("gsk_", "GROQ API key must start with 'gsk_'"),
    OPENROUTER_API_KEY: z.string().min(1, "OpenRouter API key is required"),
    GOOGLE_GENERATIVE_AI_API_KEY: z
        .string()
        .min(1, "Gemini API key is required"),
    ELEVENLABS_XI_API_KEY: z.string().min(1, "ElevenLabs API key is required"),
});

// Type inference
/**
 * Represents the inferred type from the provided type schema for the environment configuration.
 */
export type EnvConfig = z.infer<typeof envSchema>;

// Validation function
/**
 * Validates the environment variables by parsing them using the provided schema.
 *
 * @returns {EnvConfig} The validated environment configuration object.
 */
export function validateEnv(): EnvConfig {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path}: ${err.message}`)
                .join("\n");
            throw new Error(`Environment validation failed:\n${errorMessages}`);
        }
        throw error;
    }
}

// Helper schemas for nested types
/**
 * Schema representing an example message with user and content.
 *
 * @type {z.ZodObject<z.ZodRawShape<{
 *   user: z.ZodString;
 *   content: z.ZodObject<z.ZodRawShape<{
 *     text: z.ZodString;
 *     action?: z.ZodString | undefined;
 *     source?: z.ZodString | undefined;
 *     url?: z.ZodString | undefined;
 *     inReplyTo?: z.ZodParsedType<string, "uuid"> | undefined;
 *     attachments?: z.ZodArray<z.ZodTypeAny> | undefined;
 *   }>, {
 *     [k: string]: unknown;
 *   }>;
 * }, {
 *   [k: string]: unknown;
 * }>}
 */

const MessageExampleSchema = z.object({
    user: z.string(),
    content: z
        .object({
            text: z.string(),
            action: z.string().optional(),
            source: z.string().optional(),
            url: z.string().optional(),
            inReplyTo: z.string().uuid().optional(),
            attachments: z.array(z.any()).optional(),
        })
        .and(z.record(z.string(), z.unknown())), // For additional properties
});

const PluginSchema = z.object({
    name: z.string(),
    description: z.string(),
    actions: z.array(z.any()).optional(),
    providers: z.array(z.any()).optional(),
    evaluators: z.array(z.any()).optional(),
    services: z.array(z.any()).optional(),
    clients: z.array(z.any()).optional(),
});

// Main Character schema
/**
 * Character schema defining the structure of a character object.
 * Contains various properties such as id, name, system, modelProvider, etc.
 * * @typedef { Object } CharacterSchema
 * @property { string } [id] - The unique identifier of the character (optional).
 * @property { string } name - The name of the character.
 * @property { string } [system] - The system the character belongs to (optional).
 * @property { ModelProviderName } modelProvider - The name of the model provider.
 * @property { string } [modelEndpointOverride] - The endpoint override for the model (optional).
 * @property {Record<string, string>} [templates] - Collection of templates for the character (optional).
 * @property {(string | string[])} bio - Biography or array of biographies of the character.
 * @property {string[]} lore - Array of lore related to the character.
 * @property {MessageExampleSchema[][]} messageExamples - Array of arrays of message examples.
 * @property {string[]} postExamples - Array of post examples.
 * @property {string[]} topics - Array of topics associated with the character.
 * @property {string[]} adjectives - Array of adjectives describing the character.
 * @property {(string | { path: string, shared?: boolean } )[]} [knowledge] - Array of knowledge or knowledge objects (optional).
 * @property {Clients[]} clients - Array of client names associated with the character.
 * @property {(string[] | PluginSchema[])} plugins - Array of plugin names or PluginSchema objects.
 * @property { Object } [settings] - Settings object containing secrets, voice, model, and embedding model properties (optional).
 * @property {Record<string, string>} [settings.secrets] - Secrets record (optional).
 * @property { Object } [settings.voice] - Voice settings object with model and url properties (optional).
 * @property { string } [settings.voice.model] - Voice model (optional).
 * @property { string } [settings.voice.url] - Voice URL (optional).
 * @property { string } [settings.model] - Model name (optional).
 * @property { string } [settings.embeddingModel] - Embedding model name (optional).
 * @property { Object } [clientConfig] - Client configuration object for Discord and Telegram (optional).
 * @property { Object } [clientConfig.discord] - Discord specific configuration object with shouldIgnoreBotMessages and shouldIgnoreDirectMessages properties (optional).
 * @property { boolean } [clientConfig.discord.shouldIgnoreBotMessages] - Ignore bot messages on Discord (optional).
 * @property { boolean } [clientConfig.discord.shouldIgnoreDirectMessages] - Ignore direct messages on Discord (optional).
 * @property { Object } [clientConfig.telegram] - Telegram specific configuration object with shouldIgnoreBotMessages and shouldIgnoreDirectMessages properties (optional).
 * @property { boolean } [clientConfig.telegram.shouldIgnoreBotMessages] - Ignore bot messages on Telegram (optional).
 * @property { boolean } [clientConfig.telegram.shouldIgnoreDirectMessages] - Ignore direct messages on Telegram (optional).
 * @property { Object } style - Style object containing all, chat, and post properties.
 * @property {string[]} style.all - Array of styles for all interactions.
 * @property {string[]} style.chat - Array of styles for chat interactions.
 * @property {string[]} style.post - Array of styles for post interactions.
 * @property { Object } [twitterProfile] - Twitter profile object with username, screenName, bio, and optional nicknames properties (optional).
 * @property { string } twitterProfile.username - Twitter username of the character.
 * @property { string } twitterProfile.screenName - Twitter screen name of the character.
 * @property { string } twitterProfile.bio - Bio of the character on Twitter.
 * @property {string[]} [twitterProfile.nicknames] - Array of nicknames for the character on Twitter (optional).
 * @property { Object } [nft] - NFT object with prompt property (optional).
 * @property { string } [nft.prompt] - Prompt related to the character for NFTs (optional).
 */
export const CharacterSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    system: z.string().optional(),
    modelProvider: z.nativeEnum(ModelProviderName),
    modelEndpointOverride: z.string().optional(),
    templates: z.record(z.string()).optional(),
    bio: z.union([z.string(), z.array(z.string())]),
    lore: z.array(z.string()),
    messageExamples: z.array(z.array(MessageExampleSchema)),
    postExamples: z.array(z.string()),
    topics: z.array(z.string()),
    adjectives: z.array(z.string()),
    knowledge: z.array(
        z.union([
            z.string(),
            z.object({
                path: z.string(),
                shared: z.boolean().optional()
            })
        ])
    ).optional(),
    clients: z.array(z.nativeEnum(Clients)),
    plugins: z.union([z.array(z.string()), z.array(PluginSchema)]),
    settings: z
        .object({
            secrets: z.record(z.string()).optional(),
            voice: z
                .object({
                    model: z.string().optional(),
                    url: z.string().optional(),
                })
                .optional(),
            model: z.string().optional(),
            embeddingModel: z.string().optional(),
        })
        .optional(),
    clientConfig: z
        .object({
            discord: z
                .object({
                    shouldIgnoreBotMessages: z.boolean().optional(),
                    shouldIgnoreDirectMessages: z.boolean().optional(),
                })
                .optional(),
            telegram: z
                .object({
                    shouldIgnoreBotMessages: z.boolean().optional(),
                    shouldIgnoreDirectMessages: z.boolean().optional(),
                })
                .optional(),
        })
        .optional(),
    style: z.object({
        all: z.array(z.string()),
        chat: z.array(z.string()),
        post: z.array(z.string()),
    }),
    twitterProfile: z
        .object({
            username: z.string(),
            screenName: z.string(),
            bio: z.string(),
            nicknames: z.array(z.string()).optional(),
        })
        .optional(),
    nft: z
        .object({
            prompt: z.string().optional(),
        })
        .optional(),
});

// Type inference
/**
 * Type definition for character configuration based on CharacterSchema
 */
export type CharacterConfig = z.infer<typeof CharacterSchema>;

// Validation function
/**
 * Validates a character configuration JSON object using CharacterSchema.
 * If validation fails, logs the errors and throws an error message indicating validation failure.
 * 
 * @param json The JSON object to validate
 * @returns The validated CharacterConfig object
 */
export function validateCharacterConfig(json: unknown): CharacterConfig {
    try {
        return CharacterSchema.parse(json);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const groupedErrors = error.errors.reduce(
                (acc, err) => {
                    const path = err.path.join(".");
                    if (!acc[path]) {
                        acc[path] = [];
                    }
                    acc[path].push(err.message);
                    return acc;
                },
                {} as Record<string, string[]>
            );

            Object.entries(groupedErrors).forEach(([field, messages]) => {
                elizaLogger.error(
                    `Validation errors in ${field}: ${messages.join(" - ")}`
                );
            });

            throw new Error(
                "Character configuration validation failed. Check logs for details."
            );
        }
        throw error;
    }
}
