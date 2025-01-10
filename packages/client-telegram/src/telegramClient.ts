import { Context, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { MessageManager } from "./messageManager.ts";
import { getOrCreateRecommenderInBe } from "./getOrCreateRecommenderInBe.ts";

/**
 * Represents a Telegram client that interacts with the Telegram API using Telegraf library.
 */
export class TelegramClient {
    private bot: Telegraf<Context>;
    private runtime: IAgentRuntime;
    private messageManager: MessageManager;
    private backend;
    private backendToken;
    private tgTrader;
    private options;

/**
 * Constructor for the TelegramClient class.
 * @param {IAgentRuntime} runtime - The IAgentRuntime instance.
 * @param {string} botToken - The Telegram bot token.
 */
    constructor(runtime: IAgentRuntime, botToken: string) {
        elizaLogger.log("📱 Constructing new TelegramClient...");
        this.options = {
            telegram: {
                apiRoot: runtime.getSetting("TELEGRAM_API_ROOT") || process.env.TELEGRAM_API_ROOT || "https://api.telegram.org"
            },
        };
        this.runtime = runtime;
        this.bot = new Telegraf(botToken,this.options);
        this.messageManager = new MessageManager(this.bot, this.runtime);
        this.backend = runtime.getSetting("BACKEND_URL");
        this.backendToken = runtime.getSetting("BACKEND_TOKEN");
        this.tgTrader = runtime.getSetting("TG_TRADER"); // boolean To Be added to the settings
        elizaLogger.log("✅ TelegramClient constructor completed");
    }

/**
 * Starts the Telegram bot by initializing, setting up message handlers, and setting up shutdown handlers.
 * 
 * @returns {Promise<void>} A promise that resolves when the bot is successfully started.
 */
    public async start(): Promise<void> {
        elizaLogger.log("🚀 Starting Telegram bot...");
        try {
            await this.initializeBot();
            this.setupMessageHandlers();
            this.setupShutdownHandlers();
        } catch (error) {
            elizaLogger.error("❌ Failed to launch Telegram bot:", error);
            throw error;
        }
    }

/**
 * Initializes the bot by launching it, getting bot information, and setting the bot for the message manager.
 * @returns {Promise<void>} A promise that resolves once the bot has been successfully initialized.
 */
    private async initializeBot(): Promise<void> {
        this.bot.launch({ dropPendingUpdates: true });
        elizaLogger.log(
            "✨ Telegram bot successfully launched and is running!"
        );

        const botInfo = await this.bot.telegram.getMe();
        this.bot.botInfo = botInfo;
        elizaLogger.success(`Bot username: @${botInfo.username}`);

        this.messageManager.bot = this.bot;
    }

/**
 * Checks whether the group is authorized based on the configuration settings.
 * 
 * @param {Context} ctx - The Telegraf context object.
 * @returns {Promise<boolean>} Returns a promise that resolves to a boolean indicating whether the group is authorized.
 */
    private async isGroupAuthorized(ctx: Context): Promise<boolean> {
        const config = this.runtime.character.clientConfig?.telegram;
        if (ctx.from?.id === ctx.botInfo?.id) {
            return false;
        }

        if (!config?.shouldOnlyJoinInAllowedGroups) {
            return true;
        }

        const allowedGroups = config.allowedGroupIds || [];
        const currentGroupId = ctx.chat.id.toString();

        if (!allowedGroups.includes(currentGroupId)) {
            elizaLogger.info(`Unauthorized group detected: ${currentGroupId}`);
            try {
                await ctx.reply("Not authorized. Leaving.");
                await ctx.leaveChat();
            } catch (error) {
                elizaLogger.error(
                    `Error leaving unauthorized group ${currentGroupId}:`,
                    error
                );
            }
            return false;
        }

        return true;
    }

/**
* Sets up message handlers for the bot.
* @private
* @returns {void}
*/
    private setupMessageHandlers(): void {
        elizaLogger.log("Setting up message handler...");

        this.bot.on(message("new_chat_members"), async (ctx) => {
            try {
                const newMembers = ctx.message.new_chat_members;
                const isBotAdded = newMembers.some(
                    (member) => member.id === ctx.botInfo.id
                );

                if (isBotAdded && !(await this.isGroupAuthorized(ctx))) {
                    return;
                }
            } catch (error) {
                elizaLogger.error("Error handling new chat members:", error);
            }
        });

        this.bot.on("message", async (ctx) => {
            try {
                // Check group authorization first
                if (!(await this.isGroupAuthorized(ctx))) {
                    return;
                }

                if (this.tgTrader) {
                    const userId = ctx.from?.id.toString();
                    const username =
                        ctx.from?.username || ctx.from?.first_name || "Unknown";
                    if (!userId) {
                        elizaLogger.warn(
                            "Received message from a user without an ID."
                        );
                        return;
                    }
                    try {
                        await getOrCreateRecommenderInBe(
                            userId,
                            username,
                            this.backendToken,
                            this.backend
                        );
                    } catch (error) {
                        elizaLogger.error(
                            "Error getting or creating recommender in backend",
                            error
                        );
                    }
                }

                await this.messageManager.handleMessage(ctx);
            } catch (error) {
                elizaLogger.error("❌ Error handling message:", error);
                // Don't try to reply if we've left the group or been kicked
                if (error?.response?.error_code !== 403) {
                    try {
                        await ctx.reply(
                            "An error occurred while processing your message."
                        );
                    } catch (replyError) {
                        elizaLogger.error(
                            "Failed to send error message:",
                            replyError
                        );
                    }
                }
            }
        });

        this.bot.on("photo", (ctx) => {
            elizaLogger.log(
                "📸 Received photo message with caption:",
                ctx.message.caption
            );
        });

        this.bot.on("document", (ctx) => {
            elizaLogger.log(
                "📎 Received document message:",
                ctx.message.document.file_name
            );
        });

        this.bot.catch((err, ctx) => {
            elizaLogger.error(`❌ Telegram Error for ${ctx.updateType}:`, err);
            ctx.reply("An unexpected error occurred. Please try again later.");
        });
    }

/**
 * Sets up the shutdown handlers for the Telegram bot to gracefully handle signals like SIGINT, SIGTERM, and SIGHUP.
 */
    private setupShutdownHandlers(): void {
        const shutdownHandler = async (signal: string) => {
            elizaLogger.log(
                `⚠️ Received ${signal}. Shutting down Telegram bot gracefully...`
            );
            try {
                await this.stop();
                elizaLogger.log("🛑 Telegram bot stopped gracefully");
            } catch (error) {
                elizaLogger.error(
                    "❌ Error during Telegram bot shutdown:",
                    error
                );
                throw error;
            }
        };

        process.once("SIGINT", () => shutdownHandler("SIGINT"));
        process.once("SIGTERM", () => shutdownHandler("SIGTERM"));
        process.once("SIGHUP", () => shutdownHandler("SIGHUP"));
    }

/**
 * Asynchronously stops the Telegram bot.
 * 
 * @returns {Promise<void>} A Promise that resolves when the Telegram bot has been successfully stopped.
 */
    public async stop(): Promise<void> {
        elizaLogger.log("Stopping Telegram bot...");
        //await 
            this.bot.stop();
        elizaLogger.log("Telegram bot stopped");
    }
}
