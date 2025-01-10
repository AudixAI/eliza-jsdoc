import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    CancelOrdersRequest,
    CancelOrdersResponse,
    ClosePositionRequest,
    ClosePositionResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    EditOrderPreviewRequest,
    EditOrderPreviewResponse,
    EditOrderRequest,
    EditOrderResponse,
    GetOrderRequest,
    GetOrderResponse,
    ListFillsRequest,
    ListFillsResponse,
    ListOrdersRequest,
    ListOrdersResponse,
    PreviewOrderRequest,
    PreviewOrderResponse,
} from './types/orders-types';
import { method } from './types/request-types';

// [POST] Create Order
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_postorder
/**
 * Creates a new order using the provided request parameters.
 * @param {CreateOrderRequest} requestParams - The parameters for creating the order.
 * @returns {Promise<CreateOrderResponse>} A promise that resolves with the response of creating the order.
 */
export function createOrder(
    this: RESTBase,
    requestParams: CreateOrderRequest
): Promise<CreateOrderResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/orders`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [POST] Cancel Orders
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_cancelorders
/**
 * Cancels orders in batch based on the specified request parameters.
 *
 * @param {CancelOrdersRequest} requestParams The parameters for cancelling orders.
 * @returns {Promise<CancelOrdersResponse>} A promise that resolves with the response after cancelling orders.
 */
export function cancelOrders(
    this: RESTBase,
    requestParams: CancelOrdersRequest
): Promise<CancelOrdersResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/orders/batch_cancel`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [POST] Edit Order
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_editorder
/**
 * Edit an order using the given request parameters.
 *
 * @param {EditOrderRequest} requestParams - The parameters for editing the order.
 * @returns {Promise<EditOrderResponse>} A promise that resolves with the response from editing the order.
 */
export function editOrder(
    this: RESTBase,
    requestParams: EditOrderRequest
): Promise<EditOrderResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/orders/edit`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [POST] Edit Order Preview
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_previeweditorder
/**
 * Edits an order preview.
 *
 * @param {EditOrderPreviewRequest} requestParams - The parameters for editing the order preview.
 * @returns {Promise<EditOrderPreviewResponse>} A Promise that resolves with the edited order preview response.
 */
export function editOrderPreview(
    this: RESTBase,
    requestParams: EditOrderPreviewRequest
): Promise<EditOrderPreviewResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/orders/edit_preview`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [GET] List Orders
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_gethistoricalorders
/**
 * Function to list orders based on provided request parameters.
 * 
 * @param {ListOrdersRequest} requestParams - The parameters for the request.
 * @returns {Promise<ListOrdersResponse>} A promise that resolves with the list of orders response.
 */
export function listOrders(
    this: RESTBase,
    requestParams: ListOrdersRequest
): Promise<ListOrdersResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/orders/historical/batch`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] List Fills
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getfills
/**
 * Fetches a list of historical fills for orders.
 * 
 * @param {ListFillsRequest} requestParams - The request parameters for listing fills.
 * @returns {Promise<ListFillsResponse>} A promise that resolves with the list of fills.
 */
export function listFills(
    this: RESTBase,
    requestParams: ListFillsRequest
): Promise<ListFillsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/orders/historical/fills`,
        queryParams: requestParams,
        isPublic: false,
    });
}

// [GET] Get Order
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_gethistoricalorder
/**
 * Get order details by orderId.
 * 
 * @param {GetOrderRequest} request - The request object containing the orderId.
 * @returns {Promise<GetOrderResponse>} - A promise that resolves with the order details.
 */
export function getOrder(
    this: RESTBase,
    { orderId }: GetOrderRequest
): Promise<GetOrderResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/orders/historical/${orderId}`,
        isPublic: false,
    });
}

// [POST] Preview Order
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_previeworder
/**
 * Preview an order with the given request parameters.
 * 
 * @param {PreviewOrderRequest} requestParams - The request parameters for previewing the order.
 * @returns {Promise<PreviewOrderResponse>} - A Promise that resolves with the preview order response.
 */
export function previewOrder(
    this: RESTBase,
    requestParams: PreviewOrderRequest
): Promise<PreviewOrderResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/orders/preview`,
        bodyParams: requestParams,
        isPublic: false,
    });
}

// [POST] Close Position
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_closeposition
/**
 * Closes a position with the given request parameters.
 * @param {ClosePositionRequest} requestParams - The parameters for closing the position.
 * @returns {Promise<ClosePositionResponse>} A promise that resolves with the response of closing the position.
 */
export function closePosition(
    this: RESTBase,
    requestParams: ClosePositionRequest
): Promise<ClosePositionResponse> {
    return this.request({
        method: method.POST,
        endpoint: `${API_PREFIX}/orders/close_position`,
        queryParams: undefined,
        bodyParams: requestParams,
        isPublic: false,
    });
}
