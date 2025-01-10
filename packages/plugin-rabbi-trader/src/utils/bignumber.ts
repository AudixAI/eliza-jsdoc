import BigNumber from "bignumber.js";

// Re-export BigNumber constructor
export const BN = BigNumber;

// Helper function to create new BigNumber instances
/**
 * Converts the input value to a BigNumber object.
 * 
 * @param {string | number | BigNumber} value - The value to be converted to a BigNumber.
 * @returns {BigNumber} The converted BigNumber object.
 */
export function toBN(value: string | number | BigNumber): BigNumber {
    return new BigNumber(value);
}

