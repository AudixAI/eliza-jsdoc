import { WEB3_STORAGE_API_HOST } from "../constants/apis";

/**
 * Interface representing the response from an upload operation.
 * @typedef {Object} UploadResponse
 * @property {boolean} success - Indicates if the upload was successful.
 * @property {string} [cid] - The content ID associated with the uploaded file.
 * @property {Object} [urls] - URLs for accessing the uploaded file.
 * @property {string} urls.direct - URL for directly accessing the uploaded file.
 * @property {string} urls.raw - URL for accessing the raw content of the uploaded file.
 * @property {string} urls.gateway - URL for accessing the uploaded file through a gateway.
 * @property {string} [type] - The type of the uploaded file.
 * @property {string} [name] - The name of the uploaded file.
 * @property {number} [size] - The size of the uploaded file in bytes.
 * @property {string} [error] - Any error message if the upload failed.
 */
interface UploadResponse {
    success: boolean;
    cid?: string;
    urls?: {
        direct: string;
        raw: string;
        gateway: string;
    };
    type?: string;
    name?: string;
    size?: number;
    error?: string;
}

/**
 * Uploads a file to Web3.storage using base64 encoded data.
 * 
 * @param {string} base64Data The base64 encoded data of the file.
 * @param {string} fileName The name of the file to be uploaded (default is "image.png").
 * @returns {Promise<UploadResponse>} A promise that resolves to the upload response object.
 */
export async function uploadFileToWeb3Storage(
    base64Data: string,
    fileName: string = "image.png"
): Promise<UploadResponse> {
    try {
        // Remove base64 URL prefix (if exists)
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

        // Convert base64 to Blob
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });

        // Create file object
        const file = new File([blob], fileName, { type: "image/png" });

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(WEB3_STORAGE_API_HOST, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const result: UploadResponse = await response.json();
        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "upload failed",
        };
    }
}
