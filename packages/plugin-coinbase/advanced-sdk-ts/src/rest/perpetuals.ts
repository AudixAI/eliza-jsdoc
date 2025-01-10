import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    AllocatePortfolioRequest,
    AllocatePortfolioResponse,
    GetPerpetualsPortfolioSummaryRequest,
    GetPerpetualsPortfolioSummaryResponse,
    GetPerpetualsPositionRequest,
    GetPerpetualsPositionResponse,
    GetPortfolioBalancesRequest,
    GetPortfolioBalancesResponse,
    ListPerpetualsPositionsRequest,
    ListPerpetualsPositionsResponse,
    OptInOutMultiAssetCollateralRequest,
    OptInOutMultiAssetCollateralResponse,
} from './types/perpetuals-types';
import { method } from './types/request-types';

// [POST] Allocate Portfolio
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_allocateportfolio
/**
 * Allocates a portfolio using the AllocatePortfolioRequest parameters.
 *
 * @param {AllocatePortfolioRequest} requestParams - The request parameters for allocating the portfolio.
 * @returns {Promise<AllocatePortfolioResponse>} A promise that resolves with the response of the allocation.
 */
export function allocatePortfolio(
    this: RESTBase,
    requestParams: AllocatePortfolioRequest
): Promise<AllocatePortfolioResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/intx/allocate`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Perpetuals Portfolio Summary
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getintxportfoliosummary
/**
 * Fetches summary data for a perpetuals portfolio.
 *
 * @param {Object} options - The options for the request.
 * @param {string} options.portfolioUuid - The UUID of the portfolio to fetch summary data for.
 * @returns {Promise<Object>} - A promise that resolves with the summary data for the portfolio.
 */
export function getPerpetualsPortfolioSummary(
    this: RESTBase,
    { portfolioUuid }: GetPerpetualsPortfolioSummaryRequest
): Promise<GetPerpetualsPortfolioSummaryResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/intx/portfolio/${portfolioUuid}`,
        isPublic: false,
    });
}

// [GET] List Perpetuals Positions
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getintxpositions
/**
 * Fetches a list of perpetual positions for a specified portfolio.
 * 
 * @param {ListPerpetualsPositionsRequest} options - The request options including the portfolio UUID.
 * @returns {Promise<ListPerpetualsPositionsResponse>} A Promise that resolves to the list of perpetual positions.
 */
export function listPerpetualsPositions(
    this: RESTBase,
    { portfolioUuid }: ListPerpetualsPositionsRequest
): Promise<ListPerpetualsPositionsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/intx/positions/${portfolioUuid}`,
        isPublic: false,
    });
}

// [GET] Get Perpetuals Position
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getintxposition
/**
 * Requests the perpetual positions for a specific portfolio and symbol.
 * 
 * @param {GetPerpetualsPositionRequest} options - The options for the request, including the portfolio UUID and symbol.
 * @returns {Promise<GetPerpetualsPositionResponse>} A promise that resolves with the perpetual positions response.
 */
export function getPerpertualsPosition(
    this: RESTBase,
    { portfolioUuid, symbol }: GetPerpetualsPositionRequest
): Promise<GetPerpetualsPositionResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/intx/positions/${portfolioUuid}/${symbol}`,
        isPublic: false,
    });
}

// [GET] Get Portfolio Balances
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getintxbalances
/**
 * Retrieves the balances for a specific portfolio.
 *
 * @param {GetPortfolioBalancesRequest} options - The request options including the portfolio UUID.
 * @returns {Promise<GetPortfolioBalancesResponse>} A Promise that resolves with the balances for the specified portfolio.
 */
export function getPortfolioBalances(
    this: RESTBase,
    { portfolioUuid }: GetPortfolioBalancesRequest
): Promise<GetPortfolioBalancesResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/intx/balances/${portfolioUuid}`,
        isPublic: false,
    });
}

// [POST] Opt In or Out of Multi Asset Collateral
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_intxmultiassetcollateral
/**
 * Opt in or out of multi-asset collateral.
 * @param {OptInOutMultiAssetCollateralRequest} requestParams - The request parameters.
 * @returns {Promise<OptInOutMultiAssetCollateralResponse>} - The response of the opt in/out operation.
 */
export function optInOutMultiAssetCollateral(
    this: RESTBase,
    requestParams: OptInOutMultiAssetCollateralRequest
): Promise<OptInOutMultiAssetCollateralResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/intx/multi_asset_collateral`,
        bodyParams: requestParams,
        isPublic: false,
    });
}
