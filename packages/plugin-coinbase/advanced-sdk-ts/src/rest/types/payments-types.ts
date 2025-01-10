import { PaymentMethod } from './common-types';

// List Payment Methods
/**
 * Response object containing a list of payment methods.
 * @typedef {Object} ListPaymentMethodsResponse
 * @property {PaymentMethod} [paymentMethods] - The list of payment methods available.
 */
export type ListPaymentMethodsResponse = {
    paymentMethods?: PaymentMethod;
};

// Get Payment Method
/**
 * Request object for retrieving a specific payment method.
 * @typedef {Object} GetPaymentMethodRequest
 * @property {string} paymentMethodId - The ID of the payment method to retrieve.
 */
export type GetPaymentMethodRequest = {
    // Path Params
    paymentMethodId: string;
};

/**
 * Response object for retrieving a payment method.
 * @typedef {Object} GetPaymentMethodResponse
 * @property {PaymentMethod} paymentMethod - The retrieved payment method, if available.
 */
export type GetPaymentMethodResponse = {
    paymentMethod?: PaymentMethod;
};
