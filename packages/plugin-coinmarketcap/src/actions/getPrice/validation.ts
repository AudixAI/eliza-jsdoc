import { z } from "zod";
import { GetPriceContent } from "./types";

export const GetPriceSchema = z.object({
    symbol: z.string(),
    currency: z.string().default("USD"),
});

/**
 * Checks if the input content is of type GetPriceContent.
 * @param {GetPriceContent} content - The content to be checked.
 * @returns {boolean} Returns true if the content is of type GetPriceContent, otherwise false.
 */
export function isGetPriceContent(
    content: GetPriceContent
): content is GetPriceContent {
    return (
        typeof content.symbol === "string" &&
        typeof content.currency === "string"
    );
}
