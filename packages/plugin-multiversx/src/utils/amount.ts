import BigNumber from "bignumber.js";

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });

/**
 * Defines the structure of the payload object.
 * @typedef {Object} PayloadType
 * @property {string} amount - The amount value as a string.
 * @property {number} decimals - The number of decimal places.
 */
type PayloadType = {
    amount: string;
    decimals: number;
};

export const denominateAmount = ({ amount, decimals }: PayloadType) => {
    return new BigNumber(amount)
        .shiftedBy(decimals)
        .decimalPlaces(0)
        .toFixed(0);
};
