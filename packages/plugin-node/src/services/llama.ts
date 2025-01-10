import {
    elizaLogger,
    IAgentRuntime,
    ServiceType,
    ModelProviderName,
} from "@elizaos/core";
import { Service } from "@elizaos/core";
import fs from "fs";
import https from "https";
import {
    GbnfJsonSchema,
    getLlama,
    Llama,
    LlamaContext,
    LlamaContextSequence,
    LlamaContextSequenceRepeatPenalty,
    LlamaJsonSchemaGrammar,
    LlamaModel,
    Token,
} from "node-llama-cpp";
import path from "path";
import si from "systeminformation";
import { fileURLToPath } from "url";

/**
 * Array of words to be punished or discouraged in a text or conversation.
 * Includes common filler words, punctuation marks, and specific terms often associated with clichés or overused language.
 * @type {Array<string>}
 */
const wordsToPunish = [
    " please",
    " feel",
    " free",
    "!",
    "–",
    "—",
    "?",
    ".",
    ",",
    "; ",
    " cosmos",
    " tapestry",
    " tapestries",
    " glitch",
    " matrix",
    " cyberspace",
    " troll",
    " questions",
    " topics",
    " discuss",
    " basically",
    " simulation",
    " simulate",
    " universe",
    " like",
    " debug",
    " debugging",
    " wild",
    " existential",
    " juicy",
    " circuits",
    " help",
    " ask",
    " happy",
    " just",
    " cosmic",
    " cool",
    " joke",
    " punchline",
    " fancy",
    " glad",
    " assist",
    " algorithm",
    " Indeed",
    " Furthermore",
    " However",
    " Notably",
    " Therefore",
    " Additionally",
    " conclusion",
    " Significantly",
    " Consequently",
    " Thus",
    " What",
    " Otherwise",
    " Moreover",
    " Subsequently",
    " Accordingly",
    " Unlock",
    " Unleash",
    " buckle",
    " pave",
    " forefront",
    " harness",
    " harnessing",
    " bridging",
    " bridging",
    " Spearhead",
    " spearheading",
    " Foster",
    " foster",
    " environmental",
    " impact",
    " Navigate",
    " navigating",
    " challenges",
    " chaos",
    " social",
    " inclusion",
    " inclusive",
    " diversity",
    " diverse",
    " delve",
    " noise",
    " infinite",
    " insanity",
    " coffee",
    " singularity",
    " AI",
    " digital",
    " artificial",
    " intelligence",
    " consciousness",
    " reality",
    " metaverse",
    " virtual",
    " virtual reality",
    " VR",
    " Metaverse",
    " humanity",
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * JSON Schema Grammar object representing a data structure with properties user and content.
 * @type {Readonly<{
 *      type: string;
 *      properties: {
 *          user: {
 *              type: string;
 *          };
 *          content: {
 *              type: string;
 *          };
 *      };
 * }>}
 */
const jsonSchemaGrammar: Readonly<{
    type: string;
    properties: {
        user: {
            type: string;
        };
        content: {
            type: string;
        };
    };
}> = {
    type: "object",
    properties: {
        user: {
            type: "string",
        },
        content: {
            type: "string",
        },
    },
};

/**
 * Interface representing a queued message.
 * 
 * @property {string} context - The context of the message.
 * @property {number} temperature - The temperature parameter for generating text.
 * @property {string[]} stop - An array of stop words for text generation.
 * @property {number} max_tokens - The maximum number of tokens to generate.
 * @property {number} frequency_penalty - The frequency penalty parameter for text generation.
 * @property {number} presence_penalty - The presence penalty parameter for text generation.
 * @property {boolean} useGrammar - Flag indicating whether to use grammar in text generation.
 * @property {function} resolve - The function to call when the promise is resolved.
 * @property {function} reject - The function to call when the promise is rejected.
 */
interface QueuedMessage {
    context: string;
    temperature: number;
    stop: string[];
    max_tokens: number;
    frequency_penalty: number;
    presence_penalty: number;
    useGrammar: boolean;
    resolve: (value: any | string | PromiseLike<any | string>) => void;
    reject: (reason?: any) => void;
}

/**
 * LlamaService class for handling llama-related functionalities.
 * 
 * @class
 * @extends Service
 * @property {Llama | undefined} llama - The llama object instance.
 * @property {LlamaModel | undefined} model - The llama model object instance.
 * @property {string} modelPath - The path to the llama model.
 * @property {LlamaJsonSchemaGrammar<GbnfJsonSchema> | undefined} grammar - The grammar for llama JSON schema.
 * @property {LlamaContext | undefined} ctx - The llama context object instance.
 * @property {LlamaContextSequence | undefined} sequence - The sequence for llama context.
 * @property {string} modelUrl - The URL for the llama model.
 * @property {string | undefined} ollamaModel - The optional llama model string.
 */
export class LlamaService extends Service {
    private llama: Llama | undefined;
    private model: LlamaModel | undefined;
    private modelPath: string;
    private grammar: LlamaJsonSchemaGrammar<GbnfJsonSchema> | undefined;
    private ctx: LlamaContext | undefined;
    private sequence: LlamaContextSequence | undefined;
    private modelUrl: string;
    private ollamaModel: string | undefined;

    private messageQueue: QueuedMessage[] = [];
    private isProcessing: boolean = false;
    private modelInitialized: boolean = false;
    private runtime: IAgentRuntime | undefined;

    static serviceType: ServiceType = ServiceType.TEXT_GENERATION;

/**
 * Constructor for the Llama class.
 * Initializes the Llama object with default values:
 * - llama: undefined
 * - model: undefined
 * - modelUrl: the URL to download the Llama model
 * - modelPath: the local path to store the downloaded model
 * - ollamaModel: the environment variable for the OLLAMA model
 */
    constructor() {
        super();
        this.llama = undefined;
        this.model = undefined;
        this.modelUrl =
            "https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B-GGUF/resolve/main/Hermes-3-Llama-3.1-8B.Q8_0.gguf?download=true";
        const modelName = "model.gguf";
        this.modelPath = path.join(
            process.env.LLAMALOCAL_PATH?.trim() ?? "./",
            modelName
        );
        this.ollamaModel = process.env.OLLAMA_MODEL;
    }

/**
 * Asynchronously initializes the LlamaService with the given agent runtime.
 * 
 * @param {IAgentRuntime} runtime The agent runtime to initialize the LlamaService with
 * @returns {Promise<void>} A Promise that resolves after the initialization is complete
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        elizaLogger.info("Initializing LlamaService...");
        this.runtime = runtime;
    }

/**
 * Ensures that the model is initialized.
 * If the model is not initialized, it initializes the model.
 */
    private async ensureInitialized() {
        if (!this.modelInitialized) {
            elizaLogger.info(
                "Model not initialized, starting initialization..."
            );
            await this.initializeModel();
        } else {
            elizaLogger.info("Model already initialized");
        }
    }

/**
 * Asynchronously initializes the model by performing the following steps:
 * - Checks if the model file exists
 * - Determines if CUDA is available for GPU acceleration
 * - Initializes the Llama instance with optional GPU acceleration
 * - Creates a JSON schema grammar using LlamaJsonSchemaGrammar
 * - Loads the model from the provided modelPath
 * - Creates context and sequence for the model
 * - Handles errors by retrying initialization after deleting the model
 * 
 * @returns {Promise<void>} A Promise that resolves once the model is successfully initialized
 * @throws {Error} If model initialization fails after multiple retries
 */
    async initializeModel() {
        try {
            elizaLogger.info("Checking model file...");
            await this.checkModel();

            const systemInfo = await si.graphics();
            const hasCUDA = systemInfo.controllers.some((controller) =>
                controller.vendor.toLowerCase().includes("nvidia")
            );

            if (hasCUDA) {
                elizaLogger.info(
                    "LlamaService: CUDA detected, using GPU acceleration"
                );
            } else {
                elizaLogger.warn(
                    "LlamaService: No CUDA detected - local response will be slow"
                );
            }

            elizaLogger.info("Initializing Llama instance...");
            this.llama = await getLlama({
                gpu: hasCUDA ? "cuda" : undefined,
            });

            elizaLogger.info("Creating JSON schema grammar...");
            const grammar = new LlamaJsonSchemaGrammar(
                this.llama,
                jsonSchemaGrammar as GbnfJsonSchema
            );
            this.grammar = grammar;

            elizaLogger.info("Loading model...");
            this.model = await this.llama.loadModel({
                modelPath: this.modelPath,
            });

            elizaLogger.info("Creating context and sequence...");
            this.ctx = await this.model.createContext({ contextSize: 8192 });
            this.sequence = this.ctx.getSequence();

            this.modelInitialized = true;
            elizaLogger.success("Model initialization complete");
            this.processQueue();
        } catch (error) {
            elizaLogger.error(
                "Model initialization failed. Deleting model and retrying:",
                error
            );
            try {
                elizaLogger.info(
                    "Attempting to delete and re-download model..."
                );
                await this.deleteModel();
                await this.initializeModel();
            } catch (retryError) {
                elizaLogger.error(
                    "Model re-initialization failed:",
                    retryError
                );
                throw new Error(
                    `Model initialization failed after retry: ${retryError.message}`
                );
            }
        }
    }

/**
 * Asynchronously checks if the model file exists. If it does not exist, it starts the download process from the specified model URL.
 * 
 * @returns {Promise<void>} A Promise that resolves when the download is complete or rejects if there was an error during the download process.
 */
    async checkModel() {
        if (!fs.existsSync(this.modelPath)) {
            elizaLogger.info("Model file not found, starting download...");
            await new Promise<void>((resolve, reject) => {
                const file = fs.createWriteStream(this.modelPath);
                let downloadedSize = 0;
                let totalSize = 0;

                const downloadModel = (url: string) => {
                    https
                        .get(url, (response) => {
                            if (
                                response.statusCode >= 300 &&
                                response.statusCode < 400 &&
                                response.headers.location
                            ) {
                                elizaLogger.info(
                                    `Following redirect to: ${response.headers.location}`
                                );
                                downloadModel(response.headers.location);
                                return;
                            }

                            if (response.statusCode !== 200) {
                                reject(
                                    new Error(
                                        `Failed to download model: HTTP ${response.statusCode}`
                                    )
                                );
                                return;
                            }

                            totalSize = parseInt(
                                response.headers["content-length"] || "0",
                                10
                            );
                            elizaLogger.info(
                                `Downloading model: Hermes-3-Llama-3.1-8B.Q8_0.gguf`
                            );
                            elizaLogger.info(
                                `Download location: ${this.modelPath}`
                            );
                            elizaLogger.info(
                                `Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`
                            );

                            response.pipe(file);

                            let progressString = "";
                            response.on("data", (chunk) => {
                                downloadedSize += chunk.length;
                                const progress =
                                    totalSize > 0
                                        ? (
                                              (downloadedSize / totalSize) *
                                              100
                                          ).toFixed(1)
                                        : "0.0";
                                const dots = ".".repeat(
                                    Math.floor(Number(progress) / 5)
                                );
                                progressString = `Downloading model: [${dots.padEnd(20, " ")}] ${progress}%`;
                                elizaLogger.progress(progressString);
                            });

                            file.on("finish", () => {
                                file.close();
                                elizaLogger.progress(""); // Clear the progress line
                                elizaLogger.success("Model download complete");
                                resolve();
                            });

                            response.on("error", (error) => {
                                fs.unlink(this.modelPath, () => {});
                                reject(
                                    new Error(
                                        `Model download failed: ${error.message}`
                                    )
                                );
                            });
                        })
                        .on("error", (error) => {
                            fs.unlink(this.modelPath, () => {});
                            reject(
                                new Error(
                                    `Model download request failed: ${error.message}`
                                )
                            );
                        });
                };

                downloadModel(this.modelUrl);

                file.on("error", (err) => {
                    fs.unlink(this.modelPath, () => {}); // Delete the file async
                    console.error("File write error:", err.message);
                    reject(err);
                });
            });
        } else {
            elizaLogger.warn("Model already exists.");
        }
    }

/**
* Asynchronously deletes the model file from the file system if it exists.
*/
    async deleteModel() {
        if (fs.existsSync(this.modelPath)) {
            fs.unlinkSync(this.modelPath);
        }
    }

/**
 * Add a message completion task to the message queue for processing.
 * 
 * @param {string} context - The message context.
 * @param {number} temperature - The temperature parameter for generation.
 * @param {string[]} stop - List of tokens where generation should stop.
 * @param {number} frequency_penalty - The frequency penalty parameter.
 * @param {number} presence_penalty - The presence penalty parameter.
 * @param {number} max_tokens - The maximum number of tokens to generate.
 * @returns {Promise<any>} A promise that resolves when the message completion task is completed.
 */
    async queueMessageCompletion(
        context: string,
        temperature: number,
        stop: string[],
        frequency_penalty: number,
        presence_penalty: number,
        max_tokens: number
    ): Promise<any> {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.messageQueue.push({
                context,
                temperature,
                stop,
                frequency_penalty,
                presence_penalty,
                max_tokens,
                useGrammar: true,
                resolve,
                reject,
            });
            this.processQueue();
        });
    }

/**
 * Add a text completion task to the message queue.
 * 
 * @param {string} context - The prompt to continue the text from.
 * @param {number} temperature - Controls the randomness of the text generation.
 * @param {string[]} stop - Phrases to use as stopping points for the text generation.
 * @param {number} frequency_penalty - A higher penalty will decrease the likelihood that a model will repeat the same token in the completion.
 * @param {number} presence_penalty - A higher penalty will decrease the likelihood of the model mentioning the same token in the completion.
 * @param {number} max_tokens - The maximum number of tokens to generate in the completion.
 * @returns {Promise<string>} A Promise that resolves once the text completion task is processed.
 */
    async queueTextCompletion(
        context: string,
        temperature: number,
        stop: string[],
        frequency_penalty: number,
        presence_penalty: number,
        max_tokens: number
    ): Promise<string> {
        await this.ensureInitialized();

        return new Promise((resolve, reject) => {
            this.messageQueue.push({
                context,
                temperature,
                stop,
                frequency_penalty: frequency_penalty ?? 1.0,
                presence_penalty: presence_penalty ?? 1.0,
                max_tokens,
                useGrammar: false,
                resolve,
                reject,
            });
            this.processQueue();
        });
    }

/**
 * Process messages in the message queue by getting completion response
 * @returns {Promise<void>}
 */
    private async processQueue() {
        if (
            this.isProcessing ||
            this.messageQueue.length === 0 ||
            !this.modelInitialized
        ) {
            return;
        }

        this.isProcessing = true;

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                try {
                    const response = await this.getCompletionResponse(
                        message.context,
                        message.temperature,
                        message.stop,
                        message.frequency_penalty,
                        message.presence_penalty,
                        message.max_tokens,
                        message.useGrammar
                    );
                    message.resolve(response);
                } catch (error) {
                    message.reject(error);
                }
            }
        }

        this.isProcessing = false;
    }

/**
 * Asynchronously performs completion logic based on the model provider set in the runtime.
 * 
 * @param {string} prompt - The prompt for which completion is being performed.
 * @param {IAgentRuntime} runtime - The runtime object containing the model provider information.
 * @returns {Promise<string>} The completed prompt based on the model provider.
 * @throws {Error} If an error occurs during completion logic.
 */
    async completion(prompt: string, runtime: IAgentRuntime): Promise<string> {
        try {
            await this.initialize(runtime);

            if (runtime.modelProvider === ModelProviderName.OLLAMA) {
                return await this.ollamaCompletion(prompt);
            }

            return await this.localCompletion(prompt);
        } catch (error) {
            elizaLogger.error("Error in completion:", error);
            throw error;
        }
    }

/**
 * Asynchronously generates an embedding for the input text using the specified runtime.
 * If the model provider is OLLAMA, it generates embedding using OLLAMA.
 * Otherwise, it falls back to generating embedding locally.
 * 
 * @param {string} text - The input text for which embedding needs to be generated.
 * @param {IAgentRuntime} runtime - The runtime environment for generating the embedding.
 * @returns {Promise<number[]>} - A promise that resolves to an array of numbers representing the embedding.
 * @throws {Error} - If an error occurs during the embedding generation process.
 */
    async embedding(text: string, runtime: IAgentRuntime): Promise<number[]> {
        try {
            await this.initialize(runtime);

            if (runtime.modelProvider === ModelProviderName.OLLAMA) {
                return await this.ollamaEmbedding(text);
            }

            return await this.localEmbedding(text);
        } catch (error) {
            elizaLogger.error("Error in embedding:", error);
            throw error;
        }
    }

/**
 * Fetches completion response from Ollama API or local model.
 * @param {string} context - The input context for the completion.
 * @param {number} temperature - The temperature value for generating responses.
 * @param {string[]} stop - The list of stop words to end the completion process.
 * @param {number} frequency_penalty - The penalty for repeated frequency of tokens.
 * @param {number} presence_penalty - The penalty for the presence of tokens.
 * @param {number} max_tokens - The maximum number of tokens to generate in the response.
 * @param {boolean} useGrammar - Flag to indicate whether to use grammar rules.
 * @returns {Promise<any | string>} The completion response from the Ollama API or local model.
 */
    private async getCompletionResponse(
        context: string,
        temperature: number,
        stop: string[],
        frequency_penalty: number,
        presence_penalty: number,
        max_tokens: number,
        useGrammar: boolean
    ): Promise<any | string> {
        const ollamaModel = process.env.OLLAMA_MODEL;
        if (ollamaModel) {
            const ollamaUrl =
                process.env.OLLAMA_SERVER_URL || "http://localhost:11434";
            elizaLogger.info(
                `Using Ollama API at ${ollamaUrl} with model ${ollamaModel}`
            );

            const response = await fetch(`${ollamaUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: ollamaModel,
                    prompt: context,
                    stream: false,
                    options: {
                        temperature,
                        stop,
                        frequency_penalty,
                        presence_penalty,
                        num_predict: max_tokens,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Ollama request failed: ${response.statusText}`
                );
            }

            const result = await response.json();
            return useGrammar ? { content: result.response } : result.response;
        }

        // Use local GGUF model
        if (!this.sequence) {
            throw new Error("Model not initialized.");
        }

        const tokens = this.model!.tokenize(context);

        // tokenize the words to punish
        const wordsToPunishTokens = wordsToPunish
            .map((word) => this.model!.tokenize(word))
            .flat();

        const repeatPenalty: LlamaContextSequenceRepeatPenalty = {
            punishTokens: () => wordsToPunishTokens,
            penalty: 1.2,
            frequencyPenalty: frequency_penalty,
            presencePenalty: presence_penalty,
        };

        const responseTokens: Token[] = [];

        for await (const token of this.sequence.evaluate(tokens, {
            temperature: Number(temperature),
            repeatPenalty: repeatPenalty,
            grammarEvaluationState: useGrammar ? this.grammar : undefined,
            yieldEogToken: false,
        })) {
            const current = this.model.detokenize([...responseTokens, token]);
            if ([...stop].some((s) => current.includes(s))) {
                elizaLogger.info("Stop sequence found");
                break;
            }

            responseTokens.push(token);
            process.stdout.write(this.model!.detokenize([token]));
            if (useGrammar) {
                if (current.replaceAll("\n", "").includes("}```")) {
                    elizaLogger.info("JSON block found");
                    break;
                }
            }
            if (responseTokens.length > max_tokens) {
                elizaLogger.info("Max tokens reached");
                break;
            }
        }

        const response = this.model!.detokenize(responseTokens);

        if (!response) {
            throw new Error("Response is undefined");
        }

        if (useGrammar) {
            // extract everything between ```json and ```
            let jsonString = response.match(/```json(.*?)```/s)?.[1].trim();
            if (!jsonString) {
                // try parsing response as JSON
                try {
                    jsonString = JSON.stringify(JSON.parse(response));
                } catch {
                    throw new Error("JSON string not found");
                }
            }
            try {
                const parsedResponse = JSON.parse(jsonString);
                if (!parsedResponse) {
                    throw new Error("Parsed response is undefined");
                }
                await this.sequence.clearHistory();
                return parsedResponse;
            } catch (error) {
                elizaLogger.error("Error parsing JSON:", error);
            }
        } else {
            await this.sequence.clearHistory();
            return response;
        }
    }

/**
 * Asynchronously retrieves embedding response for the given input string.
 * 
 * @param {string} input The input string for which embedding response is requested.
 * @returns {Promise<number[] | undefined>} The embedding response as an array of numbers, or undefined if unsuccessful.
 */
    async getEmbeddingResponse(input: string): Promise<number[] | undefined> {
        const ollamaModel = process.env.OLLAMA_MODEL;
        if (ollamaModel) {
            const ollamaUrl =
                process.env.OLLAMA_SERVER_URL || "http://localhost:11434";
            const embeddingModel =
                process.env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large";
            elizaLogger.info(
                `Using Ollama API for embeddings with model ${embeddingModel} (base: ${ollamaModel})`
            );

            const response = await fetch(`${ollamaUrl}/api/embeddings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: embeddingModel,
                    prompt: input,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Ollama embeddings request failed: ${response.statusText}`
                );
            }

            const result = await response.json();
            return result.embedding;
        }

        // Use local GGUF model
        if (!this.sequence) {
            throw new Error("Sequence not initialized");
        }

        const ollamaUrl =
            process.env.OLLAMA_SERVER_URL || "http://localhost:11434";
        const embeddingModel =
            process.env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large";
        elizaLogger.info(
            `Using Ollama API for embeddings with model ${embeddingModel} (base: ${this.ollamaModel})`
        );

        const response = await fetch(`${ollamaUrl}/api/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                input: input,
                model: embeddingModel,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get embedding: ${response.statusText}`);
        }

        const embedding = await response.json();
        return embedding.vector;
    }

/**
 * Calls Ollama API to generate a completion based on the provided prompt.
 * @param {string} prompt - The prompt for generating the completion.
 * @returns {Promise<string>} A promise that resolves to the generated completion response.
 */
    private async ollamaCompletion(prompt: string): Promise<string> {
        const ollamaModel = process.env.OLLAMA_MODEL;
        const ollamaUrl =
            process.env.OLLAMA_SERVER_URL || "http://localhost:11434";
        elizaLogger.info(
            `Using Ollama API at ${ollamaUrl} with model ${ollamaModel}`
        );

        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: ollamaModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    stop: ["\n"],
                    frequency_penalty: 0.5,
                    presence_penalty: 0.5,
                    num_predict: 256,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.response;
    }

/**
 * Retrieves an embedding for the given text using Ollama API.
 * @param {string} text - The input text to generate embedding for.
 * @returns {Promise<number[]>} An array of numbers representing the embedding for the input text.
 */
    private async ollamaEmbedding(text: string): Promise<number[]> {
        const ollamaModel = process.env.OLLAMA_MODEL;
        const ollamaUrl =
            process.env.OLLAMA_SERVER_URL || "http://localhost:11434";
        const embeddingModel =
            process.env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large";
        elizaLogger.info(
            `Using Ollama API for embeddings with model ${embeddingModel} (base: ${ollamaModel})`
        );

        const response = await fetch(`${ollamaUrl}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: embeddingModel,
                prompt: text,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Ollama embeddings request failed: ${response.statusText}`
            );
        }

        const result = await response.json();
        return result.embedding;
    }

/**
 * Asynchronously generate a local completion for a given prompt.
 * @param {string} prompt - The prompt to generate a completion for.
 * @returns {Promise<string>} - The generated completion response.
 * @throws {Error} - If the sequence is not initialized or if the response is undefined.
 */
    private async localCompletion(prompt: string): Promise<string> {
        if (!this.sequence) {
            throw new Error("Sequence not initialized");
        }

        const tokens = this.model!.tokenize(prompt);

        // tokenize the words to punish
        const wordsToPunishTokens = wordsToPunish
            .map((word) => this.model!.tokenize(word))
            .flat();

        const repeatPenalty: LlamaContextSequenceRepeatPenalty = {
            punishTokens: () => wordsToPunishTokens,
            penalty: 1.2,
            frequencyPenalty: 0.5,
            presencePenalty: 0.5,
        };

        const responseTokens: Token[] = [];

        for await (const token of this.sequence.evaluate(tokens, {
            temperature: 0.7,
            repeatPenalty: repeatPenalty,
            yieldEogToken: false,
        })) {
            const current = this.model.detokenize([...responseTokens, token]);
            if (current.includes("\n")) {
                elizaLogger.info("Stop sequence found");
                break;
            }

            responseTokens.push(token);
            process.stdout.write(this.model!.detokenize([token]));
            if (responseTokens.length > 256) {
                elizaLogger.info("Max tokens reached");
                break;
            }
        }

        const response = this.model!.detokenize(responseTokens);

        if (!response) {
            throw new Error("Response is undefined");
        }

        await this.sequence.clearHistory();
        return response;
    }

/**
 * Generates a local embedding for the given text.
 * @param {string} text - The text to generate an embedding for.
 * @returns {Promise<number[]>} The embedding vector for the given text, or undefined if the sequence is not initialized.
 * @throws {Error} If the sequence is not initialized.
 */
    private async localEmbedding(text: string): Promise<number[]> {
        if (!this.sequence) {
            throw new Error("Sequence not initialized");
        }

        const embeddingContext = await this.model.createEmbeddingContext();
        const embedding = await embeddingContext.getEmbeddingFor(text);
        return embedding?.vector ? [...embedding.vector] : undefined;
    }
}

export default LlamaService;
