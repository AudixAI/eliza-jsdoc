import type { Plugin } from "@elizaos/core";
import { getOnChainActions } from "./actions";
import { getWalletClient, getWalletProvider } from "./wallet";

/**
 * Asynchronously creates a new Goat plugin with the provided GetSetting function.
 *
 * @param {function} getSetting - The function used to retrieve a setting with a given key.
 * @returns {Promise<Plugin>} - A Promise that resolves to a new Plugin instance with a name, description, providers, evaluators, services, and actions.
 */
async function createGoatPlugin(
    getSetting: (key: string) => string | undefined
): Promise<Plugin> {
    const walletClient = getWalletClient(getSetting);
    const actions = await getOnChainActions(walletClient);

    return {
        name: "[GOAT] Onchain Actions",
        description: "Mode integration plugin",
        providers: [getWalletProvider(walletClient)],
        evaluators: [],
        services: [],
        actions: actions,
    };
}

export default createGoatPlugin;
