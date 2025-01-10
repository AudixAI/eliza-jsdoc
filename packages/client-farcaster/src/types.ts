/**
 * Represents a user profile.
 * @typedef {Object} Profile
 * @property {number} fid - The unique identifier for the profile.
 * @property {string} name - The name of the user.
 * @property {string} username - The username of the user.
 * @property {string} [pfp] - The profile picture of the user.
 * @property {string} [bio] - The bio of the user.
 * @property {string} [url] - The URL of the user's profile.
 */
export type Profile = {
    fid: number;
    name: string;
    username: string;
    pfp?: string;
    bio?: string;
    url?: string;
    // location?: string;
    // twitter?: string;
    // github?: string;
};

/**
 * Represents the response object for a Neynar cast, containing information such as hash, authorFid, and text.
 */
export type NeynarCastResponse = {
    hash: string;
    authorFid: number;
    text: string;
};

/**
 * Represents a cast made by an author.
 * @typedef {object} Cast
 * @property {string} hash - The unique identifier for the cast.
 * @property {number} authorFid - The author's unique identifier.
 * @property {string} text - The content of the cast.
 * @property {Profile} profile - The profile of the author.
 * @property {object} inReplyTo - Optional. The hash and unique identifier of the cast being replied to.
 * @property {string} inReplyTo.hash - The unique identifier of the cast being replied to.
 * @property {number} inReplyTo.fid - The unique author identifier of the cast being replied to.
 * @property {Date} timestamp - The timestamp when the cast was made.
 */
export type Cast = {
    hash: string;
    authorFid: number;
    text: string;
    profile: Profile;
    inReplyTo?: {
        hash: string;
        fid: number;
    };
    timestamp: Date;
};

/**
 * Type representing a unique identifier for a cast.
 * @typedef {Object} CastId
 * @property {string} hash - The unique hash value.
 * @property {number} fid - The unique id value.
 */
export type CastId = {
    hash: string;
    fid: number;
};

/**
 * Type representing a request object for fetching data with a specific FID.
 * @typedef {object} FidRequest
 * @property {number} fid - The FID to fetch data for.
 * @property {number} pageSize - The number of items to include in each page of data.
 */
export type FidRequest = {
    fid: number;
    pageSize: number;
};
