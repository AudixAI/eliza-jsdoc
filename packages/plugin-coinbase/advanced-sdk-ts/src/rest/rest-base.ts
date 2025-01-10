import { generateToken } from '../jwt-generator';
import fetch, { Headers, RequestInit, Response } from 'node-fetch';
import { BASE_URL, USER_AGENT } from '../constants';
import { RequestOptions } from './types/request-types';
import { handleException } from './errors';

/**
 * Represents a base class for making REST API requests.
 * @class
 */

export class RESTBase {
    private apiKey: string | undefined;
    private apiSecret: string | undefined;

/**
 * Constructor function for creating an instance of a class with optional key and secret parameters.
 * If key or secret is not provided, it logs a message indicating that only public endpoints are accessible.
 *
 * @param {string} [key] - Optional API key for authentication.
 * @param {string} [secret] - Optional API secret for authentication.
 */
    constructor(key?: string, secret?: string) {
        if (!key || !secret) {
            console.log(
                'Could not authenticate. Only public endpoints accessible.'
            );
        }
        this.apiKey = key;
        this.apiSecret = secret;
    }

/**
 * Makes a request using the provided options.
 * 
 * @param {RequestOptions} options - The request options including method, endpoint, isPublic, queryParams, and bodyParams.
 * @returns {Promise<any>} - A promise that resolves with the result of the request.
 */
    request(options: RequestOptions): Promise<any> {
        const { method, endpoint, isPublic } = options;
        let { queryParams, bodyParams } = options;

        queryParams = queryParams ? this.filterParams(queryParams) : {};

        if (bodyParams !== undefined)
            bodyParams = bodyParams ? this.filterParams(bodyParams) : {};

        return this.prepareRequest(
            method,
            endpoint,
            queryParams,
            bodyParams,
            isPublic
        );
    }

/**
 * Prepares a request to be sent to the specified URL with the given HTTP method, query parameters, body parameters, and public access status.
 * 
 * @param {string} httpMethod - The HTTP method to use for the request.
 * @param {string} urlPath - The URL path to send the request to.
 * @param {Record<string, any>} [queryParams] - Optional query parameters to include in the request.
 * @param {Record<string, any>} [bodyParams] - Optional body parameters to include in the request.
 * @param {boolean} [isPublic] - Flag indicating whether the request is intended for public access.
 * @returns {Promise<Response>} A promise that resolves with the response to the request.
 */
    prepareRequest(
        httpMethod: string,
        urlPath: string,
        queryParams?: Record<string, any>,
        bodyParams?: Record<string, any>,
        isPublic?: boolean
    ) {
        const headers: Headers = this.setHeaders(httpMethod, urlPath, isPublic);

        const requestOptions: RequestInit = {
            method: httpMethod,
            headers: headers,
            body: JSON.stringify(bodyParams),
        };

        const queryString = this.buildQueryString(queryParams);
        const url = `https://${BASE_URL}${urlPath}${queryString}`;

        return this.sendRequest(headers, requestOptions, url);
    }

/**
 * Asynchronously sends a request to the specified URL with the provided headers and options.
 * @param {Headers} headers - The headers to include in the request.
 * @param {RequestInit} requestOptions - The options for the request.
 * @param {string} url - The URL to send the request to.
 * @returns {Promise<string>} A Promise that resolves with the response text from the request.
 */
    async sendRequest(
        headers: Headers,
        requestOptions: RequestInit,
        url: string
    ) {
        const response: Response = await fetch(url, requestOptions);
        const responseText = await response.text();
        handleException(response, responseText, response.statusText);

        return responseText;
    }

/**
 * Set headers for making a HTTP request.
 * 
 * @param {string} httpMethod - The HTTP method to be used for the request.
 * @param {string} urlPath - The URL path to send the request to.
 * @param {boolean} [isPublic] - Flag indicating if the endpoint is public or requires authentication.
 * @returns {Headers} - The headers object containing necessary headers for the request.
 */
    setHeaders(httpMethod: string, urlPath: string, isPublic?: boolean) {
        const headers: Headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('User-Agent', USER_AGENT);
        if (this.apiKey !== undefined && this.apiSecret !== undefined)
            headers.append(
                'Authorization',
                `Bearer ${generateToken(
                    httpMethod,
                    urlPath,
                    this.apiKey,
                    this.apiSecret
                )}`
            );
        else if (isPublic == undefined || isPublic == false)
            throw new Error(
                'Attempting to access authenticated endpoint with invalid API_KEY or API_SECRET.'
            );

        return headers;
    }

/**
 * Filters out any undefined values from the input data object and returns a new object with only defined values.
 * 
 * @param {Record<string, any>} data - The input data object to filter.
 * @returns {Record<string, any>} The filtered data object without undefined values.
 */
    filterParams(data: Record<string, any>) {
        const filteredParams: Record<string, any> = {};

        for (const key in data) {
            if (data[key] !== undefined) {
                filteredParams[key] = data[key];
            }
        }

        return filteredParams;
    }

/**
 * Builds a query string from the provided queryParams object.
 *
 * @param {Record<string, any>} [queryParams] - The query parameters.
 * @returns {string} The generated query string.
 */
    buildQueryString(queryParams?: Record<string, any>): string {
        if (!queryParams || Object.keys(queryParams).length === 0) {
            return '';
        }

        const queryString = Object.entries(queryParams)
            .flatMap(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.map(
                        (item) =>
                            `${encodeURIComponent(key)}=${encodeURIComponent(item)}`
                    );
                } else {
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                }
            })
            .join('&');

        return `?${queryString}`;
    }
}
