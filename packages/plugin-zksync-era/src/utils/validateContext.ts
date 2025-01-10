import { TransferContent } from "../actions/";
import { isAddress } from "viem";

/**
 * Validates the transfer action content.
 * @param {TransferContent} content - The transfer content to be validated.
 * @returns {boolean} Returns true if the content is valid, false otherwise.
 */
export class ValidateContext {
/**
 * Checks if the provided content object is a valid TransferContent object.
 * 
 * @param {TransferContent} content - The content object to be validated.
 * @returns {boolean} Returns true if the content object is a valid TransferContent object, otherwise false.
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
