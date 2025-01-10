import type { LensClient } from "./client";
import {
    elizaLogger,
    type Content,
    type IAgentRuntime,
    type Memory,
    type UUID,
} from "@elizaos/core";
import { textOnly } from "@lens-protocol/metadata";
import { createPublicationMemory } from "./memory";
import { AnyPublicationFragment } from "@lens-protocol/client";
import StorjProvider from "./providers/StorjProvider";

/**
 * Sends a publication to a Lens client.
 *
 * @param {Object} params - The parameters for sending the publication.
 * @param {LensClient} params.client - The Lens client to send the publication with.
 * @param {IAgentRuntime} params.runtime - The agent runtime.
 * @param {Content} params.content - The content of the publication.
 * @param {UUID} params.roomId - The ID of the room where the publication is being sent.
 * @param {string} [params.commentOn] - Optional comment to attach to the publication.
 * @param {StorjProvider} params.ipfs - The Storj provider for content hosting.
 * @returns {Promise<{ memory?: Memory; publication?: AnyPublicationFragment }>} A promise that resolves with the memory and publication created, or an empty object if unsuccessful.
 */
export async function sendPublication({
    client,
    runtime,
    content,
    roomId,
    commentOn,
    ipfs,
}: {
    client: LensClient;
    runtime: IAgentRuntime;
    content: Content;
    roomId: UUID;
    commentOn?: string;
    ipfs: StorjProvider;
}): Promise<{ memory?: Memory; publication?: AnyPublicationFragment }> {
    // TODO: arweave provider for content hosting
    const metadata = textOnly({ content: content.text });
    const contentURI = await ipfs.pinJson(metadata);

    const publication = await client.createPublication(
        contentURI,
        false, // TODO: support collectable settings
        commentOn
    );

    if (publication) {
        return {
            publication,
            memory: createPublicationMemory({
                roomId,
                runtime,
                publication: publication as AnyPublicationFragment,
            }),
        };
    }

    return {};
}
