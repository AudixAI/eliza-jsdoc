/**
 * Asynchronously retrieves or creates a recommender in the backend service.
 * 
 * @param {string} recommenderId - The ID of the recommender.
 * @param {string} username - The username associated with the recommender.
 * @param {string} backendToken - The token for backend authorization.
 * @param {string} backend - The backend URL.
 * @param {number} retries - The number of retry attempts (default is 3).
 * @param {number} delayMs - The delay in milliseconds between retry attempts (default is 2000).
 * @returns {Promise<Object>} - The data retrieved from the backend.
 */
export async function getOrCreateRecommenderInBe(
    recommenderId: string,
    username: string,
    backendToken: string,
    backend: string,
    retries = 3,
    delayMs = 2000
) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(
                `${backend}/api/updaters/getOrCreateRecommender`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${backendToken}`,
                    },
                    body: JSON.stringify({
                        recommenderId: recommenderId,
                        username: username,
                    }),
                }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(
                `Attempt ${attempt} failed: Error getting or creating recommender in backend`,
                error
            );
            if (attempt < retries) {
                console.log(`Retrying in ${delayMs} ms...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            } else {
                console.error("All attempts failed.");
            }
        }
    }
}
