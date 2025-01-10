import {
    embed,
    MemoryManager,
    formatMessages,
    AgentRuntime as IAgentRuntime,
} from "@elizaos/core";
import type { Memory, Provider, State } from "@elizaos/core";
import { formatFacts } from "../evaluators/fact.ts";

/**
 * Retrieve key facts known by an agent based on recent messages and memories.
 * @param {IAgentRuntime} runtime - The agent runtime instance.
 * @param {Memory} message - The message memory object.
 * @param {State} [state] - Optional state object containing recentMessagesData and actorsData.
 * @returns {string} - Formatted key facts known by the agent.
 */
/**
 * Retrieves key facts known by the agent based on recent messages and stored memories.
 *
 * @param {IAgentRuntime} runtime - The agent runtime.
 * @param {Memory} message - The message memory.
 * @param {State} [state] - Optional state information.
 * @returns {string} - Formatted key facts known by the agent.
 */
const factsProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        const recentMessagesData = state?.recentMessagesData?.slice(-10);

        const recentMessages = formatMessages({
            messages: recentMessagesData,
            actors: state?.actorsData,
        });

        const _embedding = await embed(runtime, recentMessages);

        const memoryManager = new MemoryManager({
            runtime,
            tableName: "facts",
        });

        const relevantFacts = [];
        //  await memoryManager.searchMemoriesByEmbedding(
        //     embedding,
        //     {
        //         roomId: message.roomId,
        //         count: 10,
        //         agentId: runtime.agentId,
        //     }
        // );

        const recentFactsData = await memoryManager.getMemories({
            roomId: message.roomId,
            count: 10,
            start: 0,
            end: Date.now(),
        });

        // join the two and deduplicate
        const allFacts = [...relevantFacts, ...recentFactsData].filter(
            (fact, index, self) =>
                index === self.findIndex((t) => t.id === fact.id)
        );

        if (allFacts.length === 0) {
            return "";
        }

        const formattedFacts = formatFacts(allFacts);

        return "Key facts that {{agentName}} knows:\n{{formattedFacts}}"
            .replace("{{agentName}}", runtime.character.name)
            .replace("{{formattedFacts}}", formattedFacts);
    },
};

export { factsProvider };
