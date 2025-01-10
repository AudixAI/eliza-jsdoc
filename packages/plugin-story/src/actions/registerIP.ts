import {
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    HandlerCallback,
    ModelClass,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import pinataSDK from "@pinata/sdk";
import { RegisterIpResponse } from "@story-protocol/core-sdk";
import { createHash } from "crypto";
import { uploadJSONToIPFS } from "../functions/uploadJSONToIPFS";
import { WalletProvider } from "../providers/wallet";
import { registerIPTemplate } from "../templates";
import { RegisterIPParams } from "../types";

export { registerIPTemplate };

/**
 * Class representing a RegisterIPAction.
 * @param {WalletProvider} walletProvider - The wallet provider used for the action.
 * @method registerIP
 * @param {RegisterIPParams} params - The parameters needed to register an IP.
 * @param {IAgentRuntime} runtime - The runtime environment for the action.
 * @returns {Promise<RegisterIpResponse>} A Promise that resolves with the response of the IP registration.
 */
export class RegisterIPAction {
/**
 * Constructor for creating an instance of the class.
 * @param {WalletProvider} walletProvider - The wallet provider used by the class.
 */
    constructor(private walletProvider: WalletProvider) {}

/**
 * Asynchronously registers an IP asset with the given parameters.
 * 
 * @param {RegisterIPParams} params - The parameters for registering the IP asset.
 * @param {IAgentRuntime} runtime - The runtime object for the agent.
 * @returns {Promise<RegisterIpResponse>} A promise that resolves with the response from registering the IP asset.
 */
    async registerIP(
        params: RegisterIPParams,
        runtime: IAgentRuntime
    ): Promise<RegisterIpResponse> {
        const storyClient = this.walletProvider.getStoryClient();

        // configure ip metadata
        const ipMetadata = storyClient.ipAsset.generateIpMetadata({
            title: params.title,
            description: params.description,
            ipType: params.ipType ? params.ipType : undefined,
        });

        // configure nft metadata
        const nftMetadata = {
            name: params.title,
            description: params.description,
        };

        const pinataJWT = runtime.getSetting("PINATA_JWT");
        if (!pinataJWT) throw new Error("PINATA_JWT not configured");
        const pinata = new pinataSDK({ pinataJWTKey: pinataJWT });

        // upload metadata to ipfs
        const ipIpfsHash = await uploadJSONToIPFS(pinata, ipMetadata);
        const ipHash = createHash("sha256")
            .update(JSON.stringify(ipMetadata))
            .digest("hex");
        const nftIpfsHash = await uploadJSONToIPFS(pinata, nftMetadata);
        const nftHash = createHash("sha256")
            .update(JSON.stringify(nftMetadata))
            .digest("hex");

        // register ip
        const response =
            await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
                spgNftContract: "0xC81B2cbEFD1aA0227bf513729580d3CF40fd61dF",
                terms: [],
                ipMetadata: {
                    ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
                    ipMetadataHash: `0x${ipHash}`,
                    nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
                    nftMetadataHash: `0x${nftHash}`,
                },
                txOptions: { waitForTransaction: true },
            });

        return response;
    }
}

/**
 * An action to register an NFT as an IP Asset on Story.
 *
 * @async
 * @param {IAgentRuntime} runtime - The runtime environment for the action.
 * @param {Memory} message - The message that triggered the action.
 * @param {State} state - The current state of the conversation.
 * @param {any} options - Additional options for the action.
 * @param {HandlerCallback} [callback] - Optional callback function to handle the action response.
 * @returns {Promise<boolean>} A promise that resolves with a boolean value indicating the success of the registration.
 */
export const registerIPAction = {
    name: "REGISTER_IP",
    description: "Register an NFT as an IP Asset on Story",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting REGISTER_IP handler...");

        // initialize or update state
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const registerIPContext = composeContext({
            state,
            template: registerIPTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: registerIPContext,
            modelClass: ModelClass.SMALL,
        });

        const walletProvider = new WalletProvider(runtime);
        const action = new RegisterIPAction(walletProvider);
        try {
            const response = await action.registerIP(content, runtime);
            callback?.({
                text: `Successfully registered IP ID: ${response.ipId}. Transaction Hash: ${response.txHash}. View it on the explorer: https://explorer.story.foundation/ipa/${response.ipId}`,
            });
            return true;
        } catch (e) {
            elizaLogger.error("Error registering IP:", e.message);
            callback?.({ text: `Error registering IP: ${e.message}` });
            return false;
        }
    },
    template: registerIPTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("STORY_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I would like to register my IP.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Sure! Please provide the title and description of your IP.",
                    action: "REGISTER_IP",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Register my IP titled 'My IP' with the description 'This is my IP'",
                },
            },
        ],
    ],
    similes: ["REGISTER_IP", "REGISTER_NFT"],
};
