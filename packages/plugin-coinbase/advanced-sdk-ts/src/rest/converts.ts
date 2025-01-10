import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    CommitConvertTradeRequest,
    CommitConvertTradeResponse,
    CreateConvertQuoteRequest,
    CreateConvertQuoteResponse,
    GetConvertTradeRequest,
    GetConvertTradeResponse,
} from './types/converts-types';
import { method } from './types/request-types';

// [POST] Create Convert Quote
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_createconvertquote
/**
 * Creates a convert quote by sending a POST request to the specified endpoint.
 * 
 * @param {CreateConvertQuoteRequest} requestParams - The request parameters for creating a convert quote.
 * @returns {Promise<CreateConvertQuoteResponse>} A Promise that resolves to the response data of creating the convert quote.
 */
export function createConvertQuote(
    this: RESTBase,
    requestParams: CreateConvertQuoteRequest
): Promise<CreateConvertQuoteResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/convert/quote`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Convert Trade
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getconverttrade
/**
 * Get a specific trade for conversion.
 * 
 * @param {Object} args - The arguments for the request.
 * @param {string} args.tradeId - The ID of the trade to be converted.
 * @param {...any} args.requestParams - Additional request parameters.
 * 
 * @returns {Promise<GetConvertTradeResponse>} A Promise that resolves with the response data of the conversion trade request.
 */
export function getConvertTrade(
    this: RESTBase,
    { tradeId, ...requestParams }: GetConvertTradeRequest
): Promise<GetConvertTradeResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/convert/trade/${tradeId}`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [POST] Commit Connvert Trade
// https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_commitconverttrade
/**
 * Commits a trade conversion by sending a POST request to the convert trade endpoint.
 * 
 * @param {CommitConvertTradeRequest} options - The tradeId and other request parameters.
 * @returns {Promise<CommitConvertTradeResponse>} A Promise that resolves with the response data from the server.
 */
export function commitConvertTrade(
    this: RESTBase,
    { tradeId, ...requestParams }: CommitConvertTradeRequest
): Promise<CommitConvertTradeResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/convert/trade/${tradeId}`,
        bodyParams: requestParams,
        isPublic: false,
    });
}
