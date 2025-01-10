/**
 * Enum representing HTTP methods.
 */
export enum method {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

/**
 * Interface representing the options for making a request.
 *
 * @typedef {Object} RequestOptions
 * @property {string} method - The HTTP method to be used for the request.
 * @property {string} endpoint - The endpoint to which the request will be sent.
 * @property {Object.<string, any>} [queryParams] - Optional query parameters to be included in the request.
 * @property {Object.<string, any>} [bodyParams] - Optional body parameters to be included in the request.
 * @property {boolean} isPublic - A boolean flag indicating if the request is intended to be a public request.
 */
export interface RequestOptions {
    method: method;
    endpoint: string;
    queryParams?: Record<string, any>;
    bodyParams?: Record<string, any>;
    isPublic: boolean;
}
