import { IAgentRuntime, type Relationship, type UUID } from "./types.ts";

/**
 * Creates a relationship between two users.
 * 
 * @param {Object} params - The parameters for creating the relationship.
 * @param {IAgentRuntime} params.runtime - The runtime environment.
 * @param {UUID} params.userA - The User A UUID.
 * @param {UUID} params.userB - The User B UUID.
 * 
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the relationship was successfully created.
 */
export async function createRelationship({
    runtime,
    userA,
    userB,
}: {
    runtime: IAgentRuntime;
    userA: UUID;
    userB: UUID;
}): Promise<boolean> {
    return runtime.databaseAdapter.createRelationship({
        userA,
        userB,
    });
}

/**
 * Async function to retrieve a relationship between two users.
 * @param {Object} params - The parameters for retrieving the relationship.
 * @param {IAgentRuntime} params.runtime - The runtime object for the agent.
 * @param {UUID} params.userA - The UUID of user A.
 * @param {UUID} params.userB - The UUID of user B.
 * @returns {Promise} The relationship between userA and userB.
 */
export async function getRelationship({
    runtime,
    userA,
    userB,
}: {
    runtime: IAgentRuntime;
    userA: UUID;
    userB: UUID;
}) {
    return runtime.databaseAdapter.getRelationship({
        userA,
        userB,
    });
}

/**
 * Get relationships for a given user ID from the database using the provided Agent Runtime.
 * @async
 * @param {Object} params - The parameters for getting relationships.
 * @param {IAgentRuntime} params.runtime - The Agent Runtime used to interact with the database.
 * @param {UUID} params.userId - The ID of the user whose relationships are being retrieved.
 * @returns {Promise} A promise that resolves with the relationships retrieved from the database.
 */
export async function getRelationships({
    runtime,
    userId,
}: {
    runtime: IAgentRuntime;
    userId: UUID;
}) {
    return runtime.databaseAdapter.getRelationships({ userId });
}

/**
 * Formats the relationships of a user by retrieving the relationships from the database
 * and returning an array of the formatted relationships.
 * 
 * @param {Object} params - The parameters for formatting relationships.
 * @param {IAgentRuntime} params.runtime - The runtime object for accessing database.
 * @param {UUID} params.userId - The ID of the user whose relationships are to be formatted.
 * @returns {Promise<Array<UUID>>} A promise that resolves to an array of user IDs representing the formatted relationships.
 */
export async function formatRelationships({
    runtime,
    userId,
}: {
    runtime: IAgentRuntime;
    userId: UUID;
}) {
    const relationships = await getRelationships({ runtime, userId });

    const formattedRelationships = relationships.map(
        (relationship: Relationship) => {
            const { userA, userB } = relationship;

            if (userA === userId) {
                return userB;
            }

            return userA;
        }
    );

    return formattedRelationships;
}
