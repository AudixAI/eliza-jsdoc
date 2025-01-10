import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    CancelPendingFuturesSweep,
    GetCurrentMarginWindowRequest,
    GetCurrentMarginWindowResponse,
    GetFuturesBalanceSummaryResponse,
    GetFuturesPositionRequest,
    GetFuturesPositionResponse,
    GetIntradayMarginSettingResponse,
    ListFuturesPositionsResponse,
    ListFuturesSweepsResponse,
    ScheduleFuturesSweepRequest,
    ScheduleFuturesSweepResponse,
    SetIntradayMarginSettingRequest,
    SetIntradayMarginSettingResponse,
} from './types/futures-types';
import { method } from './types/request-types';

// [GET] Get Futures Balance Summary
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getfcmbalancesummary
/**
 * Retrieves the balance summary for futures trading.
 * @returns {Promise<GetFuturesBalanceSummaryResponse>} The balance summary response.
 */
export function getFuturesBalanceSummary(
    this: RESTBase
): Promise<GetFuturesBalanceSummaryResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/cfm/balance_summary`,
        isPublic: false,
    });
}

// [GET] Get Intraday Margin Setting
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getintradaymarginsetting
/**
 * Get the intraday margin setting from the API.
 * @returns {Promise<GetIntradayMarginSettingResponse>} A promise that resolves with the intraday margin setting response.
 */
export function getIntradayMarginSetting(
    this: RESTBase
): Promise<GetIntradayMarginSettingResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/cfm/intraday/margin_setting`,
        isPublic: false,
    });
}

// [POST] Set Intraday Margin Setting
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_setintradaymarginsetting
/**
 * Sets the intraday margin setting for a user.
 * 
 * @param {SetIntradayMarginSettingRequest} requestParams - The parameters for setting the intraday margin.
 * @returns {Promise<SetIntradayMarginSettingResponse>} A Promise that resolves with the response data after the request is completed.
 */
export function setIntradayMarginSetting(
    this: RESTBase,
    requestParams: SetIntradayMarginSettingRequest
): Promise<SetIntradayMarginSettingResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/cfm/intraday/margin_setting`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Current Margin Window
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getcurrentmarginwindow
/**
 * Retrieves the current margin window for the requested parameters.
 * @param {GetCurrentMarginWindowRequest} requestParams - The request parameters for retrieving the current margin window.
 * @returns {Promise<GetCurrentMarginWindowResponse>} A Promise that resolves with the response containing the current margin window.
 */
export function getCurrentMarginWindow(
    this: RESTBase,
    requestParams: GetCurrentMarginWindowRequest
): Promise<GetCurrentMarginWindowResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/cfm/intraday/current_margin_window`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] List Futures Positions
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getfcmpositions
/**
 * Retrieves a list of futures positions.
 * 
 * @this RESTBase
 * @returns {Promise<ListFuturesPositionsResponse>} A promise that resolves with the response containing a list of futures positions.
 */
export function listFuturesPositions(
    this: RESTBase
): Promise<ListFuturesPositionsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/cfm/positions`,
        isPublic: false,
    });
}

// [GET] Get Futures Position
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getfcmposition
/**
 * Retrieves the futures position for a specific product.
 * 
 * @param {GetFuturesPositionRequest} options - The options for retrieving the futures position.
 * @param {string} options.productId - The ID of the product to retrieve the futures position for.
 * @returns {Promise<GetFuturesPositionResponse>} The response containing the futures position.
 */
export function getFuturesPosition(
    this: RESTBase,
    { productId }: GetFuturesPositionRequest
): Promise<GetFuturesPositionResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/cfm/positions/${productId}`,
        isPublic: false,
    });
}

// [POST] Schedule Futures Sweep
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_schedulefcmsweep
/**
 * Schedule a futures sweep event.
 * @param {ScheduleFuturesSweepRequest} requestParams - The parameters for scheduling the futures sweep.
 * @returns {Promise<ScheduleFuturesSweepResponse>} A promise that resolves with the response to scheduling the futures sweep.
 */
export function scheduleFuturesSweep(
    this: RESTBase,
    requestParams: ScheduleFuturesSweepRequest
): Promise<ScheduleFuturesSweepResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/cfm/sweeps/schedule`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [GET] List Futures Sweeps
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getfcmsweeps
/**
 * Function to list futures sweeps.
 * 
 * @this RESTBase
 * @returns {Promise<ListFuturesSweepsResponse>} Returns a promise that resolves with the response from the request.
 */
export function listFuturesSweeps(
    this: RESTBase
): Promise<ListFuturesSweepsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/cfm/sweeps`,
        isPublic: false,
    });
}

// [DELETE] Cancel Pending Futures Sweep
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_cancelfcmsweep
/**
 * Cancels pending futures sweep.
 * 
 * @this {RESTBase}
 * @returns {Promise<CancelPendingFuturesSweep>} A promise that resolves with the result of the sweep cancellation.
 */
export function cancelPendingFuturesSweep(
    this: RESTBase
): Promise<CancelPendingFuturesSweep> {
    return this.request({
        method: method.DELETE,
        endpoint: `${API_PREFIX}/cfm/sweeps`,
        isPublic: false,
    });
}
