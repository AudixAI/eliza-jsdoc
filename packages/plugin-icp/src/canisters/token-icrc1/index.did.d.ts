import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import type { Principal } from "@dfinity/principal";

/**
 * Interface representing an account.
 * @typedef {Object} Account
 * @property {Principal} owner - The owner of the account.
 * @property {Array} subaccount - The subaccount, which can either be an empty array or an array of Uint8Array or number[] elements.
 */
export interface Account {
    owner: Principal;
    subaccount: [] | [Uint8Array | number[]];
}
/**
 * Interface for specifying the arguments needed to retrieve the account balance.
 * @param {string} account - The account identifier for which the balance will be retrieved.
 */
export interface AccountBalanceArgs {
    account: string;
}
/**
 * Interface representing an allowance.
 * @typedef {Object} Allowance
 * @property {bigint} allowance - The amount of allowance
 * @property {bigint[]} expires_at - The expiration date for the allowance, represented as an array of bigint values
 */
export interface Allowance {
    allowance: bigint;
    expires_at: [] | [bigint];
}
/**
 * Interface representing the arguments required to check allowance.
 * @typedef {Object} AllowanceArgs
 * @property {Account} account - The account to check the allowance for.
 * @property {Account} spender - The account that is spending the allowance.
 */
export interface AllowanceArgs {
    account: Account;
    spender: Account;
}
/**
 * Interface representing the arguments required for approving an action.
 * @typedef {Object} ApproveArgs
 * @property {Array} fee - An array containing either an empty array or an array with a single element of type bigint.
 * @property {Array} memo - An array containing either an empty array or an array with a single element of type Uint8Array or number array.
 * @property {Array} from_subaccount - An array containing either an empty array or an array with a single element of type Uint8Array or number array.
 * @property {Array} created_at_time - An array containing either an empty array or an array with a single element of type bigint.
 * @property {bigint} amount - The amount to be approved.
 * @property {Array} expected_allowance - An array containing either an empty array or an array with a single element of type bigint.
 * @property {Array} expires_at - An array containing either an empty array or an array with a single element of type bigint.
 * @property {Account} spender - The spender account.
 */

export interface ApproveArgs {
    fee: [] | [bigint];
    memo: [] | [Uint8Array | number[]];
    from_subaccount: [] | [Uint8Array | number[]];
    created_at_time: [] | [bigint];
    amount: bigint;
    expected_allowance: [] | [bigint];
    expires_at: [] | [bigint];
    spender: Account;
}
/**
 * Defines the possible error types that can be returned from an approval process.
 * @typedef { Object } ApproveError
 * @property { Object } GenericError - The error details for a generic error.
 * @property { string } GenericError.message - The message describing the error.
 * @property { bigint } GenericError.error_code - The error code associated with the error.
 * @property { null } TemporarilyUnavailable - Indicates that the operation is temporarily unavailable.
 * @property { Object } Duplicate - The error details for a duplicate error.
 * @property { bigint } Duplicate.duplicate_of - The identifier of the duplicate item.
 * @property { Object } BadFee - The error details for a bad fee error.
 * @property { bigint } BadFee.expected_fee - The expected fee value.
 * @property { Object } AllowanceChanged - The error details for allowance changed error.
 * @property { bigint } AllowanceChanged.current_allowance - The current allowance value.
 * @property { Object } CreatedInFuture - The error details for an item created in the future error.
 * @property { bigint } CreatedInFuture.ledger_time - The ledger time when the item was created.
 * @property { null } TooOld - Indicates that the item is too old for the operation.
 * @property { Object } Expired - The error details for an item that has expired.
 * @property { bigint } Expired.ledger_time - The ledger time when the item expired.
 * @property { Object } InsufficientFunds - The error details for insufficient funds error.
 * @property { bigint } InsufficientFunds.balance - The available balance when the error occurred.
 */
export type ApproveError =
    | {
          GenericError: { message: string; error_code: bigint };
      }
    | { TemporarilyUnavailable: null }
    | { Duplicate: { duplicate_of: bigint } }
    | { BadFee: { expected_fee: bigint } }
    | { AllowanceChanged: { current_allowance: bigint } }
    | { CreatedInFuture: { ledger_time: bigint } }
    | { TooOld: null }
    | { Expired: { ledger_time: bigint } }
    | { InsufficientFunds: { balance: bigint } };
/**
 * Interface representing information about an archived entity.
 * @typedef {Object} ArchiveInfo
 * @property {Principal} canister_id - The principal ID of the archived entity.
 */
export interface ArchiveInfo {
    canister_id: Principal;
}
/**
 * Interface representing options for archiving data.
 * @property {bigint} num_blocks_to_archive - Number of blocks to archive.
 * @property {bigint | []} max_transactions_per_response - Maximum number of transactions per response.
 * @property {bigint} trigger_threshold - Threshold for triggering archiving.
 * @property {Array<Principal> | []} more_controller_ids - Additional controller IDs for archiving.
 * @property {bigint | []} max_message_size_bytes - Maximum size of message in bytes.
 * @property {bigint | []} cycles_for_archive_creation - Cycles required for archive creation.
 * @property {bigint | []} node_max_memory_size_bytes - Maximum memory size for the node.
 * @property {Principal} controller_id - The controller ID for archiving.
 */
export interface ArchiveOptions {
    num_blocks_to_archive: bigint;
    max_transactions_per_response: [] | [bigint];
    trigger_threshold: bigint;
    more_controller_ids: [] | [Array<Principal>];
    max_message_size_bytes: [] | [bigint];
    cycles_for_archive_creation: [] | [bigint];
    node_max_memory_size_bytes: [] | [bigint];
    controller_id: Principal;
}
/**
 * Interface representing a range of archived blocks.
 * @typedef {Object} ArchivedBlocksRange
 * @property {[Principal, string]} callback - The callback function to be invoked.
 * @property {bigint} start - The starting index of the range.
 * @property {bigint} length - The length of the range.
 */
export interface ArchivedBlocksRange {
    callback: [Principal, string];
    start: bigint;
    length: bigint;
}
/**
 * Interface for a range of archived encoded blocks.
 * @typedef {Object} ArchivedEncodedBlocksRange
 * @property {[Principal, string]} callback - The callback function for the range
 * @property {bigint} start - The start index of the range
 * @property {bigint} length - The length of the range
 */
export interface ArchivedEncodedBlocksRange {
    callback: [Principal, string];
    start: bigint;
    length: bigint;
}
/**
 * Interface for representing a collection of archive information.
 * @typedef {Object} Archives
 * @property {Array<ArchiveInfo>} archives - An array containing objects of type ArchiveInfo.
 */
export interface Archives {
    archives: Array<ArchiveInfo>;
}
/**
 * Interface for binary account balance arguments.
 * 
 * @typedef {Object} BinaryAccountBalanceArgs
 * @property {Uint8Array | number[]} account - The binary account balance value.
 */
export interface BinaryAccountBalanceArgs {
    account: Uint8Array | number[];
}
/**
 * Interface representing a range of blocks.
 * @typedef {Object} BlockRange
 * @property {Array<CandidBlock>} blocks - An array of CandidBlock objects.
 */
export interface BlockRange {
    blocks: Array<CandidBlock>;
}
/**
 * Interface for a CandidBlock object.
 * @property {CandidTransaction} transaction - The transaction associated with the block.
 * @property {TimeStamp} timestamp - The timestamp of the block.
 * @property {Array} parent_hash - The parent hash of the block, either an empty array or an array containing Uint8Arrays or number arrays.
 */
export interface CandidBlock {
    transaction: CandidTransaction;
    timestamp: TimeStamp;
    parent_hash: [] | [Uint8Array | number[]];
}
/**
 * Defines the different types of operations that can be performed on a Candid Token.
 * 
 * @typedef {Object} CandidOperation
 * @property {Object} Approve - Approve operation parameters
 * @property {Tokens} Approve.fee - The fee for the approve operation
 * @property {Uint8Array|number[]} Approve.from - The address initiating the operation
 * @property {bigint} Approve.allowance_e8s - The allowance amount in e8s 
 * @property {Tokens} Approve.allowance - The allowance amount
 * @property {[]|[Tokens]} Approve.expected_allowance - The optional expected allowance amount
 * @property {[]|[TimeStamp]} Approve.expires_at - The optional expiration time
 * @property {Uint8Array|number[]} Approve.spender - The address to whom the allowance is given
 * @property {Object} Burn - Burn operation parameters
 * @property {Uint8Array|number[]} Burn.from - The address initiating the operation
 * @property {Tokens} Burn.amount - The amount to burn
 * @property {[]|[Uint8Array|number[]]} Burn.spender - The optional spender address
 * @property {Object} Mint - Mint operation parameters
 * @property {Uint8Array|number[]} Mint.to - The address to mint tokens to
 * @property {Tokens} Mint.amount - The amount to mint
 * @property {Object} Transfer - Transfer operation parameters
 * @property {Uint8Array|number[]} Transfer.to - The address to transfer tokens to
 * @property {Tokens} Transfer.fee - The fee for the transfer operation
 * @property {Uint8Array|number[]} Transfer.from - The address initiating the transfer
 * @property {Tokens} Transfer.amount - The amount to transfer
 * @property {[]|[Uint8Array|number[]]} Transfer.spender - The optional spender address
 */
export type CandidOperation =
    | {
          Approve: {
              fee: Tokens;
              from: Uint8Array | number[];
              allowance_e8s: bigint;
              allowance: Tokens;
              expected_allowance: [] | [Tokens];
              expires_at: [] | [TimeStamp];
              spender: Uint8Array | number[];
          };
      }
    | {
          Burn: {
              from: Uint8Array | number[];
              amount: Tokens;
              spender: [] | [Uint8Array | number[]];
          };
      }
    | { Mint: { to: Uint8Array | number[]; amount: Tokens } }
    | {
          Transfer: {
              to: Uint8Array | number[];
              fee: Tokens;
              from: Uint8Array | number[];
              amount: Tokens;
              spender: [] | [Uint8Array | number[]];
          };
      };
/**
 * Interface representing a Candid Transaction.
 * @typedef {Object} CandidTransaction
 * @property {bigint} memo - The memo associated with the transaction.
 * @property {Array<Uint8Array | number[]>} icrc1_memo - The ICRC1 memo associated with the transaction.
 * @property {Array<CandidOperation>} operation - The operation associated with the transaction.
 * @property {TimeStamp} created_at_time - The timestamp when the transaction was created.
 */
export interface CandidTransaction {
    memo: bigint;
    icrc1_memo: [] | [Uint8Array | number[]];
    operation: [] | [CandidOperation];
    created_at_time: TimeStamp;
}
/**
 * Interface representing a number of decimals.
 * @property {number} decimals - The number of decimal places.
 */
export interface Decimals {
    decimals: number;
}
/**
 * Interface representing a duration with seconds and nanoseconds.
 * @interface Duration
 * @property {bigint} secs - The number of seconds in the duration.
 * @property {number} nanos - The number of nanoseconds in the duration.
 */
export interface Duration {
    secs: bigint;
    nanos: number;
}
/**
 * Interface representing feature flags.
 *
 * @interface
 * @property {boolean} icrc2 - Flag for feature ICRC2.
 */
export interface FeatureFlags {
    icrc2: boolean;
}
/**
 * Interface representing the arguments for getting blocks.
 * @typedef {Object} GetBlocksArgs
 * @property {bigint} start - The starting index for fetching blocks.
 * @property {bigint} length - The number of blocks to fetch.
 */
export interface GetBlocksArgs {
    start: bigint;
    length: bigint;
}
/**
 * Represents the possible error types that can occur when attempting to retrieve blocks.
 * @typedef {Object} GetBlocksError
 * @property {Object} BadFirstBlockIndex - Error object for when the first block index is not valid.
 * @property {bigint} BadFirstBlockIndex.requested_index - The requested block index.
 * @property {bigint} BadFirstBlockIndex.first_valid_index - The first valid block index.
 * @property {Object} Other - Error object for any other type of error.
 * @property {string} Other.error_message - The error message describing the error.
 * @property {bigint} Other.error_code - The error code associated with the error.
 */
export type GetBlocksError =
    | {
          BadFirstBlockIndex: {
              requested_index: bigint;
              first_valid_index: bigint;
          };
      }
    | { Other: { error_message: string; error_code: bigint } };
/**
 * Interface representing the initialization arguments for a token.
 * @typedef { Object } InitArgs
 * @property {Array<Principal>} send_whitelist - The list of principals allowed to send tokens.
 * @property {[] | [string]} token_symbol - The symbol of the token.
 * @property {[] | [Tokens]} transfer_fee - The transfer fee for sending tokens.
 * @property { string } minting_account - The account responsible for minting new tokens.
 * @property {[] | [bigint]} maximum_number_of_accounts - The maximum number of accounts that can hold tokens.
 * @property {[] | [bigint]} accounts_overflow_trim_quantity - The quantity trimmed when accounts overflow.
 * @property {[] | [Duration]} transaction_window - The time window for transactions.
 * @property {[] | [bigint]} max_message_size_bytes - The maximum size for an IC message.
 * @property {[] | [Account]} icrc1_minting_account - The account used for minting ICRC1 tokens.
 * @property {[] | [ArchiveOptions]} archive_options - The options for archiving.
 * @property {Array<[string, Tokens]>} initial_values - The initial values for the token.
 * @property {[] | [string]} token_name - The name of the token.
 * @property {[] | [FeatureFlags]} feature_flags - The feature flags for the token.
 */
export interface InitArgs {
    send_whitelist: Array<Principal>;
    token_symbol: [] | [string];
    transfer_fee: [] | [Tokens];
    minting_account: string;
    maximum_number_of_accounts: [] | [bigint];
    accounts_overflow_trim_quantity: [] | [bigint];
    transaction_window: [] | [Duration];
    max_message_size_bytes: [] | [bigint];
    icrc1_minting_account: [] | [Account];
    archive_options: [] | [ArchiveOptions];
    initial_values: Array<[string, Tokens]>;
    token_name: [] | [string];
    feature_flags: [] | [FeatureFlags];
}
/**
 * Type definition for payload structures that can be sent to the Ledger Canister.
 * 
 * A payload can be of type:
 * - Upgrade: Specifies an upgrade operation with optional UpgradeArgs
 * - Init: Specifies an initialization operation with InitArgs
 */
export type LedgerCanisterPayload =
    | { Upgrade: [] | [UpgradeArgs] }
    | { Init: InitArgs };
/**
 * Type that represents different types of metadata values.
 * @typedef {Object} MetadataValue
 * @property {bigint} Int - Represents an integer value.
 * @property {bigint} Nat - Represents a natural number value.
 * @property {Uint8Array | number[]} Blob - Represents a binary blob value.
 * @property {string} Text - Represents a text value.
 */
export type MetadataValue =
    | { Int: bigint }
    | { Nat: bigint }
    | { Blob: Uint8Array | number[] }
    | { Text: string };
/**
 * Interface representing a Name with a string property.
 */
export interface Name {
    name: string;
}
/**
 * Interface for the response from a query for blockchain blocks.
 * @typedef {Object} QueryBlocksResponse
 * @property {Array} certificate - An array containing either an empty array, Uint8Array, or number array.
 * @property {Array<CandidBlock>} blocks - An array containing CandidBlock objects.
 * @property {BigInt} chain_length - The length of the blockchain chain.
 * @property {BigInt} first_block_index - The index of the first block in the blockchain.
 * @property {Array<ArchivedBlocksRange>} archived_blocks - An array containing ArchivedBlocksRange objects.
 */
export interface QueryBlocksResponse {
    certificate: [] | [Uint8Array | number[]];
    blocks: Array<CandidBlock>;
    chain_length: bigint;
    first_block_index: bigint;
    archived_blocks: Array<ArchivedBlocksRange>;
}
/**
 * Interface representing the response object for querying encoded blocks.
 * @typedef {Object} QueryEncodedBlocksResponse
 * @property {Array} certificate - Either an empty array or an array of Uint8Array or number arrays.
 * @property {Array} blocks - An array of Uint8Array or number arrays representing blocks.
 * @property {bigint} chain_length - The length of the chain as a BigInt.
 * @property {bigint} first_block_index - The index of the first block as a BigInt.
 * @property {Array} archived_blocks - An array of ArchivedEncodedBlocksRange objects representing archived blocks.
 */
export interface QueryEncodedBlocksResponse {
    certificate: [] | [Uint8Array | number[]];
    blocks: Array<Uint8Array | number[]>;
    chain_length: bigint;
    first_block_index: bigint;
    archived_blocks: Array<ArchivedEncodedBlocksRange>;
}
/**
 * Represents the possible result of a transfer operation, where the result can be either successful with an Ok property containing a bigint value, or unsuccessful with an Err property containing a TransferError object.
 */
export type Result = { Ok: bigint } | { Err: TransferError };
/**
 * Type representing a result that can either be an object with an 'Ok' property of type bigint
 * or an object with an 'Err' property of type ApproveError.
 */
export type Result_1 = { Ok: bigint } | { Err: ApproveError };
/**
 * Type definition for Result_2
 * 
 * @typedef {Object} Result_2
 * @property {bigint} Ok - Represents a successful result with a bigint value
 * @property {TransferFromError} Err - Represents an error result with a TransferFromError object
 */
export type Result_2 = { Ok: bigint } | { Err: TransferFromError };
/**
 * Represents the possible results of a function, where it can either return an object with a property 'Ok' containing a BlockRange object, 
 * or return an object with a property 'Err' containing a GetBlocksError object.
 */
export type Result_3 = { Ok: BlockRange } | { Err: GetBlocksError };
/**
 * Defines a type `Result_4` that can either be an object with a property `Ok` containing an array of `Uint8Array` or `number[]` elements,
 * or an object with a property `Err` containing a `GetBlocksError`.
 */
export type Result_4 =
    | { Ok: Array<Uint8Array | number[]> }
    | { Err: GetBlocksError };
/**
 * Definition of a Result_5 type, which can either contain an Ok property of type bigint or an Err property of type TransferError_1.
 */
export type Result_5 = { Ok: bigint } | { Err: TransferError_1 };
/**
 * Interface for defining the arguments required to send tokens.
 * @typedef {Object} SendArgs
 * @property {string} to - The address to which tokens will be sent.
 * @property {Tokens} fee - The fee amount in tokens.
 * @property {bigint} memo - A unique identifier for the transaction.
 * @property {Array} from_subaccount - The subaccount from which tokens will be sent.
 * @property {Array} created_at_time - The timestamp when the transaction was created.
 * @property {Tokens} amount - The amount of tokens to be sent.
 */
export interface SendArgs {
    to: string;
    fee: Tokens;
    memo: bigint;
    from_subaccount: [] | [Uint8Array | number[]];
    created_at_time: [] | [TimeStamp];
    amount: Tokens;
}
/**
 * Interface representing a standard record.
 * @typedef {Object} StandardRecord
 * @property {string} url - The URL of the record.
 * @property {string} name - The name of the record.
 */
export interface StandardRecord {
    url: string;
    name: string;
}
/**
 * Interface representing a symbol with a string value.
 * @typedef {object} Symbol
 * @property {string} symbol - The symbol value.
 */
export interface Symbol {
    symbol: string;
}
/**
 * Interface representing a timestamp with nanosecond precision.
 * @typedef {Object} TimeStamp
 * @property {bigint} timestamp_nanos - The timestamp in nanoseconds.
 */
export interface TimeStamp {
    timestamp_nanos: bigint;
}
/**
 * Interface representing Tokens with a single property e8s of type bigint.
 */
export interface Tokens {
    e8s: bigint;
}
/**
 * Interface representing the arguments needed for a transfer operation.
 * @typedef {Object} TransferArg
 * @property {Account} to - The recipient account for the transfer.
 * @property {Array} fee - An array containing either an empty array or a single element of type bigint.
 * @property {Array} memo - An array containing either an empty array or a single element of type Uint8Array or number array.
 * @property {Array} from_subaccount - An array containing either an empty array or a single element of type Uint8Array or number array.
 * @property {Array} created_at_time - An array containing either an empty array or a single element of type bigint.
 * @property {bigint} amount - The amount to be transferred.
 */
export interface TransferArg {
    to: Account;
    fee: [] | [bigint];
    memo: [] | [Uint8Array | number[]];
    from_subaccount: [] | [Uint8Array | number[]];
    created_at_time: [] | [bigint];
    amount: bigint;
}
/**
 * Interface for defining transfer arguments.
 * @typedef {Object} TransferArgs
 * @property {Uint8Array | number[]} to - The recipient of the transfer.
 * @property {Tokens} fee - The fee for the transfer.
 * @property {bigint} memo - The memo for the transfer.
 * @property {[] | [Uint8Array | number[]]} from_subaccount - The subaccount of the sender.
 * @property {[] | [TimeStamp]} created_at_time - The timestamp of when the transfer was created.
 * @property {Tokens} amount - The amount to be transferred.
 */
export interface TransferArgs {
    to: Uint8Array | number[];
    fee: Tokens;
    memo: bigint;
    from_subaccount: [] | [Uint8Array | number[]];
    created_at_time: [] | [TimeStamp];
    amount: Tokens;
}
/**
 * Defines the possible error scenarios that can occur during a transfer operation.
 * @typedef {TransferError}
 * @property {GenericError} GenericError - Indicates a generic error with a specified message and error code.
 * @property {TemporarilyUnavailable} TemporarilyUnavailable - Indicates that the operation is temporarily unavailable.
 * @property {BadBurn} BadBurn - Indicates a bad burn scenario with a minimum burn amount required.
 * @property {Duplicate} Duplicate - Indicates a duplicate transfer scenario with the duplicate transaction ID.
 * @property {BadFee} BadFee - Indicates a bad fee scenario with the expected fee amount.
 * @property {CreatedInFuture} CreatedInFuture - Indicates a scenario where the transaction was created in the future.
 * @property {TooOld} TooOld - Indicates that the transaction is too old.
 * @property {InsufficientFunds} InsufficientFunds - Indicates that the account has insufficient funds for the transfer.
 */
export type TransferError =
    | {
          GenericError: { message: string; error_code: bigint };
      }
    | { TemporarilyUnavailable: null }
    | { BadBurn: { min_burn_amount: bigint } }
    | { Duplicate: { duplicate_of: bigint } }
    | { BadFee: { expected_fee: bigint } }
    | { CreatedInFuture: { ledger_time: bigint } }
    | { TooOld: null }
    | { InsufficientFunds: { balance: bigint } };
/**
 * Defines the possible errors that can occur during a transfer.
 * @typedef {Object} TransferError_1
 * @property {Object} TxTooOld - Error indicating that the transaction is too old.
 * @property {bigint} TxTooOld.allowed_window_nanos - The allowed time window in nanoseconds.
 * @property {Object} BadFee - Error indicating that the fee is invalid.
 * @property {Tokens} BadFee.expected_fee - The expected fee in tokens.
 * @property {Object} TxDuplicate - Error indicating that the transaction is a duplicate.
 * @property {bigint} TxDuplicate.duplicate_of - The ID of the duplicate transaction.
 * @property {Object} TxCreatedInFuture - Error indicating that the transaction was created in the future.
 * @property {null} TxCreatedInFuture - Null value.
 * @property {Object} InsufficientFunds - Error indicating that there are insufficient funds for the transaction.
 * @property {Tokens} InsufficientFunds.balance - The current balance in tokens.
 */
export type TransferError_1 =
    | {
          TxTooOld: { allowed_window_nanos: bigint };
      }
    | { BadFee: { expected_fee: Tokens } }
    | { TxDuplicate: { duplicate_of: bigint } }
    | { TxCreatedInFuture: null }
    | { InsufficientFunds: { balance: Tokens } };
/**
 * Interface representing a TransferFee object.
 * @typedef {Object} TransferFee
 * @property {Tokens} transfer_fee - The transfer fee for the transfer.
 */ 

export interface TransferFee {
    transfer_fee: Tokens;
}
/**
 * Interface representing arguments for transferring funds from one account to another.
 * @typedef {Object} TransferFromArgs
 * @property {Account} to - The account to transfer funds to.
 * @property {[] | [bigint]} fee - The fee for the transfer.
 * @property {[] | [Uint8Array | number[]]} spender_subaccount - The subaccount related to the spender.
 * @property {Account} from - The account to transfer funds from.
 * @property {[] | [Uint8Array | number[]]} memo - Optional memo for the transfer.
 * @property {[] | [bigint]} created_at_time - The time when the transfer was created.
 * @property {bigint} amount - The amount of funds to transfer.
 */
           
export interface TransferFromArgs {
    to: Account;
    fee: [] | [bigint];
    spender_subaccount: [] | [Uint8Array | number[]];
    from: Account;
    memo: [] | [Uint8Array | number[]];
    created_at_time: [] | [bigint];
    amount: bigint;
}
/**
 * Represents the possible errors that can occur during a transferFrom operation.
 * @typedef {Object} TransferFromError
 * @property {Object} GenericError - Contains message and error code in case of a generic error.
 * @property {null} TemporarilyUnavailable - Indicates that the operation is temporarily unavailable.
 * @property {Object} InsufficientAllowance - Contains the required allowance for the operation.
 * @property {Object} BadBurn - Contains the minimum burn amount required for the operation.
 * @property {Object} Duplicate - Contains the duplicate ID of the operation.
 * @property {Object} BadFee - Contains the expected fee for the operation.
 * @property {Object} CreatedInFuture - Contains the ledger time when the operation was created.
 * @property {null} TooOld - Indicates that the operation is too old to be processed.
 * @property {Object} InsufficientFunds - Contains the current balance for the operation.
 */
export type TransferFromError =
    | {
          GenericError: { message: string; error_code: bigint };
      }
    | { TemporarilyUnavailable: null }
    | { InsufficientAllowance: { allowance: bigint } }
    | { BadBurn: { min_burn_amount: bigint } }
    | { Duplicate: { duplicate_of: bigint } }
    | { BadFee: { expected_fee: bigint } }
    | { CreatedInFuture: { ledger_time: bigint } }
    | { TooOld: null }
    | { InsufficientFunds: { balance: bigint } };
/**
 * Interface for the upgrade arguments.
 *
 * @typedef {object} UpgradeArgs
 * @property {Array<bigint>} maximum_number_of_accounts - The maximum number of accounts.
 * @property {Array<Account>} icrc1_minting_account - The ICRC1 minting account.
 * @property {Array<FeatureFlags>} feature_flags - The feature flags.
 */
export interface UpgradeArgs {
    maximum_number_of_accounts: [] | [bigint];
    icrc1_minting_account: [] | [Account];
    feature_flags: [] | [FeatureFlags];
}
/**
 * Interface for interacting with a service, providing methods for account balance retrieval, account identifier lookup,
 * accessing archives, retrieving decimal values, retrieving ICRC1-related information (balance, decimals, fee, metadata, minting account, name, supported standards, symbol, total supply, and transfer),
 * retrieving ICRC2-related information (allowance, approval, transfer from),
 * retrieving name, querying blocks, querying encoded blocks, sending DFX tokens, retrieving symbol, and transferring tokens with a fee.
 */
export interface _SERVICE {
    account_balance: ActorMethod<[BinaryAccountBalanceArgs], Tokens>;
    account_balance_dfx: ActorMethod<[AccountBalanceArgs], Tokens>;
    account_identifier: ActorMethod<[Account], Uint8Array | number[]>;
    archives: ActorMethod<[], Archives>;
    decimals: ActorMethod<[], Decimals>;
    icrc1_balance_of: ActorMethod<[Account], bigint>;
    icrc1_decimals: ActorMethod<[], number>;
    icrc1_fee: ActorMethod<[], bigint>;
    icrc1_metadata: ActorMethod<[], Array<[string, MetadataValue]>>;
    icrc1_minting_account: ActorMethod<[], [] | [Account]>;
    icrc1_name: ActorMethod<[], string>;
    icrc1_supported_standards: ActorMethod<[], Array<StandardRecord>>;
    icrc1_symbol: ActorMethod<[], string>;
    icrc1_total_supply: ActorMethod<[], bigint>;
    icrc1_transfer: ActorMethod<[TransferArg], Result>;
    icrc2_allowance: ActorMethod<[AllowanceArgs], Allowance>;
    icrc2_approve: ActorMethod<[ApproveArgs], Result_1>;
    icrc2_transfer_from: ActorMethod<[TransferFromArgs], Result_2>;
    name: ActorMethod<[], Name>;
    query_blocks: ActorMethod<[GetBlocksArgs], QueryBlocksResponse>;
    query_encoded_blocks: ActorMethod<
        [GetBlocksArgs],
        QueryEncodedBlocksResponse
    >;
    send_dfx: ActorMethod<[SendArgs], bigint>;
    symbol: ActorMethod<[], Symbol>;
    transfer: ActorMethod<[TransferArgs], Result_5>;
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    transfer_fee: ActorMethod<[{}], TransferFee>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
