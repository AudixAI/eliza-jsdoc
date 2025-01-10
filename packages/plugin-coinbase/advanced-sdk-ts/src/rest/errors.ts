import { Response } from 'node-fetch';

/**
 * Represents an error specific to the Coinbase API.
 *
 * @class
 * @extends Error
 * @param {string} message - The error message.
 * @param {number} statusCode - The status code of the response.
 * @param {Response} response - The full response object.
 */
       
class CoinbaseError extends Error {
    statusCode: number;
    response: Response;

/**
 * Constructor for creating a new CoinbaseError instance.
 *
 * @param {string} message - The error message.
 * @param {number} statusCode - The status code associated with the error.
 * @param {Response} response - The response object associated with the error.
 */

    constructor(message: string, statusCode: number, response: Response) {
        super(message);
        this.name = 'CoinbaseError';
        this.statusCode = statusCode;
        this.response = response;
    }
}

/**
 * Handles exceptions for Coinbase API requests.
 * Throws a custom CoinbaseError if the response status indicates an error from the Coinbase API.
 *
 * @param {Response} response - The response object from the API request.
 * @param {string} responseText - The response text from the API request.
 * @param {string} reason - The reason for the error.
 */
export function handleException(
    response: Response,
    responseText: string,
    reason: string
) {
    let message: string | undefined;

    if (
        (400 <= response.status && response.status <= 499) ||
        (500 <= response.status && response.status <= 599)
    ) {
        if (
            response.status == 403 &&
            responseText.includes('"error_details":"Missing required scopes"')
        ) {
            message = `${response.status} Coinbase Error: Missing Required Scopes. Please verify your API keys include the necessary permissions.`;
        } else
            message = `${response.status} Coinbase Error: ${reason} ${responseText}`;

        throw new CoinbaseError(message, response.status, response);
    }
}
