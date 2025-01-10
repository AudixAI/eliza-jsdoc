import { PortfolioType } from './common-types';

// Get API Key Permissions
/**
 * Response object for getting API key permissions.
 * @typedef {Object} GetAPIKeyPermissionsResponse
 * @property {boolean} [can_view] - Specifies if the user can view data.
 * @property {boolean} [can_trade] - Specifies if the user can trade.
 * @property {boolean} [can_transfer] - Specifies if the user can transfer funds.
 * @property {string} [portfolio_uuid] - The UUID of the portfolio.
 * @property {PortfolioType} [portfolio_type] - The type of the portfolio.
 */
export type GetAPIKeyPermissionsResponse = {
    can_view?: boolean;
    can_trade?: boolean;
    can_transfer?: boolean;
    portfolio_uuid?: string;
    portfolio_type?: PortfolioType;
};
