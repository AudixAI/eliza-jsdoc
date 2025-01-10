export * from "./providers/token.ts";
export * from "./providers/wallet.ts";
export * from "./providers/trustScoreProvider.ts";
export * from "./evaluators/trust.ts";

import { Plugin } from "@elizaos/core";
import { executeSwap } from "./actions/swap.ts";
import take_order from "./actions/takeOrder";
import pumpfun from "./actions/pumpfun.ts";
import fomo from "./actions/fomo.ts";
import { executeSwapForDAO } from "./actions/swapDao";
import transferToken from "./actions/transfer.ts";
import { walletProvider } from "./providers/wallet.ts";
import { trustScoreProvider } from "./providers/trustScoreProvider.ts";
import { trustEvaluator } from "./evaluators/trust.ts";
import { TokenProvider } from "./providers/token.ts";
import { WalletProvider } from "./providers/wallet.ts";
import { getTokenBalance, getTokenBalances } from "./providers/tokenUtils.ts";

export { TokenProvider, WalletProvider, getTokenBalance, getTokenBalances };

/**
 * Represents the Solana Plugin for Eliza.
 * @type {Plugin}
 * @property {string} name - The name of the plugin ("solana").
 * @property {string} description - The description of the plugin ("Solana Plugin for Eliza").
 * @property {Array<Function>} actions - Array of actions supported by the plugin.
 * @property {Array<Function>} evaluators - Array of evaluators used by the plugin.
 * @property {Array<Function>} providers - Array of providers used by the plugin.
 */
export const solanaPlugin: Plugin = {
    name: "solana",
    description: "Solana Plugin for Eliza",
    actions: [
        executeSwap,
        pumpfun,
        fomo,
        transferToken,
        executeSwapForDAO,
        take_order,
    ],
    evaluators: [trustEvaluator],
    providers: [walletProvider, trustScoreProvider],
};

export default solanaPlugin;
