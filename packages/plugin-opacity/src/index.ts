import {
    IVerifiableInferenceAdapter,
    VerifiableInferenceOptions,
    VerifiableInferenceResult,
    VerifiableInferenceProvider,
    ModelProviderName,
    models,
    elizaLogger,
} from "@elizaos/core";
import { verifyProof } from "./utils/api";
/**
 * Interface representing the options for setting opacity of an element.
 * @typedef {Object} OpacityOptions
 * @property {ModelProviderName} [modelProvider] - The model provider name.
 * @property {string} [token] - The authentication token.
 * @property {string} [teamId] - The team ID.
 * @property {string} [teamName] - The team name.
 * @property {string} opacityProverUrl - The URL for the opacity prover.
 */
interface OpacityOptions {
    modelProvider?: ModelProviderName;
    token?: string;
    teamId?: string;
    teamName?: string;
    opacityProverUrl: string;
}

/**
 * Class representing an OpacityAdapter for generating text with verifiable inference.
 * @implements { IVerifiableInferenceAdapter }
 */
export class OpacityAdapter implements IVerifiableInferenceAdapter {
    public options: OpacityOptions;

/**
 * Constructor of the class.
 * @param {OpacityOptions} options - The options for configuring opacity.
 */
    constructor(options: OpacityOptions) {
        this.options = options;
    }

/**
 * Generates text using a specified model and context for verifiable inference.
 * 
 * @param {string} context - The context for text generation.
 * @param {string} modelClass - The class of the model to be used for text generation.
 * @param {VerifiableInferenceOptions} [options] - Optional parameters for text generation.
 * @returns {Promise<VerifiableInferenceResult>} The result of the verifiable text generation process.
 */
    async generateText(
        context: string,
        modelClass: string,
        options?: VerifiableInferenceOptions
    ): Promise<VerifiableInferenceResult> {
        const provider = this.options.modelProvider || ModelProviderName.OPENAI;
        const baseEndpoint =
            options?.endpoint ||
            `https://gateway.ai.cloudflare.com/v1/${this.options.teamId}/${this.options.teamName}`;
        const model = models[provider].model[modelClass];
        const apiKey = this.options.token;

        elizaLogger.log("Generating text with options:", {
            modelProvider: provider,
            model: modelClass,
        });

        // Get provider-specific endpoint
        let endpoint;
        let authHeader;
        let responseRegex;

        switch (provider) {
            case ModelProviderName.OPENAI:
                endpoint = `${baseEndpoint}/openai/chat/completions`;
                authHeader = `Bearer ${apiKey}`;
                break;
            default:
                throw new Error(`Unsupported model provider: ${provider}`);
        }

        try {
            let body;
            // Handle different API formats
            switch (provider) {
                case ModelProviderName.OPENAI:
                    body = {
                        model: model.name,
                        messages: [
                            {
                                role: "system",
                                content: context,
                            },
                        ],
                        temperature: model.temperature || 0.7,
                        max_tokens: model.maxOutputTokens,
                        frequency_penalty: model.frequency_penalty,
                        presence_penalty: model.presence_penalty,
                    };
                    break;
                default:
                    throw new Error(`Unsupported model provider: ${provider}`);
            }

            elizaLogger.debug("Request body:", JSON.stringify(body, null, 2));
            const requestBody = JSON.stringify(body);
            const requestHeaders = {
                "Content-Type": "application/json",
                Authorization: authHeader,
                ...options?.headers,
            };

            elizaLogger.debug("Making request to Cloudflare with:", {
                endpoint,
                headers: {
                    ...requestHeaders,
                    Authorization: "[REDACTED]",
                },
                body: requestBody,
            });

            // Validate JSON before sending
            try {
                JSON.parse(requestBody); // Verify the JSON is valid
            } catch (e) {
                elizaLogger.error("Invalid JSON body:", body);
                throw new Error("Failed to create valid JSON request body");
            }
            elizaLogger.debug("Request body:", requestBody);
            const cloudflareResponse = await fetch(endpoint, {
                method: "POST",
                headers: requestHeaders,
                body: requestBody,
            });

            if (!cloudflareResponse.ok) {
                const errorText = await cloudflareResponse.text();
                elizaLogger.error("Cloudflare error response:", {
                    status: cloudflareResponse.status,
                    statusText: cloudflareResponse.statusText,
                    error: errorText,
                });
                throw new Error(`Cloudflare request failed: ${errorText}`);
            }

            elizaLogger.debug("Cloudflare response:", {
                status: cloudflareResponse.status,
                statusText: cloudflareResponse.statusText,
                headers: cloudflareResponse.headers,
                type: cloudflareResponse.type,
                url: cloudflareResponse.url,
            });

            const cloudflareLogId =
                cloudflareResponse.headers.get("cf-aig-log-id");
            const cloudflareResponseJson = await cloudflareResponse.json();

            const proof = await this.generateProof(
                this.options.opacityProverUrl,
                cloudflareLogId
            );
            elizaLogger.debug(
                "Proof generated for text generation ID:",
                cloudflareLogId
            );

            // // Extract text based on provider format
            const text = cloudflareResponseJson.choices[0].message.content;
            const timestamp = Date.now();
            return {
                text: text,
                id: cloudflareLogId,
                provider: VerifiableInferenceProvider.OPACITY,
                timestamp: timestamp,
                proof: proof,
            };
        } catch (error) {
            console.error("Error in Opacity generateText:", error);
            throw error;
        }
    }

/**
 * Asynchronously generates a proof for a log ID by fetching the proof data from the provided base URL.
 * 
 * @param {string} baseUrl - The base URL for the API endpoint.
 * @param {string} logId - The ID of the log for which the proof is to be generated.
 * @returns {Promise<object>} A promise that resolves with the proof data in JSON format.
 */
    async generateProof(baseUrl: string, logId: string) {
        const response = await fetch(`${baseUrl}/api/logs/${logId}`);
        elizaLogger.debug("Fetching proof for log ID:", logId);
        if (!response.ok) {
            throw new Error(`Failed to fetch proof: ${response.statusText}`);
        }
        return await response.json();
    }

/**
 * Asynchronously verifies the proof of a given verifiable inference result.
 * @param {VerifiableInferenceResult} result - The verifiable inference result to verify.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the proof is valid or not.
 */
    async verifyProof(result: VerifiableInferenceResult): Promise<boolean> {
        const isValid = await verifyProof(
            `${this.options.opacityProverUrl}`,
            result.id,
            result.proof
        );
        console.log("Proof is valid:", isValid.success);
        if (!isValid.success) {
            throw new Error("Proof is invalid");
        }
        return isValid.success;
    }
}

export default OpacityAdapter;
