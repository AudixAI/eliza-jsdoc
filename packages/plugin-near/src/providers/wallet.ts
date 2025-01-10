import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";
import { KeyPair, keyStores, connect, Account, utils } from "near-api-js";
import BigNumber from "bignumber.js";
import { KeyPairString } from "near-api-js/lib/utils";
import NodeCache from "node-cache";

/**
 * Configuration object for NEAR Protocol provider.
 * @property {string} networkId - The network ID for NEAR Protocol (default: testnet).
 * @property {string} nodeUrl - The node URL for NEAR Protocol (default: testnet).
 * @property {string} walletUrl - The wallet URL for NEAR Protocol (default: testnet).
 * @property {string} helperUrl - The helper URL for NEAR Protocol (default: testnet).
 * @property {string} explorerUrl - The explorer URL for NEAR Protocol (default: testnet).
 * @property {number} MAX_RETRIES - The maximum number of retries for NEAR Protocol requests (default: 3).
 * @property {number} RETRY_DELAY - The delay time in milliseconds between retries (default: 2000).
 * @property {number} SLIPPAGE - The slippage value for NEAR Protocol transactions (default: 1).
 */
const PROVIDER_CONFIG = {
    networkId: process.env.NEAR_NETWORK || "testnet",
    nodeUrl:
        process.env.NEAR_RPC_URL ||
        `https://rpc.${process.env.NEAR_NETWORK || "testnet"}.near.org`,
    walletUrl: `https://${process.env.NEAR_NETWORK || "testnet"}.mynearwallet.com/`,
    helperUrl: `https://helper.${process.env.NEAR_NETWORK || "testnet"}.near.org`,
    explorerUrl: `https://${process.env.NEAR_NETWORK || "testnet"}.nearblocks.io`,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SLIPPAGE: process.env.NEAR_SLIPPAGE ? parseInt(process.env.NEAR_SLIPPAGE) : 1,
};

/**
 * Interface representing a NEAR Protocol token.
 * @typedef {Object} NearToken
 * @property {string} name - The name of the token.
 * @property {string} symbol - The symbol of the token.
 * @property {number} decimals - The number of decimal places the token uses.
 * @property {string} balance - The balance of the token.
 * @property {string} uiAmount - The amount of the token for display.
 * @property {string} priceUsd - The price of the token in USD.
 * @property {string} valueUsd - The total value of the token in USD.
 * @property {string} [valueNear] - The total value of the token in NEAR Protocol's native currency (optional).
 */
export interface NearToken {
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    uiAmount: string;
    priceUsd: string;
    valueUsd: string;
    valueNear?: string;
}

/**
 * Interface representing a wallet portfolio.
 * @typedef {Object} WalletPortfolio
 * @property {string} totalUsd - The total USD value in the portfolio.
 * @property {string} [totalNear] - The total NEAR value in the portfolio (optional).
 * @property {Array<NearToken>} tokens - An array of NearToken objects representing different tokens in the portfolio.
 */
interface WalletPortfolio {
    totalUsd: string;
    totalNear?: string;
    tokens: Array<NearToken>;
}

/**
 * WalletProvider class that implements the Provider interface.
 * Manages wallet functionality including fetching portfolio value,
 * connecting to NEAR wallet, and formatting portfolio information.
 */
export class WalletProvider implements Provider {
    private cache: NodeCache;
    private account: Account | null = null;
    private keyStore: keyStores.InMemoryKeyStore;
/**
 * Constructor for creating a new instance of the class.
 * 
 * @param {string} accountId - The ID of the account associated with the instance.
 */
    constructor(private accountId: string) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
        this.keyStore = new keyStores.InMemoryKeyStore();
    }

/**
 * Asynchronously gets the formatted portfolio from the wallet provider.
 * 
 * @param {IAgentRuntime} runtime - The agent runtime.
 * @param {Memory} _message - The memory message.
 * @param {State} [_state] - The optional state.
 * @returns {Promise<string | null>} The formatted portfolio or null if an error occurs.
 */
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            return await this.getFormattedPortfolio(runtime);
        } catch (error) {
            elizaLogger.error("Error in wallet provider:", error);
            return null;
        }
    }

/**
 * Connects to NEAR protocol using the provided runtime.
 * 
 * @param {IAgentRuntime} runtime - The runtime used to connect to NEAR protocol.
 * @returns {Promise<Account>} The NEAR account that is connected to.
 * @throws {Error} If NEAR wallet credentials are not configured.
 */
    public async connect(runtime: IAgentRuntime) {
        if (this.account) return this.account;

        const secretKey = runtime.getSetting("NEAR_WALLET_SECRET_KEY");
        const publicKey = runtime.getSetting("NEAR_WALLET_PUBLIC_KEY");

        if (!secretKey || !publicKey) {
            throw new Error("NEAR wallet credentials not configured");
        }

        // Create KeyPair from secret key
        const keyPair = KeyPair.fromString(secretKey as KeyPairString);

        // Set the key in the keystore
        await this.keyStore.setKey(
            PROVIDER_CONFIG.networkId,
            this.accountId,
            keyPair
        );

        const nearConnection = await connect({
            networkId: PROVIDER_CONFIG.networkId,
            keyStore: this.keyStore,
            nodeUrl: PROVIDER_CONFIG.nodeUrl,
            walletUrl: PROVIDER_CONFIG.walletUrl,
            helperUrl: PROVIDER_CONFIG.helperUrl,
        });

        this.account = await nearConnection.account(this.accountId);
        return this.account;
    }

/**
 * Fetches data from the specified URL with retry mechanism.
 * 
 * @param {string} url - The URL to fetch data from.
 * @param {RequestInit} [options={}] - The options for the fetch request.
 * @returns {Promise<any>} The data fetched from the URL.
 */
    private async fetchWithRetry(
        url: string,
        options: RequestInit = {}
    ): Promise<any> {
        let lastError: Error;

        for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                elizaLogger.error(`Attempt ${i + 1} failed:`, error);
                lastError = error as Error;
                if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
                    await new Promise((resolve) =>
                        setTimeout(
                            resolve,
                            PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i)
                        )
                    );
                }
            }
        }
        throw lastError!;
    }


/**
 * Asynchronously fetches the current value of the wallet portfolio.
 * If the value is already cached, it returns the cached value. Otherwise, it fetches the account balance, converts yoctoNEAR to NEAR, fetches the NEAR price in USD,
 * calculates the total USD value of the portfolio, and constructs a WalletPortfolio object with the total USD value, total NEAR balance, and detailed information about 
 * NEAR Protocol token holdings. The portfolio object is then set in the cache for future use.
 * 
 * @param {IAgentRuntime} runtime - The IAgentRuntime object for making blockchain queries.
 * @returns {Promise<WalletPortfolio>} A Promise that resolves to a WalletPortfolio object containing the total USD value, total NEAR balance, and detailed token holdings.
 * @throws {Error} If there is an error in fetching the portfolio value, an error is logged and rethrown.
 */
    
    async fetchPortfolioValue(
        runtime: IAgentRuntime
    ): Promise<WalletPortfolio> {
        try {
            const cacheKey = `portfolio-${this.accountId}`;
            const cachedValue = this.cache.get<WalletPortfolio>(cacheKey);

            if (cachedValue) {
                elizaLogger.log("Cache hit for fetchPortfolioValue");
                return cachedValue;
            }

            const account = await this.connect(runtime);
            const balance = await account.getAccountBalance();

            // Convert yoctoNEAR to NEAR
            const nearBalance = utils.format.formatNearAmount(
                balance.available
            );

            // Fetch NEAR price in USD
            const nearPrice = await this.fetchNearPrice();
            const valueUsd = new BigNumber(nearBalance).times(nearPrice);

            const portfolio: WalletPortfolio = {
                totalUsd: valueUsd.toString(),
                totalNear: nearBalance,
                tokens: [
                    {
                        name: "NEAR Protocol",
                        symbol: "NEAR",
                        decimals: 24,
                        balance: balance.available,
                        uiAmount: nearBalance,
                        priceUsd: nearPrice.toString(),
                        valueUsd: valueUsd.toString(),
                    },
                ],
            };

            this.cache.set(cacheKey, portfolio);
            return portfolio;
        } catch (error) {
            elizaLogger.error("Error fetching portfolio:", error);
            throw error;
        }
    }

/**
 * Fetches the current NEAR price from the Coingecko API.
 * If the price is not stored in the cache, it will make a request to the API
 * and save the price to the cache for future use.
 * 
 * @returns {Promise<number>} The current NEAR price in USD
 */
    private async fetchNearPrice(): Promise<number> {
        const cacheKey = "near-price";
        const cachedPrice = this.cache.get<number>(cacheKey);

        if (cachedPrice) {
            return cachedPrice;
        }

        try {
            const response = await this.fetchWithRetry(
                "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd"
            );
            const price = response.near.usd;
            this.cache.set(cacheKey, price);
            return price;
        } catch (error) {
            elizaLogger.error("Error fetching NEAR price:", error);
            return 0;
        }
    }

/**
 * Formats the portfolio information into a string for display.
 *
 * @param {IAgentRuntime} runtime - The runtime information of the agent.
 * @param {WalletPortfolio} portfolio - The portfolio data to be formatted.
 * @returns {string} The formatted portfolio information as a string.
 */
    formatPortfolio(
        runtime: IAgentRuntime,
        portfolio: WalletPortfolio
    ): string {
        let output = `${runtime.character.system}\n`;
        output += `Account ID: ${this.accountId}\n\n`;

        const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
        const totalNearFormatted = portfolio.totalNear;

        output += `Total Value: $${totalUsdFormatted} (${totalNearFormatted} NEAR)\n\n`;
        output += "Token Balances:\n";

        for (const token of portfolio.tokens) {
            output += `${token.name} (${token.symbol}): ${token.uiAmount} ($${new BigNumber(token.valueUsd).toFixed(2)})\n`;
        }

        output += "\nMarket Prices:\n";
        output += `NEAR: $${new BigNumber(portfolio.tokens[0].priceUsd).toFixed(2)}\n`;

        return output;
    }

/**
 * Asynchronously fetches the portfolio value for a given agent runtime, 
 * formats it using the runtime, and returns a formatted string. 
 * 
 * @param {IAgentRuntime} runtime - The agent runtime object.
 * @returns {Promise<string>} A promise that resolves to a formatted portfolio string
 */
    async getFormattedPortfolio(runtime: IAgentRuntime): Promise<string> {
        try {
            const portfolio = await this.fetchPortfolioValue(runtime);
            return this.formatPortfolio(runtime, portfolio);
        } catch (error) {
            elizaLogger.error("Error generating portfolio report:", error);
            return "Unable to fetch wallet information. Please try again later.";
        }
    }
}

/**
 * Wallet provider to retrieve formatted portfolio data from a specified NEAR account address.
 * @param {IAgentRuntime} runtime - The agent runtime interface.
 * @param {Memory} _message - The message for the agent.
 * @param {State} [_state] - The agent state (optional).
 * @returns {Promise<string | null>} The formatted portfolio data from the NEAR account address, or null if there is an error.
 */
const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        try {
            const accountId = runtime.getSetting("NEAR_ADDRESS");
            if (!accountId) {
                throw new Error("NEAR_ADDRESS not configured");
            }
            const provider = new WalletProvider(accountId);
            return await provider.getFormattedPortfolio(runtime);
        } catch (error) {
            elizaLogger.error("Error in wallet provider:", error);
            return null;
        }
    },
};

export { walletProvider };
