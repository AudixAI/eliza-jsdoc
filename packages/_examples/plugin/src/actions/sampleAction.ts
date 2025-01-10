import {
    Action,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObject,
    ModelClass,
    elizaLogger,
} from "@elizaos/core";

import { CreateResourceSchema, isCreateResourceContent } from "../types";

import { createResourceTemplate } from "../templates";

/**
 * Represents an action to create a new resource with specified details.
 * @type {Action}
 * @property {string} name - The name of the action ("CREATE_RESOURCE").
 * @property {string} description - The description of the action.
 * @property {Function} validate - Asynchronous function to validate if the API key is present in the runtime.
 * @property {Function} handler - Asynchronous function to handle the creation of a new resource.
 * @property {Array<Array<{user: string, content: {text: string}}>} examples - Array of example interactions for creating a resource.
 */
export const createResourceAction: Action = {
    name: "CREATE_RESOURCE",
    description: "Create a new resource with the specified details",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        return !!runtime.character.settings.secrets?.API_KEY;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        try {
            const context = composeContext({
                state,
                template: createResourceTemplate,
            });

            const resourceDetails = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: CreateResourceSchema,
            });

            if (!isCreateResourceContent(resourceDetails.object)) {
                callback({ text: "Invalid resource details provided." }, []);
                return;
            }

            // persist relevant data if needed to memory/knowledge
            // const memory = {
            //     type: "resource",
            //     content: resourceDetails.object,
            //     timestamp: new Date().toISOString()
            // };

            // await runtime.storeMemory(memory);

            callback(
                {
                    text: `Resource created successfully:
- Name: ${resourceDetails.object.name}
- Type: ${resourceDetails.object.type}
- Description: ${resourceDetails.object.description}
- Tags: ${resourceDetails.object.tags.join(", ")}

Resource has been stored in memory.`,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error creating resource:", error);
            callback(
                { text: "Failed to create resource. Please check the logs." },
                []
            );
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new resource with the name 'Resource1' and type 'TypeA'",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: `Resource created successfully:
- Name: Resource1
- Type: TypeA`,
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new resource with the name 'Resource2' and type 'TypeB'",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: `Resource created successfully:
- Name: Resource2
- Type: TypeB`,
                },
            },
        ],
    ],
};
