import { Account } from './common-types';

// Get Account
/**
 * Definition for the GetAccountRequest type.
 * 
 * @typedef {Object} GetAccountRequest
 * @property {string} accountUuid - The unique identifier for the account.
 */
export type GetAccountRequest = {
    // Path Params
    accountUuid: string;
};

/**
 * Response object for getting account information.
 */

export type GetAccountResponse = {
    account?: Account;
};

// List Accounts
/**
 * Represents the request object for listing accounts.
 * @typedef {Object} ListAccountsRequest
 * @property {number} [limit] - The maximum number of accounts to return.
 * @property {string} [cursor] - A token to specify the starting point for retrieving the next set of accounts.
 * @property {string} [retailPortfolioId] - The ID of the retail portfolio to filter the accounts by.
 */
export type ListAccountsRequest = {
    // Query Params
    limit?: number;
    cursor?: string;
    retailPortfolioId?: string;
};

/**
 * Response object for listing accounts.
 *
 * @typedef {Object} ListAccountsResponse
 * @property {Account[]} [accounts] - Array of Account objects.
 * @property {boolean} has_next - Indicates if there are more accounts to fetch.
 * @property {string} [cursor] - Cursor for pagination.
 * @property {number} [size] - Number of accounts in the response.
 */
export type ListAccountsResponse = {
    accounts?: Account[];
    has_next: boolean;
    cursor?: string;
    size?: number;
};
