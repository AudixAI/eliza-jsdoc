import { elizaLogger } from "@elizaos/core";
import { TokenProvider } from "../providers/token";
import { TrustScoreProvider } from "../providers/trustScoreProvider";

/**
 * Class representing a Simulation Service for trading simulation.
 */
 
export class SimulationService {
    private trustScoreProvider: TrustScoreProvider;

/**
 * Constructor for the class.
 * Initializes a new TrustScoreProvider instance and assigns it to the trustScoreProvider property.
 */
    constructor() {
        this.trustScoreProvider = new TrustScoreProvider();
    }

/**
 * Simulate a trade for a given token with a specific amount, considering trust score, liquidity, and safety parameters.
 *
 * @param {string} tokenAddress The address of the token to be traded.
 * @param {number} amount The amount of the token to be traded.
 * @returns {Promise<{
 *   expectedPrice: number;
 *   priceImpact: number;
 *   recommendedAction: "EXECUTE" | "ABORT";
 *   reason: string;
 * }>} An object containing the expected price, price impact, recommended action, and reason for the trade simulation.
 * @throws {Error} If the trade simulation fails.
 */
    async simulateTrade(
        tokenAddress: string,
        amount: number
    ): Promise<{
        expectedPrice: number;
        priceImpact: number;
        recommendedAction: "EXECUTE" | "ABORT";
        reason: string;
    }> {
        try {
            const evaluation =
                await this.trustScoreProvider.evaluateToken(tokenAddress);
            const tokenProvider = new TokenProvider(tokenAddress);
            const tokenData = await tokenProvider.getProcessedTokenData();

            // Get liquidity from DexScreener data
            const liquidity =
                tokenData.dexScreenerData.pairs[0]?.liquidity?.usd || 0;
            const priceImpact = (amount / liquidity) * 100;

            let recommendedAction: "EXECUTE" | "ABORT" = "ABORT";
            let reason = "Default safety check failed";

            if (evaluation.trustScore > 0.4 && priceImpact < 1) {
                recommendedAction = "EXECUTE";
                reason = "Trade meets safety parameters";
            }

            return {
                expectedPrice: tokenData.tradeData.price,
                priceImpact,
                recommendedAction,
                reason,
            };
        } catch (error) {
            elizaLogger.error("Trade simulation failed:", error);
            throw error;
        }
    }
}
