// GitBook API response type
/**
 * Interface representing a response from a GitBook API request.
 * @typedef {Object} GitBookResponse
 * @property {Object} answer - Object containing the answer text.
 * @property {string} answer.text - The answer text.
 * @property {string} error - The error message, if an error occurred.
 */
export interface GitBookResponse {
    answer?: {
        text: string;
    };
    error?: string;
}

// Client configuration in character.json (all optional)
/**
 * Interface for GitBookKeywords with optional projectTerms and generalQueries fields.
 * @typedef {Object} GitBookKeywords
 * @property {string[]} [projectTerms] - Optional array of project terms.
 * @property {string[]} [generalQueries] - Optional array of general queries.
 */
export interface GitBookKeywords {
    projectTerms?: string[];
    generalQueries?: string[];
}

/**
 * Interface representing the configuration options for a GitBook client.
 * @typedef {object} GitBookClientConfig
 * @property {GitBookKeywords} [keywords] - Optional keywords for GitBook
 * @property {string[]} [documentTriggers] - Optional array of strings representing document triggers
 */
export interface GitBookClientConfig {
    keywords?: GitBookKeywords;
    documentTriggers?: string[];
}
