import { z } from "zod";

export const FileLocationResultSchema = z.object({
    fileLocation: z.string().min(1),
});

/**
 * Type definition for the result of fetching file location.
 */
export type FileLocationResult = z.infer<typeof FileLocationResultSchema>;

/**
 * Check if the given object is a FileLocationResult.
 * 
 * @param obj The object to check.
 * @returns A boolean indicating whether the object is a FileLocationResult.
 */
export function isFileLocationResult(obj: unknown): obj is FileLocationResult {
    return FileLocationResultSchema.safeParse(obj).success;
}
