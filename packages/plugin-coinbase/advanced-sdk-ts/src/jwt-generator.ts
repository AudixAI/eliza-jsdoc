import jwt from 'jsonwebtoken';
import { BASE_URL, ALGORITHM, JWT_ISSUER } from './constants';
import crypto from 'crypto';

/**
 * Generates a JWT token for authenticating a request.
 * 
 * @param {string} requestMethod - The HTTP request method (e.g. GET, POST).
 * @param {string} requestPath - The path of the request.
 * @param {string} apiKey - The API key used for authentication.
 * @param {string} apiSecret - The API secret used for signing the JWT.
 * @returns {string} - The generated JWT token.
 */
export function generateToken(
    requestMethod: string,
    requestPath: string,
    apiKey: string,
    apiSecret: string
): string {
    const uri = `${requestMethod} ${BASE_URL}${requestPath}`;
    const payload = {
        iss: JWT_ISSUER,
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120,
        sub: apiKey,
        uri,
    };

    const header = {
        alg: ALGORITHM,
        kid: apiKey,
        nonce: crypto.randomBytes(16).toString('hex'),
    };
    const options: jwt.SignOptions = {
        algorithm: ALGORITHM as jwt.Algorithm,
        header: header,
    };

    return jwt.sign(payload, apiSecret as string, options);
}
