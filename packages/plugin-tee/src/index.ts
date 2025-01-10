import { Plugin } from "@elizaos/core";
import { remoteAttestationProvider } from "./providers/remoteAttestationProvider";
import { deriveKeyProvider } from "./providers/deriveKeyProvider";
import { remoteAttestationAction } from "./actions/remoteAttestation";

export { DeriveKeyProvider } from "./providers/deriveKeyProvider";
export { RemoteAttestationProvider } from "./providers/remoteAttestationProvider";
export { RemoteAttestationQuote, TEEMode } from "./types/tee";

/**
 * Plugin representing a TEE plugin with actions to generate remote attestations and derive keys.
 *
 * @type {Plugin}
 * @property {string} name - The name of the plugin.
 * @property {string} description - The description of the plugin.
 * @property {Array<Action>} actions - List of custom actions.
 * @property {Array<Evaluator>} evaluators - List of custom evaluators.
 * @property {Array<Provider>} providers - List of custom providers.
 * @property {Array<Service>} services - List of custom services.
 */
export const teePlugin: Plugin = {
    name: "tee",
    description:
        "TEE plugin with actions to generate remote attestations and derive keys",
    actions: [
        /* custom actions */
        remoteAttestationAction,
    ],
    evaluators: [
        /* custom evaluators */
    ],
    providers: [
        /* custom providers */
        remoteAttestationProvider,
        deriveKeyProvider,
    ],
    services: [
        /* custom services */
    ],
};
