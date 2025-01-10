import { Client, IAgentRuntime, elizaLogger } from "@elizaos/core";
import { privateKeyToAccount } from "viem/accounts";
import { LensClient } from "./client";
import { LensPostManager } from "./post";
import { LensInteractionManager } from "./interactions";
import StorjProvider from "./providers/StorjProvider";

/**
 * LensAgentClient class represents a client for interacting with Lens
 * 
 * @implements {Client}
 * @property {LensClient} client - Instance of LensClient for communication
 * @property {LensPostManager} posts - Manager for handling posts
 * @property {LensInteractionManager} interactions - Manager for handling interactions
 * @property {string} profileId - Unique identifier for the profile
 * @property {StorjProvider} ipfs - Instance of StorjProvider for handling IPFS operations
 * @param {IAgentRuntime} runtime - Runtime environment for the client
 * @constructor
 * @throws {Error} If EVM_PRIVATE_KEY setting is missing
 * @method start - Method to start the client
 * @method stop - Method to stop the client
 */

export class LensAgentClient implements Client {
    client: LensClient;
    posts: LensPostManager;
    interactions: LensInteractionManager;

    private profileId: `0x${string}`;
    private ipfs: StorjProvider;

/**
 * Constructor for LensApp class.
 * 
 * @param {IAgentRuntime} runtime - The runtime for the agent.
 */
    constructor(public runtime: IAgentRuntime) {
        const cache = new Map<string, any>();

        const privateKey = runtime.getSetting(
            "EVM_PRIVATE_KEY"
        ) as `0x${string}`;
        if (!privateKey) {
            throw new Error("EVM_PRIVATE_KEY is missing");
        }
        const account = privateKeyToAccount(privateKey);

        this.profileId = runtime.getSetting(
            "LENS_PROFILE_ID"
        )! as `0x${string}`;

        this.client = new LensClient({
            runtime: this.runtime,
            account,
            cache,
            profileId: this.profileId,
        });

        elizaLogger.info("Lens client initialized.");

        this.ipfs = new StorjProvider(runtime);

        this.posts = new LensPostManager(
            this.client,
            this.runtime,
            this.profileId,
            cache,
            this.ipfs
        );

        this.interactions = new LensInteractionManager(
            this.client,
            this.runtime,
            this.profileId,
            cache,
            this.ipfs
        );
    }

/**
 * Asynchronously starts the process by calling the start method on the posts and interactions objects.
 */
    async start() {
        await Promise.all([this.posts.start(), this.interactions.start()]);
    }

/**
 * Asynchronously stops both the posts and interactions components,
 * awaiting for both promises to resolve before finishing.
 */
    async stop() {
        await Promise.all([this.posts.stop(), this.interactions.stop()]);
    }
}
