import { z } from "zod";

/**
 * Interface representing a search match in an API response.
 * @property {object} match - Object containing the start and end indices of the match.
 * @property {number} match.start - The start index of the match.
 * @property {number} match.end - The end index of the match.
 * @property {string} context - The context in which the match was found.
 */
export interface SearchMatchApi {
    match: {
        start: number;
        end: number;
    };
    context: string;
}

export const noteSchema = z.object({
    tags: z.array(z.string()).optional(),
    frontmatter: z.record(z.unknown()).optional(),
    stat: z.object({
        ctime: z.number(),
        mtime: z.number(),
        size: z.number(),
    }).nullable().optional(),
    path: z.string(),
    content: z.string().nullable().optional(),
});

/**
 * Represents the inferred type of the noteSchema.
 */
export type NoteContent = z.infer<typeof noteSchema>;

export const isValidNote = (note: unknown): note is NoteContent => {
    return noteSchema.safeParse(note).success;
};

export const fileSchema = z.object({
    path: z.string(),
    content: z.string().nullable().optional(),
    stat: z.object({
        ctime: z.number(),
        mtime: z.number(),
        size: z.number(),
    }).nullable().optional()
});

/**
 * The type definition for the content of a file based on the specified file schema.
 */
export type FileContent = z.infer<typeof fileSchema>;

export const isValidFile = (file: unknown): file is FileContent => {
    return fileSchema.safeParse(file).success;
};

/**
 * Represents a note result from the API.
 * @typedef {Object} ResultNoteApi
 * @property {string} filename - The filename of the note.
 * @property {SearchMatchApi[]} matches - Array of search matches within the note.
 * @property {number} score - The score assigned to the note result.
 */
export interface ResultNoteApi {
    filename: string;
    matches: SearchMatchApi[];
    score: number;
}

/**
 * Interface representing the response from a note search API call.
 * @interface
 * @property {string} filename - The name of the file where the note was found.
 * @property {boolean} result - Indicates if the note was found in the file or not.
 */
export interface ResultNoteSearchApi {
    filename: string;
    result: boolean;
}

/**
 * Interface representing information about a server.
 * @typedef {Object} ServerInfo
 * @property {boolean} authenticated - Indicates if the server is authenticated or not.
 * @property {boolean} ok - Indicates if the server status is okay or not.
 * @property {string} service - The name of the service on the server.
 * @property {Object} versions - Object containing version information for different components.
 * @property {string} versions.obsidian - Version of the obsidian component.
 * @property {string} versions.self - Version of the self component.
 */
export interface ServerInfo {
    authenticated: boolean;
    ok: boolean;
    service: string;
    versions: {
        obsidian: string;
        self: string;
    };
}

/**
 * Interface representing a Command.
 * @property {string} id - The unique identifier of the command.
 * @property {string} name - The name of the command.
 */
export interface Command {
    id: string;
    name: string;
}

/**
 * Interface representing the content to be patched.
 * @typedef {Object} PatchContent
 * @property {string} content - The content to be patched.
 * @property {number} line - The line number where the patch should be applied.
 */
export interface PatchContent {
    content: string;
    line: number;
}

/*
export interface NoteHierarchy {
    path: string;
    content: string;
    links: NoteHierarchy[];
}
*/

export const noteHierarchySchema = z.object({
    path: z.string(),
    content: z.string().nullable().optional(),
    links: z.lazy(() => z.array(noteHierarchySchema)).nullable().optional()
});

/**
 * Represents the inferred type of the 'noteHierarchySchema' schema.
 */
export type NoteHierarchy = z.infer<typeof noteHierarchySchema>;

export const isValidNoteHierarchy = (hierarchy: unknown): hierarchy is NoteHierarchy => {
    return noteHierarchySchema.safeParse(hierarchy).success;
};

export const searchKeywordSchema = z.object({
    query: z.string().min(1).describe("The keywords to search for"),
    options: z
        .object({
            vault: z.string().optional(),
            includeExcerpt: z.boolean().optional(),
            limit: z.number().optional(),
        })
        .optional(),
});

/**
 * Represents the inferred type of the searchKeywordSchema definition.
 */
export type SearchKeyword = z.infer<typeof searchKeywordSchema>;

/**
 * Determines if the input object is a valid SearchKeyword object.
 * @param {any} obj - The object to be checked.
 * @returns {boolean} - True if the object is a valid SearchKeyword object, false otherwise.
 */
export function isSearchKeyword(obj: any): obj is SearchKeyword {
    return searchKeywordSchema.safeParse(obj).success;
}

/**
 * Definition for the QueryFormat type which can be either 'plaintext', 'dataview', or 'jsonlogic'.
 */
export type QueryFormat = 'plaintext' | 'dataview' | 'jsonlogic';

/**
 * Interface representing options for searching.
 * @typedef { Object } SearchOptions
 * @property { number } [contextLength] - The length of context to search within.
 * @property { boolean } [ignoreCase] - Whether to ignore case when searching.
 * @property {string[] | null} [searchIn] - The array of strings to search within, or null to search in all strings.
 */
export interface SearchOptions {
    contextLength?: number;
    ignoreCase?: boolean;
    searchIn?: string[] | null;
}

/**
 * Interface representing a search query.
 * @property {string} [query] - The search query string.
 * @property {QueryFormat} [queryFormat] - The format of the search query.
 * @property {SearchOptions} [options] - Additional options for the search query.
 */
export interface SearchQuery {
    query?: string;
    queryFormat?: QueryFormat;
    options?: SearchOptions;
}

export const searchOptionsSchema = z.object({
    contextLength: z.number().optional(),
    ignoreCase: z.boolean().nullable().optional().default(true),
    searchIn: z.array(z.string()).nullable().optional().default([]),
});

export const searchQuerySchema = z.object({
    query: z.union([z.string(), z.record(z.unknown())]).describe("The query to search for"),
    queryFormat: z.enum(['plaintext', 'dataview', 'jsonlogic']).describe("The format of the query"),
    options: searchOptionsSchema.optional().describe("Search options"),
});

export const isSearchQuery = (obj: unknown): obj is SearchQuery => {
    return searchQuerySchema.safeParse(obj).success;
};
