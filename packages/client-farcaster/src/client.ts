import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";
import { NeynarCastResponse, Cast, Profile, FidRequest, CastId } from "./types";

/**
 * FarcasterClient class representing a client for interacting with the Farcaster API.
 * @class
 * @public
 * @constructor
 * @param {Object} opts - The options for configuring the FarcasterClient.
 * @param {IAgentRuntime} opts.runtime - The agent runtime.
 * @param {string} opts.url - The URL for the Neynar API.
 * @param {boolean} opts.ssl - Whether to use SSL for communication.
 * @param {NeynarAPIClient} opts.neynar - The Neynar API client.
 * @param {string} opts.signerUuid - The UUID of the signer.
 * @param {Map<string, any>} opts.cache - The cache to store data.
 * @property {IAgentRuntime} runtime - The agent runtime.
 * @property {NeynarAPIClient} neynar - The Neynar API client.
 * @property {string} signerUuid - The UUID of the signer.
 * @property {Map<string, any>} cache - The cache to store data.
 * @property {Date} lastInteractionTimestamp - The timestamp of the last interaction.
 * @method loadCastFromNeynarResponse - Loads a cast from a Neynar response.
 * @method publishCast - Publishes a cast to the Neynar API.
 * @method getCast - Retrieves a cast based on the hash.
 * @method getCastsByFid - Retrieves casts for a specific FID.
 * @method getMentions - Retrieves mentions for a specific FID.
 * @method getProfile - Retrieves the profile for a specific FID.
 * @method getTimeline - Retrieves the timeline for a specific FID.
 */
export class FarcasterClient {
    runtime: IAgentRuntime;
    neynar: NeynarAPIClient;
    signerUuid: string;
    cache: Map<string, any>;
    lastInteractionTimestamp: Date;

/**
 * Constructor for creating an instance of a class.
 *
 * @param {Object} opts - The options for initializing the instance.
 * @param {IAgentRuntime} opts.runtime - The runtime for the agent.
 * @param {string} opts.url - The URL associated with the instance.
 * @param {boolean} opts.ssl - A boolean indicating if SSL is used.
 * @param {NeynarAPIClient} opts.neynar - The Neynar API client.
 * @param {string} opts.signerUuid - The UUID of the signer.
 * @param {Map<string, any>} opts.cache - The cache for storing data.
 */
    constructor(opts: {
        runtime: IAgentRuntime;
        url: string;
        ssl: boolean;
        neynar: NeynarAPIClient;
        signerUuid: string;
        cache: Map<string, any>;
    }) {
        this.cache = opts.cache;
        this.runtime = opts.runtime;
        this.neynar = opts.neynar;
        this.signerUuid = opts.signerUuid;
        this.lastInteractionTimestamp = new Date();
    }

/**
 * Loads cast data from the Neynar response object.
 * 
 * @param {any} neynarResponse - The Neynar API response object containing cast data.
 * @returns {Promise<Cast>} The cast object loaded from the Neynar response.
 */
    async loadCastFromNeynarResponse(neynarResponse: any): Promise<Cast> {
        const profile = await this.getProfile(neynarResponse.author.fid);
        return {
            hash: neynarResponse.hash,
            authorFid: neynarResponse.author.fid,
            text: neynarResponse.text,
            profile,
            ...(neynarResponse.parent_hash
                ? {
                      inReplyTo: {
                          hash: neynarResponse.parent_hash,
                          fid: neynarResponse.parent_author.fid,
                      },
                  }
                : {}),
            timestamp: new Date(neynarResponse.timestamp),
        };
    }

/**
 * Publishes a cast to Neynar API with the provided details.
 *
 * @param {string} cast - The text content of the cast to be published.
 * @param {CastId | undefined} parentCastId - The parent cast ID, if the cast is a reply to another cast.
 * @param {number} [retryTimes] - The number of times to retry publishing the cast in case of failure.
 * @returns {Promise<NeynarCastResponse | undefined>} The response from Neynar API after publishing the cast,
 * containing the hash, authorFid, and text of the published cast.
 */
    async publishCast(
        cast: string,
        parentCastId: CastId | undefined,
        retryTimes?: number
    ): Promise<NeynarCastResponse | undefined> {
        try {
            const result = await this.neynar.publishCast({
                signerUuid: this.signerUuid,
                text: cast,
                parent: parentCastId?.hash,
            });
            if (result.success) {
                return {
                    hash: result.cast.hash,
                    authorFid: result.cast.author.fid,
                    text: result.cast.text,
                };
            }
        } catch (err) {
            if (isApiErrorResponse(err)) {
                elizaLogger.error("Neynar error: ", err.response.data);
                throw err.response.data;
            } else {
                elizaLogger.error("Error: ", err);
                throw err;
            }
        }
    }

/**
 * Retrieves and returns information about a cast based on the provided cast hash.
 * @param {string} castHash - The hash value of the cast to retrieve.
 * @returns {Promise<Cast>} The cast object containing details such as hash, author details, text, profile, inReplyTo, and timestamp.
 */
    async getCast(castHash: string): Promise<Cast> {
        if (this.cache.has(`farcaster/cast/${castHash}`)) {
            return this.cache.get(`farcaster/cast/${castHash}`);
        }

        const response = await this.neynar.lookupCastByHashOrWarpcastUrl({
            identifier: castHash,
            type: "hash",
        });
        const cast = {
            hash: response.cast.hash,
            authorFid: response.cast.author.fid,
            text: response.cast.text,
            profile: {
                fid: response.cast.author.fid,
                name: response.cast.author.display_name || "anon",
                username: response.cast.author.username,
            },
            ...(response.cast.parent_hash
                ? {
                      inReplyTo: {
                          hash: response.cast.parent_hash,
                          fid: response.cast.parent_author.fid,
                      },
                  }
                : {}),
            timestamp: new Date(response.cast.timestamp),
        };

        this.cache.set(`farcaster/cast/${castHash}`, cast);

        return cast;
    }

/**
 * Fetches and returns casts for a given FID.
 * @param {FidRequest} request The FID request object containing the FID and page size.
 * @returns {Promise<Cast[]>} The array of casts retrieved for the given FID.
 */
    async getCastsByFid(request: FidRequest): Promise<Cast[]> {
        const timeline: Cast[] = [];

        const response = await this.neynar.fetchCastsForUser({
            fid: request.fid,
            limit: request.pageSize,
        });
        response.casts.map((cast) => {
            this.cache.set(`farcaster/cast/${cast.hash}`, cast);
            timeline.push({
                hash: cast.hash,
                authorFid: cast.author.fid,
                text: cast.text,
                profile: {
                    fid: cast.author.fid,
                    name: cast.author.display_name || "anon",
                    username: cast.author.username,
                },
                timestamp: new Date(cast.timestamp),
            });
        });

        return timeline;
    }

/**
 * Asynchronously retrieves mentions and replies for a specific FID from Neynar.
 * 
 * @param {FidRequest} request - The FID request object containing the FID.
 * @returns {Promise<Cast[]>} - A promise that resolves to an array of Cast objects representing the mentions and replies.
 */ 

    async getMentions(request: FidRequest): Promise<Cast[]> {
        const neynarMentionsResponse = await this.neynar.fetchAllNotifications({
            fid: request.fid,
            type: ["mentions", "replies"],
        });
        const mentions: Cast[] = [];

        neynarMentionsResponse.notifications.map((notification) => {
            const cast = {
                hash: notification.cast!.hash,
                authorFid: notification.cast!.author.fid,
                text: notification.cast!.text,
                profile: {
                    fid: notification.cast!.author.fid,
                    name: notification.cast!.author.display_name || "anon",
                    username: notification.cast!.author.username,
                },
                ...(notification.cast!.parent_hash
                    ? {
                          inReplyTo: {
                              hash: notification.cast!.parent_hash,
                              fid: notification.cast!.parent_author.fid,
                          },
                      }
                    : {}),
                timestamp: new Date(notification.cast!.timestamp),
            };
            mentions.push(cast);
            this.cache.set(`farcaster/cast/${cast.hash}`, cast);
        });

        return mentions;
    }

/**
 * Asynchronously retrieves the profile information for a given fid.
 * @param {number} fid - The fid of the user to retrieve the profile for.
 * @returns {Promise<Profile>} The profile information for the user with the specified fid.
 */
    async getProfile(fid: number): Promise<Profile> {
        if (this.cache.has(`farcaster/profile/${fid}`)) {
            return this.cache.get(`farcaster/profile/${fid}`) as Profile;
        }

        const result = await this.neynar.fetchBulkUsers({ fids: [fid] });
        if (!result.users || result.users.length < 1) {
            elizaLogger.error("Error fetching user by fid");

            throw "getProfile ERROR";
        }

        const neynarUserProfile = result.users[0];

        const profile: Profile = {
            fid,
            name: "",
            username: "",
        };

        const userDataBodyType = {
            1: "pfp",
            2: "name",
            3: "bio",
            5: "url",
            6: "username",
            // 7: "location",
            // 8: "twitter",
            // 9: "github",
        } as const;

        profile.name = neynarUserProfile.display_name!;
        profile.username = neynarUserProfile.username;
        profile.bio = neynarUserProfile.profile.bio.text;
        profile.pfp = neynarUserProfile.pfp_url;

        this.cache.set(`farcaster/profile/${fid}`, profile);

        return profile;
    }

/**
 * Asynchronously retrieves the timeline for a given FidRequest.
 * Retrieves the casts by Fid using the getCastsByFid method, caches each cast in the cache,
 * and populates the timeline array with each cast before returning the timeline array along with an optional nextPageToken.
 * @param {FidRequest} request - The FidRequest object containing the information needed to retrieve the timeline.
 * @returns {Promise<{ timeline: Cast[]; nextPageToken?: Uint8Array | undefined; }>} The timeline array containing casts and an optional nextPageToken.
 */
    async getTimeline(request: FidRequest): Promise<{
        timeline: Cast[];
        nextPageToken?: Uint8Array | undefined;
    }> {
        const timeline: Cast[] = [];

        const results = await this.getCastsByFid(request);

        for (const cast of results) {
            this.cache.set(`farcaster/cast/${cast.hash}`, cast);
            timeline.push(cast);
        }

        return {
            timeline,
            //TODO implement paging
            //nextPageToken: results.nextPageToken,
        };
    }
}
