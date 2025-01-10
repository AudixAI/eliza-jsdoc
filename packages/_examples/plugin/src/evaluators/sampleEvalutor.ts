import {
    Evaluator,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

/**
 * Sample evaluator for checking important content in memory
 * @typedef {Object} Evaluator
 * @property {boolean} alwaysRun - Indicates if the evaluator should always run
 * @property {string} description - Description of the evaluator
 * @property {Array<string>} similes - Similes related to the evaluator
 * @property {Array<Object>} examples - Examples of the evaluator in action
 * @property {Function} handler - Asynchronous function for evaluating data in memory
 * @property {Function} validate - Asynchronous function for validating the evaluator
 * @property {string} name - Name of the evaluator
 */
export const sampleEvaluator: Evaluator = {
    alwaysRun: false,
    description: "Sample evaluator for checking important content in memory",
    similes: ["content checker", "memory evaluator"],
    examples: [
        {
            context: "Checking if memory contains important content",
            messages: [
                {
                    action: "evaluate",
                    input: "This is an important message",
                    output: {
                        score: 1,
                        reason: "Memory contains important content.",
                    },
                },
            ],
            outcome: "Memory should be evaluated as important",
        },
    ],
    handler: async (runtime: IAgentRuntime, memory: Memory, state: State) => {
        // Evaluation logic for the evaluator
        elizaLogger.log("Evaluating data in sampleEvaluator...");

        // Example evaluation logic
        if (memory.content && memory.content.includes("important")) {
            elizaLogger.log("Important content found in memory.");
            return {
                score: 1,
                reason: "Memory contains important content.",
            };
        } else {
            elizaLogger.log("No important content found in memory.");
            return {
                score: 0,
                reason: "Memory does not contain important content.",
            };
        }
    },
    name: "sampleEvaluator",
    validate: async (runtime: IAgentRuntime, memory: Memory, state: State) => {
        // Validation logic for the evaluator
        return true;
    },
};
