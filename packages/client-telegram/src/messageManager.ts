import { Message } from "@telegraf/types";
import { Context, Telegraf } from "telegraf";
import {
    composeContext,
    elizaLogger,
    ServiceType,
    composeRandomUser,
} from "@elizaos/core";
import { getEmbeddingZeroVector } from "@elizaos/core";
import {
    Content,
    HandlerCallback,
    IAgentRuntime,
    IImageDescriptionService,
    Memory,
    ModelClass,
    State,
    UUID,
    Media,
} from "@elizaos/core";
import { stringToUuid } from "@elizaos/core";

import { generateMessageResponse, generateShouldRespond } from "@elizaos/core";
import { messageCompletionFooter, shouldRespondFooter } from "@elizaos/core";

import { cosineSimilarity, escapeMarkdown } from "./utils";
import {
    MESSAGE_CONSTANTS,
    TIMING_CONSTANTS,
    RESPONSE_CHANCES,
    TEAM_COORDINATION,
} from "./constants";

import fs from "fs";

const MAX_MESSAGE_LENGTH = 4096; // Telegram's max message length

/**
 * Template for determining if the agent should respond to the last message.
 * 
 * Response options are [RESPOND], [IGNORE], and [STOP].
 * 
 * {{agentName}} is in a room with other users and should only respond when they are being addressed, and should not respond if they are continuing a conversation that is very long.
 * 
 * Respond with [RESPOND] to messages that are directed at {{agentName}}, or participate in conversations that are interesting or relevant to their background.
 * If a message is not interesting, relevant, or does not directly address {{agentName}}, respond with [IGNORE].
 * 
 * Also, respond with [IGNORE] to messages that are very short or do not contain much information.
 * 
 * If a user asks {{agentName}} to be quiet, respond with [STOP].
 * If {{agentName}} concludes a conversation and isn't part of the conversation anymore, respond with [STOP].
 * 
 * IMPORTANT: {{agentName}} is particularly sensitive about being annoying, so if there is any doubt, it is better to respond with [IGNORE].
 * If {{agentName}} is conversing with a user and they have not asked to stop, it is better to respond with [RESPOND].
 * 
 * The goal is to decide whether {{agentName}} should respond to the last message.
 * 
 * {{recentMessages}}
 *
 * # INSTRUCTIONS: Choose the option that best describes {{agentName}}'s response to the last message. Ignore messages if they are addressed to someone else.
 */
const telegramShouldRespondTemplate =
    `# About {{agentName}}:
{{bio}}

# RESPONSE EXAMPLES
{{user1}}: I just saw a really great movie
{{user2}}: Oh? Which movie?
Result: [IGNORE]

{{agentName}}: Oh, this is my favorite scene
{{user1}}: sick
{{user2}}: wait, why is it your favorite scene
Result: [RESPOND]

{{user1}}: stfu bot
Result: [STOP]

{{user1}}: Hey {{agentName}}, can you help me with something
Result: [RESPOND]

{{user1}}: {{agentName}} stfu plz
Result: [STOP]

{{user1}}: i need help
{{agentName}}: how can I help you?
{{user1}}: no. i need help from someone else
Result: [IGNORE]

{{user1}}: Hey {{agentName}}, can I ask you a question
{{agentName}}: Sure, what is it
{{user1}}: can you ask claude to create a basic react module that demonstrates a counter
Result: [RESPOND]

{{user1}}: {{agentName}} can you tell me a story
{{agentName}}: uhhh...
{{user1}}: please do it
{{agentName}}: okay
{{agentName}}: once upon a time, in a quaint little village, there was a curious girl named elara
{{user1}}: I'm loving it, keep going
Result: [RESPOND]

{{user1}}: {{agentName}} stop responding plz
Result: [STOP]

{{user1}}: okay, i want to test something. {{agentName}}, can you say marco?
{{agentName}}: marco
{{user1}}: great. okay, now do it again
Result: [RESPOND]

Response options are [RESPOND], [IGNORE] and [STOP].

{{agentName}} is in a room with other users and should only respond when they are being addressed, and should not respond if they are continuing a conversation that is very long.

Respond with [RESPOND] to messages that are directed at {{agentName}}, or participate in conversations that are interesting or relevant to their background.
If a message is not interesting, relevant, or does not directly address {{agentName}}, respond with [IGNORE]

Also, respond with [IGNORE] to messages that are very short or do not contain much information.

If a user asks {{agentName}} to be quiet, respond with [STOP]
If {{agentName}} concludes a conversation and isn't part of the conversation anymore, respond with [STOP]

IMPORTANT: {{agentName}} is particularly sensitive about being annoying, so if there is any doubt, it is better to respond with [IGNORE].
If {{agentName}} is conversing with a user and they have not asked to stop, it is better to respond with [RESPOND].

The goal is to decide whether {{agentName}} should respond to the last message.

{{recentMessages}}

# INSTRUCTIONS: Choose the option that best describes {{agentName}}'s response to the last message. Ignore messages if they are addressed to someone else.
` + shouldRespondFooter;

/**
 * This template is used to generate a Telegram message handler that is capable of processing and responding to messages from users. 
 * It contains placeholders for various sections such as action examples, knowledge, agent information, character message examples, providers, attachments, actions, capabilities, message directions, recent messages, formatted conversation, and additional context about the agent. 
 * Note that the action examples included are for reference only and should not be used as part of the response. 
 */
const telegramMessageHandlerTemplate =
    // {{goals}}
    `
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# About {{agentName}}:
{{bio}}
{{lore}}

{{characterMessageExamples}}

{{providers}}

{{attachments}}

{{actions}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

# Task: Generate a reply in the voice, style and perspective of {{agentName}} while using the thread above as additional context. You are replying on Telegram.
{{formattedConversation}}
` + messageCompletionFooter;

/**
 * Interface representing a message context.
 * @property {string} content - The content of the message.
 * @property {number} timestamp - The timestamp when the message was created.
 */
interface MessageContext {
    content: string;
    timestamp: number;
}

/**
 * Represents a collection of interest chats, where each chat is identified by a unique key.
 * Each chat includes information about the current handler, last message sent, messages sent in the chat,
 * previous context, and context similarity threshold.
 */
export type InterestChats = {
    [key: string]: {
        currentHandler: string | undefined;
        lastMessageSent: number;
        messages: { userId: UUID; userName: string; content: Content }[];
        previousContext?: MessageContext;
        contextSimilarityThreshold?: number;
    };
};

/**
 * Class representing a Message Manager.
 * @class
 */

export class MessageManager {
    public bot: Telegraf<Context>;
    private runtime: IAgentRuntime;
    private interestChats: InterestChats = {};
    private teamMemberUsernames: Map<string, string> = new Map();

/**
 * Constructor for creating a new instance of a class.
 *
 * @param {Telegraf<Context>} bot - The Telegraf object used for interacting with Telegram bot.
 * @param {IAgentRuntime} runtime - The runtime object for the agent.
 */
    constructor(bot: Telegraf<Context>, runtime: IAgentRuntime) {
        this.bot = bot;
        this.runtime = runtime;

        this._initializeTeamMemberUsernames().catch((error) =>
            elizaLogger.error(
                "Error initializing team member usernames:",
                error
            )
        );
    }

/**
 * Initializes the usernames of team members for the Telegram chat.
 * If the client is not part of the team, the function returns early. 
 * Retrieves team agent IDs from the client's Telegram configuration and iterates 
 * through each ID to get the chat information for that user. 
 * If the chat has a username and it is not empty, the username is cached 
 * in the `teamMemberUsernames` map. 
 * Additionally, logs error messages if there is an issue while fetching the usernames.
 * @returns Promise<void>
 */
    private async _initializeTeamMemberUsernames(): Promise<void> {
        if (!this.runtime.character.clientConfig?.telegram?.isPartOfTeam)
            return;

        const teamAgentIds =
            this.runtime.character.clientConfig.telegram.teamAgentIds || [];

        for (const id of teamAgentIds) {
            try {
                const chat = await this.bot.telegram.getChat(id);
                if ("username" in chat && chat.username) {
                    this.teamMemberUsernames.set(id, chat.username);
                    elizaLogger.info(
                        `Cached username for team member ${id}: ${chat.username}`
                    );
                }
            } catch (error) {
                elizaLogger.error(
                    `Error getting username for team member ${id}:`,
                    error
                );
            }
        }
    }

/**
 * Retrieves the username of a team member based on their ID.
 *
 * @param {string} id - The ID of the team member.
 * @returns {string | undefined} The username of the team member, or undefined if not found.
 */
    private _getTeamMemberUsername(id: string): string | undefined {
        return this.teamMemberUsernames.get(id);
    }

/**
 * Returns a normalized user ID by converting the input ID to a string and removing all non-numeric characters.
 * 
 * @param {string | number} id - The input user ID to be normalized.
 * @returns {string} The normalized user ID as a string.
 */
    private _getNormalizedUserId(id: string | number): string {
        return id.toString().replace(/[^0-9]/g, "");
    }

/**
 * Check if a user is a member of the team based on their userId.
 * @param {string | number} userId - The userId to check if they are a team member.
 * @returns {boolean} - Returns true if the user is a team member, otherwise false.
 */
    private _isTeamMember(userId: string | number): boolean {
        const teamConfig = this.runtime.character.clientConfig?.telegram;
        if (!teamConfig?.isPartOfTeam || !teamConfig.teamAgentIds) return false;

        const normalizedUserId = this._getNormalizedUserId(userId);
        return teamConfig.teamAgentIds.some(
            (teamId) => this._getNormalizedUserId(teamId) === normalizedUserId
        );
    }

/**
 * Check if the current bot is the team leader.
 * @returns {boolean} true if the current bot is the team leader, false otherwise.
 */
    private _isTeamLeader(): boolean {
        return (
            this.bot.botInfo?.id.toString() ===
            this.runtime.character.clientConfig?.telegram?.teamLeaderId
        );
    }

/**
 * Check if the content of a request indicates team coordination.
 * @param {string} content - The content of the request.
 * @returns {boolean} Returns true if the content contains keywords associated with team coordination, false otherwise.
 */
    private _isTeamCoordinationRequest(content: string): boolean {
        const contentLower = content.toLowerCase();
        return TEAM_COORDINATION.KEYWORDS?.some((keyword) =>
            contentLower.includes(keyword.toLowerCase())
        );
    }

/**
 * Check if the provided content is relevant to a team member based on the chatId and lastAgentMemory.
 * @param {string} content The content to check for relevance.
 * @param {string} chatId The ID of the chat.
 * @param {Memory | null} lastAgentMemory The last memory of the agent, default is null.
 * @returns {boolean} True if the content is relevant to a team member, otherwise false.
 */
    private _isRelevantToTeamMember(
        content: string,
        chatId: string,
        lastAgentMemory: Memory | null = null
    ): boolean {
        const teamConfig = this.runtime.character.clientConfig?.telegram;

        // Check leader's context based on last message
        if (this._isTeamLeader() && lastAgentMemory?.content.text) {
            const timeSinceLastMessage = Date.now() - lastAgentMemory.createdAt;
            if (timeSinceLastMessage > MESSAGE_CONSTANTS.INTEREST_DECAY_TIME) {
                return false;
            }

            const similarity = cosineSimilarity(
                content.toLowerCase(),
                lastAgentMemory.content.text.toLowerCase()
            );

            return (
                similarity >=
                MESSAGE_CONSTANTS.DEFAULT_SIMILARITY_THRESHOLD_FOLLOW_UPS
            );
        }

        // Check team member keywords
        if (!teamConfig?.teamMemberInterestKeywords?.length) {
            return false; // If no keywords defined, only leader maintains conversation
        }

        // Check if content matches any team member keywords
        return teamConfig.teamMemberInterestKeywords.some((keyword) =>
            content.toLowerCase().includes(keyword.toLowerCase())
        );
    }

/**
 * Analyze the similarity between the current message and the previous context's message.
 * 
 * @param {string} currentMessage The current message to analyze.
 * @param {MessageContext} [previousContext] The previous context containing the message to compare with.
 * @param {string} [agentLastMessage] The last message sent by the agent (optional).
 * @returns {Promise<number>} The similarity score between the current message and the previous context's message.
 */
    private async _analyzeContextSimilarity(
        currentMessage: string,
        previousContext?: MessageContext,
        agentLastMessage?: string
    ): Promise<number> {
        if (!previousContext) return 1;

        const timeDiff = Date.now() - previousContext.timestamp;
        const timeWeight = Math.max(0, 1 - timeDiff / (5 * 60 * 1000));

        const similarity = cosineSimilarity(
            currentMessage.toLowerCase(),
            previousContext.content.toLowerCase(),
            agentLastMessage?.toLowerCase()
        );

        return similarity * timeWeight;
    }

/**
 * Determines whether the bot should respond based on the context of the message and chat state.
 * @param {Message} message - The message object received from the user.
 * @param {InterestChats[string]} chatState - The current chat state for the user.
 * @returns {Promise<boolean>} - A boolean indicating whether the bot should respond.
 */
    private async _shouldRespondBasedOnContext(
        message: Message,
        chatState: InterestChats[string]
    ): Promise<boolean> {
        const messageText =
            "text" in message
                ? message.text
                : "caption" in message
                  ? (message as any).caption
                  : "";

        if (!messageText) return false;

        // Always respond if mentioned
        if (this._isMessageForMe(message)) return true;

        // If we're not the current handler, don't respond
        if (chatState?.currentHandler !== this.bot.botInfo?.id.toString())
            return false;

        // Check if we have messages to compare
        if (!chatState.messages?.length) return false;

        // Get last user message (not from the bot)
        const lastUserMessage = [...chatState.messages].reverse().find(
            (m, index) =>
                index > 0 && // Skip first message (current)
                m.userId !== this.runtime.agentId
        );

        if (!lastUserMessage) return false;

        const lastSelfMemories = await this.runtime.messageManager.getMemories({
            roomId: stringToUuid(
                message.chat.id.toString() + "-" + this.runtime.agentId
            ),
            unique: false,
            count: 5,
        });

        const lastSelfSortedMemories = lastSelfMemories
            ?.filter((m) => m.userId === this.runtime.agentId)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Calculate context similarity
        const contextSimilarity = await this._analyzeContextSimilarity(
            messageText,
            {
                content: lastUserMessage.content.text || "",
                timestamp: Date.now(),
            },
            lastSelfSortedMemories?.[0]?.content?.text
        );

        const similarityThreshold =
            this.runtime.character.clientConfig?.telegram
                ?.messageSimilarityThreshold ||
            chatState.contextSimilarityThreshold ||
            MESSAGE_CONSTANTS.DEFAULT_SIMILARITY_THRESHOLD;

        return contextSimilarity >= similarityThreshold;
    }

/**
 * Check if the message is directed towards the bot.
 * @param {Message} message - The message to check.
 * @returns {boolean} Returns true if the message is for the bot, false otherwise.
 */
    private _isMessageForMe(message: Message): boolean {
        const botUsername = this.bot.botInfo?.username;
        if (!botUsername) return false;

        const messageText =
            "text" in message
                ? message.text
                : "caption" in message
                  ? (message as any).caption
                  : "";
        if (!messageText) return false;

        const isReplyToBot =
            (message as any).reply_to_message?.from?.is_bot === true &&
            (message as any).reply_to_message?.from?.username === botUsername;
        const isMentioned = messageText.includes(`@${botUsername}`);
        const hasUsername = messageText
            .toLowerCase()
            .includes(botUsername.toLowerCase());

        return (
            isReplyToBot ||
            isMentioned ||
            (!this.runtime.character.clientConfig?.telegram
                ?.shouldRespondOnlyToMentions &&
                hasUsername)
        );
    }

/**
 * Checks if a chat has enough interest based on various criteria.
 * @param {string} chatId - The unique identifier for the chat.
 * @returns {boolean} Returns true if the chat has enough interest, false otherwise.
 */
    private _checkInterest(chatId: string): boolean {
        const chatState = this.interestChats[chatId];
        if (!chatState) return false;

        const lastMessage = chatState.messages[chatState.messages.length - 1];
        const timeSinceLastMessage = Date.now() - chatState.lastMessageSent;

        if (timeSinceLastMessage > MESSAGE_CONSTANTS.INTEREST_DECAY_TIME) {
            delete this.interestChats[chatId];
            return false;
        } else if (
            timeSinceLastMessage > MESSAGE_CONSTANTS.PARTIAL_INTEREST_DECAY
        ) {
            return this._isRelevantToTeamMember(
                lastMessage?.content.text || "",
                chatId
            );
        }

        // Team leader specific checks
        if (this._isTeamLeader() && chatState.messages.length > 0) {
            if (
                !this._isRelevantToTeamMember(
                    lastMessage?.content.text || "",
                    chatId
                )
            ) {
                const recentTeamResponses = chatState.messages
                    .slice(-3)
                    .some(
                        (m) =>
                            m.userId !== this.runtime.agentId &&
                            this._isTeamMember(m.userId.toString())
                    );

                if (recentTeamResponses) {
                    delete this.interestChats[chatId];
                    return false;
                }
            }
        }

        return true;
    }

    // Process image messages and generate descriptions
/**
 * Process the image from the Telegram message.
 * Retrieves the image URL from the message, fetches the image description
 * using the IImageDescriptionService, and returns the description in a formatted string.
 * 
 * @param {Message} message - The Telegram message object
 * @returns {Promise<{ description: string } | null>} The description of the image or null if image processing fails
 */
    private async processImage(
        message: Message
    ): Promise<{ description: string } | null> {
        try {
            let imageUrl: string | null = null;

            elizaLogger.info(`Telegram Message: ${message}`);

            if ("photo" in message && message.photo?.length > 0) {
                const photo = message.photo[message.photo.length - 1];
                const fileLink = await this.bot.telegram.getFileLink(
                    photo.file_id
                );
                imageUrl = fileLink.toString();
            } else if (
                "document" in message &&
                message.document?.mime_type?.startsWith("image/")
            ) {
                const fileLink = await this.bot.telegram.getFileLink(
                    message.document.file_id
                );
                imageUrl = fileLink.toString();
            }

            if (imageUrl) {
                const imageDescriptionService =
                    this.runtime.getService<IImageDescriptionService>(
                        ServiceType.IMAGE_DESCRIPTION
                    );
                const { title, description } =
                    await imageDescriptionService.describeImage(imageUrl);
                return { description: `[Image: ${title}\n${description}]` };
            }
        } catch (error) {
            console.error("❌ Error processing image:", error);
        }

        return null;
    }

    // Decide if the bot should respond to the message
/**
 * Check if the bot should respond to a message based on various conditions.
 *
 * @param {Message} message - The message received by the bot.
 * @param {State} state - The current state of the bot.
 * @returns {Promise<boolean>} A boolean indicating whether the bot should respond to the message.
 */
    private async _shouldRespond(
        message: Message,
        state: State
    ): Promise<boolean> {
        if (
            this.runtime.character.clientConfig?.telegram
                ?.shouldRespondOnlyToMentions
        ) {
            return this._isMessageForMe(message);
        }

        // Respond if bot is mentioned
        if (
            "text" in message &&
            message.text?.includes(`@${this.bot.botInfo?.username}`)
        ) {
            elizaLogger.info(`Bot mentioned`);
            return true;
        }

        // Respond to private chats
        if (message.chat.type === "private") {
            return true;
        }

        // Don't respond to images in group chats
        if (
            "photo" in message ||
            ("document" in message &&
                message.document?.mime_type?.startsWith("image/"))
        ) {
            return false;
        }

        const chatId = message.chat.id.toString();
        const chatState = this.interestChats[chatId];
        const messageText =
            "text" in message
                ? message.text
                : "caption" in message
                  ? (message as any).caption
                  : "";

        // Check if team member has direct interest first
        if (
            this.runtime.character.clientConfig?.telegram?.isPartOfTeam &&
            !this._isTeamLeader() &&
            this._isRelevantToTeamMember(messageText, chatId)
        ) {
            return true;
        }

        // Team-based response logic
        if (this.runtime.character.clientConfig?.telegram?.isPartOfTeam) {
            // Team coordination
            if (this._isTeamCoordinationRequest(messageText)) {
                if (this._isTeamLeader()) {
                    return true;
                } else {
                    const randomDelay =
                        Math.floor(
                            Math.random() *
                                (TIMING_CONSTANTS.TEAM_MEMBER_DELAY_MAX -
                                    TIMING_CONSTANTS.TEAM_MEMBER_DELAY_MIN)
                        ) + TIMING_CONSTANTS.TEAM_MEMBER_DELAY_MIN; // 1-3 second random delay
                    await new Promise((resolve) =>
                        setTimeout(resolve, randomDelay)
                    );
                    return true;
                }
            }

            if (
                !this._isTeamLeader() &&
                this._isRelevantToTeamMember(messageText, chatId)
            ) {
                // Add small delay for non-leader responses
                await new Promise((resolve) =>
                    setTimeout(resolve, TIMING_CONSTANTS.TEAM_MEMBER_DELAY)
                ); //1.5 second delay

                // If leader has responded in last few seconds, reduce chance of responding
                if (chatState.messages?.length) {
                    const recentMessages = chatState.messages.slice(
                        -MESSAGE_CONSTANTS.RECENT_MESSAGE_COUNT
                    );
                    const leaderResponded = recentMessages.some(
                        (m) =>
                            m.userId ===
                                this.runtime.character.clientConfig?.telegram
                                    ?.teamLeaderId &&
                            Date.now() - chatState.lastMessageSent < 3000
                    );

                    if (leaderResponded) {
                        // 50% chance to respond if leader just did
                        return Math.random() > RESPONSE_CHANCES.AFTER_LEADER;
                    }
                }

                return true;
            }

            // If I'm the leader but message doesn't match my keywords, add delay and check for team responses
            if (
                this._isTeamLeader() &&
                !this._isRelevantToTeamMember(messageText, chatId)
            ) {
                const randomDelay =
                    Math.floor(
                        Math.random() *
                            (TIMING_CONSTANTS.LEADER_DELAY_MAX -
                                TIMING_CONSTANTS.LEADER_DELAY_MIN)
                    ) + TIMING_CONSTANTS.LEADER_DELAY_MIN; // 2-4 second random delay
                await new Promise((resolve) =>
                    setTimeout(resolve, randomDelay)
                );

                // After delay, check if another team member has already responded
                if (chatState?.messages?.length) {
                    const recentResponses = chatState.messages.slice(
                        -MESSAGE_CONSTANTS.RECENT_MESSAGE_COUNT
                    );
                    const otherTeamMemberResponded = recentResponses.some(
                        (m) =>
                            m.userId !== this.runtime.agentId &&
                            this._isTeamMember(m.userId)
                    );

                    if (otherTeamMemberResponded) {
                        return false;
                    }
                }
            }

            // Update current handler if we're mentioned
            if (this._isMessageForMe(message)) {
                const channelState = this.interestChats[chatId];
                if (channelState) {
                    channelState.currentHandler =
                        this.bot.botInfo?.id.toString();
                    channelState.lastMessageSent = Date.now();
                }
                return true;
            }

            // Don't respond if another teammate is handling the conversation
            if (chatState?.currentHandler) {
                if (
                    chatState.currentHandler !==
                        this.bot.botInfo?.id.toString() &&
                    this._isTeamMember(chatState.currentHandler)
                ) {
                    return false;
                }
            }

            // Natural conversation cadence
            if (!this._isMessageForMe(message) && this.interestChats[chatId]) {
                const recentMessages = this.interestChats[
                    chatId
                ].messages.slice(-MESSAGE_CONSTANTS.CHAT_HISTORY_COUNT);
                const ourMessageCount = recentMessages.filter(
                    (m) => m.userId === this.runtime.agentId
                ).length;

                if (ourMessageCount > 2) {
                    const responseChance = Math.pow(0.5, ourMessageCount - 2);
                    if (Math.random() > responseChance) {
                        return;
                    }
                }
            }
        }

        // Check context-based response for team conversations
        if (chatState?.currentHandler) {
            const shouldRespondContext =
                await this._shouldRespondBasedOnContext(message, chatState);

            if (!shouldRespondContext) {
                return false;
            }
        }

        // Use AI to decide for text or captions
        if ("text" in message || ("caption" in message && message.caption)) {
            const shouldRespondContext = composeContext({
                state,
                template:
                    this.runtime.character.templates
                        ?.telegramShouldRespondTemplate ||
                    this.runtime.character?.templates?.shouldRespondTemplate ||
                    composeRandomUser(telegramShouldRespondTemplate, 2),
            });

            const response = await generateShouldRespond({
                runtime: this.runtime,
                context: shouldRespondContext,
                modelClass: ModelClass.SMALL,
            });

            return response === "RESPOND";
        }

        return false;
    }

    // Send long messages in chunks
/**
 * Send message in chunks to avoid hitting Telegram API limits.
 * If content has attachments, handle attachments based on type (image/gif or image).
 * If no attachments, split message text into chunks and send each chunk as a separate message.
 * 
 * @param {Context} ctx - The Context object containing information about the Telegram bot and chat.
 * @param {Content} content - The content of the message to be sent, including text and optional attachments.
 * @param {number} [replyToMessageId] - Optional. The message ID to reply to.
 * @returns {Promise<Message.TextMessage[]>} An array of text messages sent or scheduled to be sent.
 */
    private async sendMessageInChunks(
        ctx: Context,
        content: Content,
        replyToMessageId?: number
    ): Promise<Message.TextMessage[]> {
        if (content.attachments && content.attachments.length > 0) {
            content.attachments.map(async (attachment: Media) => {
                if (attachment.contentType === "image/gif") {
                    // Handle GIFs specifically
                    await this.sendAnimation(ctx, attachment.url, attachment.description);
                } else if (attachment.contentType.startsWith("image")) {
                    await this.sendImage(ctx, attachment.url, attachment.description);
                }
            });
        } else {
            const chunks = this.splitMessage(content.text);
            const sentMessages: Message.TextMessage[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunk = escapeMarkdown(chunks[i]);
                const sentMessage = (await ctx.telegram.sendMessage(
                    ctx.chat.id,
                    chunk,
                    {
                        reply_parameters:
                            i === 0 && replyToMessageId
                                ? { message_id: replyToMessageId }
                                : undefined,
                        parse_mode: "Markdown",
                    }
                )) as Message.TextMessage;

                sentMessages.push(sentMessage);
            }

            return sentMessages;
        }
    }

/**
 * Sends an image to the chat using the Telegram API.
 * 
 * @param {Context} ctx - The context object for the chat.
 * @param {string} imagePath - The path to the image to send.
 * @param {string} [caption] - The optional caption for the image.
 * @returns {Promise<void>} - A Promise that resolves once the image is sent successfully.
 */
    private async sendImage(
        ctx: Context,
        imagePath: string,
        caption?: string
    ): Promise<void> {
        try {
            if (/^(http|https):\/\//.test(imagePath)) {
                // Handle HTTP URLs
                await ctx.telegram.sendPhoto(ctx.chat.id, imagePath, {
                    caption,
                });
            } else {
                // Handle local file paths
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`File not found: ${imagePath}`);
                }

                const fileStream = fs.createReadStream(imagePath);

                await ctx.telegram.sendPhoto(
                    ctx.chat.id,
                    {
                        source: fileStream,
                    },
                    {
                        caption,
                    }
                );
            }

            elizaLogger.info(`Image sent successfully: ${imagePath}`);
        } catch (error) {
            elizaLogger.error("Error sending image:", error);
        }
    }

/**
 * Sends an animation to the chat using the Telegram bot API.
 *
 * @param {Context} ctx - The context object provided by Telegraf.
 * @param {string} animationPath - The URL or local path to the animation file.
 * @param {string} [caption] - Optional caption for the animation.
 * @returns {Promise<void>} - A Promise that resolves when the animation is successfully sent.
 */
    private async sendAnimation(
        ctx: Context,
        animationPath: string,
        caption?: string
    ): Promise<void> {
        try {
            if (/^(http|https):\/\//.test(animationPath)) {
                // Handle HTTP URLs
                await ctx.telegram.sendAnimation(ctx.chat.id, animationPath, {
                    caption,
                });
            } else {
                // Handle local file paths
                if (!fs.existsSync(animationPath)) {
                    throw new Error(`File not found: ${animationPath}`);
                }

                const fileStream = fs.createReadStream(animationPath);

                await ctx.telegram.sendAnimation(
                    ctx.chat.id,
                    {
                        source: fileStream,
                    },
                    {
                        caption,
                    }
                );
            }

            elizaLogger.info(`Animation sent successfully: ${animationPath}`);
        } catch (error) {
            elizaLogger.error("Error sending animation:", error);
        }
    }

    // Split message into smaller parts
/**
 * Splits a message into chunks based on a maximum length constraint.
 *
 * @param {string} text - The text of the message to split.
 * @returns {string[]} An array of strings representing the split message chunks.
 */
    private splitMessage(text: string): string[] {
        const chunks: string[] = [];
        let currentChunk = "";

        const lines = text.split("\n");
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 <= MAX_MESSAGE_LENGTH) {
                currentChunk += (currentChunk ? "\n" : "") + line;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = line;
            }
        }

        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }

    // Generate a response using AI
/**
 * Generates a response based on the input message, state, and context.
 * 
 * @param {Memory} message - The input message to generate a response for.
 * @param {State} _state - The state of the application (unused).
 * @param {string} context - The context of the response.
 * @returns {Promise<Content>} The generated response content.
 */
    private async _generateResponse(
        message: Memory,
        _state: State,
        context: string
    ): Promise<Content> {
        const { userId, roomId } = message;

        const response = await generateMessageResponse({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        if (!response) {
            console.error("❌ No response from generateMessageResponse");
            return null;
        }

        await this.runtime.databaseAdapter.log({
            body: { message, context, response },
            userId,
            roomId,
            type: "response",
        });

        return response;
    }

    // Main handler for incoming messages
/**
 * Handles incoming messages from a given context.
 * 
 * @param ctx The context object containing the message and sender info
 * @returns A promise that resolves to void
 */
    public async handleMessage(ctx: Context): Promise<void> {
        if (!ctx.message || !ctx.from) {
            return; // Exit if no message or sender info
        }

        if (
            this.runtime.character.clientConfig?.telegram
                ?.shouldIgnoreBotMessages &&
            ctx.from.is_bot
        ) {
            return;
        }
        if (
            this.runtime.character.clientConfig?.telegram
                ?.shouldIgnoreDirectMessages &&
            ctx.chat?.type === "private"
        ) {
            return;
        }

        const message = ctx.message;
        const chatId = ctx.chat?.id.toString();
        const messageText =
            "text" in message
                ? message.text
                : "caption" in message
                  ? (message as any).caption
                  : "";

        // Add team handling at the start
        if (
            this.runtime.character.clientConfig?.telegram?.isPartOfTeam &&
            !this.runtime.character.clientConfig?.telegram
                ?.shouldRespondOnlyToMentions
        ) {
            const isDirectlyMentioned = this._isMessageForMe(message);
            const hasInterest = this._checkInterest(chatId);

            // Non-leader team member showing interest based on keywords
            if (
                !this._isTeamLeader() &&
                this._isRelevantToTeamMember(messageText, chatId)
            ) {
                this.interestChats[chatId] = {
                    currentHandler: this.bot.botInfo?.id.toString(),
                    lastMessageSent: Date.now(),
                    messages: [],
                };
            }

            const isTeamRequest = this._isTeamCoordinationRequest(messageText);
            const isLeader = this._isTeamLeader();

            // Check for continued interest
            if (hasInterest && !isDirectlyMentioned) {
                const lastSelfMemories =
                    await this.runtime.messageManager.getMemories({
                        roomId: stringToUuid(
                            chatId + "-" + this.runtime.agentId
                        ),
                        unique: false,
                        count: 5,
                    });

                const lastSelfSortedMemories = lastSelfMemories
                    ?.filter((m) => m.userId === this.runtime.agentId)
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                const isRelevant = this._isRelevantToTeamMember(
                    messageText,
                    chatId,
                    lastSelfSortedMemories?.[0]
                );

                if (!isRelevant) {
                    delete this.interestChats[chatId];
                    return;
                }
            }

            // Handle team coordination requests
            if (isTeamRequest) {
                if (isLeader) {
                    this.interestChats[chatId] = {
                        currentHandler: this.bot.botInfo?.id.toString(),
                        lastMessageSent: Date.now(),
                        messages: [],
                    };
                } else {
                    this.interestChats[chatId] = {
                        currentHandler: this.bot.botInfo?.id.toString(),
                        lastMessageSent: Date.now(),
                        messages: [],
                    };

                    if (!isDirectlyMentioned) {
                        this.interestChats[chatId].lastMessageSent = 0;
                    }
                }
            }

            // Check for other team member mentions using cached usernames
            const otherTeamMembers =
                this.runtime.character.clientConfig.telegram.teamAgentIds.filter(
                    (id) => id !== this.bot.botInfo?.id.toString()
                );

            const mentionedTeamMember = otherTeamMembers.find((id) => {
                const username = this._getTeamMemberUsername(id);
                return username && messageText?.includes(`@${username}`);
            });

            // If another team member is mentioned, clear our interest
            if (mentionedTeamMember) {
                if (
                    hasInterest ||
                    this.interestChats[chatId]?.currentHandler ===
                        this.bot.botInfo?.id.toString()
                ) {
                    delete this.interestChats[chatId];

                    // Only return if we're not the mentioned member
                    if (!isDirectlyMentioned) {
                        return;
                    }
                }
            }

            // Set/maintain interest only if we're mentioned or already have interest
            if (isDirectlyMentioned) {
                this.interestChats[chatId] = {
                    currentHandler: this.bot.botInfo?.id.toString(),
                    lastMessageSent: Date.now(),
                    messages: [],
                };
            } else if (!isTeamRequest && !hasInterest) {
                return;
            }

            // Update message tracking
            if (this.interestChats[chatId]) {
                this.interestChats[chatId].messages.push({
                    userId: stringToUuid(ctx.from.id.toString()),
                    userName:
                        ctx.from.username ||
                        ctx.from.first_name ||
                        "Unknown User",
                    content: { text: messageText, source: "telegram" },
                });

                if (
                    this.interestChats[chatId].messages.length >
                    MESSAGE_CONSTANTS.MAX_MESSAGES
                ) {
                    this.interestChats[chatId].messages = this.interestChats[
                        chatId
                    ].messages.slice(-MESSAGE_CONSTANTS.MAX_MESSAGES);
                }
            }
        }

        try {
            // Convert IDs to UUIDs
            const userId = stringToUuid(ctx.from.id.toString()) as UUID;

            // Get user name
            const userName =
                ctx.from.username || ctx.from.first_name || "Unknown User";

            // Get chat ID
            const chatId = stringToUuid(
                ctx.chat?.id.toString() + "-" + this.runtime.agentId
            ) as UUID;

            // Get agent ID
            const agentId = this.runtime.agentId;

            // Get room ID
            const roomId = chatId;

            // Ensure connection
            await this.runtime.ensureConnection(
                userId,
                roomId,
                userName,
                userName,
                "telegram"
            );

            // Get message ID
            const messageId = stringToUuid(
                message.message_id.toString() + "-" + this.runtime.agentId
            ) as UUID;

            // Handle images
            const imageInfo = await this.processImage(message);

            // Get text or caption
            let messageText = "";
            if ("text" in message) {
                messageText = message.text;
            } else if ("caption" in message && message.caption) {
                messageText = message.caption;
            }

            // Combine text and image description
            const fullText = imageInfo
                ? `${messageText} ${imageInfo.description}`
                : messageText;

            if (!fullText) {
                return; // Skip if no content
            }

            // Create content
            const content: Content = {
                text: fullText,
                source: "telegram",
                inReplyTo:
                    "reply_to_message" in message && message.reply_to_message
                        ? stringToUuid(
                              message.reply_to_message.message_id.toString() +
                                  "-" +
                                  this.runtime.agentId
                          )
                        : undefined,
            };

            // Create memory for the message
            const memory: Memory = {
                id: messageId,
                agentId,
                userId,
                roomId,
                content,
                createdAt: message.date * 1000,
                embedding: getEmbeddingZeroVector(),
            };

            // Create memory
            await this.runtime.messageManager.createMemory(memory);

            // Update state with the new memory
            let state = await this.runtime.composeState(memory);
            state = await this.runtime.updateRecentMessageState(state);

            // Decide whether to respond
            const shouldRespond = await this._shouldRespond(message, state);

            // Send response in chunks
            const callback: HandlerCallback = async (content: Content) => {
                const sentMessages = await this.sendMessageInChunks(
                    ctx,
                    content,
                    message.message_id
                );
                if (sentMessages) {
                    const memories: Memory[] = [];

                    // Create memories for each sent message
                    for (let i = 0; i < sentMessages.length; i++) {
                        const sentMessage = sentMessages[i];
                        const isLastMessage = i === sentMessages.length - 1;

                        const memory: Memory = {
                            id: stringToUuid(
                                sentMessage.message_id.toString() +
                                    "-" +
                                    this.runtime.agentId
                            ),
                            agentId,
                            userId: agentId,
                            roomId,
                            content: {
                                ...content,
                                text: sentMessage.text,
                                inReplyTo: messageId,
                            },
                            createdAt: sentMessage.date * 1000,
                            embedding: getEmbeddingZeroVector(),
                        };

                        // Set action to CONTINUE for all messages except the last one
                        // For the last message, use the original action from the response content
                        memory.content.action = !isLastMessage
                            ? "CONTINUE"
                            : content.action;

                        await this.runtime.messageManager.createMemory(memory);
                        memories.push(memory);
                    }

                    return memories;
                }
            };

            if (shouldRespond) {
                // Generate response
                const context = composeContext({
                    state,
                    template:
                        this.runtime.character.templates
                            ?.telegramMessageHandlerTemplate ||
                        this.runtime.character?.templates
                            ?.messageHandlerTemplate ||
                        telegramMessageHandlerTemplate,
                });

                const responseContent = await this._generateResponse(
                    memory,
                    state,
                    context
                );

                if (!responseContent || !responseContent.text) return;

                // Execute callback to send messages and log memories
                const responseMessages = await callback(responseContent);

                // Update state after response
                state = await this.runtime.updateRecentMessageState(state);

                // Handle any resulting actions
                await this.runtime.processActions(
                    memory,
                    responseMessages,
                    state,
                    callback
                );
            }

            await this.runtime.evaluate(memory, state, shouldRespond, callback);
        } catch (error) {
            elizaLogger.error("❌ Error handling message:", error);
            elizaLogger.error("Error sending message:", error);
        }
    }
}
