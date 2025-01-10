// ----- ENUMS -----
/**
 * Enumeration for different types of products.
 */

export enum ProductType {
    UNKNOWN = 'UNKNOWN_PRODUCT_TYPE',
    SPOT = 'SPOT',
    FUTURE = 'FUTURE',
}

/**
 * Enumeration representing the different types of contract expiry.
 * - UNKNOWN: Unknown contract expiry type
 * - EXPIRING: Contract is expiring
 * - PERPETUAL: Contract is perpetual
*/
export enum ContractExpiryType {
    UNKNOWN = 'UNKNOWN_CONTRACT_EXPIRY_TYPE',
    EXPIRING = 'EXPIRING',
    PERPETUAL = 'PERPETUAL',
}

/**
 * Enumeration representing the status of an expiring contract.
 * @enum {string}
 * @readonly
 * @property {string} UNKNOWN - Unknown expiring contract status.
 * @property {string} UNEXPIRED - Status of an unexpired contract.
 * @property {string} EXPIRED - Status of an expired contract.
 * @property {string} ALL - All status of contracts.
 */
export enum ExpiringContractStatus {
    UNKNOWN = 'UNKNOWN_EXPIRING_CONTRACT_STATUS',
    UNEXPIRED = 'STATUS_UNEXPIRED',
    EXPIRED = 'STATUS_EXPIRED',
    ALL = 'STATUS_ALL',
}

/**
 * Enum representing different types of portfolios.
 * @readonly
 * @enum {string}
 * @property {string} UNDEFINED - Represents an undefined portfolio type.
 * @property {string} DEFAULT - Represents a default portfolio type.
 * @property {string} CONSUMER - Represents a consumer portfolio type.
 * @property {string} INTX - Represents an INTX portfolio type.
 */
export enum PortfolioType {
    UNDEFINED = 'UNDEFINED',
    DEFAULT = 'DEFAULT',
    CONSUMER = 'CONSUMER',
    INTX = 'INTX',
}

/**
 * Enum representing the margin type.
 * @readonly
 * @enum {string}
 * @property {string} CROSS - Cross margin type.
 * @property {string} ISOLATED - Isolated margin type.
 */ 

export enum MarginType {
    CROSS = 'CROSS',
    ISOLATED = 'ISOLATED',
}

/**
 * Enum representing the source of order placement.
 * Possible values are:
 * - UNKNOWN: Unknown placement source
 * - RETAIL_SIMPLE: Retail simple placement
 * - RETAIL_ADVANCED: Retail advanced placement
 */
export enum OrderPlacementSource {
    UNKNOWN = 'UNKNOWN_PLACEMENT_SOURCE',
    RETAIL_SIMPLE = 'RETAIL_SIMPLE',
    RETAIL_ADVANCED = 'RETAIL_ADVANCED',
}

/**
 * Enum representing different options for sorting.
 * 
 * @readonly
 * @enum {string}
 * @property {string} UNKNOWN - Sort by unknown criteria.
 * @property {string} LIMIT_PRICE - Sort by limit price.
 * @property {string} LAST_FILL_TIME - Sort by last fill time.
 */
export enum SortBy {
    UNKNOWN = 'UNKNOWN_SORT_BY',
    LIMIT_PRICE = 'LIMIT_PRICE',
    LAST_FILL_TIME = 'LAST_FILL_TIME',
}

/**
 * Enumeration representing the two sides of an order: BUY and SELL.
 */
export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL',
}

/**
 * Enumeration representing the possible directions of a stop.
 * @enum {string}
 * @readonly
 * @property {string} UP - Represents the upward direction of a stop.
 * @property {string} DOWN - Represents the downward direction of a stop.
 */
export enum StopDirection {
    UP = 'STOP_DIRECTION_STOP_UP',
    DOWN = 'STOP_DIRECTION_STOP_DOWN',
}

/**
 * Enumeration for different time granularities.
 * @enum {string}
 * @readonly
 * @property {string} UNKNOWN - Represents unknown time granularity.
 * @property {string} ONE_MINUTE - Represents one minute granularity.
 * @property {string} FIVE_MINUTE - Represents five minute granularity.
 * @property {string} FIFTEEN_MINUTE - Represents fifteen minute granularity.
 * @property {string} THIRTY_MINUTE - Represents thirty minute granularity.
 * @property {string} ONE_HOUR - Represents one hour granularity.
 * @property {string} TWO_HOUR - Represents two hour granularity.
 * @property {string} SIX_HOUR - Represents six hour granularity.
 * @property {string} ONE_DAY - Represents one day granularity.
 */
export enum Granularity {
    UNKNOWN = 'UNKNOWN_GRANULARITY',
    ONE_MINUTE = 'ONE_MINUTE',
    FIVE_MINUTE = 'FIVE_MINUTE',
    FIFTEEN_MINUTE = 'FIFTEEN_MINUTE',
    THIRTY_MINUTE = 'THIRTY_MINUTE',
    ONE_HOUR = 'ONE_HOUR',
    TWO_HOUR = 'TWO_HOUR',
    SIX_HOUR = 'SIX_HOUR',
    ONE_DAY = 'ONE_DAY',
}

/**
 * Enum representing different product venues.
 * 
 * @readonly
 * @enum {string}
 * @property {string} UNKNOWN - Unknown venue type
 * @property {string} CBE - CBE venue
 * @property {string} FCM - FCM venue
 * @property {string} INTX - INTX venue
 */
export enum ProductVenue {
    UNKNOWN = 'UNKNOWN_VENUE_TYPE',
    CBE = 'CBE',
    FCM = 'FCM',
    INTX = 'INTX',
}

/**
 * Enum representing different intraday margin settings.
 * @enum {string}
 * @readonly
 */
      
export enum IntradayMarginSetting {
    UNSPECIFIED = 'INTRADAY_MARGIN_SETTING_UNSPECIFIED',
    STANDARD = 'INTRADAY_MARGIN_SETTING_STANDARD',
    INTRADAY = 'INTRADAY_MARGIN_SETTING_INTRADAY',
}

// ----- TYPES -----
/**
 * Represents an account with the following properties:
 * @typedef {Object} Account
 * @property {string} [uuid] - The unique identifier of the account.
 * @property {string} [name] - The name of the account.
 * @property {string} [currency] - The currency of the account.
 * @property {Record<string, any>} [available_balance] - The available balance of the account.
 * @property {boolean} [default] - Indicates if the account is the default account.
 * @property {boolean} [active] - Indicates if the account is active.
 * @property {string} [created_at] - The date the account was created.
 * @property {string} [updated_at] - The date the account was last updated.
 * @property {string} [deleted_at] - The date the account was deleted.
 * @property {Record<string, any>} [type] - The type of the account.
 * @property {boolean} [ready] - Indicates if the account is ready.
 * @property {Record<string, any>} [hold] - The hold on the account.
 * @property {string} [retail_portfolio_id] - The ID of the retail portfolio associated with the account.
 */
export type Account = {
    uuid?: string;
    name?: string;
    currency?: string;
    available_balance?: Record<string, any>;
    default?: boolean;
    active?: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    type?: Record<string, any>;
    ready?: boolean;
    hold?: Record<string, any>;
    retail_portfolio_id?: string;
};

/**
 * Represents the metadata for a trade incentive.
 * @typedef {Object} TradeIncentiveMetadata
 * @property {string} [userIncentiveId] - The ID of the user incentive.
 * @property {string} [codeVal] - The code value associated with the incentive.
 */
export type TradeIncentiveMetadata = {
    userIncentiveId?: string;
    codeVal?: string;
};

/**
 * Represents different types of order configurations.
 * 
 * @typedef {Object} OrderConfiguration
 * @property {MarketMarketIoc} market_market_ioc - Market IOC order configuration
 * @property {SorLimitIoc} sor_limit_ioc - Sor Limit IOC order configuration
 * @property {LimitLimitGtc} limit_limit_gtc - Limit GTC order configuration
 * @property {LimitLimitGtd} limit_limit_gtd - Limit GTD order configuration
 * @property {LimitLimitFok} limit_limit_fok - Limit FOK order configuration
 * @property {StopLimitStopLimitGtc} stop_limit_stop_limit_gtc - Stop Limit GTC order configuration
 * @property {StopLimitStopLimitGtd} stop_limit_stop_limit_gtd - Stop Limit GTD order configuration
 * @property {TriggerBracketGtc} trigger_bracket_gtc - Trigger Bracket GTC order configuration
 * @property {TriggerBracketGtd} trigger_bracket_gtd - Trigger Bracket GTD order configuration
 */
export type OrderConfiguration =
    | { market_market_ioc: MarketMarketIoc }
    | { sor_limit_ioc: SorLimitIoc }
    | { limit_limit_gtc: LimitLimitGtc }
    | { limit_limit_gtd: LimitLimitGtd }
    | { limit_limit_fok: LimitLimitFok }
    | { stop_limit_stop_limit_gtc: StopLimitStopLimitGtc }
    | { stop_limit_stop_limit_gtd: StopLimitStopLimitGtd }
    | { trigger_bracket_gtc: TriggerBracketGtc }
    | { trigger_bracket_gtd: TriggerBracketGtd };

/**
 * Type representing a market with either a quote size or a base size.
 */
export type MarketMarketIoc = { quote_size: string } | { base_size: string };

/**
 * Definition for the SorLimitIoc type.
 * @typedef {Object} SorLimitIoc
 * @property {string} baseSize - The base size.
 * @property {string} limitPrice - The limit price.
 */
export type SorLimitIoc = {
    baseSize: string;
    limitPrice: string;
};

/**
 * Definition for a Limit Limit Gtc order.
 * @typedef {Object} LimitLimitGtc
 * @property {string} baseSize - The base size of the order.
 * @property {string} limitPrice - The limit price for the order.
 * @property {boolean} postOnly - A flag indicating if the order is post-only.
 */
export type LimitLimitGtc = {
    baseSize: string;
    limitPrice: string;
    postOnly: boolean;
};

/**
 * Represents the limit order parameters for a Limit Limit Gtd order.
 * @typedef {object} LimitLimitGtd
 * @property {string} baseSize - The base size of the order.
 * @property {string} limitPrice - The limit price of the order.
 * @property {string} endTime - The end time of the order.
 * @property {boolean} postOnly - Indicates if the order is post only.
 */
export type LimitLimitGtd = {
    baseSize: string;
    limitPrice: string;
    endTime: string;
    postOnly: boolean;
};

/**
 * Represents a limit order with a base size and limit price.
 * @typedef {Object} LimitLimitFok
 * @property {string} baseSize - The size of the order.
 * @property {string} limitPrice - The price at which the order should execute.
 */
export type LimitLimitFok = {
    baseSize: string;
    limitPrice: string;
};

/**
 * Represents a stop-limit order with the GTC (Good 'Til Canceled) time in force
 * @typedef {object} StopLimitStopLimitGtc
 * @property {string} baseSize - The size of the order
 * @property {string} limitPrice - The price at which the order should be executed
 * @property {string} stopPrice - The price at which the stop order will trigger
 * @property {StopDirection} stopDirection - The direction of the stop order
 */
export type StopLimitStopLimitGtc = {
    baseSize: string;
    limitPrice: string;
    stopPrice: string;
    stopDirection: StopDirection;
};

/**
 * Represents a stop-limit order with a specific expiration time.
 * @typedef {Object} StopLimitStopLimitGtd
 * @property {string} baseSize - The size of the order.
 * @property {string} limitPrice - The price at which the order becomes a limit order.
 * @property {string} stopPrice - The price at which the order becomes a market order.
 * @property {string} endTime - The expiration time of the order.
 * @property {StopDirection} stopDirection - The direction of the stop price.
 */
export type StopLimitStopLimitGtd = {
    baseSize: string;
    limitPrice: string;
    stopPrice: string;
    endTime: string;
    stopDirection: StopDirection;
};

/**
 * Type representing a Trigger Bracket order with the specified parameters.
 * @typedef {object} TriggerBracketGtc
 * @property {string} baseSize - The base size of the order.
 * @property {string} limitPrice - The limit price for the order.
 * @property {string} stopTriggerPrice - The stop trigger price for the order.
 */
export type TriggerBracketGtc = {
    baseSize: string;
    limitPrice: string;
    stopTriggerPrice: string;
};

/**
 * Represents a trigger bracket order for a Gtd (Good 'til Date) order type.
 *
 * @typedef {Object} TriggerBracketGtd
 * @property {string} baseSize - The base size for the order.
 * @property {string} limitPrice - The limit price for the order.
 * @property {string} stopTriggerPrice - The stop trigger price for the order.
 * @property {string} endTime - The end time for the order.
 */
export type TriggerBracketGtd = {
    baseSize: string;
    limitPrice: string;
    stopTriggerPrice: string;
    endTime: string;
};

/**
 * Interface for RatConvertTrade object representing a trade operation.
 * @typedef { Object } RatConvertTrade
 * @property { string } [id] - Unique identifier for the trade.
 * @property {Record<string, any>} [status] - Status of the trade.
 * @property {Record<string, any>} [user_entered_amount] - Amount entered by the user.
 * @property {Record<string, any>} [amount] - Total amount of the trade.
 * @property {Record<string, any>} [subtotal] - Subtotal amount of the trade.
 * @property {Record<string, any>} [total] - Total amount including fees.
 * @property {Record<string, any>} [fees] - Fees associated with the trade.
 * @property {Record<string, any>} [total_fee] - Total fee for the trade.
 * @property {Record<string, any>} [source] - Source details of the trade.
 * @property {Record<string, any>} [target] - Target details of the trade.
 * @property {Record<string, any>} [unit_price] - Unit price of the trade.
 * @property {Record<string, any>} [user_warnings] - Any warnings for the user.
 * @property { string } [user_reference] - User reference for the trade.
 * @property { string } [source_currency] - Currency of the source.
 * @property {Record<string, any>} [cancellation_reason] - Reason for trade cancellation.
 * @property { string } [source_id] - ID of the source.
 * @property { string } [target_id] - ID of the target.
 * @property {Record<string, any>} [subscription_info] - Information about any subscription associated with the trade.
 * @property {Record<string, any>} [exchange_rate] - Exchange rate used for the trade.
 * @property {Record<string, any>} [tax_details] - Tax details for the trade.
 * @property {Record<string, any>} [trade_incentive_info] - Information about any trade incentives.
 * @property {Record<string, any>} [total_fee_without_tax] - Total fee without tax for the trade.
 * @property {Record<string, any>} [fiat_denoted_total] - Total amount denoted in fiat currency.
 */
export type RatConvertTrade = {
    id?: string;
    status?: Record<string, any>;
    user_entered_amount?: Record<string, any>;
    amount?: Record<string, any>;
    subtotal?: Record<string, any>;
    total?: Record<string, any>;
    fees?: Record<string, any>;
    total_fee?: Record<string, any>;
    source?: Record<string, any>;
    target?: Record<string, any>;
    unit_price?: Record<string, any>;
    user_warnings?: Record<string, any>;
    user_reference?: string;
    source_curency?: string;
    cancellation_reason?: Record<string, any>;
    source_id?: string;
    target_id?: string;
    subscription_info?: Record<string, any>;
    exchange_rate?: Record<string, any>;
    tax_details?: Record<string, any>;
    trade_incentive_info?: Record<string, any>;
    total_fee_without_tax?: Record<string, any>;
    fiat_denoted_total?: Record<string, any>;
};

/**
 * Defines the structure of FCMBalanceSummary object which contains various balance information.
 * @typedef {Object} FCMBalanceSummary
 * @property {Object<string, any>} [futures_buying_power] - The futures buying power balance.
 * @property {Object<string, any>} [total_usd_balance] - The total USD balance.
 * @property {Object<string, any>} [cbi_usd_balance] - The CBI USD balance.
 * @property {Object<string, any>} [cfm_usd_balance] - The CFM USD balance.
 * @property {Object<string, any>} [total_open_orders_hold_amount] - The total open orders hold amount.
 * @property {Object<string, any>} [unrealized_pnl] - The unrealized profit and loss.
 * @property {Object<string, any>} [daily_realized_pnl] - The daily realized profit and loss.
 * @property {Object<string, any>} [initial_margin] - The initial margin balance.
 * @property {Object<string, any>} [available_margin] - The available margin balance.
 * @property {Object<string, any>} [liquidation_threshold] - The liquidation threshold balance.
 * @property {Object<string, any>} [liquidation_buffer_amount] - The liquidation buffer amount balance.
 * @property {string} [liquidation_buffer_percentage] - The liquidation buffer percentage.
 * @property {Object<string, any>} [intraday_margin_window_measure] - The intraday margin window measure.
 * @property {Object<string, any>} [overnight_margin_window_measure] - The overnight margin window measure.
 */
export type FCMBalanceSummary = {
    futures_buying_power?: Record<string, any>;
    total_usd_balance?: Record<string, any>;
    cbi_usd_balance?: Record<string, any>;
    cfm_usd_balance?: Record<string, any>;
    total_open_orders_hold_amount?: Record<string, any>;
    unrealized_pnl?: Record<string, any>;
    daily_realized_pnl?: Record<string, any>;
    initial_margin?: Record<string, any>;
    available_margin?: Record<string, any>;
    liquidation_threshold?: Record<string, any>;
    liquidation_buffer_amount?: Record<string, any>;
    liquidation_buffer_percentage?: string;
    intraday_margin_window_measure?: Record<string, any>;
    overnight_margin_window_measure?: Record<string, any>;
};

/**
 * Definition of FCMPosition type.
 * @typedef {Object} FCMPosition
 * @property {string} [product_id] - The product ID.
 * @property {Record<string, any>} [expiration_time] - The expiration time.
 * @property {Record<string, any>} [side] - The side.
 * @property {string} [number_of_contracts] - The number of contracts.
 * @property {string} [current_price] - The current price.
 * @property {string} [avg_entry_price] - The average entry price.
 * @property {string} [unrealized_pnl] - The unrealized profit and loss.
 * @property {string} [daily_realized_pnl] - The daily realized profit and loss.
 */

export type FCMPosition = {
    product_id?: string;
    expiration_time?: Record<string, any>;
    side?: Record<string, any>;
    number_of_contracts?: string;
    current_price?: string;
    avg_entry_price?: string;
    unrealized_pnl?: string;
    daily_realized_pnl?: string;
};

/**
 * Type representing an FCMSweep object.
 * @typedef {Object} FCMSweep
 * @property {string} id - The ID of the FCMSweep object.
 * @property {Record<string, any>} requested_amount - The requested amount of the FCMSweep object.
 * @property {boolean} should_sweep_all - Boolean indicating if all should be swept.
 * @property {Record<string, any>} status - The status of the FCMSweep object.
 * @property {Record<string, any>} schedule_time - The schedule time of the FCMSweep object.
 */
export type FCMSweep = {
    id: string;
    requested_amount: Record<string, any>;
    should_sweep_all: boolean;
    status: Record<string, any>;
    schedule_time: Record<string, any>;
};

/**
 * Type representing a Cancel Order Object.
 * 
 * @typedef {Object} CancelOrderObject
 * @property {boolean} success - Indicates if the order was successfully cancelled.
 * @property {Record<string, any>} failure_reason - Information about why the order cancellation failed.
 * @property {string} order_id - The unique identifier of the order.
 */
export type CancelOrderObject = {
    success: boolean;
    failure_reason: Record<string, any>;
    order_id: string;
};

/**
 * Definition of an Order object.
 * @typedef { Object } Order
 * @property { string } order_id - The ID of the order.
 * @property { string } product_id - The ID of the product associated with the order.
 * @property { string } user_id - The ID of the user who placed the order.
 * @property { OrderConfiguration } order_configuration - The configuration settings for the order.
 * @property { OrderSide } side - The side of the order (buy or sell).
 * @property { string } client_order_id - The client-specific ID of the order.
 * @property {Record<string, any>} status - The current status of the order.
 * @property {Record<string, any>} [time_in_force] - The time in force settings for the order (optional).
 * @property {Record<string, any>} created_time - The timestamp when the order was created.
 * @property { string } completion_percentage - The percentage of the order that has been completed.
 * @property { string } [filled_size] - The size of the order that has been filled (optional).
 * @property { string } average_filled_price - The average price at which the order has been filled.
 * @property { string } [fee] - The fee associated with the order (optional).
 * @property { string } number_of_fills - The number of fills that have occurred for the order.
 * @property { string } [filled_value] - The total value of the order that has been filled (optional).
 * @property { boolean } pending_cancel - Indicates if the order is pending cancellation.
 * @property { boolean } size_in_quote - Indicates if the size of the order is in quote currency.
 * @property { string } total_fees - The total fees incurred by the order.
 * @property { boolean } size_inclusive_of_fees - Indicates if the size of the order includes fees.
 * @property { string } total_value_after_fees - The total value of the order after fees.
 * @property {Record<string, any>} [trigger_status] - The trigger status of the order (optional).
 * @property {Record<string, any>} [order_type] - The type of the order (optional).
 * @property {Record<string, any>} [reject_reason] - The reason for rejecting the order (optional).
 * @property { boolean } [settled] - Indicates if the order has been settled (optional).
 * @property { ProductType } [product_type] - The type of product associated with the order (optional).
 * @property { string } [reject_message] - The message associated with rejecting the order (optional).
 * @property { string } [cancel_message] - The message associated with canceling the order (optional).
 * @property { OrderPlacementSource } [order_placement_source] - The source of order placement (optional).
 * @property { string } [outstanding_hold_amount] - The remaining amount to be held for the order (optional).
 * @property { boolean } [is_liquidation] - Indicates if the order is a liquidation order (optional).
 * @property {Record<string, any>} [last_fill_time] - The timestamp of the last fill (optional).
 * @property {Record<string, any>[]} [edit_history] - The history of edits made to the order (optional).
 * @property { string } [leverage] - The leverage used for the order (optional).
 * @property { MarginType } [margin_type] - The type of margin used for the order (optional).
 * @property { string } [retail_portfolio_id] - The ID of the retail portfolio associated with the order (optional).
 * @property { string } [originating_order_id] - The ID of the order that originated this order (optional).
 * @property { string } [attached_order_id] - The ID of the attached order (optional).
 */
export type Order = {
    order_id: string;
    product_id: string;
    user_id: string;
    order_configuration: OrderConfiguration;
    side: OrderSide;
    client_order_id: string;
    status: Record<string, any>;
    time_in_force?: Record<string, any>;
    created_time: Record<string, any>;
    completion_percentage: string;
    filled_size?: string;
    average_filled_price: string;
    fee?: string;
    number_of_fills: string;
    filled_value?: string;
    pending_cancel: boolean;
    size_in_quote: boolean;
    total_fees: string;
    size_inclusive_of_fees: boolean;
    total_value_after_fees: string;
    trigger_status?: Record<string, any>;
    order_type?: Record<string, any>;
    reject_reason?: Record<string, any>;
    settled?: boolean;
    product_type?: ProductType;
    reject_message?: string;
    cancel_message?: string;
    order_placement_source?: OrderPlacementSource;
    outstanding_hold_amount?: string;
    is_liquidation?: boolean;
    last_fill_time?: Record<string, any>;
    edit_history?: Record<string, any>[];
    leverage?: string;
    margin_type?: MarginType;
    retail_portfolio_id?: string;
    originating_order_id?: string;
    attached_order_id?: string;
};

/**
 * Represents a payment method.
 * @typedef {Object} PaymentMethod
 * @property {string} [id] - The unique identifier for the payment method.
 * @property {string} [type] - The type of payment method.
 * @property {string} [name] - The name of the payment method.
 * @property {string} [currency] - The currency associated with the payment method.
 * @property {boolean} [verified] - Indicates if the payment method is verified.
 * @property {boolean} [allow_buy] - Indicates if the payment method allows buying.
 * @property {boolean} [allow_sell] - Indicates if the payment method allows selling.
 * @property {boolean} [allow_deposit] - Indicates if the payment method allows depositing funds.
 * @property {boolean} [allow_withdraw] - Indicates if the payment method allows withdrawing funds.
 * @property {string} [created_at] - The date and time when the payment method was created.
 * @property {string} [updated_at] - The date and time when the payment method was last updated.
 */
export type PaymentMethod = {
    id?: string;
    type?: string;
    name?: string;
    currency?: string;
    verified?: boolean;
    allow_buy?: boolean;
    allow_sell?: boolean;
    allow_deposit?: boolean;
    allow_withdraw?: boolean;
    created_at?: string;
    updated_at?: string;
};

/**
 * Represents a Perpetual Portfolio object.
 * @typedef { Object } PerpetualPortfolio
 * @property { string } [portfolio_uuid] - The UUID of the portfolio.
 * @property { string } [collateral] - The collateral amount.
 * @property { string } [position_notional] - The position notional value.
 * @property { string } [open_position_notional] - The open position notional value.
 * @property { string } [pending_fees] - The pending fees amount.
 * @property { string } [borrow] - The borrowed amount.
 * @property { string } [accrued_interest] - The accrued interest amount.
 * @property { string } [rolling_debt] - The rolling debt value.
 * @property { string } [portfolio_initial_margin] - The initial margin of the portfolio.
 * @property {Record<string, any>} [portfolio_im_notional] - Record of the portfolio IM notional values.
 * @property { string } [liquidation_percentage] - The liquidation percentage.
 * @property { string } [liquidation_buffer] - The liquidation buffer amount.
 * @property {Record<string, any>} [margin_type] - Record of margin type values.
 * @property {Record<string, any>} [margin_flags] - Record of margin flags values.
 * @property {Record<string, any>} [liquidation_status] - Record of liquidation status values.
 * @property {Record<string, any>} [unrealized_pnl] - Record of unrealized P&L values.
 * @property {Record<string, any>} [total_balance] - Record of total balance values.
 */
export type PerpetualPortfolio = {
    portfolio_uuid?: string;
    collateral?: string;
    position_notional?: string;
    open_position_notional?: string;
    pending_fees?: string;
    borrow?: string;
    accrued_interest?: string;
    rolling_debt?: string;
    portfolio_initial_margin?: string;
    portfolio_im_notional?: Record<string, any>;
    liquidation_percentage?: string;
    liquidation_buffer?: string;
    margin_type?: Record<string, any>;
    margin_flags?: Record<string, any>;
    liquidation_status?: Record<string, any>;
    unrealized_pnl?: Record<string, any>;
    total_balance?: Record<string, any>;
};

/**
 * Represents the summary of a portfolio.
 * @typedef {Object} PortfolioSummary
 * @property {Record<string, any>} [unrealized_pnl] - The unrealized profit and loss of the portfolio.
 * @property {Record<string, any>} [buying_power] - The buying power available in the portfolio.
 * @property {Record<string, any>} [total_balance] - The total balance of the portfolio.
 * @property {Record<string, any>} [max_withdrawal_amount] - The maximum withdrawal amount allowed from the portfolio.
 */
export type PortfolioSummary = {
    unrealized_pnl?: Record<string, any>;
    buying_power?: Record<string, any>;
    total_balance?: Record<string, any>;
    max_withdrawal_amount?: Record<string, any>;
};

/**
 * Type definition for a PositionSummary object that may contain aggregated PNL data.
 * @typedef {Object} PositionSummary
 * @property {Object.<string, any>} [aggregated_pnl] - Optional field for aggregated PNL data
 */
export type PositionSummary = {
    aggregated_pnl?: Record<string, any>;
};

/**
 * Definition of a Position object representing a trading position.
 * @typedef {Object} Position
 * @property {string} [product_id] - The product ID.
 * @property {string} [product_uuid] - The product UUID.
 * @property {string} [portfolio_uuid] - The portfolio UUID.
 * @property {string} [symbol] - The symbol of the position.
 * @property {object} [vwap] - The volume-weighted average price.
 * @property {object} [entry_vwap] - The entry volume-weighted average price.
 * @property {object} [position_side] - The position side.
 * @property {object} [margin_type] - The margin type.
 * @property {string} [net_size] - The net size of the position.
 * @property {string} [buy_order_size] - The buy order size.
 * @property {string} [sell_order_size] - The sell order size.
 * @property {string} [im_contribution] - The initial margin contribution.
 * @property {object} [unrealized_pnl] - The unrealized profit and loss.
 * @property {object} [mark_price] - The mark price.
 * @property {object} [liquidation_price] - The liquidation price.
 * @property {string} [leverage] - The leverage used for the position.
 * @property {object} [im_notional] - The initial margin notional.
 * @property {object} [mm_notional] - The maintenance margin notional.
 * @property {object} [position_notional] - The position notional.
 * @property {object} [aggregated_pnl] - The aggregated profit and loss.
 */
export type Position = {
    product_id?: string;
    product_uuid?: string;
    portfolio_uuid?: string;
    symbol?: string;
    vwap?: Record<string, any>;
    entry_vwap?: Record<string, any>;
    position_side?: Record<string, any>;
    margin_type?: Record<string, any>;
    net_size?: string;
    buy_order_size?: string;
    sell_order_size?: string;
    im_contribution?: string;
    unrealized_pnl?: Record<string, any>;
    mark_price?: Record<string, any>;
    liquidation_price?: Record<string, any>;
    leverage?: string;
    im_notional?: Record<string, any>;
    mm_notional?: Record<string, any>;
    position_notional?: Record<string, any>;
    aggregated_pnl?: Record<string, any>;
};

/**
 * Represents the balance of an asset in a trading account.
 * @typedef {Object} Balance
 * @property {Record<string, any>} asset - The details of the asset.
 * @property {string} quantity - The quantity of the asset.
 * @property {string} hold - The amount of the asset that is currently on hold.
 * @property {string} transfer_hold - The amount of the asset that is being transferred.
 * @property {string} collateral_value - The value of the asset used as collateral.
 * @property {string} collateral_weight - The weight of the asset used as collateral.
 * @property {string} max_withdraw_amount - The maximum amount of the asset that can be withdrawn.
 * @property {string} loan - The amount of the asset that is loaned.
 * @property {string} loan_collateral_requirement_usd - The USD amount required as collateral for the loan.
 * @property {string} pledged_quantity - The quantity of the asset pledged as collateral.
 */
export type Balance = {
    asset: Record<string, any>;
    quantity: string;
    hold: string;
    transfer_hold: string;
    collateral_value: string;
    collateral_weight: string;
    max_withdraw_amount: string;
    loan: string;
    loan_collateral_requirement_usd: string;
    pledged_quantity: string;
};

/**
 * Definition of a Portfolio object.
 *
 * @typedef {Object} Portfolio
 * @property {string} [name] - The name of the portfolio.
 * @property {string} [uuid] - The UUID of the portfolio.
 * @property {string} [type] - The type of the portfolio.
 */
export type Portfolio = {
    name?: string;
    uuid?: string;
    type?: string;
};

/**
 * Type representing the breakdown of a portfolio.
 * * @typedef { Object } PortfolioBreakdown
 * @property { Portfolio } [portfolio] - The portfolio information.
 * @property {Record<string, any>} [portfolio_balances] - The balances within the portfolio.
 * @property {Record<string, any>[]} [spot_positions] - The positions for spot trading.
 * @property {Record<string, any>[]} [perp_positions] - The positions for perpetual trading.
 * @property {Record<string, any>[]} [futures_positions] - The positions for futures trading.
 */
export type PortfolioBreakdown = {
    portfolio?: Portfolio;
    portfolio_balances?: Record<string, any>;
    spot_positions?: Record<string, any>[];
    perp_positions?: Record<string, any>[];
    futures_positions?: Record<string, any>[];
};

/**
 * Definition for a PriceBook object representing the bids and asks for a product.
 *
 * @typedef {Object} PriceBook
 * @property {string} product_id - The unique identifier for the product.
 * @property {Record<string, any>[]} bids - An array of bid records.
 * @property {Record<string, any>[]} asks - An array of ask records.
 * @property {Record<string, any>} [time] - Optional time record.
 */
export type PriceBook = {
    product_id: string;
    bids: Record<string, any>[];
    asks: Record<string, any>[];
    time?: Record<string, any>;
};

/**
 * Type representing products, which contains an array of products and the number of products.
 *
 * @typedef {Object} Products
 * @property {Product[]} [products] - Array of products
 * @property {number} [num_products] - Number of products
 */
export type Products = {
    products?: Product[];
    num_products?: number;
};

/**
 * Represents a product with various attributes.
 * @typedef {Object} Product
 * @property {string} product_id - The unique identifier for the product.
 * @property {string} price - The current price of the product.
 * @property {string} price_percentage_change_24h - The percentage change in price over the last 24 hours.
 * @property {string} volume_24h - The trading volume over the last 24 hours.
 * @property {string} volume_percentage_change_24h - The percentage change in trading volume over the last 24 hours.
 * @property {string} base_increment - The minimum increment for the base currency.
 * @property {string} quote_increment - The minimum increment for the quote currency.
 * @property {string} quote_min_size - The minimum size for the quote currency.
 * @property {string} quote_max_size - The maximum size for the quote currency.
 * @property {string} base_min_size - The minimum size for the base currency.
 * @property {string} base_max_size - The maximum size for the base currency.
 * @property {string} base_name - The name of the base currency.
 * @property {string} quote_name - The name of the quote currency.
 * @property {boolean} watched - Indicates if the product is being watched.
 * @property {boolean} is_disabled - Indicates if the product is disabled.
 * @property {boolean} new - Indicates if the product is new.
 * @property {string} status - The current status of the product.
 * @property {boolean} cancel_only - Indicates if trading is limited to cancel orders only.
 * @property {boolean} limit_only - Indicates if trading is limited to limit orders only.
 * @property {boolean} post_only - Indicates if trading is limited to post only.
 * @property {boolean} trading_disabled - Indicates if trading is disabled.
 * @property {boolean} auction_mode - Indicates if the product is in auction mode.
 * @property {ProductType} [product_type] - The type of product.
 * @property {string} [quote_currency_id] - The unique identifier for the quote currency.
 * @property {string} [base_currency_id] - The unique identifier for the base currency.
 * @property {Record<string, any>} [fcm_trading_session_details] - Additional details for trading sessions.
 * @property {string} [mid_market_price] - The mid-market price of the product.
 * @property {string} [alias] - An alias for the product.
 * @property {string[]} [alias_to] - An array of aliases for the product.
 * @property {string} base_display_symbol - The display symbol for the base currency.
 * @property {string} [quote_display_symbol] - The display symbol for the quote currency.
 * @property {boolean} [view_only] - Indicates if the product is view-only.
 * @property {string} [price_increment] - The increment of price for the product.
 * @property {string} [display_name] - The display name of the product.
 * @property {ProductVenue} [product_venue] - The venue where the product is traded.
 * @property {string} [approximate_quote_24h_volume] - An approximate trading volume over the last 24 hours.
 * @property {Record<string, any>} [future_product_details] - Details for future products.
 */
``` 
export type Product = {
    product_id: string;
    price: string;
    price_percentage_change_24h: string;
    volume_24h: string;
    volume_percentage_change_24h: string;
    base_increment: string;
    quote_increment: string;
    quote_min_size: string;
    quote_max_size: string;
    base_min_size: string;
    base_max_size: string;
    base_name: string;
    quote_name: string;
    watched: boolean;
    is_disabled: boolean;
    new: boolean;
    status: string;
    cancel_only: boolean;
    limit_only: boolean;
    post_only: boolean;
    trading_disabled: boolean;
    auction_mode: boolean;
    product_type?: ProductType;
    quote_currency_id?: string;
    base_currency_id?: string;
    fcm_trading_session_details?: Record<string, any>;
    mid_market_price?: string;
    alias?: string;
    alias_to?: string[];
    base_display_symbol: string;
    quote_display_symbol?: string;
    view_only?: boolean;
    price_increment?: string;
    display_name?: string;
    product_venue?: ProductVenue;
    approximate_quote_24h_volume?: string;
    future_product_details?: Record<string, any>;
};

/**
 * Type representing a list of candle objects.
 * @typedef {object} Candles
 * @property {Candle[]} candles - An array of Candle objects.
 */
export type Candles = {
    candles?: Candle[];
};

/**
 * Represents a Candle object with optional properties for start, low, high, open, close, and volume.
 * @typedef {Object} Candle
 * @property {string} [start] - The start time of the candle
 * @property {string} [low] - The lowest price of the candle
 * @property {string} [high] - The highest price of the candle
 * @property {string} [open] - The opening price of the candle
 * @property {string} [close] - The closing price of the candle
 * @property {string} [volume] - The volume of the candle
 */
export type Candle = {
    start?: string;
    low?: string;
    high?: string;
    open?: string;
    close?: string;
    volume?: string;
};

/**
* Represents a historical market trade with trade details.
*
* @typedef {Object} HistoricalMarketTrade
* @property {string} [trade_id] - The unique identifier for the trade.
* @property {string} [product_id] - The unique identifier for the product.
* @property {string} [price] - The price at which the trade occurred.
* @property {string} [size] - The size or quantity of the trade.
* @property {string} [time] - The timestamp of when the trade occurred.
* @property {OrderSide} [side] - The side of the order (buy/sell).
*/
export type HistoricalMarketTrade = {
    trade_id?: string;
    product_id?: string;
    price?: string;
    size?: string;
    time?: string;
    side?: OrderSide;
};

/**
 * Represents the balance of a portfolio.
 * @typedef {Object} PortfolioBalance
 * @property {string} [portfolio_uuid] - The unique identifier of the portfolio.
 * @property {Balance[]} [balances] - An array of balances within the portfolio.
 * @property {boolean} [is_margin_limit_reached] - Indicates if the margin limit has been reached.
 */
export type PortfolioBalance = {
    portfolio_uuid?: string;
    balances?: Balance[];
    is_margin_limit_reached?: boolean;
};
