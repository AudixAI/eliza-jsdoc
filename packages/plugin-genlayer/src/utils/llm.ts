import {
    composeContext,
    generateText,
    IAgentRuntime,
    Memory,
    ModelClass,
    parseJSONObjectFromText,
    State,
} from "@elizaos/core";

/**
 * Asynchronously generates parameters with Lead Language Model (LLM).
 * 
 * @template T - the type of response data
 * @param {IAgentRuntime} runtime - the runtime environment
 * @param {Memory} message - the message object containing the user input
 * @param {string} template - the template for composing context
 * @param {State} state - optional state object, default is null
 * @param {number} maxAttempts - maximum number of attempts, default is 5
 * @returns {Promise<T | null>} - the generated parameters or null if unsuccessful
 */
export async function getParamsWithLLM<T>(
    runtime: IAgentRuntime,
    message: Memory,
    template: string,
    state: State = null,
    maxAttempts: number = 5
): Promise<T | null> {
    const context = composeContext({
        state: {
            ...state,
            userMessage: message.content.text,
        },
        template,
    });

    for (let i = 0; i < maxAttempts; i++) {
        const response = await generateText({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        const parsedResponse = parseJSONObjectFromText(response) as T | null;
        if (parsedResponse) {
            return parsedResponse;
        }
    }
    return null;
}
