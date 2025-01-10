import { z } from "zod";

// Base resource schema
export const ResourceSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(["document", "image", "video"]),
    description: z.string(),
    tags: z.array(z.string()),
});

// Create resource schema
export const CreateResourceSchema = ResourceSchema.omit({ id: true });

// Read resource schema
export const ReadResourceSchema = z.object({
    id: z.string(),
    fields: z.array(z.string()).optional(),
});

// Update resource schema
export const UpdateResourceSchema = z.object({
    id: z.string(),
    updates: z.record(z.string(), z.any()),
});

// Type definitions
/**
 * Type definition for Resource inferred from ResourceSchema
 */
export type Resource = z.infer<typeof ResourceSchema>;
/**
 * This type definition represents the inferred type from the CreateResourceSchema schema.
 */
export type CreateResourceContent = z.infer<typeof CreateResourceSchema>;
/**
 * Type definition for the inferred type of ReadResourceSchema
 */
export type ReadResourceContent = z.infer<typeof ReadResourceSchema>;
/**
 * Type definition for UpdateResourceContent based on UpdateResourceSchema
 */
export type UpdateResourceContent = z.infer<typeof UpdateResourceSchema>;

// Type guards
export const isCreateResourceContent = (
    obj: any
): obj is CreateResourceContent => {
    return CreateResourceSchema.safeParse(obj).success;
};

export const isReadResourceContent = (obj: any): obj is ReadResourceContent => {
    return ReadResourceSchema.safeParse(obj).success;
};

export const isUpdateResourceContent = (
    obj: any
): obj is UpdateResourceContent => {
    return UpdateResourceSchema.safeParse(obj).success;
};

// Plugin configuration type
/**
 * Interface for the configuration options of the ExamplePlugin.
 *
 * @typedef {Object} ExamplePluginConfig
 * @property {string} apiKey - The API key required for accessing the API.
 * @property {string} apiSecret - The API secret required for accessing the API.
 * @property {string} [endpoint] - Optional endpoint for the API.
 */
export interface ExamplePluginConfig {
    apiKey: string;
    apiSecret: string;
    endpoint?: string;
}
