import {
    elizaLogger,
    getEmbeddingZeroVector,
    IAgentRuntime,
    stringToUuid,
    type Memory,
    type UUID,
} from "@elizaos/core";
import type { Cast } from "./types";
import { toHex } from "viem";
import { castUuid } from "./utils";
import { FarcasterClient } from "./client";

/**
 * Creates a memory object based on the provided cast information.
 * @param {Object} param0 - The parameters object.
 * @param {UUID} param0.roomId - The ID of the room where the memory is being created.
 * @param {IAgentRuntime} param0.runtime - The runtime information of the agent creating the memory.
 * @param {Cast} param0.cast - The cast object containing the information to create the memory.
 * @returns {Memory} The created memory object.
 */
export function createCastMemory({
    roomId,
    runtime,
    cast,
}: {
    roomId: UUID;
    runtime: IAgentRuntime;
    cast: Cast;
}): Memory {
    const inReplyTo = cast.inReplyTo
        ? castUuid({
              hash: toHex(cast.inReplyTo.hash),
              agentId: runtime.agentId,
          })
        : undefined;

    return {
        id: castUuid({
            hash: cast.hash,
            agentId: runtime.agentId,
        }),
        agentId: runtime.agentId,
        userId: runtime.agentId,
        content: {
            text: cast.text,
            source: "farcaster",
            url: "",
            inReplyTo,
            hash: cast.hash,
        },
        roomId,
        embedding: getEmbeddingZeroVector(),
    };
}

/**
 * Builds a conversation thread starting from the given `cast` object.
 * 
 * @param {Object} params - The parameters object
 * @param {Cast} params.cast - The initial cast object to start the thread
 * @param {IAgentRuntime} params.runtime - The runtime object for the agent
 * @param {FarcasterClient} params.client - The client object for Farcaster
 * @returns {Promise<Cast[]>} - A promise that resolves with an array containing the conversation thread
 */
export async function buildConversationThread({
    cast,
    runtime,
    client,
}: {
    cast: Cast;
    runtime: IAgentRuntime;
    client: FarcasterClient;
}): Promise<Cast[]> {
    const thread: Cast[] = [];
    const visited: Set<string> = new Set();
    async function processThread(currentCast: Cast) {
        if (visited.has(currentCast.hash)) {
            return;
        }

        visited.add(currentCast.hash);

        const roomId = castUuid({
            hash: currentCast.hash,
            agentId: runtime.agentId,
        });

        // Check if the current cast has already been saved
        const memory = await runtime.messageManager.getMemoryById(roomId);

        if (!memory) {
            elizaLogger.log("Creating memory for cast", currentCast.hash);

            const userId = stringToUuid(currentCast.profile.username);

            await runtime.ensureConnection(
                userId,
                roomId,
                currentCast.profile.username,
                currentCast.profile.name,
                "farcaster"
            );

            await runtime.messageManager.createMemory(
                createCastMemory({
                    roomId,
                    runtime,
                    cast: currentCast,
                })
            );
        }

        thread.unshift(currentCast);

        if (currentCast.inReplyTo) {
            const parentCast = await client.getCast(currentCast.inReplyTo.hash);
            await processThread(parentCast);
        }
    }

    await processThread(cast);
    return thread;
}
