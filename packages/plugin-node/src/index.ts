export * from "./services/index.ts";

import { Plugin } from "@elizaos/core";

import { describeImage } from "./actions/describe-image.ts";
import {
    AwsS3Service,
    BrowserService,
    ImageDescriptionService,
    LlamaService,
    PdfService,
    SpeechService,
    TranscriptionService,
    VideoService,
} from "./services/index.ts";

/**
 * Represents a Node Plugin which is the return type of the createNodePlugin function.
 */
export type NodePlugin = ReturnType<typeof createNodePlugin>;

/**
 * Function to create a node plugin.
 * @returns {Plugin} The created node plugin with default settings and services.
 */
export function createNodePlugin() {
    return {
        name: "default",
        description: "Default plugin, with basic actions and evaluators",
        services: [
            new BrowserService(),
            new ImageDescriptionService(),
            new LlamaService(),
            new PdfService(),
            new SpeechService(),
            new TranscriptionService(),
            new VideoService(),
            new AwsS3Service(),
        ],
        actions: [describeImage],
    } as const satisfies Plugin;
}
