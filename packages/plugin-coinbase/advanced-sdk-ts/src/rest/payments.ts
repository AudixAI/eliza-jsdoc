import { API_PREFIX } from '../constants';
import { RESTBase } from './rest-base';
import {
    GetPaymentMethodRequest,
    GetPaymentMethodResponse,
    ListPaymentMethodsResponse,
} from './types/payments-types';
import { method } from './types/request-types';

// [GET] List Payment Methods
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getpaymentmethods
/**
 * Fetches a list of payment methods from the API.
 * @this {RESTBase}
 * @returns {Promise<ListPaymentMethodsResponse>} A Promise that resolves to the list of payment methods.
 */
export function listPaymentMethods(
    this: RESTBase
): Promise<ListPaymentMethodsResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/payment_methods`,
        isPublic: false,
    });
}

// [GET] Get Payment Method
// Official Documentation: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getpaymentmethod
/**
 * Retrieves a specific payment method with the given paymentMethodId.
 *
 * @param {GetPaymentMethodRequest} options - The request options, including the paymentMethodId.
 * @returns {Promise<GetPaymentMethodResponse>} - A promise that resolves to the response containing the payment method.
 */
export function getPaymentMethod(
    this: RESTBase,
    { paymentMethodId }: GetPaymentMethodRequest
): Promise<GetPaymentMethodResponse> {
    return this.request({
        method: method.GET,
        endpoint: `${API_PREFIX}/payment_methods/${paymentMethodId}`,
        isPublic: false,
    });
}
