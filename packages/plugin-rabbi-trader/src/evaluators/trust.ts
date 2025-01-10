import { IAgentRuntime, Memory, Evaluator, elizaLogger } from "@elizaos/core";
import { TrustScoreProvider } from "../providers/trustScoreProvider";

/**
 * Trust evaluator module.
 *
 * @type {Evaluator}
 * @property {string} name - The name of the evaluator.
 * @property {Array} similes - The similes associated with the evaluator.
 * @property {Array} examples - Examples of the evaluator in use.
 * @property {string} description - A brief description of the evaluator's purpose.
 * @property {Function} validate - Asynchronous function that validates the evaluator.
 * @property {Function} handler - Asynchronous function that handles trust score evaluation and trading signals.
 */
export const trustEvaluator: Evaluator = {
  name: "EVALUATE_TRUST",
  similes: [],
  examples: [],
  description: "Evaluates token trust scores and trading signals",
  validate: async () => true,
  handler: async (runtime: IAgentRuntime, message: Memory) => {
    const trustScoreProvider = new TrustScoreProvider();
    const tokenAddress = message.content?.tokenAddress;

    if (!tokenAddress) {
      return false;
    }

    try {
      const evaluation = await trustScoreProvider.evaluateToken(tokenAddress);

      elizaLogger.log("Trust evaluation:", {
        tokenAddress,
        ...evaluation,
      });

      return true;
    } catch (error) {
      elizaLogger.error("Trust evaluation failed:", error);
      return false;
    }
  },
};
