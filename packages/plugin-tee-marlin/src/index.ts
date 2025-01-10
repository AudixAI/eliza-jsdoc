import { Plugin } from "@elizaos/core";
import { remoteAttestationAction } from "./actions/remoteAttestation";

/**
 * Exported object representing Marlin TEE Plugin.
 *
 * @type {Plugin}
 * @property {string} name - The name of the plugin.
 * @property {string} description - A description of the plugin.
 * @property {Array<Function>} actions - Custom actions provided by the plugin.
 * @property {Array<Function>} evaluators - Custom evaluators provided by the plugin.
 * @property {Array<Function>} providers - Custom providers provided by the plugin.
 * @property {Array<Function>} services - Custom services provided by the plugin.
 */
export const teeMarlinPlugin: Plugin = {
    name: "Marlin TEE Plugin",
    description:
        "TEE plugin with actions to generate remote attestations",
    actions: [
        /* custom actions */
        remoteAttestationAction,
    ],
    evaluators: [
        /* custom evaluators */
    ],
    providers: [
        /* custom providers */
    ],
    services: [
        /* custom services */
    ],
};
