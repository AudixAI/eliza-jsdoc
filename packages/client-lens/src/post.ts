import {
    composeContext,
    generateText,
    IAgentRuntime,
    ModelClass,
    stringToUuid,
    elizaLogger,
} from "@elizaos/core";
import { LensClient } from "./client";
import { formatTimeline, postTemplate } from "./prompts";
import { publicationUuid } from "./utils";
import { createPublicationMemory } from "./memory";
import { sendPublication } from "./actions";
import StorjProvider from "./providers/StorjProvider";

/**
 * Class representing a LensPostManager.
 * @class
 */
 
export class LensPostManager {
    private timeout: NodeJS.Timeout | undefined;

/**
 * Constructor for creating an instance of a class.
 * 
 * @param client The LensClient object for communication.
 * @param runtime The IAgentRuntime object for runtime information.
 * @param profileId The profile ID associated with the instance.
 * @param cache A Map object for caching data.
 * @param ipfs The StorjProvider object for IPFS communication.
 */
    constructor(
        public client: LensClient,
        public runtime: IAgentRuntime,
        private profileId: string,
        public cache: Map<string, any>,
        private ipfs: StorjProvider
    ) {}

/**
 * Asynchronous method to start generating new publications at random intervals.
 * Calls the `generateNewPublication` method and handles any errors.
 * Sets a timeout that runs `generateNewPubLoop` after a random interval between 1 and 4 hours.
 */
    public async start() {
        const generateNewPubLoop = async () => {
            try {
                await this.generateNewPublication();
            } catch (error) {
                elizaLogger.error(error);
                return;
            }

            this.timeout = setTimeout(
                generateNewPubLoop,
                (Math.floor(Math.random() * (4 - 1 + 1)) + 1) * 60 * 60 * 1000
            ); // Random interval between 1 and 4 hours
        };

        generateNewPubLoop();
    }

/**
 * Stop the operation and clear the timeout if one exists.
 */
    public async stop() {
        if (this.timeout) clearTimeout(this.timeout);
    }

/**
 * Asynchronously generates a new publication by fetching profile information, ensuring user existence,
 * fetching timeline data, formatting the home timeline, composing state, generating context,
 * generating content, and finally sending the publication.
 * 
 * @returns {Promise<void>} A Promise that resolves once the publication has been successfully generated and sent
 */
    private async generateNewPublication() {
        elizaLogger.info("Generating new publication");
        try {
            const profile = await this.client.getProfile(this.profileId);
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                profile.handle!,
                this.runtime.character.name,
                "lens"
            );

            const timeline = await this.client.getTimeline(this.profileId);

            // this.cache.set("lens/timeline", timeline);

            const formattedHomeTimeline = formatTimeline(
                this.runtime.character,
                timeline
            );

            const generateRoomId = stringToUuid("lens_generate_room");

            const state = await this.runtime.composeState(
                {
                    roomId: generateRoomId,
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    content: { text: "", action: "" },
                },
                {
                    lensHandle: profile.handle,
                    timeline: formattedHomeTimeline,
                }
            );

            const context = composeContext({
                state,
                template:
                    this.runtime.character.templates?.lensPostTemplate ||
                    postTemplate,
            });

            const content = await generateText({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            if (this.runtime.getSetting("LENS_DRY_RUN") === "true") {
                elizaLogger.info(`Dry run: would have posted: ${content}`);
                return;
            }

            try {
                const { publication } = await sendPublication({
                    client: this.client,
                    runtime: this.runtime,
                    roomId: generateRoomId,
                    content: { text: content },
                    ipfs: this.ipfs,
                });

                if (!publication) throw new Error("failed to send publication");

                const roomId = publicationUuid({
                    agentId: this.runtime.agentId,
                    pubId: publication.id,
                });

                await this.runtime.ensureRoomExists(roomId);

                await this.runtime.ensureParticipantInRoom(
                    this.runtime.agentId,
                    roomId
                );

                elizaLogger.info(`[Lens Client] Published ${publication.id}`);

                await this.runtime.messageManager.createMemory(
                    createPublicationMemory({
                        roomId,
                        runtime: this.runtime,
                        publication,
                    })
                );
            } catch (error) {
                elizaLogger.error("Error sending publication:", error);
            }
        } catch (error) {
            elizaLogger.error("Error generating new publication:", error);
        }
    }
}
