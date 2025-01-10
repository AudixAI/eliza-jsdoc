import {
    IAgentRuntime,
    IAwsS3Service,
    Service,
    ServiceType,
    elizaLogger,
} from "@elizaos/core";
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";
import * as path from "path";

/**
 * Interface representing the result of an upload operation.
 * @typedef {Object} UploadResult
 * @property {boolean} success - A flag indicating if the upload was successful.
 * @property {string} [url] - The URL of the uploaded file. Optional.
 * @property {string} [error] - An error message in case the upload failed. Optional.
 */
interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Interface representing a JSON upload result which extends UploadResult.
 * @interface
 * @property {string} key - Optional storage key to add to the result.
 */
interface JsonUploadResult extends UploadResult {
    key?: string; // Add storage key
}

/**
 * Class representing an AWS S3 Service.
 * @extends Service
 * @implements IAwsS3Service
 */
export class AwsS3Service extends Service implements IAwsS3Service {
    static serviceType: ServiceType = ServiceType.AWS_S3;

    private s3Client: S3Client | null = null;
    private bucket: string = "";
    private fileUploadPath: string = "";
    private runtime: IAgentRuntime | null = null;

/**
 * Initializes the AwsS3Service by setting the runtime and file upload path.
 *
 * @param {IAgentRuntime} runtime - The runtime object for the agent
 * @returns {Promise<void>} A Promise that resolves once the service is initialized
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        elizaLogger.log("Initializing AwsS3Service");
        this.runtime = runtime;
        this.fileUploadPath = runtime.getSetting("AWS_S3_UPLOAD_PATH") ?? "";
    }

/**
 * Initializes the S3 client by retrieving AWS credentials from the runtime and setting up the S3 client object with the provided settings.
 * @returns {Promise<boolean>} Returns a Promise that resolves to a boolean indicating whether the S3 client was successfully initialized.
 */
    private async initializeS3Client(): Promise<boolean> {
        if (this.s3Client) return true;
        if (!this.runtime) return false;

        const AWS_ACCESS_KEY_ID = this.runtime.getSetting("AWS_ACCESS_KEY_ID");
        const AWS_SECRET_ACCESS_KEY = this.runtime.getSetting(
            "AWS_SECRET_ACCESS_KEY"
        );
        const AWS_REGION = this.runtime.getSetting("AWS_REGION");
        const AWS_S3_BUCKET = this.runtime.getSetting("AWS_S3_BUCKET");

        if (
            !AWS_ACCESS_KEY_ID ||
            !AWS_SECRET_ACCESS_KEY ||
            !AWS_REGION ||
            !AWS_S3_BUCKET
        ) {
            return false;
        }

        this.s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });
        this.bucket = AWS_S3_BUCKET;
        return true;
    }

/**
 * Uploads a file to AWS S3 bucket with optional parameters for subdirectory,
 * signed URL, and expiration time.
 * @param filePath - The path to the file to upload.
 * @param subDirectory - Optional subdirectory within the bucket to store the file.
 * @param useSignedUrl - Set to true to generate a signed URL for accessing the file.
 * @param expiresIn - Expiration time for the signed URL in seconds (default is 900 seconds).
 * @returns A Promise that resolves to an UploadResult object with success status and URL or error message.
 */
    async uploadFile(
        filePath: string,
        subDirectory: string = "",
        useSignedUrl: boolean = false,
        expiresIn: number = 900
    ): Promise<UploadResult> {
        try {
            if (!(await this.initializeS3Client())) {
                return {
                    success: false,
                    error: "AWS S3 credentials not configured",
                };
            }

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: "File does not exist",
                };
            }

            const fileContent = fs.readFileSync(filePath);

            const baseFileName = `${Date.now()}-${path.basename(filePath)}`;
            // Determine storage path based on public access
            const fileName =
                `${this.fileUploadPath}${subDirectory}/${baseFileName}`.replaceAll(
                    "//",
                    "/"
                );
            // Set upload parameters
            const uploadParams = {
                Bucket: this.bucket,
                Key: fileName,
                Body: fileContent,
                ContentType: this.getContentType(filePath),
            };

            // Upload file
            await this.s3Client.send(new PutObjectCommand(uploadParams));

            // Build result object
            const result: UploadResult = {
                success: true,
            };

            // If not using signed URL, return public access URL
            if (!useSignedUrl) {
                result.url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
            } else {
                const getObjectCommand = new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                });
                result.url = await getSignedUrl(
                    this.s3Client,
                    getObjectCommand,
                    {
                        expiresIn, // 15 minutes in seconds
                    }
                );
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    /**
     * Generate signed URL for existing file
     */
/**
 * Generates a signed URL for the specified file in the S3 bucket. 
 * @param {string} fileName - The name of the file in the S3 bucket.
 * @param {number} expiresIn - The expiry time for the signed URL in seconds. Defaults to 900 seconds.
 * @returns {Promise<string>} A promise that resolves with the signed URL for the specified file.
 * @throws {Error} Throws an error if AWS S3 credentials are not configured.
 */
    async generateSignedUrl(
        fileName: string,
        expiresIn: number = 900
    ): Promise<string> {
        if (!(await this.initializeS3Client())) {
            throw new Error("AWS S3 credentials not configured");
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: fileName,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn });
    }

    private getContentType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes: { [key: string]: string } = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        };
        return contentTypes[ext] || "application/octet-stream";
    }

    /**
     * Upload JSON object to S3
     * @param jsonData JSON data to upload
     * @param fileName File name (optional, without path)
     * @param subDirectory Subdirectory (optional)
     * @param useSignedUrl Whether to use signed URL
     * @param expiresIn Signed URL expiration time (seconds)
     */
    async uploadJson(
        jsonData: any,
        fileName?: string,
        subDirectory?: string,
        useSignedUrl: boolean = false,
        expiresIn: number = 900
    ): Promise<JsonUploadResult> {
        try {
            if (!(await this.initializeS3Client())) {
                return {
                    success: false,
                    error: "AWS S3 credentials not configured",
                };
            }

            // Validate input
            if (!jsonData) {
                return {
                    success: false,
                    error: "JSON data is required",
                };
            }

            // Generate filename (if not provided)
            const timestamp = Date.now();
            const actualFileName = fileName || `${timestamp}.json`;

            // Build complete file path
            let fullPath = this.fileUploadPath || "";
            if (subDirectory) {
                fullPath = `${fullPath}/${subDirectory}`.replace(/\/+/g, "/");
            }
            const key = `${fullPath}/${actualFileName}`.replace(/\/+/g, "/");

            // Convert JSON to string
            const jsonString = JSON.stringify(jsonData, null, 2);

            // Set upload parameters
            const uploadParams = {
                Bucket: this.bucket,
                Key: key,
                Body: jsonString,
                ContentType: "application/json",
            };

            // Upload file
            await this.s3Client.send(new PutObjectCommand(uploadParams));

            // Build result
            const result: JsonUploadResult = {
                success: true,
                key: key,
            };

            // Return corresponding URL based on requirements
            if (!useSignedUrl) {
                result.url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            } else {
                const getObjectCommand = new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                });
                result.url = await getSignedUrl(
                    this.s3Client,
                    getObjectCommand,
                    { expiresIn }
                );
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }
}

export default AwsS3Service;
