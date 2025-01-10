import { stringToUuid } from "@elizaos/core";
import { BroadcastResult } from "./types";

/**
 * Generates a unique publication ID by combining the provided publication ID and agent ID.
 * @param {object} params - The parameters object.
 * @param {string} params.pubId - The publication ID.
 * @param {string} params.agentId - The agent ID.
 * @returns {string} The unique publication ID.
 */
export function publicationId({
    pubId,
    agentId,
}: {
    pubId: string;
    agentId: string;
}) {
    return `${pubId}-${agentId}`;
}

/**
 * Generates a UUID based on the provided publication ID and agent ID.
 * @param {Object} props - The properties object.
 * @param {string} props.pubId - The publication ID.
 * @param {string} props.agentId - The agent ID.
 * @returns {string} The generated UUID.
 */
export function publicationUuid(props: { pubId: string; agentId: string }) {
    return stringToUuid(publicationId(props));
}

/**
 * Populates mentions in the given text based on the provided user IDs, positions, and user map.
 * 
 * @param {string} text - The text to populate mentions in
 * @param {number[]} userIds - Array of user IDs to mention
 * @param {number[]} positions - Array of positions where mentions should be inserted
 * @param {Record<number, string>} userMap - Object mapping user IDs to display names
 * @returns {string} The text with mentions populated
 */
export function populateMentions(
    text: string,
    userIds: number[],
    positions: number[],
    userMap: Record<number, string>
) {
    // Validate input arrays have same length
    if (userIds.length !== positions.length) {
        throw new Error(
            "User IDs and positions arrays must have the same length"
        );
    }

    // Create array of mention objects with position and user info
    const mentions = userIds
        .map((userId, index) => ({
            position: positions[index],
            userId,
            displayName: userMap[userId]!,
        }))
        .sort((a, b) => b.position - a.position); // Sort in reverse order to prevent position shifting

    // Create the resulting string by inserting mentions
    let result = text;
    mentions.forEach((mention) => {
        const mentionText = `@${mention.displayName}`;
        result =
            result.slice(0, mention.position) +
            mentionText +
            result.slice(mention.position);
    });

    return result;
}

export const handleBroadcastResult = (
    broadcastResult: any
): BroadcastResult | undefined => {
    const broadcastValue = broadcastResult.unwrap();

    if ("id" in broadcastValue || "txId" in broadcastValue) {
        return broadcastValue;
    } else {
        throw new Error();
    }
};

export const getProfilePictureUri = (picture: any): string | undefined => {
    if ("optimized" in picture) {
        return picture.optimized?.uri || picture.raw?.uri || picture.uri;
    } else {
        return picture.uri;
    }
};

/**
 * Returns a new object that omits a specified key from the input object.
 * 
 * @template T - The type of the input object.
 * @template K - The type of the key to omit.
 * @param {T} obj - The input object to omit key from.
 * @param {K} key - The key to omit from the object.
 * @returns {Omit<T, K>} - A new object that omits the specified key.
 */
export function omit<T extends object, K extends string>(
    obj: T,
    key: K
): Omit<T, K> {
    const result: any = {};
    Object.keys(obj).forEach((currentKey) => {
        if (currentKey !== key) {
            result[currentKey] = obj[currentKey];
        }
    });
    return result;
}
