import { Plugin } from "@elizaos/core";
import { continueAction } from "./actions/continue.ts";
import { followRoomAction } from "./actions/followRoom.ts";
import { ignoreAction } from "./actions/ignore.ts";
import { muteRoomAction } from "./actions/muteRoom.ts";
import { noneAction } from "./actions/none.ts";
import { unfollowRoomAction } from "./actions/unfollowRoom.ts";
import { unmuteRoomAction } from "./actions/unmuteRoom.ts";
import { factEvaluator } from "./evaluators/fact.ts";
import { goalEvaluator } from "./evaluators/goal.ts";
import { boredomProvider } from "./providers/boredom.ts";
import { factsProvider } from "./providers/facts.ts";
import { timeProvider } from "./providers/time.ts";

export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";

/**
 * Plugin for agent bootstrap with basic actions and evaluators.
 * 
 * @type {Plugin}
 * @property {string} name - The name of the plugin.
 * @property {string} description - The description of the plugin.
 * @property {Action[]} actions - List of actions available for the plugin.
 * @property {Evaluator[]} evaluators - List of evaluators available for the plugin.
 * @property {Provider[]} providers - List of providers available for the plugin.
 */
export const bootstrapPlugin: Plugin = {
    name: "bootstrap",
    description: "Agent bootstrap with basic actions and evaluators",
    actions: [
        continueAction,
        followRoomAction,
        unfollowRoomAction,
        ignoreAction,
        noneAction,
        muteRoomAction,
        unmuteRoomAction,
    ],
    evaluators: [factEvaluator, goalEvaluator],
    providers: [boredomProvider, timeProvider, factsProvider],
};
export default bootstrapPlugin;
