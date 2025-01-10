import { num } from "starknet";
import { HolderData } from "../types/trustDB";

/**
 * Interface representing token metrics.
 * @typedef {Object} TokenMetrics
 * @property {bigint} liquidityUsd - The liquidity in USD.
 * @property {bigint} marketCapUsd - The market cap in USD.
 * @property {bigint} totalSupply - The total supply.
 * @property {number} ownerPercentage - The owner's percentage.
 * @property {number} creatorPercentage - The creator's percentage.
 * @property {number} top10HolderPercent - The top 10 holder's percentage.
 * @property {number} priceChange24hPercent - The price change in the last 24 hours.
 * @property {number} priceChange12hPercent - The price change in the last 12 hours.
 * @property {number} uniqueWallet24h - The number of unique wallets in the last 24 hours.
 * @property {bigint} volume24hUsd - The trading volume in the last 24 hours in USD.
 */
export interface TokenMetrics {
    liquidityUsd: bigint;
    marketCapUsd: bigint;
    totalSupply: bigint;
    ownerPercentage: number;
    creatorPercentage: number;
    top10HolderPercent: number;
    priceChange24hPercent: number;
    priceChange12hPercent: number;
    uniqueWallet24h: number;
    volume24hUsd: bigint;
}

/**
 * Interface representing trading thresholds for a token.
 * @typedef {Object} TradingThresholds
 * @property {number} [volume24hUsdThreshold] - The 24-hour volume threshold in USD.
 * @property {number} [priceChange24hPercentThreshold] - The 24-hour price change threshold in percentage.
 * @property {number} [priceChange12hPercentThreshold] - The 12-hour price change threshold in percentage.
 * @property {number} [top10HolderPercentThreshold] - The top 10 holder percentage threshold.
 * @property {number} [uniqueWallet24hThreshold] - The unique wallet 24-hour threshold.
 * @property {number} [minimumLiquidityUsd] - The minimum liquidity threshold in USD.
 * @property {number} [minimumMarketCapUsd] - The minimum market cap threshold in USD.
 */
export interface TradingThresholds {
    volume24hUsdThreshold?: number;
    priceChange24hPercentThreshold?: number;
    priceChange12hPercentThreshold?: number;
    top10HolderPercentThreshold?: number;
    uniqueWallet24hThreshold?: number;
    minimumLiquidityUsd?: number;
    minimumMarketCapUsd?: number;
}

/**
 * Evaluates whether a token should be traded based on specified metrics and thresholds.
 * @param {TokenMetrics} metrics - The metrics of the token being evaluated.
 * @param {TradingThresholds} thresholds - The thresholds for trading conditions (optional).
 * @returns {{ shouldTrade: boolean; reasons: string[] }} Object with the evaluation results.
 */
export function evaluateTokenTrading(
    metrics: TokenMetrics,
    thresholds: TradingThresholds = {}
): { shouldTrade: boolean; reasons: string[] } {
    // Default thresholds
    const {
        volume24hUsdThreshold = 1000,
        priceChange24hPercentThreshold = 10,
        priceChange12hPercentThreshold = 5,
        top10HolderPercentThreshold = 0.05,
        uniqueWallet24hThreshold = 100,
        minimumLiquidityUsd = 1000,
        minimumMarketCapUsd = 100000,
    } = thresholds;

    const reasons: string[] = [];

    // Evaluate each condition
    if (metrics.top10HolderPercent >= top10HolderPercentThreshold) {
        reasons.push("High concentration in top 10 holders");
    }

    if (metrics.volume24hUsd >= BigInt(volume24hUsdThreshold)) {
        reasons.push("High 24h trading volume");
    }

    if (metrics.priceChange24hPercent >= priceChange24hPercentThreshold) {
        reasons.push("Significant 24h price change");
    }

    if (metrics.priceChange12hPercent >= priceChange12hPercentThreshold) {
        reasons.push("Significant 12h price change");
    }

    if (metrics.uniqueWallet24h >= uniqueWallet24hThreshold) {
        reasons.push("High number of unique wallets");
    }

    if (metrics.liquidityUsd < BigInt(minimumLiquidityUsd)) {
        reasons.push("Low liquidity");
    }

    if (metrics.marketCapUsd < BigInt(minimumMarketCapUsd)) {
        reasons.push("Low market cap");
    }

    return {
        shouldTrade: reasons.length > 0,
        reasons,
    };
}

/**
 * Interface for defining parameters to analyze holders.
 * @property {HolderData[]} holders - An array of HolderData objects.
 * @property {string} ownerBalance - The balance of the owner.
 * @property {string} creatorBalance - The balance of the creator.
 * @property {number} [thresholdPercentage] - Optional threshold percentage for analysis.
 */
export interface HolderAnalysisParams {
    holders: HolderData[];
    ownerBalance: string;
    creatorBalance: string;
    thresholdPercentage?: number;
}

/**
 * Interface representing the result of holder analysis.
 * @typedef {Object} HolderAnalysisResult
 * @property {number} count - The number of holders.
 * @property {Array} holders - An array containing objects with address and percentage properties.
 * @property {string} holders[].address - The address of the holder.
 * @property {number} holders[].percentage - The percentage of total supply held by the holder.
 * @property {bigint} totalSupply - The total supply of the asset.
 */
export interface HolderAnalysisResult {
    count: number;
    holders: Array<{
        address: string;
        percentage: number;
    }>;
    totalSupply: bigint;
}

/**
 * Analyzes the high supply holders based on the specified parameters.
 *
 * @param {HolderAnalysisParams} params - The parameters for analyzing the high supply holders.
 * @returns {HolderAnalysisResult} The analysis result containing the count of high supply holders, their details, and the total supply.
 */
export function analyzeHighSupplyHolders(
    params: HolderAnalysisParams
): HolderAnalysisResult {
    try {
        const {
            holders,
            ownerBalance,
            creatorBalance,
            thresholdPercentage = 0.02, // Default threshold of 2%
        } = params;

        const ownerBalanceBigInt = num.toBigInt(ownerBalance);
        const totalSupply = ownerBalanceBigInt + num.toBigInt(creatorBalance);

        const highSupplyHolders = holders
            .map((holder) => {
                const balance = num.toBigInt(holder.balance);
                const percentage = Number(balance) / Number(totalSupply);
                return {
                    address: holder.address,
                    percentage,
                };
            })
            .filter((holder) => holder.percentage > thresholdPercentage);

        return {
            count: highSupplyHolders.length,
            holders: highSupplyHolders,
            totalSupply,
        };
    } catch (error) {
        console.error("Error analyzing high supply holders:", error);
        return {
            count: 0,
            holders: [],
            totalSupply: BigInt(0),
        };
    }
}
