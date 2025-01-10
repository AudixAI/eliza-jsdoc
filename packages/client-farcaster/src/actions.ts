import type { FarcasterClient } from "./client";
import type { Content, IAgentRuntime, Memory, UUID } from "@elizaos/core";
import type { Cast, CastId, Profile } from "./types";
import { createCastMemory } from "./memory";
import { splitPostContent } from "./utils";

/**
 * Sends a cast message to a specific room while splitting the content into chunks. 
 * 
 * @param {Object} options - The options for sending the cast message.
 * @param {Profile} options.profile - The profile of the sender.
 * @param {FarcasterClient} options.client - The Farcaster client used for communication.
 * @param {IAgentRuntime} options.runtime - The runtime information of the agent.
 * @param {Content} options.content - The content of the cast message.
 * @param {UUID} options.roomId - The ID of the room where the cast message will be sent.
 * @param {string} options.signerUuid - The UUID of the signer.
 * @param {CastId} [options.inReplyTo] - The ID of the cast message being replied to (optional).
 * 
 * @returns {Promise<{ memory: Memory; cast: Cast }[]>} An array of objects containing the memory and cast message sent.
 */
export async function sendCast({
    client,
    runtime,
    content,
    roomId,
    inReplyTo,
    profile,
}: {
    profile: Profile;
    client: FarcasterClient;
    runtime: IAgentRuntime;
    content: Content;
    roomId: UUID;
    signerUuid: string;
    inReplyTo?: CastId;
}): Promise<{ memory: Memory; cast: Cast }[]> {
    const chunks = splitPostContent(content.text);
    const sent: Cast[] = [];
    let parentCastId = inReplyTo;

    for (const chunk of chunks) {
        const neynarCast = await client.publishCast(chunk, parentCastId);

        if (neynarCast) {
            const cast: Cast = {
                hash: neynarCast.hash,
                authorFid: neynarCast.authorFid,
                text: neynarCast.text,
                profile,
                inReplyTo: parentCastId,
                timestamp: new Date(),
            };

            sent.push(cast!);

            parentCastId = {
                fid: neynarCast?.authorFid!,
                hash: neynarCast?.hash!,
            };
        }
    }

    return sent.map((cast) => ({
        cast,
        memory: createCastMemory({
            roomId,
            runtime,
            cast,
        }),
    }));
}
