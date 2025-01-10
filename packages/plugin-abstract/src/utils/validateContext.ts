import { TransferContent } from "../actions";
import { isAddress } from "viem";

/**
 * Validates the transfer action content.
 * @param {TransferContent} content - The transfer action content to validate.
 * @returns {boolean} Returns true if the content is valid, false otherwise.
 */
export class ValidateContext {
/**
 * Checks if the provided TransferContent object is valid.
 *
 * @param {TransferContent} content - The TransferContent object to validate.
 * @returns {boolean} Returns true if the content is valid, otherwise false.
 */
    static transferAction(
        content: TransferContent
    ): content is TransferContent {
        const { tokenAddress, recipient, amount } = content;

        // Validate types
        const areTypesValid =
            typeof tokenAddress === "string" &&
            typeof recipient === "string" &&
            (typeof amount === "string" || typeof amount === "number");

        if (!areTypesValid) {
            return false;
        }

        // Validate addresses
        return [tokenAddress, recipient].every((address) =>
            isAddress(address, { strict: false })
        );
    }
}
