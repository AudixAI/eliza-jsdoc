

/**
 * Verifies proof by making a POST request to the specified base URL.
 *
 * @param {string} baseUrl - The base URL for the API endpoint.
 * @param {string} textID - The ID of the text to be verified.
 * @param {string} proof - The proof to be verified.
 * @returns {Promise<Object>} - A promise that resolves with the verification result as JSON.
 * @throws {Error} - If the verification process fails, an error is thrown with a descriptive message.
 */
export async function verifyProof(baseUrl: string, textID: string, proof: string) {
    const response = await fetch(`${baseUrl}/api/verify`, {
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(proof),
        method: "POST",
    });
    if (!response.ok) {
        throw new Error(`Failed to verify proof: ${response.statusText}`);
    }
    return await response.json();
}
