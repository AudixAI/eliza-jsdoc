/**
 * Represents a user profile.
 * @typedef {Object} Profile
 * @property {string} id - The unique identifier for the profile.
 * @property {string} profileId - The profile identifier.
 * @property {string|null} [name] - The name of the user.
 * @property {string} [handle] - The user's handle.
 * @property {string} [pfp] - The profile picture of the user.
 * @property {string|null} [bio] - The biography of the user.
 * @property {string} [url] - The URL associated with the user's profile.
 */
export type Profile = {
    id: string;
    profileId: string;
    name?: string | null;
    handle?: string;
    pfp?: string;
    bio?: string | null;
    url?: string;
};

/**
 * Represents the result of a broadcast transaction.
 * @typedef {Object} BroadcastResult
 * @property {string} [id] - The ID of the broadcast result.
 * @property {string} [txId] - The transaction ID of the broadcast result.
 */
export type BroadcastResult = {
    id?: string;
    txId?: string;
};
