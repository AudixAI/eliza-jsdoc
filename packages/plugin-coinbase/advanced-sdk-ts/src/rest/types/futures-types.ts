import {
    FCMBalanceSummary,
    FCMPosition,
    FCMSweep,
    IntradayMarginSetting,
} from './common-types';

// Get Futures Balance Summary
/**
 * Response object for getting futures balance summary.
 * @typedef {Object} GetFuturesBalanceSummaryResponse
 * @property {FCMBalanceSummary} balance_summary - The FCMBalanceSummary object containing the balance summary details.
 */
export type GetFuturesBalanceSummaryResponse = {
    balance_summary?: FCMBalanceSummary;
};

// Get Intraday Margin Setting
/**
 * Response object for getting intraday margin setting.
 * @typedef {object} GetIntradayMarginSettingResponse
 * @property {IntradayMarginSetting} setting - The intraday margin setting.
 */
export type GetIntradayMarginSettingResponse = {
    setting?: IntradayMarginSetting;
};

// Set Intraday Margin Setting
/**
 * Type definition for the request to set an intraday margin setting.
 * @typedef {Object} SetIntradayMarginSettingRequest
 * @property {IntradayMarginSetting} setting - The intraday margin setting to be set.
 */
export type SetIntradayMarginSettingRequest = {
    // Body Params
    setting?: IntradayMarginSetting;
};

/**
* Response type for setting intraday margin settings.
*/
export type SetIntradayMarginSettingResponse = Record<string, never>;

// Get Current Margin Window
/**
 * Type representing a request object for retrieving the current margin window.
 *
 * @typedef {Object} GetCurrentMarginWindowRequest
 * @property {string} marginProfileType - The type of margin profile to query (optional).
 */
export type GetCurrentMarginWindowRequest = {
    // Query Params
    marginProfileType?: string;
};

/**
 * Response object for getting current margin window information.
 * @typedef {Object} GetCurrentMarginWindowResponse
 * @property {Record<string, any>} margin_window - The margin window object.
 * @property {boolean} is_intraday_margin_killswitch_enabled - Flag to indicate if intraday margin killswitch is enabled.
 * @property {boolean} is_intraday_margin_enrollment_killswitch_enabled - Flag to indicate if intraday margin enrollment killswitch is enabled.
 */
export type GetCurrentMarginWindowResponse = {
    margin_window?: Record<string, any>;
    is_intraday_margin_killswitch_enabled?: boolean;
    is_intraday_margin_enrollment_killswitch_enabled?: boolean;
};

// List Futures Positions
/**
 * Response object for listing futures positions.
 * @typedef {Object} ListFuturesPositionsResponse
 * @property {FCMPosition[]} [positions] - Array of FCMPosition objects representing the positions.
 */
export type ListFuturesPositionsResponse = {
    positions?: FCMPosition[];
};

// Get Futures Position
/**
 * Type representing a request to get futures position data.
 * @typedef {object} GetFuturesPositionRequest
 * @property {string} productId - The ID of the product.
 */
export type GetFuturesPositionRequest = {
    // Path Params
    productId: string;
};

/**
 * Response object for getting futures position.
 * @typedef {Object} GetFuturesPositionResponse
 * @property {FCMPosition} position - The position information.
 */
export type GetFuturesPositionResponse = {
    position?: FCMPosition;
};

// Schedule Futures Sweep
/**
 * Request object for scheduling a futures sweep with fiat amount.
 * @typedef {Object} ScheduleFuturesSweepRequest
 * @property {string} [usdAmount] - The amount in USD to be swept.
 */
export type ScheduleFuturesSweepRequest = {
    // Body Params
    usdAmount?: string;
};

/**
 * Response object for scheduling future sweeps.
 * @typedef {Object} ScheduleFuturesSweepResponse
 * @property {boolean} [success] - Indicates if the scheduling was successful.
 */
export type ScheduleFuturesSweepResponse = {
    success?: boolean;
};

// List Futures Sweeps
/**
 * Response object for listing future sweeps.
 * @typedef {Object} ListFuturesSweepsResponse
 * @property {FCMSweep[]} sweeps - An array of FCMSweep objects containing information about future sweeps.
 */
export type ListFuturesSweepsResponse = {
    sweeps: FCMSweep[];
};

// Cancel Pending Futures Sweep = {
/**
 * Type representing the result of canceling pending futures sweep.
 * @typedef {Object} CancelPendingFuturesSweep
 * @property {boolean} [success] - Indicates if the cancellation was successful.
 */ 

export type CancelPendingFuturesSweep = {
    success?: boolean;
};
