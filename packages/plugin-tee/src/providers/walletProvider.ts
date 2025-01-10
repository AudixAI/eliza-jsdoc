/* This is an example of how WalletProvider can use DeriveKeyProvider to generate a Solana Keypair */
import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import NodeCache from "node-cache";
import { DeriveKeyProvider } from "./deriveKeyProvider";
import { RemoteAttestationQuote } from "../types/tee";
// Provider configuration
const PROVIDER_CONFIG = {
    BIRDEYE_API: "https://public-api.birdeye.so",
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    DEFAULT_RPC: "https://api.mainnet-beta.solana.com",
    TOKEN_ADDRESSES: {
        SOL: "So11111111111111111111111111111111111111112",
        BTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
        ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    },
};

/**
 * Interface representing an Item.
 * @typedef {Object} Item
 * @property {string} name - The name of the item.
 * @property {string} address - The address of the item.
 * @property {string} symbol - The symbol of the item.
 * @property {number} decimals - The decimals of the item.
 * @property {string} balance - The balance of the item.
 * @property {string} uiAmount - The UI amount of the item.
 * @property {string} priceUsd - The price in USD of the item.
 * @property {string} valueUsd - The value in USD of the item.
 * @property {string} [valueSol] - Optional value in Sol of the item.
 */
export interface Item {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    balance: string;
    uiAmount: string;
    priceUsd: string;
    valueUsd: string;
    valueSol?: string;
}

/**
 * Interface representing a Wallet Portfolio.
 * @typedef { Object } WalletPortfolio
 * @property { string } totalUsd - The total amount in USD.
 * @property { string } [totalSol] - The total amount in SOL (optional).
 * @property {Array<Item>} items - An array of items in the portfolio.
 */
interface WalletPortfolio {
    totalUsd: string;
    totalSol?: string;
    items: Array<Item>;
}

/**
 * Interface for storing price data for various items.
 * @typedef {Object} _BirdEyePriceData
 * @property {Object.<string, {number, number}>} data - The data object containing price information for items.
 * @property {number} data.price - The current price of the item.
 * @property {number} data.priceChange24h - The price change of the item in the last 24 hours.
 */
interface _BirdEyePriceData {
    data: {
        [key: string]: {
            price: number;
            priceChange24h: number;
        };
    };
}

/**
 * Interface representing the prices of different cryptocurrencies.
 * @typedef {Object} Prices
 * @property {Object} solana - Object containing the price of Solana in USD.
 * @property {string} solana.usd - The price of Solana in USD.
 * @property {Object} bitcoin - Object containing the price of Bitcoin in USD.
 * @property {string} bitcoin.usd - The price of Bitcoin in USD.
 * @property {Object} ethereum - Object containing the price of Ethereum in USD.
 * @property {string} ethereum.usd - The price of Ethereum in USD.
 */
interface Prices {
    solana: { usd: string };
    bitcoin: { usd: string };
    ethereum: { usd: string };
}

/**
 * WalletProvider class representing a provider for fetching wallet and portfolio data
 * * @class
 */
export class WalletProvider {
    private cache: NodeCache;

/**
 * Constructor for creating a new instance of the class.
 * @param {Connection} connection - The connection object.
 * @param {PublicKey} walletPublicKey - The public key of the wallet.
 */
    constructor(
        private connection: Connection,
        private walletPublicKey: PublicKey
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
    }

/**
 * Makes a fetch request with retries in case of failure.
 * @param {any} runtime - The runtime object.
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} [options={}] - The options for the fetch request.
 * @returns {Promise<any>} The data fetched from the URL.
 */
    private async fetchWithRetry(
        runtime,
        url: string,
        options: RequestInit = {}
    ): Promise<any> {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            try {
                const apiKey = runtime.getSetting("BIRDEYE_API_KEY");
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        Accept: "application/json",
                        "x-chain": "solana",
                        "X-API-KEY": apiKey || "",
                        ...options.headers,
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `HTTP error! status: ${response.status}, message: ${errorText}`
                    );
                }

                const data = await response.json();
                return data;
            } catch (error) {
                elizaLogger.error(`Attempt ${i + 1} failed:`, error);
                lastError = error;
                if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
                    const delay = PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        elizaLogger.error(
            "All attempts failed. Throwing the last error:",
            lastError
        );
        throw lastError;
    }

/**
 * Fetches the portfolio value for the wallet.
 * 
 * @param {Runtime} runtime - The runtime environment.
 * @returns {Promise<WalletPortfolio>} The wallet portfolio value.
 */
    async fetchPortfolioValue(runtime): Promise<WalletPortfolio> {
        try {
            const cacheKey = `portfolio-${this.walletPublicKey.toBase58()}`;
            const cachedValue = this.cache.get<WalletPortfolio>(cacheKey);

            if (cachedValue) {
                elizaLogger.log("Cache hit for fetchPortfolioValue");
                return cachedValue;
            }
            elizaLogger.log("Cache miss for fetchPortfolioValue");

            const walletData = await this.fetchWithRetry(
                runtime,
                `${PROVIDER_CONFIG.BIRDEYE_API}/v1/wallet/token_list?wallet=${this.walletPublicKey.toBase58()}`
            );

            if (!walletData?.success || !walletData?.data) {
                elizaLogger.error("No portfolio data available", walletData);
                throw new Error("No portfolio data available");
            }

            const data = walletData.data;
            const totalUsd = new BigNumber(data.totalUsd.toString());
            const prices = await this.fetchPrices(runtime);
            const solPriceInUSD = new BigNumber(prices.solana.usd.toString());

            const items = data.items.map((item: any) => ({
                ...item,
                valueSol: new BigNumber(item.valueUsd || 0)
                    .div(solPriceInUSD)
                    .toFixed(6),
                name: item.name || "Unknown",
                symbol: item.symbol || "Unknown",
                priceUsd: item.priceUsd || "0",
                valueUsd: item.valueUsd || "0",
            }));

            const totalSol = totalUsd.div(solPriceInUSD);
            const portfolio = {
                totalUsd: totalUsd.toString(),
                totalSol: totalSol.toFixed(6),
                items: items.sort((a, b) =>
                    new BigNumber(b.valueUsd)
                        .minus(new BigNumber(a.valueUsd))
                        .toNumber()
                ),
            };
            this.cache.set(cacheKey, portfolio);
            return portfolio;
        } catch (error) {
            elizaLogger.error("Error fetching portfolio:", error);
            throw error;
        }
    }

/**
 * Fetches the current prices of SOL, BTC, and ETH using the BIRDEYE API. 
 *
 * @param {any} runtime - The runtime environment information.
 * @returns {Promise<Prices>} A Promise that resolves to an object containing the prices of SOL, BTC, and ETH.
 * @throws {Error} If there is an error fetching the prices.
 */
    async fetchPrices(runtime): Promise<Prices> {
        try {
            const cacheKey = "prices";
            const cachedValue = this.cache.get<Prices>(cacheKey);

            if (cachedValue) {
                elizaLogger.log("Cache hit for fetchPrices");
                return cachedValue;
            }
            elizaLogger.log("Cache miss for fetchPrices");

            const { SOL, BTC, ETH } = PROVIDER_CONFIG.TOKEN_ADDRESSES;
            const tokens = [SOL, BTC, ETH];
            const prices: Prices = {
                solana: { usd: "0" },
                bitcoin: { usd: "0" },
                ethereum: { usd: "0" },
            };

            for (const token of tokens) {
                const response = await this.fetchWithRetry(
                    runtime,
                    `${PROVIDER_CONFIG.BIRDEYE_API}/defi/price?address=${token}`,
                    {
                        headers: {
                            "x-chain": "solana",
                        },
                    }
                );

                if (response?.data?.value) {
                    const price = response.data.value.toString();
                    prices[
                        token === SOL
                            ? "solana"
                            : token === BTC
                              ? "bitcoin"
                              : "ethereum"
                    ].usd = price;
                } else {
                    elizaLogger.warn(
                        `No price data available for token: ${token}`
                    );
                }
            }

            this.cache.set(cacheKey, prices);
            return prices;
        } catch (error) {
            elizaLogger.error("Error fetching prices:", error);
            throw error;
        }
    }

/**
 * Formats the portfolio information into a string for display.
 * 
 * @param {Runtime} runtime - The runtime environment.
 * @param {WalletPortfolio} portfolio - The user's wallet portfolio data.
 * @param {Prices} prices - The current market prices for various cryptocurrencies.
 * @returns {string} Formatted portfolio information as a string.
 */
    formatPortfolio(
        runtime,
        portfolio: WalletPortfolio,
        prices: Prices
    ): string {
        let output = `${runtime.character.description}\n`;
        output += `Wallet Address: ${this.walletPublicKey.toBase58()}\n\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalSolFormatted = portfolio.totalSol;

        output += `Total Value: $${totalUsdFormatted} (${totalSolFormatted} SOL)\n\n`;
        output += "Token Balances:\n";

        const nonZeroItems = portfolio.items.filter((item) =>
            new BigNumber(item.uiAmount).isGreaterThan(0)
        );

        if (nonZeroItems.length === 0) {
            output += "No tokens found with non-zero balance\n";
        } else {
            for (const item of nonZeroItems) {
                const valueUsd = new BigNumber(item.valueUsd).toFixed(2);
                output += `${item.name} (${item.symbol}): ${new BigNumber(
                    item.uiAmount
                ).toFixed(6)} ($${valueUsd} | ${item.valueSol} SOL)\n`;
            }
        }

        output += "\nMarket Prices:\n";
        output += `SOL: $${new BigNumber(prices.solana.usd).toFixed(2)}\n`;
        output += `BTC: $${new BigNumber(prices.bitcoin.usd).toFixed(2)}\n`;
        output += `ETH: $${new BigNumber(prices.ethereum.usd).toFixed(2)}\n`;

        return output;
    }

/**
 * Asynchronously retrieves portfolio information and formats it for display.
 * @param {Runtime} runtime The runtime object containing the necessary information.
 * @returns {Promise<string>} The formatted portfolio information.
 */
    async getFormattedPortfolio(runtime): Promise<string> {
        try {
            const [portfolio, prices] = await Promise.all([
                this.fetchPortfolioValue(runtime),
                this.fetchPrices(runtime),
            ]);

            return this.formatPortfolio(runtime, portfolio, prices);
        } catch (error) {
            elizaLogger.error("Error generating portfolio report:", error);
            return "Unable to fetch wallet information. Please try again later.";
        }
    }
}

/**
 * Function to retrieve wallet information asynchronously.
 *
 * @param {IAgentRuntime} runtime - The agent runtime object.
 * @param {Memory} _message - The memory object (not used in this function).
 * @param {State} _state - The state object (optional).
 * @returns {Promise<string>} The formatted portfolio information from the wallet provider.
 */
const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string> => {
        const agentId = runtime.agentId;
        const teeMode = runtime.getSetting("TEE_MODE");
        const deriveKeyProvider = new DeriveKeyProvider(teeMode);
        try {
            // Validate wallet configuration
            if (!runtime.getSetting("WALLET_SECRET_SALT")) {
                elizaLogger.error(
                    "Wallet secret salt is not configured in settings"
                );
                return "";
            }

            let publicKey: PublicKey;
            try {
                const derivedKeyPair: {
                    keypair: Keypair;
                    attestation: RemoteAttestationQuote;
                } = await deriveKeyProvider.deriveEd25519Keypair(
                    "/",
                    runtime.getSetting("WALLET_SECRET_SALT"),
                    agentId
                );
                publicKey = derivedKeyPair.keypair.publicKey;
                elizaLogger.log("Wallet Public Key: ", publicKey.toBase58());
            } catch (error) {
                elizaLogger.error("Error creating PublicKey:", error);
                return "";
            }

            const connection = new Connection(PROVIDER_CONFIG.DEFAULT_RPC);
            const provider = new WalletProvider(connection, publicKey);

            const porfolio = await provider.getFormattedPortfolio(runtime);
            return porfolio;
        } catch (error) {
            elizaLogger.error("Error in wallet provider:", error.message);
            return `Failed to fetch wallet information: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    },
};

// Module exports
export { walletProvider };
