import { z } from "zod";

export const TransferSchema = z.object({
    to: z.string(),
    amount: z.number(), // use number ignoring decimals issue
});

/**
 * Interface representing the content of a transfer.
 * @property {string} to - The recipient of the transfer.
 * @property {number} amount - The amount being transferred.
 */
export interface TransferContent {
    to: string;
    amount: number;
}

export const isTransferContent = (object: any): object is TransferContent => {
    if (TransferSchema.safeParse(object).success) {
        return true;
    }
    console.error("Invalid content: ", object);
    return false;
};

export const PumpCreateSchema = z.object({
    action: z.literal("CREATE_TOKEN"),
    params: z.object({
        symbol: z.string(),
        name: z.string(),
        description: z.string(),
    }),
});

export const PumpBuySchema = z.object({
    action: z.literal("BUY_TOKEN"),
    params: z.object({
        tokenAddress: z.string(),
        value: z.number(),
    }),
});

export const PumpSellSchema = z.object({
    action: z.literal("SELL_TOKEN"),
    params: z.object({
        tokenAddress: z.string(),
        value: z.number(),
    }),
});

export const PumpSchema = z.union([
    PumpCreateSchema,
    PumpBuySchema,
    PumpSellSchema,
]);

/**
 * Type alias for the inferred type of PumpSchema.
 */
export type PumpContent = z.infer<typeof PumpSchema>;
/**
 * Type definition for creating a Pump with inferred schema from PumpCreateSchema
 */
export type PumpCreateContent = z.infer<typeof PumpCreateSchema>;
/**
 * Represents the type inferred from the PumpBuySchema.
 */
export type PumpBuyContent = z.infer<typeof PumpBuySchema>;
/**
 * Type definition for the inferred type from PumpSellSchema.
 */
export type PumpSellContent = z.infer<typeof PumpSellSchema>;

/**
 * Checks if the given object is of type PumpContent by validating against PumpSchema.
 * @param {any} object - The object to be checked
 * @returns {boolean} - True if the object is of type PumpContent, false otherwise
 */
export function isPumpContent(object: any): object is PumpContent {
    if (PumpSchema.safeParse(object).success) {
        return true;
    }
    console.error("Invalid content: ", object);
    return false;
}

/**
 * Determines if the given object is a valid PumpCreateContent based on PumpCreateSchema validation.
 * @param {any} object - The object to be checked.
 * @returns {boolean} - Returns true if the object is a valid PumpCreateContent, otherwise returns false.
 */
export function isPumpCreateContent(object: any): object is PumpCreateContent {
    return PumpCreateSchema.safeParse(object).success;
}

/**
 * Function to check if the input object is of type PumpBuyContent.
 * @param object The object to be checked.
 * @returns A boolean indicating if the input object is of type PumpBuyContent.
 */
export function isPumpBuyContent(object: any): object is PumpBuyContent {
    return PumpBuySchema.safeParse(object).success;
}

/**
 * Function to check if the input object is a PumpSellContent based on the PumpSellSchema validation.
 * 
 * @param {any} object - The input object to be checked
 * @returns {boolean} - Returns true if the object is a valid PumpSellContent, false otherwise
 */
export function isPumpSellContent(object: any): object is PumpSellContent {
    return PumpSellSchema.safeParse(object).success;
}
