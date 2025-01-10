import { elizaLogger, IAgentRuntime } from "@elizaos/core";
import { Fraction, Percent } from "@uniswap/sdk-core";
import { Account, Contract, RpcProvider } from "starknet";

/**
 * Get the balance of a token for a given StarkNet runtime and token address.
 * 
 * @param {IAgentRuntime} runtime - The StarkNet runtime to interact with.
 * @param {string} tokenAddress - The address of the token contract.
 * @returns {Promise<number>} The balance of the token at the specified address.
 */
export const getTokenBalance = async (
    runtime: IAgentRuntime,
    tokenAddress: string
) => {
    const provider = getStarknetProvider(runtime);

    const { abi: tokenAbi } = await provider.getClassAt(tokenAddress);
    if (tokenAbi === undefined) {
        throw new Error("no abi.");
    }

    const tokenContract = new Contract(tokenAbi, tokenAddress, provider);

    tokenContract.connect(getStarknetAccount(runtime));

    return await tokenContract.balanceOf(tokenAddress);
};

export const getStarknetProvider = (runtime: IAgentRuntime) => {
    return new RpcProvider({
        nodeUrl: runtime.getSetting("STARKNET_RPC_URL"),
    });
};

export const getStarknetAccount = (runtime: IAgentRuntime) => {
    return new Account(
        getStarknetProvider(runtime),
        runtime.getSetting("STARKNET_ADDRESS"),
        runtime.getSetting("STARKNET_PRIVATE_KEY")
    );
};

export const getPercent = (amount: string | number, decimals: number) => {
    return new Percent(amount, decimals);
};

export const parseFormatedAmount = (amount: string) => amount.replace(/,/g, "");

export const PERCENTAGE_INPUT_PRECISION = 2;

export const parseFormatedPercentage = (percent: string) =>
    new Percent(
        +percent * 10 ** PERCENTAGE_INPUT_PRECISION,
        100 * 10 ** PERCENTAGE_INPUT_PRECISION
    );

/**
 * Interface for defining options for parsing currency amounts.
 * @property {number} fixed - The number of decimal places to round the currency amount to.
 * @property {number} [significant] - The number of significant digits to include in the currency amount.
 */
interface ParseCurrencyAmountOptions {
    fixed: number;
    significant?: number;
}

export const formatCurrenyAmount = (
    amount: Fraction,
    { fixed, significant = 1 }: ParseCurrencyAmountOptions
) => {
    const fixedAmount = amount.toFixed(fixed);
    const significantAmount = amount.toSignificant(significant);

    if (+significantAmount > +fixedAmount) return significantAmount;
    else return +fixedAmount.toString();
};

export const formatPercentage = (percentage: Percent) => {
    const formatedPercentage = +percentage.toFixed(2);
    const exact = percentage.equalTo(
        new Percent(Math.round(formatedPercentage * 100), 10000)
    );

    return `${exact ? "" : "~"}${formatedPercentage}%`;
};

/**
 * Represents a configuration object for retry logic.
 * @typedef {object} RetryConfig
 * @property {number} [maxRetries] - The maximum number of retry attempts.
 * @property {number} [delay] - The initial delay before the first retry attempt.
 * @property {number} [maxDelay] - The maximum delay between retry attempts.
 * @property {function} [backoff] - The custom backoff function to calculate the delay between retry attempts.
 */
export type RetryConfig = {
    maxRetries?: number;
    delay?: number;
    maxDelay?: number;
    backoff?: (retryCount: number, delay: number, maxDelay: number) => number;
};

/**
 * Fetch data from a specified URL with retry mechanism
 * 
 * @template T - The type of data to be returned
 * @param {string} url - The URL to fetch data from
 * @param {RequestInit} [options] - The options to be used in the fetch request
 * @param {RetryConfig} [config] - The configuration object for retry behavior
 * @returns {Promise<T>} - A promise that resolves with the fetched data
 */
export async function fetchWithRetry<T>(
    url: string,
    options?: RequestInit,
    config: RetryConfig = {}
): Promise<T> {
    const {
        maxRetries = 3,
        delay = 1000,
        maxDelay = 10000,
        backoff = (retryCount, baseDelay, maxDelay) =>
            Math.min(baseDelay * Math.pow(2, retryCount), maxDelay),
    } = config;

    let lastError: Error | null = null;

    for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(
                    `Coingecko API HTTP status: ${response.status}`
                );
            }

            return await response.json();
        } catch (error) {
            elizaLogger.debug(`Error fetching ${url}:`, error);
            lastError = error as Error;

            if (retryCount === maxRetries) break;

            await new Promise((resolve) =>
                setTimeout(resolve, backoff(retryCount, delay, maxDelay))
            );
            elizaLogger.debug(`Retry #${retryCount + 1} to fetch ${url}...`);
        }
    }

    throw lastError;
}
