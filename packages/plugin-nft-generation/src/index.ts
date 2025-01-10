import { Plugin } from "@elizaos/core";
import nftCollectionGeneration from "./actions/nftCollectionGeneration.ts";
import mintNFTAction from "./actions/mintNFTAction.ts";

export * from "./provider/wallet/walletSolana.ts";
export * from "./api.ts";

/**
 * Asynchronously delays execution for a specified amount of time.
 * @param {number} ms - The number of milliseconds to delay execution (default is 3000).
 * @returns {Promise<void>} - A Promise that resolves after the specified delay.
 */
export async function sleep(ms: number = 3000) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export const nftGenerationPlugin: Plugin = {
    name: "nftCollectionGeneration",
    description: "Generate NFT Collections",
    actions: [nftCollectionGeneration, mintNFTAction],
    evaluators: [],
    providers: [],
};
