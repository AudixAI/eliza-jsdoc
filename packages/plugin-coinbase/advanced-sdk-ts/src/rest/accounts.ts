import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    GetAccountRequest,
    GetAccountResponse,
    ListAccountsRequest,
    ListAccountsResponse,
} from './types/accounts-types';
import { method } from './types/request-types';

// [GET] Get Account
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getaccount
/**
 * Retrieves information about a specific account from the API.
 * @param {GetAccountRequest} params - The parameters for the request, including the accountUuid to retrieve.
 * @returns {Promise<GetAccountResponse>} A promise that resolves with the response data for the account.
 */
export function getAccount(
    this: RESTBase,
    { accountUuid }: GetAccountRequest
): Promise<GetAccountResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/accounts/${accountUuid}`,
        isPublic: false,
    });
}

// [GET] List Accounts
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getaccounts
/**
 * List all accounts using the provided request parameters.
 * 
 * @param {ListAccountsRequest} requestParams - The parameters for listing accounts.
 * @returns {Promise<ListAccountsResponse>} A Promise that resolves with the list of accounts.
 */
export function listAccounts(
    this: RESTBase,
    requestParams: ListAccountsRequest
): Promise<ListAccountsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/accounts`,
        queryParams: requestParams,
        isPublic: false,
    });
}
