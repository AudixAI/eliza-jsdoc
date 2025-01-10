import { isPrincipalText } from "../../ic/principals";
// ? 1. bigint -> string
// ? 2. principal -> string

/**
 * Custom stringify function that converts BigInt values to strings,
 * Principal objects to text representations, and Principal text values to themselves.
 * 
 * @param {*} v - The value to be stringified
 * @returns {string} - The stringified value
 */
export const customStringify = (v: any): string =>
    JSON.stringify(v, (_key, value) => {
        if (typeof value === "bigint") {
            return `${value}`;
        } else if (
            value &&
            typeof value === "object" &&
            value._isPrincipal === true
        ) {
            return value.toText();
        } else if (
            value &&
            typeof value === "object" &&
            value.__principal__ &&
            isPrincipalText(value.__principal__)
        ) {
            return value.__principal__;
        }
        return value;
    });
