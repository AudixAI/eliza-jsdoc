import {
    PerpetualPortfolio,
    PortfolioBalance,
    PortfolioSummary,
    Position,
    PositionSummary,
} from './common-types';

// Allocate Portfolio
/**
 * Definition of the AllocatePortfolioRequest type.
 * @typedef {Object} AllocatePortfolioRequest
 * @property {string} portfolioUuid The UUID of the portfolio.
 * @property {string} symbol The symbol of the asset.
 * @property {string} amount The amount of the asset.
 * @property {string} currency The currency of the asset amount.
 */
export type AllocatePortfolioRequest = {
    // Body Params
    portfolioUuid: string;
    symbol: string;
    amount: string;
    currency: string;
};

/**
 * Response object for allocating portfolio.
 * It is a record with keys of type string and values of type never.
 */
export type AllocatePortfolioResponse = Record<string, never>;

// Get Perpetuals Portfolio Summary
/**
 * Represents a request object used to retrieve a summary of perpetuals portfolio.
 * @typedef {Object} GetPerpetualsPortfolioSummaryRequest
 * @property {string} portfolioUuid - The unique identifier of the portfolio.
 */
export type GetPerpetualsPortfolioSummaryRequest = {
    // Path Params
    portfolioUuid: string;
};

/**
 * Response object for fetching portfolios and summary data for perpetuals.
 * @typedef {Object} GetPerpetualsPortfolioSummaryResponse
 * @property {PerpetualPortfolio[]} portfolios - The array of perpetual portfolios.
 * @property {PortfolioSummary} summary - The summary data for the portfolios.
 */
export type GetPerpetualsPortfolioSummaryResponse = {
    portfolios?: PerpetualPortfolio[];
    summary?: PortfolioSummary;
};

// List Perpetuals Positions
/**
 * Defines the request object for fetching a list of perpetual positions for a specific portfolio.
 * @typedef {Object} ListPerpetualsPositionsRequest
 * @property {string} portfolioUuid - The unique identifier of the portfolio to fetch positions for.
 */
export type ListPerpetualsPositionsRequest = {
    // Path Params
    portfolioUuid: string;
};

/**
 * Response object for a list of perpetuals positions.
 * @typedef {Object} ListPerpetualsPositionsResponse
 * @property {Position[]} positions - An array of positions.
 * @property {PositionSummary} summary - Summary of positions.
 */
export type ListPerpetualsPositionsResponse = {
    positions?: Position[];
    summary?: PositionSummary;
};

// Get Perpetuals Position
/**
 * Represents the request object for retrieving perpetuals position.
 * 
 * @typedef {Object} GetPerpetualsPositionRequest
 * @property {string} portfolioUuid - The UUID of the portfolio
 * @property {string} symbol - The symbol of the position
 */
export type GetPerpetualsPositionRequest = {
    // Path Params
    portfolioUuid: string;
    symbol: string;
};

/**
 * Response object for getting perpetuals position.
 * @typedef {Object} GetPerpetualsPositionResponse
 * @property {Position} [position] - The position object.
 */
export type GetPerpetualsPositionResponse = {
    position?: Position;
};

// Get Portfolio Balances
/**
 * Request object for getting portfolio balances.
 * @typedef {Object} GetPortfolioBalancesRequest
 * @property {string} portfolioUuid - The UUID of the portfolio.
 */
export type GetPortfolioBalancesRequest = {
    // Path Params
    portfolioUuid: string;
};

/**
 * Response object for getting portfolio balances.
 */
export type GetPortfolioBalancesResponse = {
    portfolio_balancces?: PortfolioBalance[];
};

// Opt In or Out of Multi Asset Collateral
/**
 * Represents a request to opt in or out of multi-asset collateral with optional parameters.
 * @typedef {Object} OptInOutMultiAssetCollateralRequest
 * @property {string} [portfolioUuid] - The UUID of the portfolio.
 * @property {boolean} [multiAssetCollateralEnabled] - Whether multi-asset collateral is enabled or disabled.
 */
export type OptInOutMultiAssetCollateralRequest = {
    // Body Params
    portfolioUuid?: string;
    multiAssetCollateralEnabled?: boolean;
};

/**
 * Response object for opting in/out of multi-asset collateral
 * 
 * @typedef {Object} OptInOutMultiAssetCollateralResponse
 * @property {boolean} [cross_collateral_enabled] - Indicates if cross collateral is enabled
 */
export type OptInOutMultiAssetCollateralResponse = {
    cross_collateral_enabled?: boolean;
};
