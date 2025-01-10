import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    CreatePortfolioRequest,
    CreatePortfolioResponse,
    DeletePortfolioRequest,
    DeletePortfolioResponse,
    EditPortfolioRequest,
    EditPortfolioResponse,
    GetPortfolioBreakdownRequest,
    GetPortfolioBreakdownResponse,
    ListPortfoliosRequest,
    ListPortfoliosResponse,
    MovePortfolioFundsRequest,
    MovePortfolioFundsResponse,
} from './types/portfolios-types';
import { method } from './types/request-types';

// [GET] List Portfolios
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getportfolios
/**
 * Function to list portfolios.
 * 
 * @param {ListPortfoliosRequest} requestParams - The request parameters for listing portfolios.
 * @returns {Promise<ListPortfoliosResponse>} A promise that resolves with the response containing a list of portfolios.
 */
export function listPortfolios(
    this: RESTBase,
    requestParams: ListPortfoliosRequest
): Promise<ListPortfoliosResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/portfolios`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [POST] Create Portfolio
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_createportfolio
/**
 * Creates a new portfolio based on the provided request parameters.
 * 
 * @param {CreatePortfolioRequest} requestParams - The parameters for creating the portfolio.
 * @returns {Promise<CreatePortfolioResponse>} A promise that resolves with the response from the server.
 */
export function createPortfolio(
    this: RESTBase,
    requestParams: CreatePortfolioRequest
): Promise<CreatePortfolioResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/portfolios`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [POST] Move Portfolio Funds
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_moveportfoliofunds
/**
 * Move funds from one portfolio to another.
 * 
 * @param {MovePortfolioFundsRequest} requestParams - The parameters for moving funds.
 * @returns {Promise<MovePortfolioFundsResponse>} A Promise that resolves with the response data after moving funds.
 */
export function movePortfolioFunds(
    this: RESTBase,
    requestParams: MovePortfolioFundsRequest
): Promise<MovePortfolioFundsResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/portfolios/move_funds`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Portfolio Breakdown
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getportfoliobreakdown
/**
 * Retrieves the breakdown of a portfolio by making a request to the API endpoint.
 * @param {Object} options - The options for the request.
 * @param {string} options.portfolioUuid - The UUID of the portfolio to retrieve the breakdown for.
 * @param {...any} options.requestParams - Additional parameters for the request.
 * @returns {Promise<GetPortfolioBreakdownResponse>} The response containing the breakdown of the portfolio.
 */
export function getPortfolioBreakdown(
    this: RESTBase,
    { portfolioUuid, ...requestParams }: GetPortfolioBreakdownRequest
): Promise<GetPortfolioBreakdownResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/portfolios/${portfolioUuid}`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [DELETE] Delete Portfolio
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_deleteportfolio
/**
 * Deletes a portfolio with the specified UUID.
 *
 * @param {DeletePortfolioRequest} options - The options for deleting the portfolio, including the portfolio UUID.
 * @returns {Promise<DeletePortfolioResponse>} A promise that resolves with the response from the API after deleting the portfolio.
 */
export function deletePortfolio(
    this: RESTBase,
    { portfolioUuid }: DeletePortfolioRequest
): Promise<DeletePortfolioResponse> {
    return this.request({
        method: method.DELETE,
        endpoint: `${API_PREFIX}/portfolios/${portfolioUuid}`,
        isPublic: false,
    });
}

// [PUT] Edit Portfolio
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_editportfolio
/**
 * Edit a portfolio with the provided UUID by sending a PUT request to the API.
 * 
 * @param {EditPortfolioRequest} options - The options for the portfolio edit request.
 * @param {string} options.portfolioUuid - The UUID of the portfolio to edit.
 * @returns {Promise<EditPortfolioResponse>} A promise that resolves with the response from the server.
 */
export function editPortfolio(
    this: RESTBase,
    { portfolioUuid, ...requestParams }: EditPortfolioRequest
): Promise<EditPortfolioResponse> {
    return this.request({
        method: method.PUT,
        endpoint: `${API_PREFIX}/portfolios/${portfolioUuid}`,
        bodyParams: requestParams,
        isPublic: false,
    });
}
