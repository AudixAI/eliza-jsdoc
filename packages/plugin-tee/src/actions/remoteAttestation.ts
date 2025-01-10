import type { IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { RemoteAttestationProvider } from "../providers/remoteAttestationProvider";
import { fetch, type BodyInit } from "undici";

/**
 * Convert a hexadecimal string to a Uint8Array.
 * 
 * @param {string} hex - The hexadecimal string to convert.
 * @returns {Uint8Array} The resulting Uint8Array.
 * @throws {Error} If the hex string is invalid.
 */
function hexToUint8Array(hex: string) {
    hex = hex.trim();
    if (!hex) {
      throw new Error("Invalid hex string");
    }
    if (hex.startsWith("0x")) {
      hex = hex.substring(2);
    }
    if (hex.length % 2 !== 0) {
      throw new Error("Invalid hex string");
    }

    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.slice(i, i + 2), 16);
      if (isNaN(byte)) {
        throw new Error("Invalid hex string");
      }
      array[i / 2] = byte;
    }
    return array;
}

/**
 * Uploads a Uint8Array as a binary file to a specified URL.
 * 
 * @param {Uint8Array} data - The Uint8Array data to be uploaded.
 * @returns {Promise<Response>} - A Promise that resolves with the Response object from the fetch request.
 */
async function uploadUint8Array(data: Uint8Array) {
    const blob = new Blob([data], { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("file", blob, 'quote.bin');

    return await fetch("https://proof.t16z.com/api/upload", {
        method: "POST",
        body: formData as BodyInit,
      });
}

/**
 * Represents a remote attestation action that generates a remote attestation to prove that the agent is running in a Trusted Execution Environment (TEE).
 *
 * @typedef {Object} RemoteAttestationAction
 * @property {string} name - The name of the action.
 * @property {Array<string>} similes - Array of related terms or concepts.
 * @property {string} description - A description of the action.
 * @property {Function} handler - The function that handles the remote attestation generation process.
 * @property {Function} validate - A function that validates the runtime environment for remote attestation.
 * @property {Array<Object>} examples - Array of example scenarios demonstrating the usage of the action.
 */
export const remoteAttestationAction = {
    name: "REMOTE_ATTESTATION",
    similes: ["REMOTE_ATTESTATION", "TEE_REMOTE_ATTESTATION", "TEE_ATTESTATION"],
    description: "Generate a remote attestation to prove that the agent is running in a TEE",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        callback: HandlerCallback,
    ) => {
        try {
            // Get the remote attestation of the agentId
            const agentId = runtime.agentId;
            const teeMode = runtime.getSetting("TEE_MODE");
            const provider = new RemoteAttestationProvider(teeMode);
            const attestation = await provider.generateAttestation(agentId, 'raw');
            const attestationData = hexToUint8Array(attestation.quote);
            const response = await uploadUint8Array(attestationData);
            const data = await response.json();
            callback({
                text: `Here's my 🧾 RA Quote 🫡
                https://proof.t16z.com/reports/${data.checksum}`,
                action: "NONE",
            });
            return true;
        } catch (error) {
            console.error("Failed to fetch remote attestation: ", error);
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime) => {
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "If you are running in a TEE, generate a remote attestation",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Of course, one second...",
                    action: "REMOTE_ATTESTATION",
                },
            }
        ],
    ],
};