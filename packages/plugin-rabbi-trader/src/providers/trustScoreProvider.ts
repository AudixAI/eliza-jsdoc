import { elizaLogger } from "@elizaos/core";
import { TokenProvider } from "./token";
import { ProcessedTokenData } from "../types/token";

/**
 * TrustScoreProvider class responsible for calculating trust scores and evaluating tokens.
 */
 
export class TrustScoreProvider {
    private tokenProviders: Map<string, TokenProvider> = new Map();

/**
 * Get the TokenProvider for the specified token address. If the TokenProvider does not exist for the address, it will be created and stored for future reference.
 * @param {string} tokenAddress - The address of the token for which to get the TokenProvider
 * @returns {TokenProvider} The TokenProvider instance for the specified token address
 */
    getTokenProvider(tokenAddress: string): TokenProvider {
        if (!this.tokenProviders.has(tokenAddress)) {
            this.tokenProviders.set(tokenAddress, new TokenProvider(tokenAddress));
        }
        return this.tokenProviders.get(tokenAddress)!;
    }

/**
 * Calculates the trust score based on liquidity, volume, and market cap data of a token.
 * @param {ProcessedTokenData} tokenData - The processed token data containing information needed for the calculation.
 * @returns {Promise<number>} - The trust score calculated based on the weighted factors.
 */
    async calculateTrustScore(tokenData: ProcessedTokenData): Promise<number> {
        const pair = tokenData.dexScreenerData.pairs[0];
        const {
            liquidity,
            volume,
            marketCap
        } = pair;

        // Weight factors
        const LIQUIDITY_WEIGHT = 0.4;
        const VOLUME_WEIGHT = 0.4;
        const MCAP_WEIGHT = 0.2;

        // Calculate component scores
        const liquidityScore = Math.min(liquidity.usd / 100000, 1) * LIQUIDITY_WEIGHT;
        const volumeScore = Math.min(volume.h24 / 50000, 1) * VOLUME_WEIGHT;
        const mcapScore = Math.min(marketCap / 1000000, 1) * MCAP_WEIGHT;

        return liquidityScore + volumeScore + mcapScore;
    }

/**
 * Asynchronously evaluates the trust score, risk level, trading advice, and reason for a given token address.
 * 
 * @param {string} tokenAddress - The address of the token to evaluate.
 * @returns {Promise<{
 *  trustScore: number;
 *  riskLevel: "LOW" | "MEDIUM" | "HIGH";
 *  tradingAdvice: "BUY" | "SELL" | "HOLD";
 *  reason: string;
 * }>} - Object containing trust score, risk level, trading advice, and reason.
 * @throws {Error} If trust evaluation fails.
 */
    async evaluateToken(tokenAddress: string): Promise<{
        trustScore: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        tradingAdvice: "BUY" | "SELL" | "HOLD";
        reason: string;
    }> {
        try {
            const provider = this.getTokenProvider(tokenAddress);
            const tokenData = await provider.getProcessedTokenData();
            const trustScore = await this.calculateTrustScore(tokenData);
            const pair = tokenData.dexScreenerData.pairs[0];

            // Risk assessment
            const riskLevel = trustScore > 0.7 ? "LOW" :
                            trustScore > 0.4 ? "MEDIUM" : "HIGH";

            // Trading signals
            let tradingAdvice: "BUY" | "SELL" | "HOLD" = "HOLD";
            let reason = "Market conditions stable";

            if (pair.priceChange.h24 > 5 && trustScore > 0.4) {
                tradingAdvice = "BUY";
                reason = "Strong upward momentum with good trust score";
            } else if (pair.priceChange.h24 < -10 || trustScore < 0.3) {
                tradingAdvice = "SELL";
                reason = "Deteriorating conditions or low trust score";
            }

            return { trustScore, riskLevel, tradingAdvice, reason };
        } catch (error) {
            elizaLogger.error(`Trust evaluation failed: ${error}`);
            throw error;
        }
    }
}
