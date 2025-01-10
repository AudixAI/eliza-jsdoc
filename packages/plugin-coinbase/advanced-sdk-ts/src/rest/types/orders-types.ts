import {
    CancelOrderObject,
    ContractExpiryType,
    MarginType,
    Order,
    OrderConfiguration,
    OrderPlacementSource,
    OrderSide,
    ProductType,
    SortBy,
} from './common-types';

// Create Order
/**
 * Type representing a request to create a new order
 * @typedef {Object} CreateOrderRequest
 * @property {string} clientOrderId - The unique identifier for the order
 * @property {string} productId - The unique identifier for the product being ordered
 * @property {OrderSide} side - The side of the order (buy or sell)
 * @property {OrderConfiguration} orderConfiguration - The configuration details for the order
 * @property {string} [selfTradePreventionId] - Optional unique identifier for self-trade prevention
 * @property {string} [leverage] - Optional leverage for the order
 * @property {MarginType} [marginType] - Optional margin type for the order
 * @property {string} [retailPortfolioId] - Optional identifier for the retail portfolio
 */
export type CreateOrderRequest = {
    // Body Params
    clientOrderId: string;
    productId: string;
    side: OrderSide;
    orderConfiguration: OrderConfiguration;
    selfTradePreventionId?: string;
    leverage?: string;
    marginType?: MarginType;
    retailPortfolioId?: string;
};

/**
 * Represents the response object for creating an order.
 * @typedef {Object} CreateOrderResponse
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {Record<string, any>} [failure_reason] - Deprecated: Reason for failure.
 * @property {string} [order_id] - Deprecated: The ID of the order.
 * @property {Object} [response] - The response object containing either a success or error response.
 * @property {Object} [response.success_response] - The success response object.
 * @property {Object} [response.error_response] - The error response object.
 * @property {OrderConfiguration} [order_configuration] - Configuration details of the order.
 */
export type CreateOrderResponse = {
    success: boolean;
    failure_reason?: Record<string, any>; // deprecated
    order_id?: string; // deprecated
    response?:
        | { success_response: Record<string, any> }
        | { error_response: Record<string, any> };
    order_configuration?: OrderConfiguration;
};

// Cancel Orders
/**
 * Represents a request to cancel multiple orders.
 * @typedef {object} CancelOrdersRequest
 * @property {string[]} orderIds - An array of order IDs to be cancelled.
 */
export type CancelOrdersRequest = {
    // Body Params
    orderIds: string[];
};

/**
 * Response type for canceling orders.
 * @typedef {object} CancelOrdersResponse
 * @property {CancelOrderObject[]} [results] - Array of cancel order objects.
 */
export type CancelOrdersResponse = {
    results?: CancelOrderObject[];
};

// Edit Order
/**
 * Represents the request body for editing an order.
 * @typedef {object} EditOrderRequest
 * @property {string} orderId - The ID of the order to be edited.
 * @property {string} [price] - The new price of the order (optional).
 * @property {string} [size] - The new size of the order (optional).
 */
export type EditOrderRequest = {
    // Body Params
    orderId: string;
    price?: string;
    size?: string;
};

/**
 * Represents the response object from an edit order request.
 * @typedef {Object} EditOrderResponse
 * @property {boolean} success - Indicates if the request was successful.
 * @property {Object} [response] - The response data from the request. Deprecated.
 * @property {Object} [response.success_response] - Deprecated success response data.
 * @property {Object} [response.error_response] - Deprecated error response data.
 * @property {Object[]} [errors] - Array of error objects, if any.
 */
export type EditOrderResponse = {
    success: boolean;
    response?:
        | { success_response: Record<string, any> } // deprecated
        | { error_response: Record<string, any> }; // deprecated
    errors?: Record<string, any>[];
};

// Edit Order Preview
/**
 * Represents a request to preview edits to an order.
 * @typedef {Object} EditOrderPreviewRequest
 * @property {string} orderId - The ID of the order to be edited.
 * @property {string} [price] - The updated price for the order (optional).
 * @property {string} [size] - The updated size for the order (optional).
 */
export type EditOrderPreviewRequest = {
    // Body Params
    orderId: string;
    price?: string;
    size?: string;
};

/**
 * Represents the response object when editing an order preview.
 * @typedef {Object} EditOrderPreviewResponse
 * @property {Record<string, any>[]} errors - Array of errors encountered during editing.
 * @property {string} [slippage] - The slippage amount.
 * @property {string} [order_total] - The total order amount.
 * @property {string} [commission_total] - The total commission amount.
 * @property {string} [quote_size] - The size of the quote.
 * @property {string} [base_size] - The size of the base.
 * @property {string} [best_bid] - The best bid price.
 * @property {string} [average_filled_price] - The average filled price.
 */
export type EditOrderPreviewResponse = {
    errors: Record<string, any>[];
    slippage?: string;
    order_total?: string;
    commission_total?: string;
    quote_size?: string;
    base_size?: string;
    best_bid?: string;
    average_filled_price?: string;
};

// List Orders
/**
 * Type representing a request to list orders.
 * @typedef {Object} ListOrdersRequest
 * @property {string[]} [orderIds] - Array of order IDs to filter by.
 * @property {string[]} [productIds] - Array of product IDs to filter by.
 * @property {string[]} [orderStatus] - Array of order status values to filter by.
 * @property {number} [limit] - Maximum number of orders to retrieve.
 * @property {string} [startDate] - Start date for filtering orders.
 * @property {string} [endDate] - End date for filtering orders.
 * @property {string} [orderType] - Type of order to filter by.
 * @property {OrderSide} [orderSide] - Side of order to filter by.
 * @property {string} [cursor] - Cursor for pagination.
 * @property {ProductType} [productType] - Type of product to filter by.
 * @property {OrderPlacementSource} [orderPlacementSource] - Source of order to filter by.
 * @property {ContractExpiryType} [contractExpiryType] - Type of contract expiry to filter by.
 * @property {string[]} [assetFilters] - Array of asset filters to apply.
 * @property {string} [retailPortfolioId] - ID of the retail portfolio to filter by.
 * @property {string} [timeInForces] - Time in force value to filter by.
 * @property {SortBy} [sortBy] - Sort criteria for the retrieved orders.
 */
export type ListOrdersRequest = {
    // Query Params
    orderIds?: string[];
    productIds?: string[];
    orderStatus?: string[];
    limit?: number;
    startDate?: string;
    endDate?: string;
    orderType?: string;
    orderSide?: OrderSide;
    cursor?: string;
    productType?: ProductType;
    orderPlacementSource?: OrderPlacementSource;
    contractExpiryType?: ContractExpiryType;
    assetFilters?: string[];
    retailPortfolioId?: string;
    timeInForces?: string;
    sortBy?: SortBy;
};

/**
 * Response object for getting a list of orders.
 * @typedef {Object} ListOrdersResponse
 * @property {Order[]} orders - The list of orders.
 * @property {number} [sequence] - Deprecated.
 * @property {boolean} has_next - Indicates if there are more orders available.
 * @property {string} [cursor] - A cursor for paging through the list of orders.
 */
export type ListOrdersResponse = {
    orders: Order[];
    sequence?: number; // deprecated
    has_next: boolean;
    cursor?: string;
};

// List Fills
/**
 * Request object for fetching a list of fills.
 *
 * @typedef {Object} ListFillsRequest
 * @property {string[]} [orderIds] - Array of order IDs to filter by.
 * @property {string[]} [tradeIds] - Array of trade IDs to filter by.
 * @property {string[]} [productIds] - Array of product IDs to filter by.
 * @property {string} [startSequenceTimestamp] - Start timestamp to filter by.
 * @property {string} [endSequenceTimestamp] - End timestamp to filter by.
 * @property {string} [retailPortfolioId] - Retail portfolio ID to filter by.
 * @property {number} [limit] - Maximum number of results to return.
 * @property {string} [cursor] - Cursor for paginating through results.
 * @property {SortBy} [sortBy] - Sort order for results.
 */
      
export type ListFillsRequest = {
    // Query Params
    orderIds?: string[];
    tradeIds?: string[];
    productIds?: string[];
    startSequenceTimestamp?: string;
    endSequenceTimestamp?: string;
    retailPortfolioId?: string;
    limit?: number;
    cursor?: string;
    sortBy?: SortBy;
};

/**
 * Response object containing a list of fills.
 * @typedef {Object} ListFillsResponse
 * @property {Record<string, any>[]} fills - An array of fill records.
 * @property {string} cursor - A string representing the cursor for pagination.
 */
export type ListFillsResponse = {
    fills?: Record<string, any>[];
    cursor?: string;
};

// Get Order
/**
 * Type representing a request to get an order.
 * @typedef {Object} GetOrderRequest
 * @property {string} orderId - The unique identifier of the order.
 */ 

export type GetOrderRequest = {
    // Path Params
    orderId: string;
};

/**
 * Response object containing the order details.
 * @typedef {Object} GetOrderResponse
 * @property {Order} order - The order information.
 */
export type GetOrderResponse = {
    order?: Order;
};

// Preview Order
/**
 * Describes the request body for creating a preview order.
 * @typedef {Object} PreviewOrderRequest
 * @property {string} productId - The ID of the product being ordered.
 * @property {OrderSide} side - The side of the order (Buy or Sell).
 * @property {OrderConfiguration} orderConfiguration - The configuration details for the order.
 * @property {string} [leverage] - The leverage amount for the order (optional).
 * @property {MarginType} [marginType] - The margin type for the order (optional).
 * @property {string} [retailPortfolioId] - The ID of the retail portfolio (optional).
 */
export type PreviewOrderRequest = {
    // Body Params
    productId: string;
    side: OrderSide;
    orderConfiguration: OrderConfiguration;
    leverage?: string;
    marginType?: MarginType;
    retailPortfolioId?: string;
};

/**
 * Definition of the PreviewOrderResponse type.
 * @typedef {Object} PreviewOrderResponse
 * @property {string} order_total - The total order amount.
 * @property {string} commission_total - The total commission amount.
 * @property {Record<string, any>[]} errs - Array of error records.
 * @property {Record<string, any>[]} warning - Array of warning records.
 * @property {string} quote_size - The size of the quote.
 * @property {string} base_size - The size of the base.
 * @property {string} best_bid - The best bid price.
 * @property {string} best_ask - The best ask price.
 * @property {boolean} is_max - Flag indicating if it is the maximum value.
 * @property {string} [order_margin_total] - The total order margin amount (optional).
 * @property {string} [leverage] - The leverage amount (optional).
 * @property {string} [long_leverage] - The long leverage amount (optional).
 * @property {string} [short_leverage] - The short leverage amount (optional).
 * @property {string} [slippage] - The slippage amount (optional).
 * @property {string} [preview_id] - The preview ID (optional).
 * @property {string} [current_liquidation_buffer] - The current liquidation buffer amount (optional).
 * @property {string} [projected_liquidation_buffer] - The projected liquidation buffer amount (optional).
 * @property {string} [max_leverage] - The maximum leverage amount (optional).
 * @property {Record<string, any>} [pnl_configuration] - The profit and loss configuration (optional).
 */
             
export type PreviewOrderResponse = {
    order_total: string;
    commission_total: string;
    errs: Record<string, any>[];
    warning: Record<string, any>[];
    quote_size: string;
    base_size: string;
    best_bid: string;
    best_ask: string;
    is_max: boolean;
    order_margin_total?: string;
    leverage?: string;
    long_leverage?: string;
    short_leverage?: string;
    slippage?: string;
    preview_id?: string;
    current_liquidation_buffer?: string;
    projected_liquidation_buffer?: string;
    max_leverage?: string;
    pnl_configuration?: Record<string, any>;
};

// Close Position
/**
 * Define the structure of a Close Position request object.
 *
 * @typedef {Object} ClosePositionRequest
 * @property {string} clientOrderId - The unique identifier for the client order.
 * @property {string} productId - The identification of the product related to the request.
 * @property {string} [size] - Optional parameter indicating the size of the position to be closed.
 */
export type ClosePositionRequest = {
    // Body Params
    clientOrderId: string;
    productId: string;
    size?: string;
};

/**
 * Represents the response object for closing a position.
 * @typedef {Object} ClosePositionResponse
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {Object} [response] - The response object which can be either a success response or an error response.
 * @property {Object} [order_configuration] - The configuration of the order associated with the response.
 */
export type ClosePositionResponse = {
    success: boolean;
    response?:
        | { success_response: Record<string, any> }
        | { error_response: Record<string, any> };
    order_configuration?: OrderConfiguration;
};
