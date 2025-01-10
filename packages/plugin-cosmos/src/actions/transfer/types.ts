import { z } from "zod";
import { cosmosTransferParamsSchema } from "./schema";

/**
 * Represents the inferred type of the CosmosTransferParams based on the cosmosTransferParamsSchema.
 */ 

export type CosmosTransferParams = z.infer<typeof cosmosTransferParamsSchema>;
