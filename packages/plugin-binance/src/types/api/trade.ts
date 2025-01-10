import { ORDER_SIDES, ORDER_TYPES, TIME_IN_FORCE } from "../../constants/api";

/**
 * Represents a specific type of order from the possible options defined in ORDER_TYPES.
 */
export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
/**
 * Defines the type OrderSide as one of the values in the ORDER_SIDES object.
 */
export type OrderSide = (typeof ORDER_SIDES)[keyof typeof ORDER_SIDES];
/**
 * Defines the type `TimeInForce` to be a key of the `TIME_IN_FORCE` object.
 */
export type TimeInForce = (typeof TIME_IN_FORCE)[keyof typeof TIME_IN_FORCE];

/**
 * Binance API new order response
 */
/**
 * Interface representing the response object returned by Binance when placing an order.
 * @typedef {Object} BinanceOrderResponse
 * @property {string} symbol - The symbol of the asset being traded.
 * @property {number} orderId - The unique identifier of the order.
 * @property {number} orderListId - The unique identifier of the order list.
 * @property {string} clientOrderId - The client-provided identifier of the order.
 * @property {number} transactTime - The transaction timestamp of the order.
 * @property {string} price - The price set for the order.
 * @property {string} origQty - The original quantity of the order.
 * @property {string} executedQty - The quantity that has been executed.
 * @property {string} cummulativeQuoteQty - The total quote quantity of the order.
 * @property {OrderStatus} status - The current status of the order.
 * @property {TimeInForce} timeInForce - The time in force of the order.
 * @property {OrderType} type - The type of order (LIMIT, MARKET, etc.).
 * @property {OrderSide} side - The side of the order (BUY or SELL).
 * @property {OrderFill[]} [fills] - An array of order fills, representing each trade that was executed.
 */
export interface BinanceOrderResponse {
    symbol: string;
    orderId: number;
    orderListId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: OrderStatus;
    timeInForce: TimeInForce;
    type: OrderType;
    side: OrderSide;
    fills?: OrderFill[];
}

/**
 * Order fill information
 */
export interface OrderFill {
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
    tradeId: number;
}

/**
 * Order status types
 */
export type OrderStatus =
    | "NEW"
    | "PARTIALLY_FILLED"
    | "FILLED"
    | "CANCELED"
    | "PENDING_CANCEL"
    | "REJECTED"
    | "EXPIRED";

/**
 * New order parameters for Binance API
 */
export interface BinanceNewOrderParams {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    timeInForce?: TimeInForce;
    quantity?: string | number;
    quoteOrderQty?: string | number;
    price?: string | number;
    newClientOrderId?: string;
    stopPrice?: string | number;
    icebergQty?: string | number;
    newOrderRespType?: "ACK" | "RESULT" | "FULL";
}

/**
 * Order query parameters
 */
export interface BinanceOrderQueryParams {
    symbol: string;
    orderId?: number;
    origClientOrderId?: string;
}

/**
 * Cancel order parameters
 */
export interface BinanceCancelOrderParams extends BinanceOrderQueryParams {
    newClientOrderId?: string;
}
