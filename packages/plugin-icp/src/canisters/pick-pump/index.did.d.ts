import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

/**
 * Interface representing a candlestick with the following properties:
 * @property {number} low - The lowest price in the period
 * @property {number} high - The highest price in the period
 * @property {number} close - The closing price of the period
 * @property {number} open - The opening price of the period
 * @property {bigint} timestamp - The timestamp of the candle
 */
export interface Candle {
    low: number;
    high: number;
    close: number;
    open: number;
    timestamp: bigint;
}
/**
 * Interface representing a comment.
 * @prop { string } creator - The creator of the comment.
 * @prop { string } token - The token associated with the comment.
 * @prop { string } content - The content of the comment.
 * @prop { bigint } created_at - The timestamp when the comment was created.
 * @prop {string[]} image - An array containing the image URL associated with the comment, if any.
 */
export interface Comment {
    creator: string;
    token: string;
    content: string;
    created_at: bigint;
    image: [] | [string];
}
/**
 * Interface representing the argument needed to create a comment.
 *
 * @param {string} token - The authentication token of the user.
 * @param {string} content - The content of the comment.
 * @param {Array<string>} image - Optional parameter for image URL(s) attached to the comment.
 */

export interface CreateCommentArg {
    token: string;
    content: string;
    image: [] | [string];
}
/**
 * Interface for defining the arguments needed to create a new meme token.
 * @typedef {Object} CreateMemeTokenArg
 * @property {Array.<string>|[]} twitter - The Twitter handle(s) associated with the token.
 * @property {string} logo - The URL of the token's logo.
 * @property {string} name - The name of the token.
 * @property {string} description - A brief description of the token.
 * @property {Array.<string>|[]} website - The URL(s) of the token's website.
 * @property {Array.<string>|[]} telegram - The Telegram handle(s) associated with the token.
 * @property {string} symbol - The symbol of the token.
 */
export interface CreateMemeTokenArg {
    twitter: [] | [string];
    logo: string;
    name: string;
    description: string;
    website: [] | [string];
    telegram: [] | [string];
    symbol: string;
}
/**
* Interface for a holder with balance and owner information.
*
* @property {bigint} balance - The balance of the holder.
* @property {string} owner - The owner of the balance.
*/
export interface Holder {
    balance: bigint;
    owner: string;
}
/**
 * Interface representing initialization arguments for the contract.
 * @typedef {Object} InitArg
 * @property {Principal} fee_receiver - The principal ID of the fee receiver.
 * @property {Array<bigint>} create_token_fee - The fee required to create a token.
 * @property {Principal} icp_canister_id - The principal ID of the ICP canister.
 * @property {boolean} maintenance - Flag indicating if the system is in maintenance mode.
 * @property {Array<number>} fee_percentage - The percentage fee to be applied.
 */
export interface InitArg {
    fee_receiver: Principal;
    create_token_fee: [] | [bigint];
    icp_canister_id: Principal;
    maintenance: boolean;
    fee_percentage: [] | [number];
}
/**
 * Interface representing a Meme Token.
 * @typedef { object } MemeToken
 * @property { bigint } id - The unique identifier of the token.
 * @property { string } creator - The creator of the token.
 * @property { bigint } available_token - The number of available tokens.
 * @property {Array|string} twitter - The Twitter account associated with the token.
 * @property { bigint } volume_24h - The 24-hour trading volume of the token.
 * @property { string } logo - The URL of the token's logo.
 * @property { string } name - The name of the token.
 * @property { number } liquidity - The liquidity of the token.
 * @property { string } description - The description of the token.
 * @property { bigint } created_at - The timestamp when the token was created.
 * @property {Array|string} website - The website associated with the token.
 * @property { bigint } last_tx_time - The timestamp of the last transaction.
 * @property {Array|string} canister - The canister associated with the token.
 * @property { bigint } market_cap_icp - The market capitalization of the token in ICP.
 * @property { number } market_cap_usd - The market capitalization of the token in USD.
 * @property { number } price - The price of the token.
 * @property {Array|string} telegram - The Telegram account associated with the token.
 * @property { string } symbol - The symbol of the token.
 */
export interface MemeToken {
    id: bigint;
    creator: string;
    available_token: bigint;
    twitter: [] | [string];
    volume_24h: bigint;
    logo: string;
    name: string;
    liquidity: number;
    description: string;
    created_at: bigint;
    website: [] | [string];
    last_tx_time: bigint;
    canister: [] | [string];
    market_cap_icp: bigint;
    market_cap_usd: number;
    price: number;
    telegram: [] | [string];
    symbol: string;
}
/**
 * Interface representing a view of a MemeToken with its corresponding balance.
 * @typedef {Object} MemeTokenView
 * @property {MemeToken} token - The MemeToken object
 * @property {bigint} balance - The balance associated with the MemeToken
 */
export interface MemeTokenView {
    token: MemeToken;
    balance: bigint;
}
/**
 * Type representing a result that can be either an Ok value of type bigint or an Err value of type string.
 */
export type Result = { Ok: bigint } | { Err: string };
/**
 * Type definition for Result_1 which can either be of type { Ok: MemeToken } or { Err: string }
 */
export type Result_1 = { Ok: MemeToken } | { Err: string };
/**
 * Definition of Sort type, which can have one of three possible values:
 * - CreateTimeDsc: Used for sorting by creation time in descending order
 * - LastTradeDsc: Used for sorting by last trade time in descending order
 * - MarketCapDsc: Used for sorting by market capitalization in descending order
 */
export type Sort =
    | { CreateTimeDsc: null }
    | { LastTradeDsc: null }
    | { MarketCapDsc: null };
/**
 * Represents a transaction object.
 * @typedef {Object} Transaction
 * @property {bigint} token_amount - The amount of the token involved in the transaction.
 * @property {bigint} token_id - The unique identifier of the token involved in the transaction.
 * @property {string} token_symbol - The symbol of the token involved in the transaction.
 * @property {string} from - The sender of the transaction.
 * @property {bigint} timestamp - The timestamp of the transaction.
 * @property {bigint} icp_amount - The amount of ICP involved in the transaction.
 * @property {string} tx_type - The type of the transaction.
 */
export interface Transaction {
    token_amount: bigint;
    token_id: bigint;
    token_symbol: string;
    from: string;
    timestamp: bigint;
    icp_amount: bigint;
    tx_type: string;
}
/**
 * Interface representing a user.
 * @typedef {Object} User
 * @property {string} principal - The principal of the user.
 * @property {string} name - The name of the user.
 * @property {bigint} last_login_seconds - The time of the user's last login in seconds.
 * @property {bigint} register_at_second - The time when the user registered in seconds.
 * @property {string} avatar - The avatar URL of the user.
 */
export interface User {
    principal: string;
    name: string;
    last_login_seconds: bigint;
    register_at_second: bigint;
    avatar: string;
}
/**
 * Interface representing the result of receiving funds in a wallet.
 * @typedef {Object} WalletReceiveResult
 * @property {bigint} accepted - The amount of funds accepted by the wallet.
 */
export interface WalletReceiveResult {
    accepted: bigint;
}
/**
 * Interface representing the service with various actor methods.
 * @interface _SERVICE
 * @property buy - Actor method for buying with arguments [bigint, number] and returning Result.
 * @property calculate_buy - Actor method for calculating buy with arguments [bigint, number] and returning Result.
 * @property calculate_sell - Actor method for calculating sell with arguments [bigint, number] and returning Result.
 * @property create_token - Actor method for creating token with arguments [CreateMemeTokenArg] and returning Result_1.
 * @property king_of_hill - Actor method for retrieving king of the hill with no arguments and returning either an empty array or an array of MemeToken.
 * @property last_txs - Actor method for retrieving last transactions with argument bigint and returning an array of Transaction.
 * @property post_comment - Actor method for posting comment with argument CreateCommentArg and returning undefined.
 * @property query_all_tokens - Actor method for querying all tokens with arguments [bigint, bigint, [] | [Sort]] and returning an array of MemeToken and bigint.
 * @property query_token - Actor method for querying a token with argument bigint and returning either an empty array or an array of MemeToken.
 * @property query_token_candle - Actor method for querying token candles with arguments [bigint, [] | [bigint]] and returning an array of Candle.
 * @property query_token_comments - Actor method for querying token comments with arguments [Principal, bigint, bigint] and returning an array of Comment and bigint.
 * @property query_token_holders - Actor method for querying token holders with arguments [bigint, bigint, bigint] and returning an array of Holder and bigint.
 * @property query_token_transactions - Actor method for querying token transactions with arguments [bigint, bigint, bigint] and returning an array of Transaction and bigint.
 * @property query_user - Actor method for querying a user with optional argument Principal and returning User.
 * @property query_user_launched - Actor method for querying a user's launched tokens with optional argument Principal and returning an array of MemeToken.
 * @property query_user_tokens - Actor method for querying a user's tokens with optional argument Principal and returning an array of MemeTokenView.
 * @property sell - Actor method for selling with arguments [bigint, number] and returning Result.
 * @property wallet_balance - Actor method for retrieving wallet balance with no arguments and returning bigint.
 * @property wallet_receive - Actor method for receiving wallet balance with no arguments and returning WalletReceiveResult.
 */

export interface _SERVICE {
    buy: ActorMethod<[bigint, number], Result>;
    calculate_buy: ActorMethod<[bigint, number], Result>;
    calculate_sell: ActorMethod<[bigint, number], Result>;
    create_token: ActorMethod<[CreateMemeTokenArg], Result_1>;
    king_of_hill: ActorMethod<[], [] | [MemeToken]>;
    last_txs: ActorMethod<[bigint], Array<Transaction>>;
    post_comment: ActorMethod<[CreateCommentArg], undefined>;
    query_all_tokens: ActorMethod<
        [bigint, bigint, [] | [Sort]],
        [Array<MemeToken>, bigint]
    >;
    query_token: ActorMethod<[bigint], [] | [MemeToken]>;
    query_token_candle: ActorMethod<[bigint, [] | [bigint]], Array<Candle>>;
    query_token_comments: ActorMethod<
        [Principal, bigint, bigint],
        [Array<Comment>, bigint]
    >;
    query_token_holders: ActorMethod<
        [bigint, bigint, bigint],
        [Array<Holder>, bigint]
    >;
    query_token_transactions: ActorMethod<
        [bigint, bigint, bigint],
        [Array<Transaction>, bigint]
    >;
    query_user: ActorMethod<[[] | [Principal]], User>;
    query_user_launched: ActorMethod<[[] | [Principal]], Array<MemeToken>>;
    query_user_tokens: ActorMethod<[[] | [Principal]], Array<MemeTokenView>>;
    sell: ActorMethod<[bigint, number], Result>;
    wallet_balance: ActorMethod<[], bigint>;
    wallet_receive: ActorMethod<[], WalletReceiveResult>;
}
export declare const idlFactory: IDL.InterfaceFactory;
