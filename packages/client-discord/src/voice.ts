import {
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    ServiceType,
    State,
    UUID,
    composeContext,
    composeRandomUser,
    elizaLogger,
    getEmbeddingZeroVector,
    generateMessageResponse,
    stringToUuid,
    generateShouldRespond,
    ITranscriptionService,
    ISpeechService,
} from "@elizaos/core";
import {
    AudioPlayer,
    AudioReceiveStream,
    NoSubscriberBehavior,
    StreamType,
    VoiceConnection,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnections,
    joinVoiceChannel,
    entersState,
} from "@discordjs/voice";
import {
    BaseGuildVoiceChannel,
    ChannelType,
    Client,
    Guild,
    GuildMember,
    VoiceChannel,
    VoiceState,
} from "discord.js";
import EventEmitter from "events";
import prism from "prism-media";
import { Readable, pipeline } from "stream";
import { DiscordClient } from "./index.ts";
import {
    discordShouldRespondTemplate,
    discordVoiceHandlerTemplate,
} from "./templates.ts";
import { getWavHeader } from "./utils.ts";

// These values are chosen for compatibility with picovoice components
const DECODE_FRAME_SIZE = 1024;
const DECODE_SAMPLE_RATE = 16000;

/**
 * Class representing an AudioMonitor.
 * @param { Readable } readable - The Readable stream to monitor.
 * @param { number } maxSize - The maximum size of the buffers.
 * @param { Function } onStart - The function to call when audio starts.
 * @param { Function } callback - The function to call with the buffer data.
 */
export class AudioMonitor {
    private readable: Readable;
    private buffers: Buffer[] = [];
    private maxSize: number;
    private lastFlagged: number = -1;
    private ended: boolean = false;

/**
 * Constructor for AudioMonitor class.
 *
 * @param {Readable} readable The readable stream.
 * @param {number} maxSize The maximum size of the buffer.
 * @param {function} onStart Callback function called when monitoring starts.
 * @param {function} callback Callback function to receive the buffer.
 */
    constructor(
        readable: Readable,
        maxSize: number,
        onStart: () => void,
        callback: (buffer: Buffer) => void
    ) {
        this.readable = readable;
        this.maxSize = maxSize;
        this.readable.on("data", (chunk: Buffer) => {
            //console.log('AudioMonitor got data');
            if (this.lastFlagged < 0) {
                this.lastFlagged = this.buffers.length;
            }
            this.buffers.push(chunk);
            const currentSize = this.buffers.reduce(
                (acc, cur) => acc + cur.length,
                0
            );
            while (currentSize > this.maxSize) {
                this.buffers.shift();
                this.lastFlagged--;
            }
        });
        this.readable.on("end", () => {
            elizaLogger.log("AudioMonitor ended");
            this.ended = true;
            if (this.lastFlagged < 0) return;
            callback(this.getBufferFromStart());
            this.lastFlagged = -1;
        });
        this.readable.on("speakingStopped", () => {
            if (this.ended) return;
            elizaLogger.log("Speaking stopped");
            if (this.lastFlagged < 0) return;
            callback(this.getBufferFromStart());
        });
        this.readable.on("speakingStarted", () => {
            if (this.ended) return;
            onStart();
            elizaLogger.log("Speaking started");
            this.reset();
        });
    }

/**
 * Removes all listeners for the 'data', 'end', 'speakingStopped', and 'speakingStarted' events from the readable stream.
 */
    stop() {
        this.readable.removeAllListeners("data");
        this.readable.removeAllListeners("end");
        this.readable.removeAllListeners("speakingStopped");
        this.readable.removeAllListeners("speakingStarted");
    }

/**
 * Check if the object has been flagged.
 * @returns {boolean} true if the object has been flagged, false otherwise.
 */
    isFlagged() {
        return this.lastFlagged >= 0;
    }

/**
 * Retrieves a buffer from the flagged position onwards.
 * If the last flagged index is less than 0, returns null.
 * Returns a concatenated buffer from the last flagged index to the end of the buffers array.
 * @returns {Buffer | null} The concatenated buffer or null if lastFlagged < 0.
 */
    getBufferFromFlag() {
        if (this.lastFlagged < 0) {
            return null;
        }
        const buffer = Buffer.concat(this.buffers.slice(this.lastFlagged));
        return buffer;
    }

/**
 * Concatenates all buffers in the array starting from the beginning.
 * 
 * @return {Buffer} The concatenated buffer.
 */
    getBufferFromStart() {
        const buffer = Buffer.concat(this.buffers);
        return buffer;
    }

/**
 * Resets the buffers array and lastFlagged index.
 */
    reset() {
        this.buffers = [];
        this.lastFlagged = -1;
    }

/**
 * Check if the object is in an ended state.
 * 
 * @returns {boolean} True if the object is in an ended state, false otherwise.
 */
    isEnded() {
        return this.ended;
    }
}

/**
 * Manages voice data and transcriptions for users.
 * 
 * @class VoiceManager
 * @extends EventEmitter
 * @property {boolean} processingVoice - Flag indicating if voice data is currently being processed.
 * @property {NodeJS.Timeout | null} transcriptionTimeout - Timer for processing voice transcriptions.
 * @property {Map<string, { buffers: Buffer[]; totalLength: number; lastActive: number }>} userStates - Map of user states containing voice buffers and related information.
 */
export class VoiceManager extends EventEmitter {
    private processingVoice: boolean = false;
    private transcriptionTimeout: NodeJS.Timeout | null = null;
    private userStates: Map<
        string,
        {
            buffers: Buffer[];
            totalLength: number;
            lastActive: number;
            transcriptionText: string;
        }
    > = new Map();
    private activeAudioPlayer: AudioPlayer | null = null;
    private client: Client;
    private runtime: IAgentRuntime;
    private streams: Map<string, Readable> = new Map();
    private connections: Map<string, VoiceConnection> = new Map();
    private activeMonitors: Map<
        string,
        { channel: BaseGuildVoiceChannel; monitor: AudioMonitor }
    > = new Map();

/**
 * Constructor for initializing a new instance of the class.
 * @param {DiscordClient} client - The Discord client object.
 */
    constructor(client: DiscordClient) {
        super();
        this.client = client.client;
        this.runtime = client.runtime;
    }

/**
 * Handles updates to the voice state of a member.
 *
 * @param {VoiceState} oldState - The old VoiceState object.
 * @param {VoiceState} newState - The new VoiceState object.
 */
    async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;
        const member = newState.member;
        if (!member) return;
        if (member.id === this.client.user?.id) {
            return;
        }

        // Ignore mute/unmute events
        if (oldChannelId === newChannelId) {
            return;
        }

        // User leaving a channel where the bot is present
        if (oldChannelId && this.connections.has(oldChannelId)) {
            this.stopMonitoringMember(member.id);
        }

        // User joining a channel where the bot is present
        if (newChannelId && this.connections.has(newChannelId)) {
            await this.monitorMember(
                member,
                newState.channel as BaseGuildVoiceChannel
            );
        }
    }

/**
 * Asynchronously joins the specified voice channel, handling connection establishment and state changes.
 *
 * @param {BaseGuildVoiceChannel} channel - The voice channel to join
 * @returns {Promise<void>} - A Promise that resolves when the connection is successfully established
 */
    async joinChannel(channel: BaseGuildVoiceChannel) {
        const oldConnection = this.getVoiceConnection(
            channel.guildId as string
        );
        if (oldConnection) {
            try {
                oldConnection.destroy();
                // Remove all associated streams and monitors
                this.streams.clear();
                this.activeMonitors.clear();
            } catch (error) {
                console.error("Error leaving voice channel:", error);
            }
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator as any,
            selfDeaf: false,
            selfMute: false,
            group: this.client.user.id,
        });

        try {
            // Wait for either Ready or Signalling state
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Ready, 20_000),
                entersState(
                    connection,
                    VoiceConnectionStatus.Signalling,
                    20_000
                ),
            ]);

            // Log connection success
            elizaLogger.log(
                `Voice connection established in state: ${connection.state.status}`
            );

            // Set up ongoing state change monitoring
            connection.on("stateChange", async (oldState, newState) => {
                elizaLogger.log(
                    `Voice connection state changed from ${oldState.status} to ${newState.status}`
                );

                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    elizaLogger.log("Handling disconnection...");

                    try {
                        // Try to reconnect if disconnected
                        await Promise.race([
                            entersState(
                                connection,
                                VoiceConnectionStatus.Signalling,
                                5_000
                            ),
                            entersState(
                                connection,
                                VoiceConnectionStatus.Connecting,
                                5_000
                            ),
                        ]);
                        // Seems to be reconnecting to a new channel
                        elizaLogger.log("Reconnecting to channel...");
                    } catch (e) {
                        // Seems to be a real disconnect, destroy and cleanup
                        elizaLogger.log(
                            "Disconnection confirmed - cleaning up..." + e
                        );
                        connection.destroy();
                        this.connections.delete(channel.id);
                    }
                } else if (
                    newState.status === VoiceConnectionStatus.Destroyed
                ) {
                    this.connections.delete(channel.id);
                } else if (
                    !this.connections.has(channel.id) &&
                    (newState.status === VoiceConnectionStatus.Ready ||
                        newState.status === VoiceConnectionStatus.Signalling)
                ) {
                    this.connections.set(channel.id, connection);
                }
            });

            connection.on("error", (error) => {
                elizaLogger.log("Voice connection error:", error);
                // Don't immediately destroy - let the state change handler deal with it
                elizaLogger.log(
                    "Connection error - will attempt to recover..."
                );
            });

            // Store the connection
            this.connections.set(channel.id, connection);

            // Continue with voice state modifications
            const me = channel.guild.members.me;
            if (me?.voice && me.permissions.has("DeafenMembers")) {
                try {
                    await me.voice.setDeaf(false);
                    await me.voice.setMute(false);
                } catch (error) {
                    elizaLogger.log("Failed to modify voice state:", error);
                    // Continue even if this fails
                }
            }

            connection.receiver.speaking.on("start", async (userId: string) => {
                let user = channel.members.get(userId);
                if (!user) {
                    try {
                        user = await channel.guild.members.fetch(userId);
                    } catch (error) {
                        console.error("Failed to fetch user:", error);
                    }
                }
                if (user && !user?.user.bot) {
                    this.monitorMember(user as GuildMember, channel);
                    this.streams.get(userId)?.emit("speakingStarted");
                }
            });

            connection.receiver.speaking.on("end", async (userId: string) => {
                const user = channel.members.get(userId);
                if (!user?.user.bot) {
                    this.streams.get(userId)?.emit("speakingStopped");
                }
            });
        } catch (error) {
            elizaLogger.log("Failed to establish voice connection:", error);
            connection.destroy();
            this.connections.delete(channel.id);
            throw error;
        }
    }

/**
 * Retrieves the voice connection for a specific guild.
 *
 * @param {string} guildId - The ID of the guild for which to retrieve the voice connection.
 * @returns {VoiceConnection|undefined} The voice connection for the specified guild, or undefined if not found.
 */
    private getVoiceConnection(guildId: string) {
        const connections = getVoiceConnections(this.client.user.id);
        if (!connections) {
            return;
        }
        const connection = [...connections.values()].find(
            (connection) => connection.joinConfig.guildId === guildId
        );
        return connection;
    }

/**
 * Monitors the audio stream of a member in a voice channel.
 * @param {GuildMember} member - The member whose audio stream is being monitored.
 * @param {BaseGuildVoiceChannel} channel - The voice channel where the member is connected.
 */
    private async monitorMember(
        member: GuildMember,
        channel: BaseGuildVoiceChannel
    ) {
        const userId = member?.id;
        const userName = member?.user?.username;
        const name = member?.user?.displayName;
        const connection = this.getVoiceConnection(member?.guild?.id);
        const receiveStream = connection?.receiver.subscribe(userId, {
            autoDestroy: true,
            emitClose: true,
        });
        if (!receiveStream || receiveStream.readableLength === 0) {
            return;
        }
        const opusDecoder = new prism.opus.Decoder({
            channels: 1,
            rate: DECODE_SAMPLE_RATE,
            frameSize: DECODE_FRAME_SIZE,
        });
        const volumeBuffer: number[] = [];
        const VOLUME_WINDOW_SIZE = 30;
        const SPEAKING_THRESHOLD = 0.05;
        opusDecoder.on("data", (pcmData: Buffer) => {
            // Monitor the audio volume while the agent is speaking.
            // If the average volume of the user's audio exceeds the defined threshold, it indicates active speaking.
            // When active speaking is detected, stop the agent's current audio playback to avoid overlap.

            if (this.activeAudioPlayer) {
                const samples = new Int16Array(
                    pcmData.buffer,
                    pcmData.byteOffset,
                    pcmData.length / 2
                );
                const maxAmplitude = Math.max(...samples.map(Math.abs)) / 32768;
                volumeBuffer.push(maxAmplitude);

                if (volumeBuffer.length > VOLUME_WINDOW_SIZE) {
                    volumeBuffer.shift();
                }
                const avgVolume =
                    volumeBuffer.reduce((sum, v) => sum + v, 0) /
                    VOLUME_WINDOW_SIZE;

                if (avgVolume > SPEAKING_THRESHOLD) {
                    volumeBuffer.length = 0;
                    this.cleanupAudioPlayer(this.activeAudioPlayer);
                    this.processingVoice = false;
                }
            }
        });
        pipeline(
            receiveStream as AudioReceiveStream,
            opusDecoder as any,
            (err: Error | null) => {
                if (err) {
                    console.log(`Opus decoding pipeline error: ${err}`);
                }
            }
        );
        this.streams.set(userId, opusDecoder);
        this.connections.set(userId, connection as VoiceConnection);
        opusDecoder.on("error", (err: any) => {
            console.log(`Opus decoding error: ${err}`);
        });
        const errorHandler = (err: any) => {
            console.log(`Opus decoding error: ${err}`);
        };
        const streamCloseHandler = () => {
            console.log(`voice stream from ${member?.displayName} closed`);
            this.streams.delete(userId);
            this.connections.delete(userId);
        };
        const closeHandler = () => {
            console.log(`Opus decoder for ${member?.displayName} closed`);
            opusDecoder.removeListener("error", errorHandler);
            opusDecoder.removeListener("close", closeHandler);
            receiveStream?.removeListener("close", streamCloseHandler);
        };
        opusDecoder.on("error", errorHandler);
        opusDecoder.on("close", closeHandler);
        receiveStream?.on("close", streamCloseHandler);

        this.client.emit(
            "userStream",
            userId,
            name,
            userName,
            channel,
            opusDecoder
        );
    }

/**
 * Leaves the specified voice channel, destroying the connection and stopping monitoring of all members in the channel.
 *
 * @param {BaseGuildVoiceChannel} channel - The voice channel to leave.
 */
    leaveChannel(channel: BaseGuildVoiceChannel) {
        const connection = this.connections.get(channel.id);
        if (connection) {
            connection.destroy();
            this.connections.delete(channel.id);
        }

        // Stop monitoring all members in this channel
        for (const [memberId, monitorInfo] of this.activeMonitors) {
            if (
                monitorInfo.channel.id === channel.id &&
                memberId !== this.client.user?.id
            ) {
                this.stopMonitoringMember(memberId);
            }
        }

        console.log(`Left voice channel: ${channel.name} (${channel.id})`);
    }

/**
 * Stops monitoring a specific member.
 * @param {string} memberId - The ID of the member to stop monitoring.
 */
    stopMonitoringMember(memberId: string) {
        const monitorInfo = this.activeMonitors.get(memberId);
        if (monitorInfo) {
            monitorInfo.monitor.stop();
            this.activeMonitors.delete(memberId);
            this.streams.delete(memberId);
            console.log(`Stopped monitoring user ${memberId}`);
        }
    }

/**
 * Asynchronous function to handle when the bot joins a new guild.
 * @param {Guild} guild - The guild that the bot has joined.
 */
    async handleGuildCreate(guild: Guild) {
        console.log(`Joined guild ${guild.name}`);
        // this.scanGuild(guild);
    }

/**
 * Asynchronously debounces the process of transcription for a user when triggered.
 *
 * @param {UUID} userId - The unique identifier of the user.
 * @param {string} name - The name associated with the user.
 * @param {string} userName - The user's username.
 * @param {BaseGuildVoiceChannel} channel - The voice channel where the transcription is being processed.
 */  

    async debouncedProcessTranscription(
        userId: UUID,
        name: string,
        userName: string,
        channel: BaseGuildVoiceChannel
    ) {
        const DEBOUNCE_TRANSCRIPTION_THRESHOLD = 1500; // wait for 1.5 seconds of silence

        if (this.activeAudioPlayer?.state?.status === "idle") {
            elizaLogger.log("Cleaning up idle audio player.");
            this.cleanupAudioPlayer(this.activeAudioPlayer);
        }

        if (this.activeAudioPlayer || this.processingVoice) {
            const state = this.userStates.get(userId);
            state.buffers.length = 0;
            state.totalLength = 0;
            return;
        }

        if (this.transcriptionTimeout) {
            clearTimeout(this.transcriptionTimeout);
        }

        this.transcriptionTimeout = setTimeout(async () => {
            this.processingVoice = true;
            try {
                await this.processTranscription(
                    userId,
                    channel.id,
                    channel,
                    name,
                    userName
                );

                // Clean all users' previous buffers
                this.userStates.forEach((state, _) => {
                    state.buffers.length = 0;
                    state.totalLength = 0;
                });
            } finally {
                this.processingVoice = false;
            }
        }, DEBOUNCE_TRANSCRIPTION_THRESHOLD);
    }

/**
 * Handles the user audio stream by monitoring the audio data and processing it for transcription.
 * @param {UUID} userId - The unique identifier of the user.
 * @param {string} name - The name of the user.
 * @param {string} userName - The username of the user.
 * @param {BaseGuildVoiceChannel} channel - The voice channel where the user is connected.
 * @param {Readable} audioStream - The stream of audio data from the user.
 */
    async handleUserStream(
        userId: UUID,
        name: string,
        userName: string,
        channel: BaseGuildVoiceChannel,
        audioStream: Readable
    ) {
        console.log(`Starting audio monitor for user: ${userId}`);
        if (!this.userStates.has(userId)) {
            this.userStates.set(userId, {
                buffers: [],
                totalLength: 0,
                lastActive: Date.now(),
                transcriptionText: "",
            });
        }

        const state = this.userStates.get(userId);

        const processBuffer = async (buffer: Buffer) => {
            try {
                state!.buffers.push(buffer);
                state!.totalLength += buffer.length;
                state!.lastActive = Date.now();
                this.debouncedProcessTranscription(
                    userId,
                    name,
                    userName,
                    channel
                );
            } catch (error) {
                console.error(
                    `Error processing buffer for user ${userId}:`,
                    error
                );
            }
        };

        new AudioMonitor(
            audioStream,
            10000000,
            () => {
                if (this.transcriptionTimeout) {
                    clearTimeout(this.transcriptionTimeout);
                }
            },
            async (buffer) => {
                if (!buffer) {
                    console.error("Received empty buffer");
                    return;
                }
                await processBuffer(buffer);
            }
        );
    }

/**
 * Process the transcription of audio data for a user.
 *
 * @param {UUID} userId - The unique identifier of the user.
 * @param {string} channelId - The ID of the channel where the audio data was received.
 * @param {BaseGuildVoiceChannel} channel - The voice channel where the transcription is taking place.
 * @param {string} name - The name of the user.
 * @param {string} userName - The username of the user.
 * @returns {Promise<void>} - A promise that resolves when the transcription process is complete.
 */
    private async processTranscription(
        userId: UUID,
        channelId: string,
        channel: BaseGuildVoiceChannel,
        name: string,
        userName: string
    ) {
        const state = this.userStates.get(userId);
        if (!state || state.buffers.length === 0) return;
        try {
            const inputBuffer = Buffer.concat(state.buffers, state.totalLength);

            state.buffers.length = 0; // Clear the buffers
            state.totalLength = 0;
            // Convert Opus to WAV
            const wavBuffer = await this.convertOpusToWav(inputBuffer);
            console.log("Starting transcription...");

            const transcriptionText = await this.runtime
                .getService<ITranscriptionService>(ServiceType.TRANSCRIPTION)
                .transcribe(wavBuffer);

            function isValidTranscription(text: string): boolean {
                if (!text || text.includes("[BLANK_AUDIO]")) return false;
                return true;
            }

            if (transcriptionText && isValidTranscription(transcriptionText)) {
                state.transcriptionText += transcriptionText;
            }

            if (state.transcriptionText.length) {
                this.cleanupAudioPlayer(this.activeAudioPlayer);
                const finalText = state.transcriptionText;
                state.transcriptionText = "";
                await this.handleUserMessage(
                    finalText,
                    userId,
                    channelId,
                    channel,
                    name,
                    userName
                );
            }
        } catch (error) {
            console.error(
                `Error transcribing audio for user ${userId}:`,
                error
            );
        }
    }

/**
 * Handles user message received from Discord channel
 *
 * @param {string} message - The message sent by the user
 * @param {UUID} userId - The ID of the user sending the message
 * @param {string} channelId - The ID of the Discord channel
 * @param {BaseGuildVoiceChannel} channel - The Discord voice channel object
 * @param {string} name - The name associated with the user
 * @param {string} userName - The username of the user
 * @returns {Promise<void | null>} - A promise that resolves with no specified value or null
 */
    private async handleUserMessage(
        message: string,
        userId: UUID,
        channelId: string,
        channel: BaseGuildVoiceChannel,
        name: string,
        userName: string
    ) {
        try {
            const roomId = stringToUuid(channelId + "-" + this.runtime.agentId);
            const userIdUUID = stringToUuid(userId);

            await this.runtime.ensureConnection(
                userIdUUID,
                roomId,
                userName,
                name,
                "discord"
            );

            let state = await this.runtime.composeState(
                {
                    agentId: this.runtime.agentId,
                    content: { text: message, source: "Discord" },
                    userId: userIdUUID,
                    roomId,
                },
                {
                    discordChannel: channel,
                    discordClient: this.client,
                    agentName: this.runtime.character.name,
                }
            );

            if (message && message.startsWith("/")) {
                return null;
            }

            const memory = {
                id: stringToUuid(channelId + "-voice-message-" + Date.now()),
                agentId: this.runtime.agentId,
                content: {
                    text: message,
                    source: "discord",
                    url: channel.url,
                },
                userId: userIdUUID,
                roomId,
                embedding: getEmbeddingZeroVector(),
                createdAt: Date.now(),
            };

            if (!memory.content.text) {
                return { text: "", action: "IGNORE" };
            }

            await this.runtime.messageManager.createMemory(memory);

            state = await this.runtime.updateRecentMessageState(state);

            const shouldIgnore = await this._shouldIgnore(memory);

            if (shouldIgnore) {
                return { text: "", action: "IGNORE" };
            }

            const shouldRespond = await this._shouldRespond(
                message,
                userId,
                channel,
                state
            );

            if (!shouldRespond) {
                return;
            }

            const context = composeContext({
                state,
                template:
                    this.runtime.character.templates
                        ?.discordVoiceHandlerTemplate ||
                    this.runtime.character.templates?.messageHandlerTemplate ||
                    discordVoiceHandlerTemplate,
            });

            const responseContent = await this._generateResponse(
                memory,
                state,
                context
            );

            const callback: HandlerCallback = async (content: Content) => {
                console.log("callback content: ", content);
                const { roomId } = memory;

                const responseMemory: Memory = {
                    id: stringToUuid(
                        memory.id + "-voice-response-" + Date.now()
                    ),
                    agentId: this.runtime.agentId,
                    userId: this.runtime.agentId,
                    content: {
                        ...content,
                        user: this.runtime.character.name,
                        inReplyTo: memory.id,
                    },
                    roomId,
                    embedding: getEmbeddingZeroVector(),
                };

                if (responseMemory.content.text?.trim()) {
                    await this.runtime.messageManager.createMemory(
                        responseMemory
                    );
                    state = await this.runtime.updateRecentMessageState(state);

                    const responseStream = await this.runtime
                        .getService<ISpeechService>(
                            ServiceType.SPEECH_GENERATION
                        )
                        .generate(this.runtime, content.text);

                    if (responseStream) {
                        await this.playAudioStream(
                            userId,
                            responseStream as Readable
                        );
                    }

                    await this.runtime.evaluate(memory, state);
                } else {
                    console.warn("Empty response, skipping");
                }
                return [responseMemory];
            };

            const responseMemories = await callback(responseContent);

            const response = responseContent;

            const content = (response.responseMessage ||
                response.content ||
                response.message) as string;

            if (!content) {
                return null;
            }

            console.log("responseMemories: ", responseMemories);

            await this.runtime.processActions(
                memory,
                responseMemories,
                state,
                callback
            );
        } catch (error) {
            console.error("Error processing transcribed text:", error);
        }
    }

/**
 * Convert Opus audio data in PCM format to WAV format.
 *
 * @param {Buffer} pcmBuffer - The PCM audio data to convert to WAV.
 * @returns {Promise<Buffer>} - A Promise that resolves with the converted WAV audio data.
 */
    private async convertOpusToWav(pcmBuffer: Buffer): Promise<Buffer> {
        try {
            // Generate the WAV header
            const wavHeader = getWavHeader(
                pcmBuffer.length,
                DECODE_SAMPLE_RATE
            );

            // Concatenate the WAV header and PCM data
            const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

            return wavBuffer;
        } catch (error) {
            console.error("Error converting PCM to WAV:", error);
            throw error;
        }
    }

/**
* Determines whether the bot should respond to a message based on various conditions.
* @param {string} message - The message to be checked.
* @param {UUID} userId - The ID of the user who sent the message.
* @param {BaseGuildVoiceChannel} channel - The voice channel where the message was sent.
* @param {State} state - The current state of the application.
* @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the bot should respond.
*/
    private async _shouldRespond(
        message: string,
        userId: UUID,
        channel: BaseGuildVoiceChannel,
        state: State
    ): Promise<boolean> {
        if (userId === this.client.user?.id) return false;
        const lowerMessage = message.toLowerCase();
        const botName = this.client.user.username.toLowerCase();
        const characterName = this.runtime.character.name.toLowerCase();
        const guild = channel.guild;
        const member = guild?.members.cache.get(this.client.user?.id as string);
        const nickname = member?.nickname;

        if (
            lowerMessage.includes(botName as string) ||
            lowerMessage.includes(characterName) ||
            lowerMessage.includes(
                this.client.user?.tag.toLowerCase() as string
            ) ||
            (nickname && lowerMessage.includes(nickname.toLowerCase()))
        ) {
            return true;
        }

        if (!channel.guild) {
            return true;
        }

        // If none of the above conditions are met, use the generateText to decide
        const shouldRespondContext = composeContext({
            state,
            template:
                this.runtime.character.templates
                    ?.discordShouldRespondTemplate ||
                this.runtime.character.templates?.shouldRespondTemplate ||
                composeRandomUser(discordShouldRespondTemplate, 2),
        });

        const response = await generateShouldRespond({
            runtime: this.runtime,
            context: shouldRespondContext,
            modelClass: ModelClass.SMALL,
        });

        if (response === "RESPOND") {
            return true;
        } else if (response === "IGNORE") {
            return false;
        } else if (response === "STOP") {
            return false;
        } else {
            console.error(
                "Invalid response from response generateText:",
                response
            );
            return false;
        }
    }

/**
 * Generates a response based on the given message, state, and context.
 * 
 * @param {Memory} message The message object containing userId and roomId.
 * @param {State} state The current state of the conversation.
 * @param {string} context The context in which the response is being generated.
 * @returns {Promise<Content>} A promise that resolves to the generated response content.
 */
    private async _generateResponse(
        message: Memory,
        state: State,
        context: string
    ): Promise<Content> {
        const { userId, roomId } = message;

        const response = await generateMessageResponse({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        response.source = "discord";

        if (!response) {
            console.error("No response from generateMessageResponse");
            return;
        }

        await this.runtime.databaseAdapter.log({
            body: { message, context, response },
            userId: userId,
            roomId,
            type: "response",
        });

        return response;
    }

/**
 * Check if the message should be ignored based on various criteria.
 *
 * @param {Memory} message - The message to be checked for ignoring.
 * @returns {Promise<boolean>} A boolean indicating whether the message should be ignored.
 */ 
    private async _shouldIgnore(message: Memory): Promise<boolean> {
        // console.log("message: ", message);
        elizaLogger.debug("message.content: ", message.content);
        // if the message is 3 characters or less, ignore it
        if ((message.content as Content).text.length < 3) {
            return true;
        }

        const loseInterestWords = [
            // telling the bot to stop talking
            "shut up",
            "stop",
            "dont talk",
            "silence",
            "stop talking",
            "be quiet",
            "hush",
            "stfu",
            "stupid bot",
            "dumb bot",

            // offensive words
            "fuck",
            "shit",
            "damn",
            "suck",
            "dick",
            "cock",
            "sex",
            "sexy",
        ];
        if (
            (message.content as Content).text.length < 50 &&
            loseInterestWords.some((word) =>
                (message.content as Content).text?.toLowerCase().includes(word)
            )
        ) {
            return true;
        }

        const ignoreWords = ["k", "ok", "bye", "lol", "nm", "uh"];
        if (
            (message.content as Content).text?.length < 8 &&
            ignoreWords.some((word) =>
                (message.content as Content).text?.toLowerCase().includes(word)
            )
        ) {
            return true;
        }

        return false;
    }

/**
 * Scan the guild for a suitable voice channel to join.
 *
 * @param {Guild} guild The guild to scan for voice channels.
 */
    async scanGuild(guild: Guild) {
        let chosenChannel: BaseGuildVoiceChannel | null = null;

        try {
            const channelId = this.runtime.getSetting(
                "DISCORD_VOICE_CHANNEL_ID"
            ) as string;
            if (channelId) {
                const channel = await guild.channels.fetch(channelId);
                if (channel?.isVoiceBased()) {
                    chosenChannel = channel as BaseGuildVoiceChannel;
                }
            }

            if (!chosenChannel) {
                const channels = (await guild.channels.fetch()).filter(
                    (channel) => channel?.type == ChannelType.GuildVoice
                );
                for (const [, channel] of channels) {
                    const voiceChannel = channel as BaseGuildVoiceChannel;
                    if (
                        voiceChannel.members.size > 0 &&
                        (chosenChannel === null ||
                            voiceChannel.members.size >
                                chosenChannel.members.size)
                    ) {
                        chosenChannel = voiceChannel;
                    }
                }
            }

            if (chosenChannel) {
                console.log(`Joining channel: ${chosenChannel.name}`);
                await this.joinChannel(chosenChannel);
            } else {
                console.warn("No suitable voice channel found to join.");
            }
        } catch (error) {
            console.error("Error selecting or joining a voice channel:", error);
        }
    }

/**
 * Plays an audio stream for a specific user.
 * @param {UUID} userId - The unique identifier of the user.
 * @param {Readable} audioStream - The readable stream containing the audio data.
 * @returns {void}
 */
    async playAudioStream(userId: UUID, audioStream: Readable) {
        const connection = this.connections.get(userId);
        if (connection == null) {
            console.log(`No connection for user ${userId}`);
            return;
        }
        this.cleanupAudioPlayer(this.activeAudioPlayer);
        const audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        this.activeAudioPlayer = audioPlayer;
        connection.subscribe(audioPlayer);

        const audioStartTime = Date.now();

        const resource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
        });
        audioPlayer.play(resource);

        audioPlayer.on("error", (err: any) => {
            console.log(`Audio player error: ${err}`);
        });

        audioPlayer.on(
            "stateChange",
            (_oldState: any, newState: { status: string }) => {
                if (newState.status == "idle") {
                    const idleTime = Date.now();
                    console.log(
                        `Audio playback took: ${idleTime - audioStartTime}ms`
                    );
                }
            }
        );
    }

/**
 * Cleans up the provided audio player by stopping it, removing all listeners, and potentially
 * clearing the active audio player if it matches the one being cleaned up.
 * 
 * @param {AudioPlayer} audioPlayer - The audio player to be cleaned up
 */
    cleanupAudioPlayer(audioPlayer: AudioPlayer) {
        if (!audioPlayer) return;

        audioPlayer.stop();
        audioPlayer.removeAllListeners();
        if (audioPlayer === this.activeAudioPlayer) {
            this.activeAudioPlayer = null;
        }
    }

/**
 * Handles the join channel command by deferring the reply immediately to prevent interaction timeout,
 * validating the provided voice channel, joining the voice channel, and replying with the result.
 * 
 * @param {any} interaction - The interaction received from the user
 * @returns {Promise<void>} - A Promise that resolves once the command is handled
 */
    async handleJoinChannelCommand(interaction: any) {
        try {
            // Defer the reply immediately to prevent interaction timeout
            await interaction.deferReply();

            const channelId = interaction.options.get("channel")
                ?.value as string;
            if (!channelId) {
                await interaction.editReply(
                    "Please provide a voice channel to join."
                );
                return;
            }

            const guild = interaction.guild;
            if (!guild) {
                await interaction.editReply("Could not find guild.");
                return;
            }

            const voiceChannel = interaction.guild.channels.cache.find(
                (channel: VoiceChannel) =>
                    channel.id === channelId &&
                    channel.type === ChannelType.GuildVoice
            );

            if (!voiceChannel) {
                await interaction.editReply("Voice channel not found!");
                return;
            }

            await this.joinChannel(voiceChannel as BaseGuildVoiceChannel);
            await interaction.editReply(
                `Joined voice channel: ${voiceChannel.name}`
            );
        } catch (error) {
            console.error("Error joining voice channel:", error);
            // Use editReply instead of reply for the error case
            await interaction
                .editReply("Failed to join the voice channel.")
                .catch(console.error);
        }
    }

/**
 * Handles the command to leave the voice channel.
 * 
 * @param {any} interaction - The interaction object received from the command.
 * @returns {Promise<void>} - A Promise that resolves once the command has been handled.
 */
    async handleLeaveChannelCommand(interaction: any) {
        const connection = this.getVoiceConnection(interaction.guildId as any);

        if (!connection) {
            await interaction.reply("Not currently in a voice channel.");
            return;
        }

        try {
            connection.destroy();
            await interaction.reply("Left the voice channel.");
        } catch (error) {
            console.error("Error leaving voice channel:", error);
            await interaction.reply("Failed to leave the voice channel.");
        }
    }
}
