import {
    elizaLogger,
    getEndpoint,
    IAgentRuntime,
    IImageDescriptionService,
    ModelProviderName,
    models,
    Service,
    ServiceType,
} from "@elizaos/core";
import {
    AutoProcessor,
    AutoTokenizer,
    env,
    Florence2ForConditionalGeneration,
    Florence2Processor,
    PreTrainedModel,
    PreTrainedTokenizer,
    RawImage,
    type Tensor,
} from "@huggingface/transformers";
import fs from "fs";
import gifFrames from "gif-frames";
import os from "os";
import path from "path";

const IMAGE_DESCRIPTION_PROMPT =
    "Describe this image and give it a title. The first line should be the title, and then a line break, then a detailed description of the image. Respond with the format 'title\\ndescription'";

/**
 * Interface representing an image provider that can interact with images.
 * @interface
 */

interface ImageProvider {
    initialize(): Promise<void>;
    describeImage(
        imageData: Buffer,
        mimeType: string
    ): Promise<{ title: string; description: string }>;
}

// Utility functions
const convertToBase64DataUrl = (
    imageData: Buffer,
    mimeType: string
): string => {
    const base64Data = imageData.toString("base64");
    return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Handles errors from API responses.
 * @param {Response} response - The response object from the API call.
 * @param {string} provider - The name of the API provider.
 * @returns {Promise<never>} - A promise that never resolves, throwing an Error with the HTTP status.
 */
const handleApiError = async (
    response: Response,
    provider: string
): Promise<never> => {
    const responseText = await response.text();
    elizaLogger.error(
        `${provider} API error:`,
        response.status,
        "-",
        responseText
    );
    throw new Error(`HTTP error! status: ${response.status}`);
};

const parseImageResponse = (
    text: string
): { title: string; description: string } => {
    const [title, ...descriptionParts] = text.split("\n");
    return { title, description: descriptionParts.join("\n") };
};

/**
 * Class representing a local image provider that implements the Image Provider interface.
 * @implements { ImageProvider }
 */
class LocalImageProvider implements ImageProvider {
    private model: PreTrainedModel | null = null;
    private processor: Florence2Processor | null = null;
    private tokenizer: PreTrainedTokenizer | null = null;
    private modelId: string = "onnx-community/Florence-2-base-ft";

/**
 * Asynchronously initializes the image service by setting environment variables and downloading required models, processor, and tokenizer.
 *
 * @returns A Promise that resolves once the initialization is complete
 */
    async initialize(): Promise<void> {
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.backends.onnx.logLevel = "fatal";
        env.backends.onnx.wasm.proxy = false;
        env.backends.onnx.wasm.numThreads = 1;

        elizaLogger.info("Downloading Florence model...");
        this.model = await Florence2ForConditionalGeneration.from_pretrained(
            this.modelId,
            {
                device: "gpu",
                progress_callback: (progress) => {
                    if (progress.status === "downloading") {
                        const percent = (
                            (progress.loaded / progress.total) *
                            100
                        ).toFixed(1);
                        const dots = ".".repeat(
                            Math.floor(Number(percent) / 5)
                        );
                        elizaLogger.info(
                            `Downloading Florence model: [${dots.padEnd(20, " ")}] ${percent}%`
                        );
                    }
                },
            }
        );

        elizaLogger.info("Downloading processor...");
        this.processor = (await AutoProcessor.from_pretrained(
            this.modelId
        )) as Florence2Processor;

        elizaLogger.info("Downloading tokenizer...");
        this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
        elizaLogger.success("Image service initialization complete");
    }

/**
 * Asynchronously describes an image based on the provided image data.
 *
 * @param {Buffer} imageData - The image data in Buffer format.
 * @returns {Promise<{ title: string; description: string }>} An object containing the title and description of the image.
 * @throws {Error} If model components are not initialized.
 */
    async describeImage(
        imageData: Buffer
    ): Promise<{ title: string; description: string }> {
        if (!this.model || !this.processor || !this.tokenizer) {
            throw new Error("Model components not initialized");
        }

        const base64Data = imageData.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64Data}`;
        const image = await RawImage.fromURL(dataUrl);
        const visionInputs = await this.processor(image);
        const prompts = this.processor.construct_prompts("<DETAILED_CAPTION>");
        const textInputs = this.tokenizer(prompts);

        elizaLogger.log("Generating image description");
        const generatedIds = (await this.model.generate({
            ...textInputs,
            ...visionInputs,
            max_new_tokens: 256,
        })) as Tensor;

        const generatedText = this.tokenizer.batch_decode(generatedIds, {
            skip_special_tokens: false,
        })[0];

        const result = this.processor.post_process_generation(
            generatedText,
            "<DETAILED_CAPTION>",
            image.size
        );

        const detailedCaption = result["<DETAILED_CAPTION>"] as string;
        return { title: detailedCaption, description: detailedCaption };
    }
}

/**
 * Class representing an image provider that uses OpenAI API to describe images.
 * @implements { ImageProvider }
 */
class OpenAIImageProvider implements ImageProvider {
/**
 * Constructor for creating an instance of the class.
 * * @param runtime - The runtime object that implements the IAgentRuntime interface.
 */
    constructor(private runtime: IAgentRuntime) {}

/**
 * Asynchronously initializes something.
 * @returns A Promise that resolves to void when initialization is complete.
 */
    async initialize(): Promise<void> {}

/**
 * Asynchronously describes an image using the OpenAI API.
 *
 * @param {Buffer} imageData - The image data to be described.
 * @param {string} mimeType - The MIME type of the image.
 * @returns {Promise<{ title: string; description: string }>} The title and description of the image.
 */
    async describeImage(
        imageData: Buffer,
        mimeType: string
    ): Promise<{ title: string; description: string }> {
        const imageUrl = convertToBase64DataUrl(imageData, mimeType);

        const content = [
            { type: "text", text: IMAGE_DESCRIPTION_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
        ];

        const endpoint =
            this.runtime.imageVisionModelProvider === ModelProviderName.OPENAI
                ? getEndpoint(this.runtime.imageVisionModelProvider)
                : "https://api.openai.com/v1";

        const response = await fetch(endpoint + "/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.runtime.getSetting("OPENAI_API_KEY")}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content }],
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            await handleApiError(response, "OpenAI");
        }

        const data = await response.json();
        return parseImageResponse(data.choices[0].message.content);
    }
}

/**
 * Class representing a Google Image Provider that implements the ImageProvider interface.
 */

class GoogleImageProvider implements ImageProvider {
/**
 * Constructor for creating an instance of a class with the specified runtime.
 * * @param { IAgentRuntime } runtime - The runtime to be injected into the class instance.
 */
    constructor(private runtime: IAgentRuntime) {}

/**
 * Asynchronously initializes the object.
 * * @returns A Promise that resolves when the initialization is complete.
 */
    async initialize(): Promise<void> {}

/**
 * Describe an image using the Google Generative AI API.
 *
 * This method takes image data and its MIME type, sends a request to the Google Generative AI API,
 * and returns a promise that resolves to an object with the title and description of the generated content.
 *
 * @param {Buffer} imageData The image data to describe.
 * @param {string} mimeType The MIME type of the image.
 * @returns {Promise<{title: string, description: string}>} A promise that resolves to an object
 * with the title and description of the generated content.
 */
    async describeImage(
        imageData: Buffer,
        mimeType: string
    ): Promise<{ title: string; description: string }> {
        const endpoint = getEndpoint(ModelProviderName.GOOGLE);
        const apiKey = this.runtime.getSetting("GOOGLE_GENERATIVE_AI_API_KEY");

        const response = await fetch(
            `${endpoint}/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: IMAGE_DESCRIPTION_PROMPT },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: imageData.toString("base64"),
                                    },
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            await handleApiError(response, "Google Gemini");
        }

        const data = await response.json();
        return parseImageResponse(data.candidates[0].content.parts[0].text);
    }
}

/**
 * Represents a service for describing images.
  * Provides methods for initializing the service, loading image data, extracting the first frame from a GIF image,
  * and describing an image by providing a title and description.
  *
  * @implements {IImageDescriptionService}
 */
export class ImageDescriptionService
    extends Service
    implements IImageDescriptionService
{
    static serviceType: ServiceType = ServiceType.IMAGE_DESCRIPTION;

    private initialized: boolean = false;
    private runtime: IAgentRuntime | null = null;
    private provider: ImageProvider | null = null;

/**
 * Get an instance of the ImageDescriptionService.
 * @returns {IImageDescriptionService} An instance of the ImageDescriptionService.
 */
    getInstance(): IImageDescriptionService {
        return ImageDescriptionService.getInstance();
    }

/**
 * Initialize the ImageDescriptionService with the provided runtime.
 *
 * @param {IAgentRuntime} runtime - The runtime object for the agent.
 * @returns {Promise<void>} A promise that resolves once the initialization is complete.
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        elizaLogger.log("Initializing ImageDescriptionService");
        this.runtime = runtime;
    }

/**
 * Initializes the image provider based on the runtime configuration.
 * Throws an error if runtime is not provided.
 * Supported image vision model providers include LLAMALOCAL, GOOGLE, and OPENAI.
 * Initializes the provider and sets the 'initialized' flag to true.
 * @returns A Promise that resolves once the provider is initialized.
 */
    private async initializeProvider(): Promise<void> {
        if (!this.runtime) {
            throw new Error("Runtime is required for image recognition");
        }

        const model = models[this.runtime?.character?.modelProvider];

        if (this.runtime.imageVisionModelProvider) {
            if (
                this.runtime.imageVisionModelProvider ===
                ModelProviderName.LLAMALOCAL
            ) {
                this.provider = new LocalImageProvider();
                elizaLogger.debug("Using llama local for vision model");
            } else if (
                this.runtime.imageVisionModelProvider ===
                ModelProviderName.GOOGLE
            ) {
                this.provider = new GoogleImageProvider(this.runtime);
                elizaLogger.debug("Using google for vision model");
            } else if (
                this.runtime.imageVisionModelProvider ===
                ModelProviderName.OPENAI
            ) {
                this.provider = new OpenAIImageProvider(this.runtime);
                elizaLogger.debug("Using openai for vision model");
            } else {
                elizaLogger.error(
                    `Unsupported image vision model provider: ${this.runtime.imageVisionModelProvider}`
                );
            }
        } else if (model === models[ModelProviderName.LLAMALOCAL]) {
            this.provider = new LocalImageProvider();
            elizaLogger.debug("Using llama local for vision model");
        } else if (model === models[ModelProviderName.GOOGLE]) {
            this.provider = new GoogleImageProvider(this.runtime);
            elizaLogger.debug("Using google for vision model");
        } else {
            elizaLogger.debug("Using default openai for vision model");
            this.provider = new OpenAIImageProvider(this.runtime);
        }

        await this.provider.initialize();
        this.initialized = true;
    }

/**
 * Asynchronously loads image data from the given imageUrl.
 * If the imageUrl ends with '.gif', the function extracts the first frame from the gif, reads the image data,
 * sets mimeType to 'image/png', and cleans up the temp file.
 * If the imageUrl does not end with '.gif':
 *  - If the file exists locally, reads the file data, determines mimeType based on the extension (if available) or sets it to 'image/jpeg'.
 *  - If the file does not exist locally, fetches the data, validates the response, reads the data, sets mimeType based on the content-type header or defaults to 'image/jpeg'.
 * Upon successful loading of the image data, returns an object containing the image data as a Buffer and the mimeType.
 * Throws an error if the imageURL is invalid or if failed to load the image data.
 *
 * @param imageUrl - The URL or local path of the image to load
 * @returns A Promise that resolves to an object containing the image data as a Buffer and the mimeType
 */
    private async loadImageData(
        imageUrl: string
    ): Promise<{ data: Buffer; mimeType: string }> {
        const isGif = imageUrl.toLowerCase().endsWith(".gif");
        let imageData: Buffer;
        let mimeType: string;

        if (isGif) {
            const { filePath } = await this.extractFirstFrameFromGif(imageUrl);
            imageData = fs.readFileSync(filePath);
            mimeType = "image/png";
            fs.unlinkSync(filePath); // Clean up temp file
        } else {
            if (fs.existsSync(imageUrl)) {
                imageData = fs.readFileSync(imageUrl);
                const ext = path.extname(imageUrl).slice(1);
                mimeType = ext ? `image/${ext}` : "image/jpeg";
            } else {
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch image: ${response.statusText}`
                    );
                }
                imageData = Buffer.from(await response.arrayBuffer());
                mimeType = response.headers.get("content-type") || "image/jpeg";
            }
        }

        if (!imageData || imageData.length === 0) {
            throw new Error("Failed to fetch image data");
        }

        return { data: imageData, mimeType };
    }

/**
 * Extracts the first frame from a GIF at the specified URL and saves it as a PNG file.
 * @param {string} gifUrl - The URL of the GIF to extract the first frame from.
 * @returns {Promise<{ filePath: string }>} A Promise that resolves with the file path of the saved PNG file containing the first frame.
 */
    private async extractFirstFrameFromGif(
        gifUrl: string
    ): Promise<{ filePath: string }> {
        const frameData = await gifFrames({
            url: gifUrl,
            frames: 1,
            outputType: "png",
        });

        const tempFilePath = path.join(
            os.tmpdir(),
            `gif_frame_${Date.now()}.png`
        );

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(tempFilePath);
            frameData[0].getImage().pipe(writeStream);
            writeStream.on("finish", () => resolve({ filePath: tempFilePath }));
            writeStream.on("error", reject);
        });
    }

/**
 * Asynchronously describes an image by taking its URL, fetching and analyzing the image data, and returning a title and description.
 *
 * @param {string} imageUrl - The URL of the image to describe.
 * @returns {Promise<{ title: string; description: string }>} - A promise that resolves to an object containing the title and description of the image.
 */
    async describeImage(
        imageUrl: string
    ): Promise<{ title: string; description: string }> {
        if (!this.initialized) {
            await this.initializeProvider();
        }

        try {
            const { data, mimeType } = await this.loadImageData(imageUrl);
            return await this.provider!.describeImage(data, mimeType);
        } catch (error) {
            elizaLogger.error("Error in describeImage:", error);
            throw error;
        }
    }
}

export default ImageDescriptionService;
