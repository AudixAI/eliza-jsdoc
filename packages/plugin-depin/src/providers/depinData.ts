import {
    type IAgentRuntime,
    type Provider,
    type Memory,
    type State,
    elizaLogger,
    ICacheManager,
} from "@elizaos/core";
import NodeCache from "node-cache";
import * as path from "path";

import type { DepinScanMetrics, DepinScanProject } from "../types/depin";

export const DEPIN_METRICS_URL =
    "https://gateway1.iotex.io/depinscan/explorer?is_latest=true";
export const DEPIN_PROJECTS_URL = "https://metrics-api.w3bstream.com/project";

/**
 * DePINScanProvider class to interact with DePINScan Metrics and Projects
 * @class
 */

export class DePINScanProvider {
    private cache: NodeCache;
    private cacheKey: string = "depin/metrics";

/**
 * Constructor for creating a new instance of the class.
 * @param {ICacheManager} cacheManager - The cache manager implementation to be used.
 */
    constructor(private cacheManager: ICacheManager) {
        this.cache = new NodeCache({ stdTTL: 3600 });
    }

/**
 * Read data from the cache for a given key.
 * 
 * @template T - The type of data to be read from the cache
 * @param {string} key - The key to use for retrieving data from the cache
 * @returns {Promise<T | null>} - A Promise that resolves with the cached data, or null if not found
 */
    private async readFromCache<T>(key: string): Promise<T | null> {
        const cached = await this.cacheManager.get<T>(
            path.join(this.cacheKey, key)
        );
        return cached;
    }

/**
 * Asynchronously writes data to the cache.
 * 
 * @template T - The type of data being written to the cache
 * @param {string} key - The key under which the data will be stored in the cache
 * @param {T} data - The data to be stored in the cache
 * @returns {Promise<void>} - A promise that resolves when the data has been written to the cache
 */ 

    private async writeToCache<T>(key: string, data: T): Promise<void> {
        await this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
    }

/**
 * Retrieves data from cache, first checking the in-memory cache and then the file-based cache if necessary.
 * 
 * @template T - The type of data being retrieved from cache
 * @param key - The key used to identify the data in cache
 * @returns A Promise that resolves to the cached data, or null if the data is not found in cache
 */
    private async getCachedData<T>(key: string): Promise<T | null> {
        // Check in-memory cache first
        const cachedData = this.cache.get<T>(key);
        if (cachedData) {
            return cachedData;
        }

        // Check file-based cache
        const fileCachedData = await this.readFromCache<T>(key);
        if (fileCachedData) {
            // Populate in-memory cache
            this.cache.set(key, fileCachedData);
            return fileCachedData;
        }

        return null;
    }

/**
 * Sets data in both in-memory cache and file-based cache.
 * 
 * @param {string} cacheKey - The key to use for caching the data.
 * @param {T} data - The data to be stored in the cache.
 * @returns {Promise<void>} A promise that resolves when the data is successfully stored in both caches.
 */
    private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(cacheKey, data);

        // Write to file-based cache
        await this.writeToCache(cacheKey, data);
    }

/**
 * Fetches the DepinScan metrics from the DEPIN_METRICS_URL
 * @returns {Promise<DepinScanMetrics>} The DepinScan metrics
 */
    private async fetchDepinscanMetrics(): Promise<DepinScanMetrics> {
        const res = await fetch(DEPIN_METRICS_URL);
        return res.json();
    }

/**
 * Fetches depinscan projects from a specified URL.
 *
 * @returns {Promise<DepinScanProject[]>} A promise that resolves with an array of DepinScanProject objects.
 */
    private async fetchDepinscanProjects(): Promise<DepinScanProject[]> {
        const res = await fetch(DEPIN_PROJECTS_URL);
        return res.json();
    }

/**
 * Asynchronously fetches and returns the daily metrics for DePINScan.
 *
 * @returns A promise that resolves with the DepinScanMetrics object representing the daily metrics.
 */
    async getDailyMetrics(): Promise<DepinScanMetrics> {
        const cacheKey = "depinscanDailyMetrics";
        const cachedData = await this.getCachedData<DepinScanMetrics>(cacheKey);
        if (cachedData) {
            console.log("Returning cached DePINScan daily metrics");
            return cachedData;
        }

        const metrics = await this.fetchDepinscanMetrics();

        this.setCachedData<DepinScanMetrics>(cacheKey, metrics);
        console.log("DePIN daily metrics cached");

        return metrics;
    }

    private abbreviateNumber = (
        value: string | number | bigint | undefined
    ): string => {
        if (value === undefined || value === null) return "";

        let num: number;

        if (typeof value === "bigint") {
            // Convert bigint to number safely for processing
            num = Number(value);
        } else if (typeof value === "number") {
            num = value;
        } else if (typeof value === "string") {
            // Parse string to number
            num = parseFloat(value);
        } else {
            return ""; // Handle unexpected types gracefully
        }

        if (isNaN(num)) return value.toString(); // Return as string if not a valid number
        if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
        return num.toString(); // Return original number as string if no abbreviation is needed
    };

/**
 * Parses an array of DepinScanProject objects and returns a 2D array of string values following a specific schema.
 * @param {DepinScanProject[]} projects - The array of DepinScanProject objects to be parsed
 * @returns {string[][]} - A 2D array of strings with values following the specified schema
 */
    private parseProjects(projects: DepinScanProject[]): string[][] {
        const schema = [
            "project_name",
            "slug",
            "token",
            "layer_1",
            "categories",
            "market_cap",
            "token_price",
            "total_devices",
            "avg_device_cost",
            "days_to_breakeven",
            "estimated_daily_earnings",
            "chainid",
            "coingecko_id",
            "fully_diluted_valuation",
        ];

        const parsedProjects = projects.map((project) => {
            const {
                project_name,
                slug,
                token,
                layer_1,
                categories,
                market_cap,
                token_price,
                total_devices,
                avg_device_cost,
                days_to_breakeven,
                estimated_daily_earnings,
                chainid,
                coingecko_id,
                fully_diluted_valuation,
            } = project;

            // Create an array following the schema
            return [
                project_name,
                slug,
                token,
                layer_1 ? layer_1.join(", ") : "", // Flatten array for compact representation
                categories ? categories.join(", ") : "", // Flatten array for compact representation
                this.abbreviateNumber(market_cap?.toString()),
                token_price?.toString(),
                total_devices?.toString(),
                avg_device_cost?.toString(),
                days_to_breakeven?.toString(),
                estimated_daily_earnings?.toString(),
                chainid?.toString(),
                coingecko_id?.toString(),
                this.abbreviateNumber(fully_diluted_valuation?.toString()),
            ];
        });

        parsedProjects.unshift(schema);

        return parsedProjects;
    }

/**
 * Asynchronously retrieves DePINScan projects either from the cache or by fetching them
 * and then parsing the result.
 * 
 * @returns A promise that resolves to a 2D array of strings representing the DePINScan projects.
 */
    async getProjects(): Promise<string[][]> {
        const cacheKey = "depinscanProjects";
        const cachedData = await this.getCachedData<string[][]>(cacheKey);
        if (cachedData) {
            console.log("Returning cached DePINScan projects");
            return cachedData;
        }

        const projects = await this.fetchDepinscanProjects();
        const parsedProjects = this.parseProjects(projects);

        this.setCachedData<string[][]>(cacheKey, parsedProjects);
        console.log("DePINScan projects cached");

        return parsedProjects;
    }
}

/**
 * Data provider for DePIN metrics and projects.
 *
 * @param {IAgentRuntime} runtime - The Agent runtime environment.
 * @param {Memory} _message - The memory message (not used in this function).
 * @param {State} _state - The state (optional, not used in this function).
 * @returns {Promise<string | null>} A string containing the daily metrics and projects from DePINScan.
 */
export const depinDataProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            const depinscan = new DePINScanProvider(runtime.cacheManager);
            const depinscanMetrics = await depinscan.getDailyMetrics();
            const depinscanProjects = await depinscan.getProjects();

            return `
                #### **DePINScan Daily Metrics**
                ${depinscanMetrics}
                #### **DePINScan Projects**
                ${depinscanProjects}
            `;
        } catch (error) {
            elizaLogger.error("Error in DePIN data provider:", error);
            return null;
        }
    },
};
