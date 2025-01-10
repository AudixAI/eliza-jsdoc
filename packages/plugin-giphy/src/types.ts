// types.ts

/**
 * Interface representing the configuration options for the Giphy API.
 * @property {string} apiKey - The API key required to access the Giphy API.
 */
export interface GiphyConfig {
    apiKey: string;
}

/**
 * Interface for the response object returned from a GIF API call.
 * @typedef {Object} GifResponse
 * @property {Gif[]} data - Array of GIF objects.
 * @property {Object} pagination - Object containing pagination details.
 * @property {number} pagination.total_count - Total number of GIFs available.
 * @property {number} pagination.count - Number of GIFs returned in the current response.
 * @property {number} pagination.offset - Offset of the current response in the list of available GIFs.
 * @property {Object} meta - Object containing meta information about the response.
 * @property {number} meta.status - HTTP status code of the response.
 * @property {string} meta.msg - Message related to the response.
 * @property {string} meta.response_id - ID of the response.
 */
export interface GifResponse {
    data: Gif[];
    pagination: {
        total_count: number;
        count: number;
        offset: number;
    };
    meta: {
        status: number;
        msg: string;
        response_id: string;
    };
}

/**
 * Interface representing a Gif object.
 * @typedef {Object} Gif
 * @property {string} id - The unique ID of the GIF.
 * @property {string} url - The URL of the GIF on Giphy's webpage.
 * @property {string} title - The title of the GIF.
 * @property {Object} images - Object containing different image formats of the GIF.
 * @property {Object} images.original - Original image format of the GIF.
 * @property {string} images.original.url - The direct URL of the original GIF.
 * @property {string} images.original.width - The width of the original GIF.
 * @property {string} images.original.height - The height of the original GIF.
 * @property {string} images.original.size - The size of the original GIF.
 * @property {string} images.original.mp4 - The URL of the MP4 version of the GIF (optional).
 * @property {string} images.original.webp - The URL of the WebP version of the GIF (optional).
 * @property {Object} images.downsized - Downsized image format of the GIF.
 * @property {string} images.downsized.url - The URL of the downsized GIF.
 * @property {string} images.downsized.width - The width of the downsized GIF.
 * @property {string} images.downsized.height - The height of the downsized GIF.
 * @property {Object} images.fixed_height - Fixed height image format of the GIF.
 * @property {string} images.fixed_height.url - The URL of the fixed height GIF.
 * @property {string} images.fixed_height.width - The width of the fixed height GIF.
 * @property {string} images.fixed_height.height - The height of the fixed height GIF.
 */
export interface Gif {
    id: string;
    url: string; // Giphy webpage URL
    title: string;
    images: {
        original: {
            url: string; // Direct GIF URL
            width: string;
            height: string;
            size: string;
            mp4?: string;
            webp?: string;
        };
        downsized: {
            url: string;
            width: string;
            height: string;
        };
        fixed_height: {
            url: string;
            width: string;
            height: string;
        };
        // Add other image formats if needed
    };
}
