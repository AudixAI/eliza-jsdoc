import path from "node:path";
import { fileURLToPath } from "url";
import { FlagEmbedding, EmbeddingModel } from "fastembed";
import elizaLogger from "./logger";

/**
 * Manages the local embedding model for generating embeddings from input strings.
 */
class LocalEmbeddingModelManager {
    private static instance: LocalEmbeddingModelManager | null;
    private model: FlagEmbedding | null = null;
    private initPromise: Promise<void> | null = null;
    private initializationLock = false;

/**
 * Private constructor.
 */
    private constructor() {}

/**
 * Retrieves the singleton instance of LocalEmbeddingModelManager.
 * If an instance does not already exist, a new one is created.
 * @returns {LocalEmbeddingModelManager} The singleton instance of LocalEmbeddingModelManager
 */
    public static getInstance(): LocalEmbeddingModelManager {
        if (!LocalEmbeddingModelManager.instance) {
            LocalEmbeddingModelManager.instance =
                new LocalEmbeddingModelManager();
        }
        return LocalEmbeddingModelManager.instance;
    }

/**
 * Retrieves the root path of the project based on the current file's path.
 * @returns {Promise<string>} A Promise that resolves to the root path of the project.
 */
    private async getRootPath(): Promise<string> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const rootPath = path.resolve(__dirname, "..");
        return rootPath.includes("/eliza/")
            ? rootPath.split("/eliza/")[0] + "/eliza/"
            : path.resolve(__dirname, "..");
    }

/**
 * Asynchronously initializes the model if it has not already been initialized.
 * If initialization is in progress, waits for it to complete.
 * Uses a lock to prevent multiple simultaneous initializations.
 * 
 * @returns A Promise that resolves once the model is initialized.
 */
    public async initialize(): Promise<void> {
        // If already initialized, return immediately
        if (this.model) {
            return;
        }

        // If initialization is in progress, wait for it
        if (this.initPromise) {
            return this.initPromise;
        }

        // Use a lock to prevent multiple simultaneous initializations
        if (this.initializationLock) {
            // Wait for current initialization to complete
            while (this.initializationLock) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return;
        }

        this.initializationLock = true;

        try {
            this.initPromise = this.initializeModel();
            await this.initPromise;
        } finally {
            this.initializationLock = false;
            this.initPromise = null;
        }
    }

/**
 * Initializes the BGE embedding model for local embedding.
 * This method checks if the code is running in a Node.js environment,
 * creates a cache directory if it does not exist,
 * and initializes the BGE embedding model with specified parameters.
 * 
 * @returns A Promise that resolves when the model is successfully initialized or rejects with an error.
 */
    private async initializeModel(): Promise<void> {
        const isNode =
            typeof process !== "undefined" &&
            process.versions != null &&
            process.versions.node != null;

        if (!isNode) {
            throw new Error("Local embedding not supported in browser");
        }

        try {
            const fs = await import("fs");
            const cacheDir = (await this.getRootPath()) + "/cache/";

            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            elizaLogger.debug("Initializing BGE embedding model...");

            this.model = await FlagEmbedding.init({
                cacheDir: cacheDir,
                model: EmbeddingModel.BGESmallENV15,
                maxLength: 512,
            });

            elizaLogger.debug("BGE model initialized successfully");
        } catch (error) {
            elizaLogger.error("Failed to initialize BGE model:", error);
            throw error;
        }
    }

/**
 * Generates an embedding for the input string using the model. If the model has not been initialized, it will be initialized before generating the embedding.
 * 
 * @param {string} input The input string to generate an embedding for.
 * @return {Promise<number[]>} The generated embedding as an array of numbers.
 * @throws {Error} If the model fails to initialize or if the embedding generation fails.
 */
    public async generateEmbedding(input: string): Promise<number[]> {
        if (!this.model) {
            await this.initialize();
        }

        if (!this.model) {
            throw new Error("Failed to initialize model");
        }

        try {
            // Let fastembed handle tokenization internally
            const embedding = await this.model.queryEmbed(input);
            // Debug the raw embedding
            elizaLogger.debug("Raw embedding from BGE:", {
                type: typeof embedding,
                isArray: Array.isArray(embedding),
                dimensions: Array.isArray(embedding)
                    ? embedding.length
                    : "not an array",
                sample: Array.isArray(embedding)
                    ? embedding.slice(0, 5)
                    : embedding,
            });
            return this.processEmbedding(embedding);
        } catch (error) {
            elizaLogger.error("Embedding generation failed:", error);
            throw error;
        }
    }

/**
 * Processes the provided embedding and returns a standardized array format.
 * 
 * @param {number[]} embedding - The embedding to process.
 * @returns {number[]} - The standardized array format of the embedding.
 * @throws {Error} - If the embedding format is unexpected or invalid.
 */
    private processEmbedding(embedding: number[]): number[] {
        let finalEmbedding: number[];

        if (
            ArrayBuffer.isView(embedding) &&
            embedding.constructor === Float32Array
        ) {
            finalEmbedding = Array.from(embedding);
        } else if (
            Array.isArray(embedding) &&
            ArrayBuffer.isView(embedding[0]) &&
            embedding[0].constructor === Float32Array
        ) {
            finalEmbedding = Array.from(embedding[0]);
        } else if (Array.isArray(embedding)) {
            finalEmbedding = embedding;
        } else {
            throw new Error(`Unexpected embedding format: ${typeof embedding}`);
        }

        finalEmbedding = finalEmbedding.map((n) => Number(n));

        if (!Array.isArray(finalEmbedding) || finalEmbedding[0] === undefined) {
            throw new Error(
                "Invalid embedding format: must be an array starting with a number"
            );
        }

        if (finalEmbedding.length !== 384) {
            elizaLogger.warn(
                `Unexpected embedding dimension: ${finalEmbedding.length}`
            );
        }

        return finalEmbedding;
    }

/**
 * Resets the state of the object by setting the model to null, initPromise to null, and initializationLock to false.
 * If the model exists, any cleanup logic can be added before setting it to null.
 * @returns {Promise<void>} A Promise that resolves when the reset operation is complete.
 */
    public async reset(): Promise<void> {
        if (this.model) {
            // Add any cleanup logic here if needed
            this.model = null;
        }
        this.initPromise = null;
        this.initializationLock = false;
    }

    // For testing purposes
/**
 * Resets the instance of LocalEmbeddingModelManager by calling the reset method 
 * and setting the instance to null.
 */
    public static resetInstance(): void {
        if (LocalEmbeddingModelManager.instance) {
            LocalEmbeddingModelManager.instance.reset();
            LocalEmbeddingModelManager.instance = null;
        }
    }
}

export default LocalEmbeddingModelManager;
