import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import type { IAgentRuntime } from "@elizaos/core";

// ipfs pinning service: https://storj.dev/dcs/api/storj-ipfs-pinning
/**
 * StorjProvider class for interacting with Storj IPFS API.
 * @constructor
 * @param {IAgentRuntime} runtime - The runtime object providing access to settings.
 */
class StorjProvider {
    private STORJ_API_URL: string = "https://www.storj-ipfs.com";
    private STORJ_API_USERNAME: string;
    private STORJ_API_PASSWORD: string;
    private baseURL: string;
    private client: AxiosInstance;

/**
 * Constructor function for setting up a new instance of the class.
 * 
 * @param {IAgentRuntime} runtime - The runtime object for accessing settings.
 */
    constructor(runtime: IAgentRuntime) {
        this.STORJ_API_USERNAME = runtime.getSetting("STORJ_API_USERNAME")!;
        this.STORJ_API_PASSWORD = runtime.getSetting("STORJ_API_PASSWORD")!;
        this.baseURL = `${this.STORJ_API_URL}/api/v0`;
        this.client = this.createClient();
    }

/**
 * Create a new Axios client with the specified baseURL and authentication credentials.
 * @returns {AxiosInstance} The created Axios client instance.
 */
    private createClient(): AxiosInstance {
        return axios.create({
            baseURL: this.baseURL,
            auth: {
                username: this.STORJ_API_USERNAME,
                password: this.STORJ_API_PASSWORD,
            },
        });
    }

/**
* Generates a hash from a given URI or hash.
*
* @param {string} uriOrHash - The URI or hash to generate a hash from.
* @returns {string} The generated hash.
*/
    private hash(uriOrHash: string): string {
        return typeof uriOrHash === "string" && uriOrHash.startsWith("ipfs://")
            ? uriOrHash.split("ipfs://")[1]
            : uriOrHash;
    }

/**
 * Concatenates the STORJ_API_URL with the hashed URI or hash to generate the gateway URL.
 * 
 * @param {string} uriOrHash - The URI or hash to be hashed and concatenated with the STORJ_API_URL.
 * @returns {string} The generated gateway URL.
 */
    public gatewayURL(uriOrHash: string): string {
        return `${this.STORJ_API_URL}/ipfs/${this.hash(uriOrHash)}`;
    }

/**
 * Asynchronously pins a JSON object to IPFS and returns the CID of the pinned data.
 * If the input is not a string, the JSON object will be stringified before being pinned.
 * 
 * @param {any} json - The JSON object to be pinned to IPFS.
 * @returns {Promise<string>} A Promise that resolves with the CID of the pinned data.
 */
    public async pinJson(json: any): Promise<string> {
        if (typeof json !== "string") {
            json = JSON.stringify(json);
        }
        const formData = new FormData();
        formData.append("path", Buffer.from(json, "utf-8").toString());

        const headers = {
            "Content-Type": "multipart/form-data",
            ...formData.getHeaders(),
        };

        const { data } = await this.client.post(
            "add?cid-version=1",
            formData.getBuffer(),
            { headers }
        );

        return this.gatewayURL(data.Hash);
    }

/**
 * Uploads a file and returns the hash value associated with it.
 *
 * @param {Object} file - The file object containing buffer, originalname, and mimetype.
 * @param {Buffer} file.buffer - The content of the file to be uploaded.
 * @param {string} file.originalname - The original name of the file.
 * @param {string} file.mimetype - The MIME type of the file.
 * @returns {Promise<string>} The hash value associated with the uploaded file.
 */
    public async pinFile(file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }): Promise<string> {
        const formData = new FormData();
        formData.append("file", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });

        const response = await this.client.post("add?cid-version=1", formData, {
            headers: {
                "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        return this.gatewayURL(response.data.Hash);
    }
}

export default StorjProvider;
