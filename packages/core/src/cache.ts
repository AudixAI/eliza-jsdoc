import path from "path";
import fs from "fs/promises";
import type {
    CacheOptions,
    ICacheManager,
    IDatabaseCacheAdapter,
    UUID,
} from "./types";

/**
 * Interface for a cache adapter that stores key-value pairs.
 * @interface
 */

export interface ICacheAdapter {
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}

/**
 * Interface for a cache adapter that stores key-value pairs.
 * @interface
 */
export class MemoryCacheAdapter implements ICacheAdapter {
    data: Map<string, string>;

/**
 * Constructor for creating an instance of the class.
 * @param {Map<string, string>} [initalData] - Optional initial data to be set in the instance.
 */
    constructor(initalData?: Map<string, string>) {
        this.data = initalData ?? new Map<string, string>();
    }

/**
 * Retrieves the value from the data store corresponding to the given key.
 * @param {string} key - The key to retrieve the value for.
 * @returns {Promise<string | undefined>} The value associated with the key, or undefined if the key does not exist.
 */
    async get(key: string): Promise<string | undefined> {
        return this.data.get(key);
    }

/**
 * Asynchronously sets a key-value pair in the data.
 * 
 * @param {string} key - The key to set in the data.
 * @param {string} value - The value to set for the specified key.
 * @returns {Promise<void>} - A Promise that resolves once the operation is complete.
 */
    async set(key: string, value: string): Promise<void> {
        this.data.set(key, value);
    }

/**
 * Asynchronously deletes the value associated with the provided key from the data store.
 * 
 * @param {string} key - The key of the value to be deleted.
 * @returns {Promise<void>} A promise that resolves once the value is successfully deleted.
 */
    async delete(key: string): Promise<void> {
        this.data.delete(key);
    }
}

/**
 * Class representing a filesystem cache adapter.
 * @implements {ICacheAdapter}
 */
    
export class FsCacheAdapter implements ICacheAdapter {
/**
 * Constructor for creating an instance of a class with a specified data directory.
 * 
 * @param dataDir The directory path where data will be stored or retrieved from.
 */
    constructor(private dataDir: string) {}

/**
 * Asynchronously reads the contents of a file given a key.
 * @param {string} key - The key used to identify the file.
 * @returns {Promise<string | undefined>} The contents of the file as a string if successful, otherwise undefined.
 */
    async get(key: string): Promise<string | undefined> {
        try {
            return await fs.readFile(path.join(this.dataDir, key), "utf8");
        } catch {
            // console.error(error);
            return undefined;
        }
    }

/**
 * Asynchronously sets a key-value pair in the data directory.
 * @param {string} key - The key to set.
 * @param {string} value - The value to set for the key.
 * @returns {Promise<void>} A Promise that resolves when the key-value pair is set successfully.
 */
    async set(key: string, value: string): Promise<void> {
        try {
            const filePath = path.join(this.dataDir, key);
            // Ensure the directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, value, "utf8");
        } catch (error) {
            console.error(error);
        }
    }

/**
 * Asynchronously deletes the file located at the given key in the data directory.
 * 
 * @param {string} key - The key to locate the file in the data directory.
 * @returns {Promise<void>} A Promise that resolves when the file is successfully deleted.
 */
    async delete(key: string): Promise<void> {
        try {
            const filePath = path.join(this.dataDir, key);
            await fs.unlink(filePath);
        } catch {
            // console.error(error);
        }
    }
}

/**
 * Implementation of the ICacheAdapter interface that uses a database as the caching mechanism.
 * @implements {ICacheAdapter}
 */
           
export class DbCacheAdapter implements ICacheAdapter {
/**
 * Constructor for creating a new instance of a class.
 * @param {IDatabaseCacheAdapter} db - The database cache adapter to be used.
 * @param {UUID} agentId - The UUID of the agent.
 */
    constructor(
        private db: IDatabaseCacheAdapter,
        private agentId: UUID
    ) {}

/**
 * Retrieve a value from the cache using the specified key.
 * 
 * @param {string} key - The key to retrieve the value for.
 * @returns {Promise<string | undefined>} The value associated with the key, or undefined if not found.
 */ 

    async get(key: string): Promise<string | undefined> {
        return this.db.getCache({ agentId: this.agentId, key });
    }

/**
 * Asynchronously sets a key-value pair in the cache for the current agent.
 * 
 * @param {string} key - The key to set in the cache.
 * @param {string} value - The value to associate with the key in the cache.
 * @returns {Promise<void>} - A promise that resolves when the key-value pair is successfully set in the cache.
 */
    async set(key: string, value: string): Promise<void> {
        await this.db.setCache({ agentId: this.agentId, key, value });
    }

/**
 * Asynchronously deletes a key from the cache for the current agent.
 * 
 * @param {string} key - The key to be deleted from the cache.
 * @returns {Promise<void>} - A Promise that resolves once the key is deleted from the cache.
 */
    async delete(key: string): Promise<void> {
        await this.db.deleteCache({ agentId: this.agentId, key });
    }
}

/**
 * CacheManager class for managing cache operations.
 * @template CacheAdapter - The type of cache adapter to use.
 */
export class CacheManager<CacheAdapter extends ICacheAdapter = ICacheAdapter>
    implements ICacheManager
{
    adapter: CacheAdapter;

/**
 * Initializes a new instance of the class with the specified cache adapter.
 * 
 * @param {CacheAdapter} adapter The cache adapter to use.
 */
    constructor(adapter: CacheAdapter) {
        this.adapter = adapter;
    }

/**
 * Asynchronously retrieves a value from the cache using the provided key.
 * 
 * @param {string} key - The key to look up in the cache.
 * @returns {Promise<T | undefined>} A Promise that resolves to the value associated with the key, or undefined if the key does not exist or the value has expired.
 */
    async get<T = unknown>(key: string): Promise<T | undefined> {
        const data = await this.adapter.get(key);

        if (data) {
            const { value, expires } = JSON.parse(data) as {
                value: T;
                expires: number;
            };

            if (!expires || expires > Date.now()) {
                return value;
            }

            this.adapter.delete(key).catch(() => {});
        }

        return undefined;
    }

/**
 * Set a key-value pair in the cache.
 * @param {string} key - The key to set in the cache.
 * @param {T} value - The value to associate with the key.
 * @param {CacheOptions} [opts] - Additional options for setting the cache.
 * @returns {Promise<void>} A promise that resolves once the key-value pair is set in the cache.
 */
    async set<T>(key: string, value: T, opts?: CacheOptions): Promise<void> {
        return this.adapter.set(
            key,
            JSON.stringify({ value, expires: opts?.expires ?? 0 })
        );
    }

/**
 * Asynchronously deletes the value associated with the given key.
 * @param {string} key - The key of the value to delete.
 * @returns {Promise<void>} A Promise that resolves once the value is deleted.
 */
    async delete(key: string): Promise<void> {
        return this.adapter.delete(key);
    }
}
