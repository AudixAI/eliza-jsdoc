import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    GetBestBidAskRequest,
    GetBestBidAskResponse,
    GetMarketTradesRequest,
    GetMarketTradesResponse,
    GetProductBookRequest,
    GetProductBookResponse,
    GetProductCandlesRequest,
    GetProductCandlesResponse,
    GetProductRequest,
    GetProductResponse,
    ListProductsRequest,
    ListProductsResponse,
} from './types/products-types';
import { method } from './types/request-types';

// [GET] Get Best Bid Ask
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getbestbidask
/**
 * Retrieves the best bid and ask prices for a given request.
 * @param {GetBestBidAskRequest} requestParams - The parameters for the request.
 * @returns {Promise<GetBestBidAskResponse>} A promise that resolves with the response containing the best bid and ask prices.
 */
export function getBestBidAsk(
    this: RESTBase,
    requestParams: GetBestBidAskRequest
): Promise<GetBestBidAskResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/best_bid_ask`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Product Book
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getproductbook
/**
 * Retrieves the product book based on the given request parameters.
 * 
 * @param {GetProductBookRequest} requestParams - The request parameters for retrieving the product book.
 * @returns {Promise<GetProductBookResponse>} The response containing the product book data.
 */
export function getProductBook(
    this: RESTBase,
    requestParams: GetProductBookRequest
): Promise<GetProductBookResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/product_book`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] List Products
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getproducts
/**
 * Fetches a list of products.
 * 
 * @param {ListProductsRequest} requestParams - The parameters for filtering the list of products.
 * @returns {Promise<ListProductsResponse>} A Promise that resolves with the list of products.
 */
export function listProducts(
    this: RESTBase,
    requestParams: ListProductsRequest
): Promise<ListProductsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/products`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Product
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getproduct
/**
 * Retrieves product information from the API.
 * 
 * @param {GetProductRequest} options - The options for retrieving the product, including the productId and any additional request parameters.
 * @returns {Promise<GetProductResponse>} A promise that resolves with the product information.
 */
export function getProduct(
    this: RESTBase,
    { productId, ...requestParams }: GetProductRequest
): Promise<GetProductResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/products/${productId}`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Product Candles
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getcandles
/**
 * Get the candles for a specific product.
 * @param {GetProductCandlesRequest} params - The parameters for the request.
 * @returns {Promise<GetProductCandlesResponse>} A promise that resolves with the candles for the product.
 */
export function getProductCandles(
    this: RESTBase,
    { productId, ...requestParams }: GetProductCandlesRequest
): Promise<GetProductCandlesResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/products/${productId}/candles`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Market Trades
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getmarkettrades
/**
 * Retrieves market trades for a specific product.
 * 
 * @param {GetMarketTradesRequest} options - The options for retrieving market trades, including the product ID and any additional request parameters.
 * @returns {Promise<GetMarketTradesResponse>} A promise that resolves with the market trades response.
 */
export function getMarketTrades(
    this: RESTBase,
    { productId, ...requestParams }: GetMarketTradesRequest
): Promise<GetMarketTradesResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/products/${productId}/ticker`,
        queryParams: requestParams,
        isPublic: false,
    });
}
