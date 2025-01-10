import { stringToUuid } from "@elizaos/core";

export const MAX_CAST_LENGTH = 1024; // Updated to Twitter's current character limit

/**
 * Concatenates the hash and agentId values to create a unique identifier.
 * 
 * @param {object} param0 - An object containing the hash and agentId values.
 * @param {string} param0.hash - The hash value to be concatenated.
 * @param {string} param0.agentId - The agentId value to be concatenated.
 * 
 * @returns {string} The concatenated hash and agentId values.
 */
export function castId({ hash, agentId }: { hash: string; agentId: string }) {
    return `${hash}-${agentId}`;
}

/**
 * Function to cast the provided hash and agentId into a UUID format.
 * @param {Object} props - The properties object containing hash and agentId.
 * @param {string} props.hash - The hash to be cast into UUID.
 * @param {string} props.agentId - The agentId to be cast into UUID.
 * @returns {string} - The UUID generated from the hash and agentId.
 */
export function castUuid(props: { hash: string; agentId: string }) {
    return stringToUuid(castId(props));
}

/**
 * Splits a given content into an array of strings, each representing a post
 * 
 * @param {string} content The content to split into posts
 * @param {number} [maxLength=MAX_CAST_LENGTH] The maximum character length for each post
 * @returns {string[]} An array of strings representing each post
 */
export function splitPostContent(
    content: string,
    maxLength: number = MAX_CAST_LENGTH
): string[] {
    const paragraphs = content.split("\n\n").map((p) => p.trim());
    const posts: string[] = [];
    let currentTweet = "";

    for (const paragraph of paragraphs) {
        if (!paragraph) continue;

        if ((currentTweet + "\n\n" + paragraph).trim().length <= maxLength) {
            if (currentTweet) {
                currentTweet += "\n\n" + paragraph;
            } else {
                currentTweet = paragraph;
            }
        } else {
            if (currentTweet) {
                posts.push(currentTweet.trim());
            }
            if (paragraph.length <= maxLength) {
                currentTweet = paragraph;
            } else {
                // Split long paragraph into smaller chunks
                const chunks = splitParagraph(paragraph, maxLength);
                posts.push(...chunks.slice(0, -1));
                currentTweet = chunks[chunks.length - 1];
            }
        }
    }

    if (currentTweet) {
        posts.push(currentTweet.trim());
    }

    return posts;
}

/**
 * Splits a paragraph into chunks based on a maximum length specified.
 *
 * @param {string} paragraph - The paragraph to split into chunks.
 * @param {number} maxLength - The maximum length of each chunk.
 * @returns {string[]} An array of chunks where each element is a string that does not exceed the maxLength.
 */
export function splitParagraph(paragraph: string, maxLength: number): string[] {
    const sentences = paragraph.match(/[^\.!\?]+[\.!\?]+|[^\.!\?]+$/g) || [
        paragraph,
    ];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
        if ((currentChunk + " " + sentence).trim().length <= maxLength) {
            if (currentChunk) {
                currentChunk += " " + sentence;
            } else {
                currentChunk = sentence;
            }
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            if (sentence.length <= maxLength) {
                currentChunk = sentence;
            } else {
                // Split long sentence into smaller pieces
                const words = sentence.split(" ");
                currentChunk = "";
                for (const word of words) {
                    if (
                        (currentChunk + " " + word).trim().length <= maxLength
                    ) {
                        if (currentChunk) {
                            currentChunk += " " + word;
                        } else {
                            currentChunk = word;
                        }
                    } else {
                        if (currentChunk) {
                            chunks.push(currentChunk.trim());
                        }
                        currentChunk = word;
                    }
                }
            }
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Populate mentions in the given text with user information.
 * @param {string} text - The text to populate with mentions.
 * @param {number[]} userIds - Array of user IDs to mention.
 * @param {number[]} positions - Array of positions for each mention in the text.
 * @param {Record<number, string>} userMap - Object mapping user IDs to display names.
 * @returns {string} The text with mentions populated with user display names.
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
