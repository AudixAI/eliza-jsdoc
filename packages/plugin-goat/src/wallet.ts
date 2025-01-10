import { WalletClientBase } from "@goat-sdk/core";
import { viem } from "@goat-sdk/wallet-viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mode } from "viem/chains";

// Add the chain you want to use, remember to update also
// the EVM_PROVIDER_URL to the correct one for the chain
export const chain = mode;

/**
 * Retrieves the wallet client using the provided function to get settings.
 * 
 * @param {Function} getSetting - The function to retrieve settings
 * @returns {Object} - The wallet client object
 */
export function getWalletClient(
    getSetting: (key: string) => string | undefined
) {
    const privateKey = getSetting("EVM_PRIVATE_KEY");
    if (!privateKey) return null;

    const provider = getSetting("EVM_PROVIDER_URL");
    if (!provider) throw new Error("EVM_PROVIDER_URL not configured");

    const wallet = createWalletClient({
        account: privateKeyToAccount(privateKey as `0x${string}`),
        chain: chain,
        transport: http(provider),
    });

    return viem(wallet);
}

/**
 * Retrieves wallet information from a provided WalletClientBase instance.
 * @param {WalletClientBase} walletClient - The wallet client instance to use for retrieving wallet information.
 * @returns {Object} An object with a `get` method that returns a Promise with the wallet address and balance in Ethereum.
 */
export function getWalletProvider(walletClient: WalletClientBase) {
    return {
        async get(): Promise<string | null> {
            try {
                const address = walletClient.getAddress();
                const balance = await walletClient.balanceOf(address);
                return `EVM Wallet Address: ${address}\nBalance: ${balance} ETH`;
            } catch (error) {
                console.error("Error in EVM wallet provider:", error);
                return null;
            }
        },
    };
}
