import { Portfolio, PortfolioBreakdown, PortfolioType } from './common-types';

// List Portfolios
/**
 * Request object for listing portfolios.
 * 
 * @typedef {Object} ListPortfoliosRequest
 * @property {PortfolioType} [portfolioType] - The type of portfolios to query.
 */
export type ListPortfoliosRequest = {
    // Query Params
    portfolioType?: PortfolioType;
};

/**
 * Response object containing a list of portfolios.
 * @typedef {Object} ListPortfoliosResponse
 * @property {Array<Portfolio>} [portfolios] - An optional array of Portfolio objects.
 */
export type ListPortfoliosResponse = {
    portfolios?: Portfolio[];
};

// Create Portfolio
/**
 * Type representing the request body for creating a portfolio.
 * @typedef {Object} CreatePortfolioRequest
 * @property {string} name - The name of the portfolio.
 */
export type CreatePortfolioRequest = {
    // Body Params
    name: string;
};

/**
 * Response object for creating a portfolio.
 * @typedef {Object} CreatePortfolioResponse
 * @property {Portfolio} portfolio - The created portfolio object, if successful.
 */
export type CreatePortfolioResponse = {
    portfolio?: Portfolio;
};

// Move Portfolio Funds
/**
 * TypeScript type for the request to move funds between portfolios.
 * @typedef {object} MovePortfolioFundsRequest
 * @property {Record<string, any>} funds - The funds to be moved.
 * @property {string} sourcePortfolioUuid - The UUID of the source portfolio.
 * @property {string} targetPortfolioUuid - The UUID of the target portfolio.
 */
export type MovePortfolioFundsRequest = {
    // Body Params
    funds: Record<string, any>;
    sourcePortfolioUuid: string;
    targetPortfolioUuid: string;
};

/**
 * Definition of the response object when moving funds between portfolios.
 * @typedef {Object} MovePortfolioFundsResponse
 * @property {string} [source_portfolio_uuid] - The UUID of the source portfolio.
 * @property {string} [target_portfolio_uuid] - The UUID of the target portfolio.
 */
export type MovePortfolioFundsResponse = {
    source_portfolio_uuid?: string;
    target_portfolio_uuid?: string;
};

// Get Portfolio Breakdown
/**
 * Request object for getting portfolio breakdown.
 * @typedef {Object} GetPortfolioBreakdownRequest
 * @property {string} portfolioUuid - The UUID of the portfolio.
 * @property {string} [currency] - The currency for the breakdown (optional).
 */
export type GetPortfolioBreakdownRequest = {
    // Path Params
    portfolioUuid: string;

    // Query Params
    currency?: string;
};

/**
 * Response object for getting portfolio breakdown.
 * @typedef {Object} GetPortfolioBreakdownResponse
 * @property {PortfolioBreakdown} breakdown - The portfolio breakdown information.
 */
export type GetPortfolioBreakdownResponse = {
    breakdown?: PortfolioBreakdown;
};

// Delete Portfolio
/**
 * Represents the request object for deleting a portfolio.
 * @typedef {Object} DeletePortfolioRequest
 * @property {string} portfolioUuid - The UUID of the portfolio to be deleted.
 */
export type DeletePortfolioRequest = {
    // Path Params
    portfolioUuid: string;
};

/**
 * Represents the response object for deleting a portfolio.
 */
export type DeletePortfolioResponse = Record<string, never>;

// Edit Portfolio
/**
 * Represents the request body for editing a portfolio.
 * @typedef {Object} EditPortfolioRequest
 * @property {string} portfolioUuid - The UUID of the portfolio being edited.
 * @property {string} name - The new name for the portfolio.
 */
export type EditPortfolioRequest = {
    // Path Params
    portfolioUuid: string;

    // Body Params
    name: string;
};

/**
 * Response object for editing a portfolio.
 * @typedef {Object} EditPortfolioResponse
 * @property {Portfolio} [portfolio] - The updated portfolio object.
 */
export type EditPortfolioResponse = {
    portfolio?: Portfolio;
};
