import { z } from "zod";

/**
 * Interface representing the content of a tweet.
 * @typedef {Object} TweetContent
 * @property {string} text - The text content of the tweet.
 */
export interface TweetContent {
    text: string;
}

export const TweetSchema = z.object({
    text: z.string().describe("The text of the tweet"),
});

export const isTweetContent = (obj: any): obj is TweetContent => {
    return TweetSchema.safeParse(obj).success;
};
