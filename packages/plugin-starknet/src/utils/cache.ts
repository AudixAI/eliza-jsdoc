import NodeCache from "node-cache";
import fs from "fs";
import path from "path";

/**
 * Cache class for storing and retrieving data with an in-memory and file-based cache.
 * @class
 */
export class Cache {
    private cache: NodeCache;
    public cacheDir: string;

/**
 * Constructor for initializing NodeCache and setting up cache directory path.
 */
    constructor() {
        this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
        const __dirname = path.resolve();

        // Find the 'eliza' folder in the filepath and adjust the cache directory path
        const elizaIndex = __dirname.indexOf("eliza");
        if (elizaIndex !== -1) {
            const pathToEliza = __dirname.slice(0, elizaIndex + 5); // include 'eliza'
            this.cacheDir = path.join(pathToEliza, "cache");
        } else {
            this.cacheDir = path.join(__dirname, "cache");
        }

        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir);
        }
    }

/**
 * Reads data from a cache file based on the provided cache key.
 * 
 * @template T - The type of data to be returned from the cache file
 * @param {string} cacheKey - The key used to identify the cache file
 * @returns {T | null} - The data stored in the cache file, or null if the file does not exist or is expired
 */
    private readCacheFromFile<T>(cacheKey: string): T | null {
        const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const fileContent = fs.readFileSync(filePath, "utf-8");
                const parsed = JSON.parse(fileContent);
                const now = Date.now();
                if (now < parsed.expiry) {
                    return parsed.data as T;
                } else {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error(
                    `Error reading cache file for key ${cacheKey}:`,
                    error
                );
                // Delete corrupted cache file
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error(`Error deleting corrupted cache file:`, e);
                }
            }
        }
        return null;
    }

/**
 * Write data to a cache file with the given cache key.
 * @template T
 * @param {string} cacheKey - The key for the cache file.
 * @param {T} data - The data to be stored in the cache file.
 * @returns {void}
 */
    private writeCacheToFile<T>(cacheKey: string, data: T): void {
        try {
            const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
            const cacheData = {
                data: data,
                expiry: Date.now() + 300000, // 5 minutes in milliseconds
            };
            fs.writeFileSync(filePath, JSON.stringify(cacheData), "utf-8");
        } catch (error) {
            console.error(
                `Error writing cache file for key ${cacheKey}:`,
                error
            );
        }
    }

/**
 * Retrieves a value from the cache using the specified cache key.
 * @template T
 * @param {string} cacheKey - The key used to retrieve the value from the cache.
 * @returns {T | undefined} The value associated with the cache key, or undefined if not found.
 */
    public get<T>(cacheKey: string): T | undefined {
        return this.cache.get<T>(cacheKey);
    }

/**
 * Stores data in the cache using the specified cache key.
 * 
 * @template T - The type of data being stored in the cache.
 * @param {string} cacheKey - The key to store the data under in the cache.
 * @param {T} data - The data to be stored in the cache.
 * @returns {void}
 */
    public set<T>(cacheKey: string, data: T): void {
        this.cache.set(cacheKey, data);
    }

/**
 * Retrieves data from cache with the given cache key.
 * * @template T - The type of data to retrieve.
 * @param { string } cacheKey - The key to identify the data in cache.
 * @returns {T | null} - The cached data if found, otherwise null.
 */
    public getCachedData<T>(cacheKey: string): T | null {
        // Check in-memory cache first
        const cachedData = this.cache.get<T>(cacheKey);
        if (cachedData !== undefined) {
            return cachedData;
        }

        // Check file-based cache
        const fileCachedData = this.readCacheFromFile<T>(cacheKey);
        if (fileCachedData) {
            // Populate in-memory cache
            this.cache.set(cacheKey, fileCachedData);
            return fileCachedData;
        }

        return null;
    }

/**
 * Sets data in the in-memory cache and writes to file-based cache.
 * 
 * @param {string} cacheKey - The key to store the data in the cache.
 * @param {T} data - The data to be stored.
 * @returns {void}
 */
    public setCachedData<T>(cacheKey: string, data: T): void {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        this.writeCacheToFile(cacheKey, data);
    }
}
