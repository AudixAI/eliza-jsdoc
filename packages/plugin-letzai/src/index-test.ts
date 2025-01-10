// I left this file here, because I was using it to test multiple callbacks in one file.
// If anybody knows how to achieve that, please lmk

/**
 * Object representing the action of generating an image via LetzAI API with polling.
 * @type {Object}
 * @property {string} name - The name of the action.
 * @property {Array<string>} similes - An array of similar words or phrases for the action.
 * @property {string} description - A brief description of the action.
 * @property {boolean} suppressInitialMessage - Whether to suppress the initial message.
 * @property {function} validate - Asynchronous function to validate the action.
 * @property {function} handler - Function to handle the action and provide a response.
 * @property {Array<Array<Object>>} examples - Array of examples showing how the action might be used in conversation.
 */ 
     
export const letzAiImageGeneration = {
    name: "GENERATE_IMAGE",
    similes: ["IMAGE_GENERATION", "IMAGE_GEN"],
    description: "Generate an image via LetzAI API (with polling).",
    suppressInitialMessage: true,

    // Provide a default validate() that simply returns true
    validate: async (_runtime: any, _message: any, _state: any) => {
        return true;
    },

    // Add a simple handler that outputs "OK" when triggered
    handler: (
        runtime: any,
        message: any,
        state: any,
        options: any,
        callback: any,
    ) => {
        // For now, just call the callback with "OK"
        callback({
            text: "OK",
        });

        callback({
            text: "OK2",
        });
    },

    // Add examples to show how this action might be used in conversation
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Generate an image of a neon futuristic cityscape",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Okay give me a second",
                    action: "GENERATE_IMAGE",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Sure, generating image via LetzAI...",
                    action: "GENERATE_IMAGE",
                },
            },
        ],
        [
            {
                user: "{{user2}}",
                content: {
                    text: "Please make a fantasy landscape with dragons and castles",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Alright, generating image now...",
                    action: "GENERATE_IMAGE",
                },
            },
        ],
    ],
};

export const letzAIPlugin = {
    name: "letzai",
    actions: [letzAiImageGeneration],
};

