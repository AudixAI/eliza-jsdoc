import type { IAgentRuntime, Provider, Memory, State } from "@elizaos/core";
import { Provider as FuelProvider, Wallet, WalletUnlocked } from "fuels";

/**
 * Class representing a WalletProvider.
 */

export class WalletProvider {
    wallet: WalletUnlocked;

/**
 * Initializes a new instance of a wallet using the provided private key and FuelProvider.
 * 
 * @param {string} privateKey - The private key in hexadecimal format (e.g. '0x123456789...')
 * @param {FuelProvider} provider - The provider for interacting with the Fuel network
 */
    constructor(privateKey: `0x${string}`, provider: FuelProvider) {
        this.wallet = Wallet.fromPrivateKey(privateKey, provider);
    }

/**
 * Returns the address in B256 format from the wallet.
 * 
 * @returns {string} The B256 formatted address
 */
    getAddress(): string {
        return this.wallet.address.toB256();
    }

/**
 * Asynchronously retrieves the balance from the wallet and returns it in a formatted way.
 * @returns {string} The formatted balance value.
 */
    async getBalance() {
        const balance = await this.wallet.getBalance();
        return balance.format();
    }
}

/**
 * Initializes a wallet provider using the provided runtime object.
 * 
 * @param {IAgentRuntime} runtime - The runtime object used to access settings.
 * @returns {Promise<WalletProvider>} A Promise that resolves to a new instance of WalletProvider.
 * @throws {Error} If the FUEL_PRIVATE_KEY setting is missing.
 */
export const initWalletProvider = async (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("FUEL_PRIVATE_KEY");
    if (!privateKey) {
        throw new Error("FUEL_PRIVATE_KEY is missing");
    }
    const fuelProviderUrl =
        runtime.getSetting("FUEL_PROVIDER_URL") ||
        "https://mainnet.fuel.network/v1/graphql";

    const provider = await FuelProvider.create(fuelProviderUrl);
    return new WalletProvider(privateKey as `0x${string}`, provider);
};

export const fuelWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        const walletProvider = await initWalletProvider(runtime);
        const balance = await walletProvider.getBalance();
        return `Fuel Wallet Address: ${walletProvider.getAddress()}\nBalance: ${balance} ETH`;
    },
};
