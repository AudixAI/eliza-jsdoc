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
import { getIPDetailsTemplate } from "../templates";
import { Address } from "viem";
import { Asset, RESOURCE_TYPE } from "../types/api";
import { API_URL, getResource } from "../lib/api";

export { getIPDetailsTemplate };

// Types for the action parameters and response
/**
* Represents the parameters required to get details for a specified IP address.
* @typedef {Object} GetIPDetailsParams
* @property {string} ipId - The ID of the IP address for which details are needed.
*/
type GetIPDetailsParams = {
    ipId: Address;
};

/**
 * Response object containing data for retrieving details of an IP address.
 * @typedef {Object} GetIPDetailsResponse
 * @property {Asset} data - The asset object with IP details.
 */
type GetIPDetailsResponse = {
    data: Asset;
};

/**
 * Class handling IP details retrieval from Story Protocol
 */
/**
 * Asynchronous function to fetch details of a specific IP address.
 * 
 * @param {GetIPDetailsParams} params - The parameters for fetching IP details.
 * @returns {Promise<GetIPDetailsResponse>} The response containing details of the IP address.
 */
class GetIPDetailsAction {
/**
 * Asynchronously retrieves the details of an IP address.
 * 
 * @param {GetIPDetailsParams} params - The parameters for retrieving IP details.
 * @returns {Promise<GetIPDetailsResponse>} A promise that resolves to the details of the IP address.
 */
    async getIPDetails(
        params: GetIPDetailsParams
    ): Promise<GetIPDetailsResponse> {
        elizaLogger.log("Fetching from", `${API_URL}/${RESOURCE_TYPE.ASSET}`);
        return (await getResource(
            RESOURCE_TYPE.ASSET,
            params.ipId
        )) as GetIPDetailsResponse;
    }
}

/**
 * Formats IP asset details into a readable string
 */
const formatIPDetails = (data: Asset): string => `IP Asset Details:
ID: ${data.id}
NFT Name: ${data.nftMetadata.name}
Token Contract: ${data.nftMetadata.tokenContract}
Token ID: ${data.nftMetadata.tokenId}
Image URL: ${data.nftMetadata.imageUrl}

Relationships:
• Ancestors: ${data.ancestorCount}
• Descendants: ${data.descendantCount}
• Parents: ${data.parentCount || 0}
• Children: ${data.childCount || 0}
• Roots: ${data.rootCount || 0}

Created:
Block #${data.blockNumber}
Timestamp: ${data.blockTimestamp}`;

/**
 * Main action configuration for getting IP details
 */
export const getIPDetailsAction = {
    name: "GET_IP_DETAILS",
    description: "Get details for an IP Asset on Story",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting GET_IP_DETAILS handler...");

        // Initialize or update state
        state = !state
            ? ((await runtime.composeState(message)) as State)
            : await runtime.updateRecentMessageState(state);

        // Generate content using template
        const content = await generateObjectDeprecated({
            runtime,
            context: composeContext({ state, template: getIPDetailsTemplate }),
            modelClass: ModelClass.SMALL,
        });

        // Fetch and format IP details
        const action = new GetIPDetailsAction();
        try {
            const response = await action.getIPDetails(content);
            const formattedResponse = formatIPDetails(response.data);

            callback?.({
                text: formattedResponse,
                action: "GET_IP_DETAILS",
                source: "Story Protocol API",
            });
            return true;
        } catch (e) {
            elizaLogger.error("Error fetching IP details:", e.message);
            callback?.({
                text: `Error fetching IP details: ${e.message}`,
            });
            return false;
        }
    },
    template: getIPDetailsTemplate,
    validate: async () => true,
    // Example usage of the action
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get details for an IP Asset 0x2265F2b8e47F98b3Bdf7a1937EAc27282954A4Db",
                    action: "GET_IP_DETAILS",
                },
            },
        ],
    ],
    similes: ["IP_DETAILS", "IP_DETAILS_FOR_ASSET", "IP_DETAILS_FOR_IP"],
};
