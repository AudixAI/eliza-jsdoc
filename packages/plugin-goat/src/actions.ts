import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { MODE, USDC, erc20 } from "@goat-sdk/plugin-erc20";
import { kim } from "@goat-sdk/plugin-kim";
import { sendETH } from "@goat-sdk/wallet-evm";
import { WalletClientBase } from "@goat-sdk/core";

import {
    generateText,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    composeContext,
} from "@elizaos/core";

/**
 * Retrieves the on-chain actions available for the specified wallet client.
 *
 * @param {WalletClientBase} wallet - The wallet client to retrieve actions for
 * @returns {Promise<Array<Action>>} - An array of on-chain actions with associated handlers
 */
export async function getOnChainActions(wallet: WalletClientBase) {
    const actionsWithoutHandler = [
        {
            name: "SWAP_TOKENS",
            description: "Swap two different tokens using KIM protocol",
            similes: [],
            validate: async () => true,
            examples: [],
        },
        // 1. Add your actions here
    ];

    const tools = await getOnChainTools({
        wallet: wallet,
        // 2. Configure the plugins you need to perform those actions
        plugins: [sendETH(), erc20({ tokens: [USDC, MODE] }), kim()],
    });

    // 3. Let GOAT handle all the actions
    return actionsWithoutHandler.map((action) => ({
        ...action,
        handler: getActionHandler(action.name, action.description, tools),
    }));
}

/**
 * Returns a handler function for a given action, which takes in the runtime, message, state, options, and callback parameters.
 *
 * @param {string} actionName - The name of the action.
 * @param {string} actionDescription - The description of the action.
 * @param {any} tools - The tools required for the action.
 * @returns {Function} An async function that handles the action and returns a boolean indicating success or failure.
 */
function getActionHandler(
    actionName: string,
    actionDescription: string,
    tools
) {
    return async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        let currentState = state ?? (await runtime.composeState(message));
        currentState = await runtime.updateRecentMessageState(currentState);

        try {
            // 1. Call the tools needed
            const context = composeActionContext(
                actionName,
                actionDescription,
                currentState
            );
            const result = await generateText({
                runtime,
                context,
                tools,
                maxSteps: 10,
                // Uncomment to see the log each tool call when debugging
                // onStepFinish: (step) => {
                //     console.log(step.toolResults);
                // },
                modelClass: ModelClass.LARGE,
            });

            // 2. Compose the response
            const response = composeResponseContext(result, currentState);
            const responseText = await generateResponse(runtime, response);

            callback?.({
                text: responseText,
                content: {},
            });
            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            // 3. Compose the error response
            const errorResponse = composeErrorResponseContext(
                errorMessage,
                currentState
            );
            const errorResponseText = await generateResponse(
                runtime,
                errorResponse
            );

            callback?.({
                text: errorResponseText,
                content: { error: errorMessage },
            });
            return false;
        }
    };
}

/**
 * Composes an action context based on the given parameters.
 * 
 * @param {string} actionName - The name of the action.
 * @param {string} actionDescription - The description of the action.
 * @param {State} state - The current state of the application.
 * @returns {string} - The composed action context template.
 */
function composeActionContext(
    actionName: string,
    actionDescription: string,
    state: State
): string {
    const actionTemplate = `
# Knowledge
{{knowledge}}

About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}


# Action: ${actionName}
${actionDescription}

{{recentMessages}}

Based on the action chosen and the previous messages, execute the action and respond to the user using the tools you were given.
`;
    return composeContext({ state, template: actionTemplate });
}

/**
 * Composes a response context based on the result and state.
 * 
 * @param {unknown} result - The result to include in the response context.
 * @param {State} state - The state of the context.
 * @returns {string} The composed response context string.
 */
function composeResponseContext(result: unknown, state: State): string {
    const responseTemplate = `
    # Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

Here is the result:
${JSON.stringify(result)}

{{actions}}

Respond to the message knowing that the action was successful and these were the previous messages:
{{recentMessages}}
  `;
    return composeContext({ state, template: responseTemplate });
}

/**
 * Compose an error response context containing information about the error and the state of the application.
 * @param {string} errorMessage - The error message to be displayed in the response.
 * @param {State} state - The current state of the application.
 * @returns {string} The error response context template.
 */
function composeErrorResponseContext(
    errorMessage: string,
    state: State
): string {
    const errorResponseTemplate = `
# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{actions}}

Respond to the message knowing that the action failed.
The error was:
${errorMessage}

These were the previous messages:
{{recentMessages}}
    `;
    return composeContext({ state, template: errorResponseTemplate });
}

/**
 * Asynchronously generates a response using the provided runtime and context.
 *
 * @param {IAgentRuntime} runtime - The runtime used to generate the response.
 * @param {string} context - The context in which to generate the response.
 * @returns {Promise<string>} The generated response as a string.
 */
async function generateResponse(
    runtime: IAgentRuntime,
    context: string
): Promise<string> {
    return generateText({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    });
}
