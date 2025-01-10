import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import {
    AnyPublicationFragment,
    LensClient as LensClientCore,
    production,
    LensTransactionStatusType,
    LimitType,
    NotificationType,
    ProfileFragment,
    PublicationType,
    FeedEventItemType,
} from "@lens-protocol/client";
import { Profile, BroadcastResult } from "./types";
import { PrivateKeyAccount } from "viem";
import { getProfilePictureUri, handleBroadcastResult, omit } from "./utils";

/**
 * LensClient class represents a client for interacting with the Lens platform.
 *
 * @property {IAgentRuntime} runtime - The runtime environment for the client.
 * @property {PrivateKeyAccount} account - The account associated with the client.
 * @property {Map<string, any>} cache - The cache for storing data associated with the client.
 * @property {Date} lastInteractionTimestamp - The timestamp of the last interaction with the client.
 * @property {`0x${string}`} profileId - The profile ID of the client.
 * 
 * @property {boolean} authenticated - Flag indicating if the client is authenticated.
 * @property {ProfileFragment | null} authenticatedProfile - The authenticated profile of the client, if available.
 */
export class LensClient {
    runtime: IAgentRuntime;
    account: PrivateKeyAccount;
    cache: Map<string, any>;
    lastInteractionTimestamp: Date;
    profileId: `0x${string}`;

    private authenticated: boolean;
    private authenticatedProfile: ProfileFragment | null;
    private core: LensClientCore;

/**
 * Create a new LensClient instance.
 * @param {Object} opts - The options for the LensClient.
 * @param {IAgentRuntime} opts.runtime - The runtime object.
 * @param {Map<string, any>} opts.cache - The cache object.
 * @param {PrivateKeyAccount} opts.account - The account object.
 * @param {`0x${string}`} opts.profileId - The profile ID.
 */
    constructor(opts: {
        runtime: IAgentRuntime;
        cache: Map<string, any>;
        account: PrivateKeyAccount;
        profileId: `0x${string}`;
    }) {
        this.cache = opts.cache;
        this.runtime = opts.runtime;
        this.account = opts.account;
        this.core = new LensClientCore({
            environment: production,
        });
        this.lastInteractionTimestamp = new Date();
        this.profileId = opts.profileId;
        this.authenticated = false;
        this.authenticatedProfile = null;
    }

/**
 * Asynchronously authenticates the user by generating a challenge, signing the message,
 * and authenticating the challenge with the signature. Updates the authenticated profile
 * and sets the authenticated flag to true upon successful authentication.
 * 
 * @returns {Promise<void>} A promise that resolves once the authentication process is complete
 */
    async authenticate(): Promise<void> {
        try {
            const { id, text } =
                await this.core.authentication.generateChallenge({
                    signedBy: this.account.address,
                    for: this.profileId,
                });

            const signature = await this.account.signMessage({
                message: text,
            });

            await this.core.authentication.authenticate({ id, signature });
            this.authenticatedProfile = await this.core.profile.fetch({
                forProfileId: this.profileId,
            });

            this.authenticated = true;
        } catch (error) {
            elizaLogger.error("client-lens::client error: ", error);
            throw error;
        }
    }

/**
 * Asynchronously creates a publication with the given content URI.
 * If the `onchain` flag is set to true, the publication is created on the blockchain.
 * If a `commentOn` string is provided, the publication is a comment on another publication identified by `commentOn`.
 * 
 * @param contentURI The content URI for the publication.
 * @param onchain Boolean indicating whether the publication should be created on the blockchain.
 * @param commentOn Optional string identifying the publication to comment on.
 * @returns A Promise that resolves to an AnyPublicationFragment object, null, or undefined.
 */
    async createPublication(
        contentURI: string,
        onchain: boolean = false,
        commentOn?: string
    ): Promise<AnyPublicationFragment | null | undefined> {
        try {
            if (!this.authenticated) {
                await this.authenticate();
                elizaLogger.log("done authenticating");
            }
            let broadcastResult;

            if (commentOn) {
                broadcastResult = onchain
                    ? await this.createCommentOnchain(contentURI, commentOn)
                    : await this.createCommentMomoka(contentURI, commentOn);
            } else {
                broadcastResult = onchain
                    ? await this.createPostOnchain(contentURI)
                    : await this.createPostMomoka(contentURI);
            }

            elizaLogger.log("broadcastResult", broadcastResult);

            if (broadcastResult.id) {
                return await this.core.publication.fetch({
                    forId: broadcastResult.id,
                });
            }

            const completion = await this.core.transaction.waitUntilComplete({
                forTxHash: broadcastResult.txHash,
            });

            if (completion?.status === LensTransactionStatusType.Complete) {
                return await this.core.publication.fetch({
                    forTxHash: completion?.txHash,
                });
            }
        } catch (error) {
            elizaLogger.error("client-lens::client error: ", error);
            throw error;
        }
    }

/**
 * Asynchronously fetches a publication based on the provided publication ID.
 *
 * @param {string} pubId - The ID of the publication to fetch.
 * @returns {Promise<AnyPublicationFragment | null>} The fetched publication or null if not found.
 */
    async getPublication(
        pubId: string
    ): Promise<AnyPublicationFragment | null> {
        if (this.cache.has(`lens/publication/${pubId}`)) {
            return this.cache.get(`lens/publication/${pubId}`);
        }

        const publication = await this.core.publication.fetch({ forId: pubId });

        if (publication)
            this.cache.set(`lens/publication/${pubId}`, publication);

        return publication;
    }

/**
 * Retrieve publications for a given profile ID with an optional limit.
 * 
 * @param {string} profileId - The unique identifier of the profile to retrieve publications for.
 * @param {number} [limit=50] - The maximum number of publications to return. Default is 50.
 * @returns {Promise<AnyPublicationFragment[]>} An array of publication fragments matching the criteria.
 */
    async getPublicationsFor(
        profileId: string,
        limit: number = 50
    ): Promise<AnyPublicationFragment[]> {
        const timeline: AnyPublicationFragment[] = [];
        let next: any | undefined = undefined;

        do {
            const { items, next: newNext } = next
                ? await next()
                : await this.core.publication.fetchAll({
                      limit: LimitType.Fifty,
                      where: {
                          from: [profileId],
                          publicationTypes: [PublicationType.Post],
                      },
                  });

            items.forEach((publication) => {
                this.cache.set(
                    `lens/publication/${publication.id}`,
                    publication
                );
                timeline.push(publication);
            });

            next = newNext;
        } while (next && timeline.length < limit);

        return timeline;
    }

/**
 * Asynchronously retrieves mentions from the notifications API.
 * If the user is not authenticated, it first calls the authenticate method.
 * 
 * @returns A Promise that resolves to an object with the mentions array and an optional next function.
 */
    async getMentions(): Promise<{
        mentions: AnyPublicationFragment[];
        next?: () => {};
    }> {
        if (!this.authenticated) {
            await this.authenticate();
        }
        // TODO: we should limit to new ones or at least latest n
        const result = await this.core.notifications.fetch({
            where: {
                highSignalFilter: false, // true,
                notificationTypes: [
                    NotificationType.Mentioned,
                    NotificationType.Commented,
                ],
            },
        });
        const mentions: AnyPublicationFragment[] = [];

        const { items, next } = result.unwrap();

        items.map((notification) => {
            // @ts-ignore NotificationFragment
            const item = notification.publication || notification.comment;
            if (!item.isEncrypted) {
                mentions.push(item);
                this.cache.set(`lens/publication/${item.id}`, item);
            }
        });

        return { mentions, next };
    }

/**
 * Retrieves profile information for a given profileId.
 * If the information is already cached, it returns the cached value.
 * If not cached, it makes a fetch request to retrieve the profile information from the core service.
 * If the fetch is successful, it constructs a Profile object and caches it for future use.
 *
 * @param {string} profileId - The ID of the profile to retrieve.
 * @returns {Promise<Profile>} A promise that resolves to the Profile object.
 * @throws Throws an error if the fetch request fails.
 */
    async getProfile(profileId: string): Promise<Profile> {
        if (this.cache.has(`lens/profile/${profileId}`)) {
            return this.cache.get(`lens/profile/${profileId}`) as Profile;
        }

        const result = await this.core.profile.fetch({
            forProfileId: profileId,
        });
        if (!result?.id) {
            elizaLogger.error("Error fetching user by profileId");

            throw "getProfile ERROR";
        }

        const profile: Profile = {
            id: "",
            profileId,
            name: "",
            handle: "",
        };

        profile.id = result.id;
        profile.name = result.metadata?.displayName;
        profile.handle = result.handle?.localName;
        profile.bio = result.metadata?.bio;
        profile.pfp = getProfilePictureUri(result.metadata?.picture);

        this.cache.set(`lens/profile/${profileId}`, profile);

        return profile;
    }

/**
 * Retrieve timeline of publications for a given profile ID.
 * 
 * @param {string} profileId - The ID of the profile to fetch the timeline for.
 * @param {number} [limit=10] - The maximum number of publications to fetch.
 * @returns {Promise<AnyPublicationFragment[]>} - A promise that resolves to an array of AnyPublicationFragment objects.
 * @throws {Error} - If an error occurs while fetching the timeline.
 */
    async getTimeline(
        profileId: string,
        limit: number = 10
    ): Promise<AnyPublicationFragment[]> {
        try {
            if (!this.authenticated) {
                await this.authenticate();
            }
            const timeline: AnyPublicationFragment[] = [];
            let next: any | undefined = undefined;

            do {
                const result = next
                    ? await next()
                    : await this.core.feed.fetch({
                          where: {
                              for: profileId,
                              feedEventItemTypes: [FeedEventItemType.Post],
                          },
                      });

                const data = result.unwrap();

                data.items.forEach((item) => {
                    // private posts in orb clubs are encrypted
                    if (timeline.length < limit && !item.root.isEncrypted) {
                        this.cache.set(
                            `lens/publication/${item.id}`,
                            item.root
                        );
                        timeline.push(item.root as AnyPublicationFragment);
                    }
                });

                next = data.pageInfo.next;
            } while (next && timeline.length < limit);

            return timeline;
        } catch (error) {
            elizaLogger.error(error);
            throw new Error("client-lens:: getTimeline");
        }
    }

/**
 * Creates a post on the blockchain with the given content URI.
 * If the authenticated profile has 'signless' enabled, the post is created gasless and signless.
 * If 'signless' is not enabled, the post is created gasless with signed type data.
 * @param {string} contentURI - The URI of the content to be posted onchain
 * @returns {Promise<BroadcastResult | undefined>} A Promise that resolves with the broadcast result of the post or undefined if an error occurs
 */
    private async createPostOnchain(
        contentURI: string
    ): Promise<BroadcastResult | undefined> {
        // gasless + signless if they enabled the lens profile manager
        if (this.authenticatedProfile?.signless) {
            const broadcastResult = await this.core.publication.postOnchain({
                contentURI,
                openActionModules: [], // TODO: if collectable
            });
            return handleBroadcastResult(broadcastResult);
        }

        // gasless with signed type data
        const typedDataResult =
            await this.core.publication.createOnchainPostTypedData({
                contentURI,
                openActionModules: [], // TODO: if collectable
            });
        const { id, typedData } = typedDataResult.unwrap();

        const signedTypedData = await this.account.signTypedData({
            domain: omit(typedData.domain as any, "__typename"),
            types: omit(typedData.types, "__typename"),
            primaryType: "Post",
            message: omit(typedData.value, "__typename"),
        });

        const broadcastResult = await this.core.transaction.broadcastOnchain({
            id,
            signature: signedTypedData,
        });
        return handleBroadcastResult(broadcastResult);
    }

/**
 * Create a new post on Momoka using the specified contentURI.
 * 
 * @param {string} contentURI The URI of the content to post.
 * @returns {Promise<BroadcastResult | undefined>} A promise that resolves with the broadcast result or undefined.
 */
    private async createPostMomoka(
        contentURI: string
    ): Promise<BroadcastResult | undefined> {
        elizaLogger.log("createPostMomoka");
        // gasless + signless if they enabled the lens profile manager
        if (this.authenticatedProfile?.signless) {
            const broadcastResult = await this.core.publication.postOnMomoka({
                contentURI,
            });
            return handleBroadcastResult(broadcastResult);
        }

        // gasless with signed type data
        const typedDataResult =
            await this.core.publication.createMomokaPostTypedData({
                contentURI,
            });
        elizaLogger.log("typedDataResult", typedDataResult);
        const { id, typedData } = typedDataResult.unwrap();

        const signedTypedData = await this.account.signTypedData({
            domain: omit(typedData.domain as any, "__typename"),
            types: omit(typedData.types, "__typename"),
            primaryType: "Post",
            message: omit(typedData.value, "__typename"),
        });

        const broadcastResult = await this.core.transaction.broadcastOnMomoka({
            id,
            signature: signedTypedData,
        });
        return handleBroadcastResult(broadcastResult);
    }

/**
 * 
 * Creates a comment on the blockchain.
 * 
 * @param {string} contentURI - The URI of the content being commented on.
 * @param {string} commentOn - The content ID being commented on.
 * @returns {Promise<BroadcastResult | undefined>} The result of broadcasting the comment on the blockchain.
 * 
 */
    private async createCommentOnchain(
        contentURI: string,
        commentOn: string
    ): Promise<BroadcastResult | undefined> {
        // gasless + signless if they enabled the lens profile manager
        if (this.authenticatedProfile?.signless) {
            const broadcastResult = await this.core.publication.commentOnchain({
                commentOn,
                contentURI,
            });
            return handleBroadcastResult(broadcastResult);
        }

        // gasless with signed type data
        const typedDataResult =
            await this.core.publication.createOnchainCommentTypedData({
                commentOn,
                contentURI,
            });

        const { id, typedData } = typedDataResult.unwrap();

        const signedTypedData = await this.account.signTypedData({
            domain: omit(typedData.domain as any, "__typename"),
            types: omit(typedData.types, "__typename"),
            primaryType: "Comment",
            message: omit(typedData.value, "__typename"),
        });

        const broadcastResult = await this.core.transaction.broadcastOnchain({
            id,
            signature: signedTypedData,
        });
        return handleBroadcastResult(broadcastResult);
    }

/**
 * Create a comment on a Momoka item.
 * @param {string} contentURI - The URI of the content to comment on.
 * @param {string} commentOn - The item to comment on.
 * @returns {Promise<BroadcastResult | undefined>} The result of the broadcast operation, if successful.
 */
    private async createCommentMomoka(
        contentURI: string,
        commentOn: string
    ): Promise<BroadcastResult | undefined> {
        // gasless + signless if they enabled the lens profile manager
        if (this.authenticatedProfile?.signless) {
            const broadcastResult = await this.core.publication.commentOnMomoka(
                {
                    commentOn,
                    contentURI,
                }
            );
            return handleBroadcastResult(broadcastResult);
        }

        // gasless with signed type data
        const typedDataResult =
            await this.core.publication.createMomokaCommentTypedData({
                commentOn,
                contentURI,
            });

        const { id, typedData } = typedDataResult.unwrap();

        const signedTypedData = await this.account.signTypedData({
            domain: omit(typedData.domain as any, "__typename"),
            types: omit(typedData.types, "__typename"),
            primaryType: "Comment",
            message: omit(typedData.value, "__typename"),
        });

        const broadcastResult = await this.core.transaction.broadcastOnMomoka({
            id,
            signature: signedTypedData,
        });
        return handleBroadcastResult(broadcastResult);
    }
}
