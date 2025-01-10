import { IAgentRuntime } from "@elizaos/core";
import { CosmosWalletChains } from "../../shared/entities/cosmos-wallet-chains-data";

/**
 * Initialize wallet chains data using the provided runtime object.
 * 
 * @param {IAgentRuntime} runtime - The runtime object containing necessary settings.
 * @returns {Promise<CosmosWalletChains>} A promise that resolves to the CosmosWalletChains object.
 * @throws {Error} If COSMOS_RECOVERY_PHRASE or COSMOS_AVAILABLE_CHAINS setting is missing or empty.
 */
export const initWalletChainsData = async (runtime: IAgentRuntime) => {
    const mnemonic = runtime.getSetting("COSMOS_RECOVERY_PHRASE");
    const availableChains = runtime.getSetting("COSMOS_AVAILABLE_CHAINS");

    if (!mnemonic) {
        throw new Error("COSMOS_RECOVERY_PHRASE is missing");
    }

    if (!availableChains) {
        throw new Error("COSMOS_AVAILABLE_CHAINS is missing");
    }

    const availableChainsArray = availableChains.split(",");

    if (!availableChainsArray.length) {
        throw new Error("COSMOS_AVAILABLE_CHAINS is empty");
    }

    return await CosmosWalletChains.create(mnemonic, availableChainsArray);
};
