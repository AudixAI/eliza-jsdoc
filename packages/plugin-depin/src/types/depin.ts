/**
 * Represents the metrics collected during a Depin scan.
 * @typedef {Object} DepinScanMetrics
 * @property {string} date - The date of the scan.
 * @property {string} total_projects - The total number of projects scanned.
 * @property {string} market_cap - The market capitalization data.
 * @property {string} total_device - The total number of devices scanned.
 */
export type DepinScanMetrics = {
    date: string;
    total_projects: string;
    market_cap: string;
    total_device: string;
};

/**
 * Represents a DepinScan project which includes details such as project name, slug, token, 
 * layer 1, categories, market cap, token price, total devices, average device cost, days to breakeven,
 * estimated daily earnings, chain ID, coingecko ID, and fully diluted valuation.
 */
export type DepinScanProject = {
    project_name: string;
    slug: string;
    token: string;
    layer_1: string[];
    categories: string[];
    market_cap: string;
    token_price: string;
    total_devices: string;
    avg_device_cost: string;
    days_to_breakeven: string;
    estimated_daily_earnings: string;
    chainid: string;
    coingecko_id: string;
    fully_diluted_valuation: string;
};
