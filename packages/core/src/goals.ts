import {
    IAgentRuntime,
    type Goal,
    type Objective,
    type UUID,
} from "./types.ts";

/**
 * Retrieves goals for a specific room and user from the database.
 * @async
 * @param {Object} param Object containing runtime, roomId, userId, onlyInProgress, and count properties
 * @param {IAgentRuntime} param.runtime The agent runtime
 * @param {UUID} param.roomId The ID of the room
 * @param {UUID} [param.userId] The ID of the user (optional)
 * @param {boolean} [param.onlyInProgress=true] Flag indicating whether only in-progress goals should be fetched
 * @param {number} [param.count=5] The number of goals to retrieve
 * @returns {Promise<Goal[]>} A promise that resolves to an array of goals
 */
export const getGoals = async ({
    runtime,
    roomId,
    userId,
    onlyInProgress = true,
    count = 5,
}: {
    runtime: IAgentRuntime;
    roomId: UUID;
    userId?: UUID;
    onlyInProgress?: boolean;
    count?: number;
}) => {
    return runtime.databaseAdapter.getGoals({
        agentId: runtime.agentId,
        roomId,
        userId,
        onlyInProgress,
        count,
    });
};

/**
 * Formats an array of goals as a string.
 * @param {Object} data - The goals data.
 * @param {Goal[]} data.goals - The array of Goal objects to format.
 * @returns {string} The formatted goals as a string.
 */
export const formatGoalsAsString = ({ goals }: { goals: Goal[] }) => {
    const goalStrings = goals.map((goal: Goal) => {
        const header = `Goal: ${goal.name}\nid: ${goal.id}`;
        const objectives =
            "Objectives:\n" +
            goal.objectives
                .map((objective: Objective) => {
                    return `- ${objective.completed ? "[x]" : "[ ]"} ${objective.description} ${objective.completed ? " (DONE)" : " (IN PROGRESS)"}`;
                })
                .join("\n");
        return `${header}\n${objectives}`;
    });
    return goalStrings.join("\n");
};

export const updateGoal = async ({
    runtime,
    goal,
}: {
    runtime: IAgentRuntime;
    goal: Goal;
}) => {
    return runtime.databaseAdapter.updateGoal(goal);
};

export const createGoal = async ({
    runtime,
    goal,
}: {
    runtime: IAgentRuntime;
    goal: Goal;
}) => {
    return runtime.databaseAdapter.createGoal(goal);
};
