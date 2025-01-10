import { Address, Hash } from "viem";

/**
 * Enum representing types of action response.
 * @readonly
 * @enum {string}
 * @property {string} SET - Set action response type.
 * @property {string} ATTACH - Attach action response type.
 * @property {string} CREATE - Create action response type.
 * @property {string} REGISTER - Register action response type.
 * @property {string} REMOVE - Remove action response type.
 */
export enum ACTION_RESPONSE_TYPE {
    SET = "SET",
    ATTACH = "ATTACH",
    CREATE = "CREATE",
    REGISTER = "REGISTER",
    REMOVE = "REMOVE",
}

/**
 * Enum representing different types of resources with their corresponding paths.
 * @enum { string }
 * @readonly
 */
export enum RESOURCE_TYPE {
    LICENSE_TOKEN = "licenses/tokens", // new version
    LICENSE_TEMPLATES = "licenses/templates", // new version
    LICENSE_TERMS = "licenses/terms", // new version
    IP_LICENSE_TERMS = "licenses/ip/terms", // new version
    IP_LICENSE_DETAILS = "detailed-ip-license-terms", // new version
    ASSET = "assets",
    COLLECTION = "collections",
    DISPUTE = "disputes",
    LICENSE_MINT_FEES = "licenses/mintingfees",
    MODULE = "modules",
    PERMISSION = "permissions",
    ROYALTY = "royalties",
    ROYALTY_PAY = "royalties/payments",
    ROYALTY_POLICY = "royalties/policies",
    ROYALTY_SPLIT = "royalties/splits",
    TAGS = "tags",
    TRANSACTION = "transactions",
    LATEST_TRANSACTIONS = "transactions/latest",
}

/**
 * Enum representing the different response types for resources
 * @enum { string }
 * @readonly
 */
export enum RESPOURCE_REPONSE_TYPE {
    LICENSE_TOKEN = "LICENSETOKEN", // new version
    LICENSE_TEMPLATES = "LICENSETEMPLATE", // new version
    LICENSE_TERMS = "LICENSETERM", // new version
    IP_LICENSE_TERMS = "licenses/ip/terms", // new version
    IP_LICENSE_DETAILS = "detailed-ip-license-terms", // new version
    ASSET = "IPASSET",
    COLLECTION = "COLLECTION",
    DISPUTE = "DISPUTE",
    LICENSE_MINT_FEES = "licenses/mintingfees",
    MODULE = "modules",
    PERMISSION = "PERMISSION",
    ROYALTY = "ROYALTY",
    ROYALTY_PAY = "royalties/payments",
    ROYALTY_POLICY = "ROYALTYPOLICY",
    ROYALTY_SPLIT = "royalties/splits",
    TAGS = "tags",
}

/**
 * Type representing different resource types.
 * @typedef { object } ResourceType
 * @property { string } RESOURCE_TYPE.ASSET - Asset type resource.
 * @property { string } RESOURCE_TYPE.COLLECTION - Collection type resource.
 * @property { string } RESOURCE_TYPE.TRANSACTION - Transaction type resource.
 * @property { string } RESOURCE_TYPE.LATEST_TRANSACTIONS - Latest transactions type resource.
 * @property { string } RESOURCE_TYPE.LICENSE_TOKEN - License token type resource.
 * @property { string } RESOURCE_TYPE.LICENSE_TERMS - License terms type resource.
 * @property { string } RESOURCE_TYPE.LICENSE_TEMPLATES - License templates type resource.
 * @property { string } RESOURCE_TYPE.IP_LICENSE_TERMS - IP license terms type resource.
 * @property { string } RESOURCE_TYPE.IP_LICENSE_DETAILS - IP license details type resource.
 * @property { string } RESOURCE_TYPE.LICENSE_MINT_FEES - License mint fees type resource.
 * @property { string } RESOURCE_TYPE.MODULE - Module type resource.
 * @property { string } RESOURCE_TYPE.PERMISSION - Permission type resource.
 * @property { string } RESOURCE_TYPE.TAGS - Tags type resource.
 * @property { string } RESOURCE_TYPE.ROYALTY - Royalty type resource.
 * @property { string } RESOURCE_TYPE.ROYALTY_PAY - Royalty payment type resource.
 * @property { string } RESOURCE_TYPE.ROYALTY_POLICY - Royalty policy type resource.
 * @property { string } RESOURCE_TYPE.ROYALTY_SPLIT - Royalty split type resource.
 * @property { string } RESOURCE_TYPE.DISPUTE - Dispute type resource.
 */
export type ResourceType =
    | RESOURCE_TYPE.ASSET
    | RESOURCE_TYPE.COLLECTION
    | RESOURCE_TYPE.TRANSACTION
    | RESOURCE_TYPE.LATEST_TRANSACTIONS
    | RESOURCE_TYPE.LICENSE_TOKEN
    | RESOURCE_TYPE.LICENSE_TERMS
    | RESOURCE_TYPE.LICENSE_TEMPLATES
    | RESOURCE_TYPE.IP_LICENSE_TERMS
    | RESOURCE_TYPE.IP_LICENSE_DETAILS
    | RESOURCE_TYPE.LICENSE_MINT_FEES
    | RESOURCE_TYPE.MODULE
    | RESOURCE_TYPE.PERMISSION
    | RESOURCE_TYPE.TAGS
    | RESOURCE_TYPE.ROYALTY
    | RESOURCE_TYPE.ROYALTY_PAY
    | RESOURCE_TYPE.ROYALTY_POLICY
    | RESOURCE_TYPE.ROYALTY_SPLIT
    | RESOURCE_TYPE.DISPUTE;

/**
 * Represents the options for pagination.
 * @typedef {Object} PaginationOptions
 * @property {number} [limit] - The maximum number of items to return per page.
 * @property {number} [offset] - The number of items to skip from the beginning of the result set.
 */
export type PaginationOptions = {
    limit?: number;
    offset?: number;
};

/**
 * Defines the options available for filtering assets.
 * @typedef { Object } AssetFilterOptions
 * @property { string } [chainId] - The chain ID of the asset.
 * @property { string } [metadataResolverAddress] - The metadata resolver address of the asset.
 * @property { string } [tokenContract] - The contract address of the token.
 * @property { string } [tokenId] - The token ID of the asset.
 */
export type AssetFilterOptions = {
    chainId?: string;
    metadataResolverAddress?: string;
    tokenContract?: string;
    tokenId?: string;
};

/**
 * Options for filtering disputes.
 * @typedef {Object} DisputeFilterOptions
 * @property {string} [currentTag] - The current tag of the dispute.
 * @property {string} [initiator] - The initiator of the dispute.
 * @property {string} [targetIpId] - The target IP ID of the dispute.
 * @property {string} [targetTag] - The target tag of the dispute.
 */
export type DisputeFilterOptions = {
    currentTag?: string;
    initiator?: string;
    targetIpId?: string;
    targetTag?: string;
};

/**
 * Options for filtering permissions.
 * @typedef {Object} PermissionFilterOptions
 * @property {string} [signer] - The signer of the permission.
 * @property {string} [to] - The recipient of the permission.
 */
export type PermissionFilterOptions = {
    signer?: string;
    to?: string;
};

/**
 * Options for filtering policies.
 *
 * @typedef {object} PolicyFilterOptions
 * @property {string} [policyFrameworkManager] - The policy framework manager to filter by.
 */
export type PolicyFilterOptions = {
    policyFrameworkManager?: string;
};

/**
 * Options for filtering policies in a policy framework.
 * @typedef {Object} PolicyFrameworkFilterOptions
 * @property {string} [address] - The address to filter by.
 * @property {string} [name] - The name to filter by.
 */
export type PolicyFrameworkFilterOptions = {
    address?: string;
    name?: string;
};

/**
 * Options for filtering royalty information.
 * @typedef {Object} RoyaltyFilterOptions
 * @property {string|null} ipId - Optional IP ID for filtering
 * @property {string|null} royaltyPolicy - Optional royalty policy for filtering
 */
export type RoyaltyFilterOptions = {
    ipId?: string | null;
    royaltyPolicy?: string | null;
};

/**
 * Options for filtering tags.
 * @typedef {Object} TagFilterOptions
 * @property {string} [ipId] - The IP identifier.
 * @property {string} [tag] - The tag to filter by.
 */
export type TagFilterOptions = {
    ipId?: string;
    tag?: string;
};
/**
 * Defines the filter options for querying royalty pay transactions.
 * @typedef {Object} RoyaltyPayFilterOptions
 * @property {string} [ipId] - The IP ID associated with the transaction.
 * @property {string} [payerIpId] - The IP ID of the payer associated with the transaction.
 * @property {string} [receiverIpId] - The IP ID of the receiver associated with the transaction.
 * @property {string} [sender] - The sender of the transaction.
 * @property {string} [token] - The token associated with the transaction.
 */
  
export type RoyaltyPayFilterOptions = {
    ipId?: string;
    payerIpId?: string;
    receiverIpId?: string;
    sender?: string;
    token?: string;
};

/**
 * Represents options for filtering modules.
 * @typedef {Object} ModuleFilterOptions
 * @property {string} [name] - The name of the module to filter by.
 */
export type ModuleFilterOptions = {
    name?: string;
};

/**
 * Options to filter licenses by licensor IP ID or policy ID.
 * @typedef {Object} LicenseFilterOptions
 * @property {string} [licensorIpId] - The licensor IP ID to filter licenses by.
 * @property {string} [policyId] - The policy ID to filter licenses by.
 */
export type LicenseFilterOptions = {
    licensorIpId?: string;
    policyId?: string;
};

/**
 * Options for filtering licenses based on framework creator.
 */
export type LicenseFrameworkFilterOptions = {
    creator?: string;
};

/**
 * Represents the filter options for retrieving IPA policies.
 * @typedef {Object} IPAPolicyFilterOptions
 * @property {string} [active] - Specifies whether the policy is active.
 * @property {string} [inherited] - Specifies whether the policy is inherited.
 * @property {string} [policyId] - The ID of the policy to retrieve.
 */
export type IPAPolicyFilterOptions = {
    active?: string;
    inherited?: string;
    policyId?: string;
};

/**
 * Represents options for filtering transactions.
 * @typedef {Object} TransactionFilterOptions
 * @property {string} [actionType] - The type of action associated with the transaction.
 * @property {string} [resourceId] - The ID of the resource associated with the transaction.
 */ 

export type TransactionFilterOptions = {
    actionType?: string;
    resourceId?: string;
};

/**
 * Type representing different filter options for various entities.
 * Can be used to filter assets, disputes, permissions, policies, policy frameworks, royalties,
 * tags, royalty payments, modules, licenses, license frameworks, IPA policies, and transactions.
 */
export type FilterOptions =
    | AssetFilterOptions
    | DisputeFilterOptions
    | PermissionFilterOptions
    | PolicyFilterOptions
    | PolicyFrameworkFilterOptions
    | RoyaltyFilterOptions
    | TagFilterOptions
    | RoyaltyPayFilterOptions
    | ModuleFilterOptions
    | LicenseFilterOptions
    | LicenseFrameworkFilterOptions
    | IPAPolicyFilterOptions
    | TransactionFilterOptions;

/**
 * Defines the type QueryHeaders, which can either contain the properties
 * "x-api-key", "x-chain", and optionally "x-extend-asset" with their corresponding types being string,
 * or an empty object. 
 */
export type QueryHeaders =
    | {
          "x-api-key": string;
          "x-chain": string;
          "x-extend-asset"?: string;
      }
    | {};

/**
 * Enum representing different options for ordering query results.
 * Options include:
 * - BLOCK_TIMESTAMP: Order by block timestamp
 * - BLOCK_NUMBER: Order by block number
 * - TOKEN_ID: Order by token ID
 * - ASSET_COUNT: Order by asset count
 * - LICENSES_COUNT: Order by licenses count
 * - DESCENDANT_COUNT: Order by descendant count
 */
export enum QUERY_ORDER_BY {
    BLOCK_TIMESTAMP = "blockTimestamp",
    BLOCK_NUMBER = "blockNumber",
    TOKEN_ID = "tokenId",
    ASSET_COUNT = "assetCount",
    LICENSES_COUNT = "licensesCount",
    DESCENDANT_COUNT = "descendantCount",
    // PARENTS = "parentIpIds",
}

/**
 * Enum representing the possible order directions for query results.
 * Contains two options: ASC and DESC.
 */
export enum QUERY_ORDER_DIRECTION {
    ASC = "asc",
    DESC = "desc",
}

/**
* QueryOptions type for defining various options for querying data.
* @typedef {Object} QueryOptions
* @property {string | number} chain - The chain to query data from.
* @property {PaginationOptions} pagination - The pagination options for query results.
* @property {FilterOptions} where - The filters to apply to the query results.
* @property {QUERY_ORDER_BY} orderBy - The field to order the query results by.
* @property {QUERY_ORDER_DIRECTION} orderDirection - The direction to order the query results in.
*/
export type QueryOptions = {
    chain?: string | number;
    pagination?: PaginationOptions;
    where?: FilterOptions;
    orderBy?: QUERY_ORDER_BY;
    orderDirection?: QUERY_ORDER_DIRECTION;
};

/**
 * Represents a transaction object.
 * @typedef {Object} Transaction
 * @property {string} id - The unique identifier of the transaction.
 * @property {string} createdAt - The timestamp when the transaction was created.
 * @property {string} actionType - The type of action performed in the transaction.
 * @property {Address} initiator - The address of the initiator of the transaction.
 * @property {Address} ipId - The address of the IP involved in the transaction.
 * @property {Address} resourceId - The address of the resource involved in the transaction.
 * @property {string} resourceType - The type of the resource involved in the transaction.
 * @property {string} blockNumber - The block number in which the transaction was included.
 * @property {string} blockTimestamp - The timestamp of the block in which the transaction was included.
 * @property {string} logIndex - The index of the transaction within the block log.
 * @property {string} transactionIndex - The index of the transaction within the block.
 * @property {Hash} tx_hash - The hash of the transaction.
 */
export type Transaction = {
    id: string;
    createdAt: string;
    actionType: string;
    initiator: Address;
    ipId: Address;
    resourceId: Address;
    resourceType: string;
    blockNumber: string;
    blockTimestamp: string;
    logIndex: string;
    transactionIndex: string;
    tx_hash: Hash;
};

/**
 * Represents the metadata of a non-fungible token (NFT) asset.
 * @typedef {Object} AssetNFTMetadata
 * @property {string} name - The name of the NFT asset.
 * @property {string} chainId - The blockchain chain ID where the NFT asset is located.
 * @property {Address} tokenContract - The address of the token contract for the NFT asset.
 * @property {string} tokenId - The unique identifier of the NFT asset within the token contract.
 * @property {string} tokenUri - The URI that points to the metadata of the NFT asset.
 * @property {string} imageUrl - The URL of the image representing the NFT asset.
 */
export type AssetNFTMetadata = {
    name: string;
    chainId: string;
    tokenContract: Address;
    tokenId: string;
    tokenUri: string;
    imageUrl: string;
};

/**
 * Represents a permission object with specific attributes.
 * @typedef {object} Permission
 * @property {string} id - The ID of the permission.
 * @property {string} permission - The type of permission.
 * @property {Address} signer - The address of the signer.
 * @property {Address} to - The address of the recipient.
 * @property {string} func - The function associated with the permission.
 * @property {string} blockNumber - The block number associated with the permission.
 * @property {string} blockTimestamp - The timestamp of the block associated with the permission.
 */
export type Permission = {
    id: string;
    permission: string;
    signer: Address;
    to: Address;
    func: string;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Definition for a PolicyFramework object.
 * @typedef {Object} PolicyFramework
 * @property {string} id - The ID of the policy framework.
 * @property {Address} address - The address of the policy framework.
 * @property {string} name - The name of the policy framework.
 * @property {string} blockNumber - The block number of the policy framework.
 * @property {string} blockTimestamp - The timestamp of the policy framework block.
 */
export type PolicyFramework = {
    id: string;
    address: Address;
    name: string;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Definition of the Module type.
 * 
 * @typedef {Object} Module
 * @property {string} id - The ID of the module.
 * @property {string} name - The name of the module.
 * @property {string} module - The module itself.
 * @property {string} blockNumber - The block number.
 * @property {string} blockTimestamp - The timestamp of the block.
 * @property {string} deletedAt - The deletion date of the module.
 */
export type Module = {
    id: string;
    name: string;
    module: string;
    blockNumber: string;
    blockTimestamp: string;
    deletedAt: string;
};

/**
 * Represents a Tag object with properties.
 * @typedef {object} Tag
 * @property {string} id - The id of the tag.
 * @property {string} uuid - The UUID of the tag.
 * @property {Address} ipId - The Address of the tag.
 * @property {string} tag - The tag string.
 * @property {string} deletedAt - The timestamp when the tag was deleted.
 * @property {string} blockNumber - The block number of the tag.
 * @property {string} blockTimestamp - The timestamp of the block when the tag was created.
 */
export type Tag = {
    id: string;
    uuid: string;
    ipId: Address;
    tag: string;
    deletedAt: string;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Represents a policy applied to a specific IP address.
 * @typedef {Object} IPAPolicy
 * @property {string} id - The unique identifier of the policy.
 * @property {Address} ipId - The IP address to which the policy is applied.
 * @property {Address} policyId - The identifier of the policy itself.
 * @property {string} index - The index of the policy.
 * @property {boolean} active - Indicates if the policy is currently active.
 * @property {boolean} inherited - Indicates if the policy is inherited.
 * @property {string} blockNumber - The block number when the policy was created.
 * @property {string} blockTimestamp - The timestamp when the policy was created.
 */
        
export type IPAPolicy = {
    id: string;
    ipId: Address;
    policyId: Address;
    index: string;
    active: boolean;
    inherited: boolean;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Represents a royalty pay transaction object.
 * @typedef {Object} RoyaltyPay
 * @property {string} id - The unique identifier of the royalty pay transaction.
 * @property {Address} receiverIpId - The IP address of the receiver.
 * @property {Address} payerIpId - The IP address of the payer.
 * @property {Address} sender - The sender's address.
 * @property {Address} token - The token address.
 * @property {string} amount - The amount of the royalty pay.
 * @property {string} blockNumber - The block number of the transaction.
 * @property {string} blockTimestamp - The timestamp of the block.
 */
export type RoyaltyPay = {
    id: string;
    receiverIpId: Address;
    payerIpId: Address;
    sender: Address;
    token: Address;
    amount: string;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Definition of a Royalty object.
 * 
 * @typedef {object} Royalty
 * @property {string} id - The unique identifier of the royalty.
 * @property {Address} ipId - The address of the intellectual property associated with the royalty.
 * @property {string} data - Additional data related to the royalty.
 * @property {Address} royaltyPolicy - The address of the royalty policy.
 * @property {string} blockNumber - The block number when the royalty was created.
 * @property {string} blockTimestamp - The timestamp when the royalty was created.
 */
export type Royalty = {
    id: string;
    ipId: Address;
    data: string;
    royaltyPolicy: Address;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Represents a dispute object.
 * @typedef {Object} Dispute
 * @property {string} id - The unique identifier of the dispute.
 * @property {Address} targetIpId - The address of the target IP.
 * @property {Address} targetTag - The address of the target tag.
 * @property {Address} currentTag - The address of the current tag.
 * @property {Address} arbitrationPolicy - The address of the arbitration policy.
 * @property {string} evidenceLink - The link to the evidence related to the dispute.
 * @property {Address} initiator - The address of the user who initiated the dispute.
 * @property {string} data - Additional data related to the dispute.
 * @property {string} blockNumber - The block number at which the dispute occurred.
 * @property {string} blockTimestamp - The timestamp of the block at which the dispute occurred.
 */
export type Dispute = {
    id: string;
    targetIpId: Address;
    targetTag: Address;
    currentTag: Address;
    arbitrationPolicy: Address;
    evidenceLink: string;
    initiator: Address;
    data: string;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Represents a collection with various statistics related to assets, licenses, and disputes.
 * @typedef { Object } Collection
 * @property { string } id - The unique identifier of the collection.
 * @property { string } assetCount - The number of assets in the collection.
 * @property { string } licensesCount - The number of licenses in the collection.
 * @property { string } resolvedDisputeCount - The number of resolved disputes in the collection.
 * @property { string } cancelledDisputeCount - The number of cancelled disputes in the collection.
 * @property { string } raisedDisputeCount - The number of raised disputes in the collection.
 * @property { string } judgedDisputeCount - The number of disputes in the collection that have been judged.
 * @property { string } blockNumber - The block number at which the collection was created.
 * @property { string } blockTimestamp - The timestamp at which the collection was created.
 */
export type Collection = {
    id: string;
    assetCount: string;
    licensesCount: string;
    resolvedDisputeCount: string;
    cancelledDisputeCount: string;
    raisedDisputeCount: string;
    judgedDisputeCount: string;
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Represents a Policy object.
 * @typedef {object} Policy
 * @property {string} id - The ID of the policy.
 * @property {Address} policyFrameworkManager - The address of the policy framework manager.
 * @property {string} frameworkData - The framework data of the policy.
 * @property {Address} royaltyPolicy - The address of the royalty policy.
 * @property {string} royaltyData - The royalty data of the policy.
 * @property {string} mintingFee - The minting fee of the policy.
 * @property {Address} mintingFeeToken - The address of the token for minting fee.
 * @property {string} blockNumber - The block number associated with the policy.
 * @property {string} blockTimestamp - The timestamp of the block associated with the policy.
 * @property {PILType} pil - The PIL type of the policy.
 */

export type Policy = {
    id: string;
    policyFrameworkManager: Address;
    frameworkData: string;
    royaltyPolicy: Address;
    royaltyData: string;
    mintingFee: string;
    mintingFeeToken: Address;
    blockNumber: string;
    blockTimestamp: string;
    pil: PILType;
};

/**
 * Represents an object that defines the terms and conditions for using a PIL (Provider Identification Layer).
 * @typedef { Object } PILType
 * @property { Hash } id - The unique identifier for the PIL.
 * @property { boolean } attribution - Indicates if attribution is required.
 * @property { boolean } commercialUse - Indicates if commercial use is allowed.
 * @property { boolean } commercialAttribution - Indicates if commercial use requires attribution.
 * @property { Address } commercializerChecker - The address for the commercializer checker.
 * @property { string } commercializerCheckerData - Additional data for the commercializer checker.
 * @property { string } commercialRevShare - The revenue share for commercial use.
 * @property { boolean } derivativesAllowed - Indicates if derivatives are allowed.
 * @property { boolean } derivativesAttribution - Indicates if derivative works require attribution.
 * @property { boolean } derivativesApproval - Indicates if approval is required for derivates.
 * @property { boolean } derivativesReciprocal - Indicates if reciprocal obligations apply to derivatives.
 * @property {string[]} territories - An array of territories where the PIL can be used.
 * @property {string[]} distributionChannels - An array of distribution channels where the PIL can be distributed.
 * @property {string[]} contentRestrictions - An array of content restrictions for the PIL.
 */
export type PILType = {
    id: Hash;
    attribution: boolean;
    commercialUse: boolean;
    commercialAttribution: boolean;
    commercializerChecker: Address;
    commercializerCheckerData: string;
    commercialRevShare: string;
    derivativesAllowed: boolean;
    derivativesAttribution: boolean;
    derivativesApproval: boolean;
    derivativesReciprocal: boolean;
    territories: string[];
    distributionChannels: string[];
    contentRestrictions: string[];
};

/**
 * Represents a royalty split, including information about the ID, holders, and claim arguments.
 * @typedef {Object} RoyaltySplit
 * @property {Address} id - The ID associated with the royalty split
 * @property {RoyaltyHolder[]} holders - An array of royalty holders
 * @property {string} claimFromIPPoolArg - The claim argument for the IP pool
 */
export type RoyaltySplit = {
    id: Address;
    holders: RoyaltyHolder[];
    claimFromIPPoolArg: string;
};

/**
 * Represents a royalty holder.
 * @typedef {Object} RoyaltyHolder
 * @property {Address} id - The ID of the royalty holder.
 * @property {string} ownership - The ownership status of the royalty holder.
 */
export type RoyaltyHolder = {
    id: Address;
    ownership: string;
};

/**
 * Represents a license token with specific attributes.
 * @typedef {Object} LicenseToken
 * @property {string} id - The unique identifier of the license token.
 * @property {Address} licensorIpId - The address of the licensor IP.
 * @property {Address} licenseTemplate - The address of the license template.
 * @property {string} licenseTermsId - The identifier of the license terms.
 * @property {boolean} transferable - Indicates if the license token is transferable.
 * @property {Address} owner - The address of the current owner of the license token.
 * @property {string} mintedAt - The timestamp when the license token was minted.
 * @property {string} expiresAt - The timestamp when the license token expires.
 * @property {string} burntAt - The timestamp when the license token was burnt.
 * @property {string} blockNumber - The number of the block where the license token was processed.
 * @property {string} blockTime - The timestamp of the block where the license token was processed.
 */
export type LicenseToken = {
    id: string;
    licensorIpId: Address;
    licenseTemplate: Address;
    licenseTermsId: string;
    transferable: boolean;
    owner: Address;
    mintedAt: string;
    expiresAt: string;
    burntAt: string;
    blockNumber: string;
    blockTime: string;
};

/**
 * Represents a license template with the following properties:
 * @typedef { Object } LicenseTemplate
 * @property { string } id - The unique identifier for the license template.
 * @property { string } name - The name of the license template.
 * @property { string } metadataUri - The URI to retrieve metadata about the license template.
 * @property { string } blockNumber - The block number associated with the license template.
 * @property { string } blockTime - The time at which the license template was added to the blockchain.
 */
export type LicenseTemplate = {
    id: string;
    name: string;
    metadataUri: string;
    blockNumber: string;
    blockTime: string;
};

/**
 * Represents a social media platform with its corresponding URL.
 * @typedef {Object} SocialMedia
 * @property {string} [platform] - The name of the social media platform.
 * @property {string} [url] - The URL of the social media profile.
 */
export type SocialMedia = {
    platform?: string;
    url?: string;
};

/**
 * Definition of a Creator entity.
 * @typedef {Object} Creator
 * @property {string} [name] - The name of the creator.
 * @property {Address} [address] - The address of the creator.
 * @property {string} [description] - The description of the creator.
 * @property {number} [contributionPercent] - The contribution percentage of the creator.
 * @property {SocialMedia[]} [socialMedia] - The social media accounts of the creator.
 */
export type Creator = {
    name?: string;
    address?: Address;
    description?: string;
    contributionPercent?: number;
    socialMedia?: SocialMedia[];
};

/**
 * Interface for IP metadata.
 * @typedef {Object} IPMetadata
 * @property {string} [title] - The title of the IP.
 * @property {string} [description] - The description of the IP.
 * @property {string} [ipType] - The type of IP.
 * @property {Creator[]} [creators] - The creators of the IP.
 * @property {Object[]} [appInfo] - Information about the app related to the IP.
 * @property {string} [appInfo.id] - The ID of the app.
 * @property {string} [appInfo.name] - The name of the app.
 * @property {string} [appInfo.website] - The website of the app.
 * @property {Object[]} [relationships] - Relationships related to the IP.
 * @property {Address} [relationships.parentIpId] - The parent IP ID.
 * @property {string} [relationships.type] - The type of relationship.
 * @property {Object} [robotTerms] - Robot terms related to the IP.
 * @property {string} [robotTerms.userAgent] - The user agent for robot terms.
 * @property {string} [robotTerms.allow] - Allowance information for robot terms.
 * @property {any} [key] - Additional properties as needed.
 */
export interface IPMetadata {
    title?: string;
    description?: string;
    ipType?: string;
    creators?: Creator[];
    appInfo?: {
        id?: string;
        name?: string;
        website?: string;
    }[];
    relationships?: {
        parentIpId?: Address;
        type?: string;
    }[];
    robotTerms?: {
        userAgent?: string;
        allow?: string;
    };
    [key: string]: any;
}

/**
 * Interface representing asset metadata.
 * @typedef {Object} AssetMetadata
 * @property {Address} id - The unique identifier of the asset.
 * @property {string} metadataHash - The hash value of the metadata.
 * @property {string} metadataUri - The URI of the metadata.
 * @property {IPMetadata} metadataJson - The metadata in JSON format.
 * @property {string} nftMetadataHash - The hash value of the NFT metadata.
 * @property {string} nftTokenUri - The URI of the NFT token.
 * @property {string} registrationDate - The date of registration for the asset.
 */
export interface AssetMetadata {
    id: Address;
    metadataHash: string;
    metadataUri: string;
    metadataJson: IPMetadata;
    nftMetadataHash: string;
    nftTokenUri: string;
    registrationDate: string;
}

/**
 * Represents a collection of user-related data.
 * @typedef {Object} UserCollection
 * @property {number} [id] - The unique identifier of the collection.
 * @property {number} [user_id] - The user ID associated with the collection.
 * @property {Hash} [tx_hash] - The transaction hash related to the collection.
 * @property {string} [chain] - The blockchain network of the collection.
 * @property {string} [chain_id] - The ID of the blockchain network.
 * @property {Address} [collection_address] - The address of the collection.
 * @property {string} [collection_name] - The name of the collection.
 * @property {string} [collection_thumb] - The thumbnail image of the collection.
 * @property {string} [collection_banner] - The banner image of the collection.
 * @property {string} [collection_description] - The description of the collection.
 * @property {string} [created_at] - The timestamp when the collection was created.
 * @property {string} [updated_at] - The timestamp when the collection was last updated.
 * @property {null} [User] - A user associated with the collection.
 */
export type UserCollection = {
    id?: number;
    user_id?: number;
    tx_hash?: Hash;
    chain?: string;
    chain_id?: string;
    collection_address?: Address;
    collection_name?: string;
    collection_thumb?: string;
    collection_banner?: string;
    collection_description?: string;
    created_at?: string;
    updated_at?: string;
    User?: null;
};

/**
 * Enum representing different flavors of Public Image License.
 * This enum includes options for non-commercial social remixing, commercial use, commercial remix, and custom licenses.
 */
export enum PIL_FLAVOR {
    NON_COMMERCIAL_SOCIAL_REMIXING = "Non-Commercial Social Remixing",
    COMMERCIAL_USE = "Commercial Use",
    COMMERCIAL_REMIX = "Commercial Remix",
    CUSTOM = "Custom",
    // OPEN_DOMAIN = "Open Domain",
    // NO_DERIVATIVE = "No Derivative",
}

/**
 * Represents the possible flavors for a PIL (Public Information License).
 */
export type PilFlavor =
    | PIL_FLAVOR.NON_COMMERCIAL_SOCIAL_REMIXING
    | PIL_FLAVOR.COMMERCIAL_USE
    | PIL_FLAVOR.COMMERCIAL_REMIX
    | PIL_FLAVOR.CUSTOM;

/**
 * Represents an Asset in the system.
 * @typedef { Object } Asset
 * @property { Address } id - The unique identifier of the asset.
 * @property { number } ancestorCount - The number of ancestors of the asset.
 * @property { number } descendantCount - The number of descendants of the asset.
 * @property { number } [parentCount] - The number of parents of the asset, optional.
 * @property { number } [childCount] - The number of children of the asset, optional.
 * @property { number } [rootCount] - The number of root assets in the hierarchy, optional.
 * @property {Address[] | null} parentIpIds - The IDs of the parent IPs associated with the asset.
 * @property {Address[] | null} childIpIds - The IDs of the child IPs associated with the asset.
 * @property {Address[] | null} rootIpIds - The IDs of the root IPs associated with the asset.
 * @property {Asset[] | null} [parentIps] - The parent IPs associated with the asset, optional.
 * @property {Asset[] | null} [rootIps] - The root IPs associated with the asset, optional.
 * @property {Asset[] | null} [childIps] - The child IPs associated with the asset, optional.
 * @property { Object } nftMetadata - The metadata of the NFT associated with the asset.
 * @property { string } nftMetadata.name - The name of the NFT.
 * @property { string } nftMetadata.chainId - The chain ID of the token.
 * @property { Address } nftMetadata.tokenContract - The address of the token contract.
 * @property { string } nftMetadata.tokenId - The ID of the token.
 * @property { string } nftMetadata.tokenUri - The URI of the token.
 * @property { string } nftMetadata.imageUrl - The URL of the image associated with the token.
 * @property { string } blockNumber - The block number of the asset.
 * @property { string } blockTimestamp - The timestamp of the block when the asset was created.
 */
export type Asset = {
    id: Address;
    ancestorCount: number;
    descendantCount: number;
    parentCount?: number;
    childCount?: number;
    rootCount?: number;
    parentIpIds: Address[] | null;
    childIpIds: Address[] | null;
    rootIpIds: Address[] | null;
    parentIps?: Asset[] | null;
    rootIps?: Asset[] | null;
    childIps?: Asset[] | null;
    nftMetadata: {
        name: string;
        chainId: string;
        tokenContract: Address;
        tokenId: string;
        tokenUri: string;
        imageUrl: string;
    };
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Type representing an edge in the asset graph.
 * @typedef {Object} AssetEdges
 * @property {Address} ipId - The IP ID associated with the asset.
 * @property {Address} parentIpId - The parent IP ID of the asset.
 * @property {string} blockNumber - The block number when the asset was created.
 * @property {string} blockTime - The timestamp of when the asset was created.
 * @property {Address} licenseTemplate - The license template used for the asset.
 * @property {string} licenseTermsId - The ID of the license terms.
 * @property {string} licenseTokenId - The ID of the license token.
 * @property {string} transactionHash - The hash of the transaction that created the asset.
 * @property {string} transactionIndex - The index of the transaction in the block.
 */
      
export type AssetEdges = {
    ipId: Address;
    parentIpId: Address;
    blockNumber: string;
    blockTime: string;
    licenseTemplate: Address;
    licenseTermsId: string;
    licenseTokenId: string;
    transactionHash: string;
    transactionIndex: string;
};

/**
 * Represents a license for a digital asset.
 * @typedef {Object} License
 * @property {string} id - The unique identifier for the license.
 * @property {Address} licensorIpId - The address of the licensor.
 * @property {string} licenseTemplate - The template for the license.
 * @property {string} licenseTermsId - The identifier for the license terms.
 * @property {boolean} transferable - Indicates if the license is transferable.
 * @property {Address} owner - The address of the license owner.
 * @property {string} mintedAt - The timestamp when the license was minted.
 * @property {string} expiresAt - The timestamp when the license expires.
 * @property {string} burntAt - The timestamp when the license was burnt.
 * @property {string} blockNumber - The block number when the license was created.
 * @property {string} blockTime - The timestamp corresponding to the block number.
 */
export type License = {
    id: string;
    licensorIpId: Address;
    licenseTemplate: string;
    licenseTermsId: string;
    transferable: boolean;
    owner: Address;
    mintedAt: string;
    expiresAt: string;
    burntAt: string;
    blockNumber: string;
    blockTime: string;
};

/**
 * Defines the structure of the PIL (Public Interest License) terms.
 * * @typedef { Object } PILTerms
 * @property { boolean } commercialAttribution - Indicates if commercial attribution is required.
 * @property { number } commercialRevenueCeiling - The maximum commercial revenue allowed.
 * @property { number } commercialRevenueShare - The percentage of revenue shared with commercializer.
 * @property { boolean } commercialUse - Indicates if commercial use is allowed.
 * @property { Address } commercializerCheck - The address for commercializer verification.
 * @property { Address } currency - The currency used for revenue calculations.
 * @property { boolean } derivativesAllowed - Indicates if derivatives are allowed.
 * @property { boolean } derivativesApproval - Indicates if approval is required for derivatives.
 * @property { boolean } derivativesAttribution - Indicates if derivatives must include attribution.
 * @property { boolean } derivativesReciprocal - Indicates if reciprocal licensing is required for derivatives.
 * @property { number } derivativesRevenueCeiling - The maximum revenue allowed for derivatives.
 * @property { string } expiration - The expiration date of the PIL terms.
 * @property { string } uRI - The URI for accessing the PIL terms.
 */
export type PILTerms = {
    commercialAttribution: boolean;
    commercialRevenueCelling: number;
    commercialRevenueShare: number;
    commercialUse: boolean;
    commercializerCheck: Address;
    currency: Address;
    derivativesAllowed: boolean;
    derivativesApproval: boolean;
    derivativesAttribution: boolean;
    derivativesReciprocal: boolean;
    derivativesRevenueCelling: number;
    expiration: string;
    uRI: string;
};

/**
 * Definition for IPLicenseDetails object.
 * @typedef {Object} IPLicenseDetails
 * @property {string} id - The ID of the license
 * @property {Address} ipId - The address of the IP
 * @property {string} licenseTemplateId - The ID of the license template
 * @property {Object} licenseTemplate - Information about the license template
 * @property {string} licenseTemplate.id - The ID of the license template
 * @property {string} licenseTemplate.name - The name of the license template
 * @property {string} licenseTemplate.metadataUri - The URI of the license template metadata
 * @property {string} licenseTemplate.blockNumber - The block number of the license template
 * @property {string} licenseTemplate.blockTime - The block time of the license template
 * @property {PILTerms} terms - The terms of the license agreement
 */
export type IPLicenseDetails = {
    id: string;
    ipId: Address;
    licenseTemplateId: string;
    licenseTemplate: {
        id: string;
        name: string;
        metadataUri: string;
        blockNumber: string;
        blockTime: string;
    };
    terms: PILTerms;
};
/**
 * Represents the license terms of an intellectual property.
 * @typedef {Object} IPLicenseTerms
 * @property {string} id - The unique identifier for the license terms.
 * @property {Address} ipId - The address of the intellectual property.
 * @property {string} licenseTemplate - The template of the license terms.
 * @property {string} licenseTermsId - The identifier for the license terms.
 * @property {string} blockNumber - The block number associated with the license terms.
 * @property {string} blockTime - The timestamp of when the block was created.
 */
export type IPLicenseTerms = {
    id: string;
    ipId: Address;
    licenseTemplate: string;
    licenseTermsId: string;
    blockNumber: string;
    blockTime: string;
};

/**
 * Represents a royalty policy for a token.
 * @typedef {Object} RoyaltyPolicy
 * @property {Address} id - The unique identifier of the policy.
 * @property {Address} ipRoyaltyVault - The address of the IP royalty vault.
 * @property {Address} splitClone - The address of the split clone.
 * @property {string} royaltyStack - The stack for royalties.
 * @property {Address[]} targetAncestors - The target ancestors for royalties.
 * @property {string[]} targetRoyaltyAmount - The amounts for target royalties.
 * @property {string} blockNumber - The block number associated with the policy.
 * @property {string} blockTimestamp - The timestamp associated with the block.
 */
export type RoyaltyPolicy = {
    id: Address;
    ipRoyaltyVault: Address;
    splitClone: Address;
    royaltyStack: string;
    targetAncestors: Address[];
    targetRoyaltyAmount: string[];
    blockNumber: string;
    blockTimestamp: string;
};

/**
 * Interface representing a trait.
 * @interface Trait
 * @property {string} trait_type - The type of the trait.
 * @property {string | number} value - The value of the trait.
 * @property {number} [max_value] - The maximum value of the trait (optional).
 */
export interface Trait {
    trait_type: string;
    value: string | number;
    max_value?: number;
}

/**
 * Represents the terms of a license.
 * @typedef {Object} LicenseTerms
 * @property {string} id - The unique identifier of the license terms.
 * @property {Trait[]} licenseTerms - An array of traits associated with the license terms.
 * @property {Address} licenseTemplate - The address of the license template.
 * @property {string} blockNumber - The block number related to the license terms.
 * @property {string} blockTime - The block time related to the license terms.
 */
export type LicenseTerms = {
    id: string;
    // json: string
    licenseTerms: Trait[];
    licenseTemplate: Address;
    blockNumber: string;
    blockTime: string;
};

/**
 * Interface representing the metadata of an asset.
 * @property {Address} id - The unique identifier of the asset.
 * @property {string} metadataHash - The hash of the metadata.
 * @property {string} metadataUri - The URI to access the metadata.
 * @property {IPMetadata} metadataJson - The JSON metadata object.
 * @property {string} nftMetadataHash - The hash of the NFT metadata.
 * @property {string} nftTokenUri - The URI to access the NFT token.
 * @property {string} registrationDate - The date when the asset was registered.
 */
     
export interface AssetMetadata {
    id: Address;
    metadataHash: string;
    metadataUri: string;
    metadataJson: IPMetadata;
    nftMetadataHash: string;
    nftTokenUri: string;
    registrationDate: string;
}

/**
 * Interface representing a trait.
 * @property {string} trait_type - The type of the trait.
 * @property {string | number} value - The value assigned to the trait.
 * @property {number} [max_value] - The maximum value that the trait can have (optional).
 */
export interface Trait {
    trait_type: string;
    value: string | number;
    max_value?: number;
}
