import { IAgentRuntime, ModelClass, Service, ServiceType, elizaLogger, generateObjectDeprecated, generateText } from "@elizaos/core";
import { GoPlusManage, GoPlusParamType, GoPlusType } from "../lib/GoPlusManage";
import { requestPrompt, responsePrompt } from "../templates";

/**
 * Interface for a service that handles security checks in the Goplus application.
 * @interface
 */

export interface IGoplusSecurityService extends Service {
    check(text: string): Promise<string>;
}

/**
 * Class representing the Goplus Security Service.
 * @extends Service
 * @implements IGoplusSecurityService
 */
export class GoplusSecurityService extends Service implements IGoplusSecurityService {
    private apiKey: string;
    private runtime: IAgentRuntime;
/**
 * Returns the instance of GoplusSecurityService.
 * @returns {GoplusSecurityService} The instance of GoplusSecurityService.
 */
    getInstance(): GoplusSecurityService {
        return this;
    }
/**
 * Retrieves the service type as GOPLUS_SECURITY.
 */
    static get serviceType() {
        return ServiceType.GOPLUS_SECURITY;
    }

/**
 * Initializes the agent with the provided runtime and sets the api key from the runtime settings.
 * @param {IAgentRuntime} runtime - The runtime object for the agent.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
    initialize(runtime: IAgentRuntime): Promise<void> {
        this.runtime = runtime;
        this.apiKey = runtime.getSetting("GOPLUS_API_KEY");
        return;
    }


    /**
     * Connect to WebSocket and send a message
     */
/**
 * Asynchronously checks the input text for security vulnerabilities using various security checks.
 * * @param { string } text - The input text to be checked for security vulnerabilities.
 * @returns {Promise<string>} - A promise that resolves with the response text after performing security checks.
 */
    async check(text: string): Promise<string> {
        try {
            elizaLogger.log("check input text", text);
            const obj = await generateObjectDeprecated({
                runtime: this.runtime,
                context: requestPrompt(text),
                modelClass: ModelClass.SMALL, // gpt-4o-mini
            }) as GoPlusParamType;

            elizaLogger.log("check generateObjectDeprecated text", obj);

            const goPlusManage = new GoPlusManage(this.apiKey)
            let checkResult: any;
            switch(obj.type) {
                case GoPlusType.EVMTOKEN_SECURITY_CHECK:
                    checkResult = await goPlusManage.tokenSecurity(obj.network, obj.token);
                    break;
                case GoPlusType.SOLTOKEN_SECURITY_CHECK:
                    checkResult = await goPlusManage.solanaTokenSecurityUsingGET(obj.token);
                    break;
                case GoPlusType.SUITOKEN_SECURITY_CHECK:
                    checkResult = await goPlusManage.suiTokenSecurityUsingGET(obj.token);
                    break;
                case GoPlusType.RUGPULL_SECURITY_CHECK:
                    checkResult = await goPlusManage.rugpullDetection(obj.network, obj.contract);
                    break;
                case GoPlusType.NFT_SECURITY_CHECK:
                    checkResult = await goPlusManage.nftSecurity(obj.network, obj.token);
                    break;
                case GoPlusType.ADRESS_SECURITY_CHECK:
                    checkResult = await goPlusManage.addressSecurity(obj.wallet);
                    break;
                case GoPlusType.APPROVAL_SECURITY_CHECK:
                    checkResult = await goPlusManage.approvalSecurity(obj.network, obj.contract);
                    break;
                case GoPlusType.ACCOUNT_ERC20_SECURITY_CHECK:
                    checkResult = await goPlusManage.erc20ApprovalSecurity(obj.network, obj.wallet);
                    break;
                case GoPlusType.ACCOUNT_ERC721_SECURITY_CHECK:
                    checkResult = await goPlusManage.erc721ApprovalSecurity(obj.network, obj.wallet);
                    break;
                case GoPlusType.ACCOUNT_ERC1155_SECURITY_CHECK:
                    checkResult = await goPlusManage.erc1155ApprovalSecurity(obj.network, obj.wallet);
                    break;
                case GoPlusType.SIGNATURE_SECURITY_CHECK:
                    checkResult = await goPlusManage.inputDecode(obj.network, obj.data);
                    break;
                case GoPlusType.URL_SECURITY_CHECK:
                    checkResult = await goPlusManage.dappSecurityAndPhishingSite(obj.url);
                    break;
                default:
                    throw new Error("type is invaild")
            }

            elizaLogger.log("checkResult text", checkResult);
            const checkResponse = await generateText({
                runtime: this.runtime,
                context: responsePrompt(JSON.stringify(checkResult), text),
                modelClass: ModelClass.SMALL,
            });
            elizaLogger.log("checkResponse text", checkResponse);
            return checkResponse
        } catch (e) {
            elizaLogger.error(e);
            return "error";
        }
    }
}

export default GoplusSecurityService;
