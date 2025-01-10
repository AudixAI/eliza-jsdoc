/**
 * Interface representing the configuration options for Stargaze.
 * @property {string} endpoint - The endpoint URL for Stargaze.
 */
export interface StargazeConfig {
    endpoint: string;
}

/**
 * Interface representing the response structure for NFTs.
 * @property {Token[]} tokens - An array of tokens.
 * @property {Object} pageInfo - Information about the pagination of the results.
 * @property {number} pageInfo.total - The total number of tokens.
 * @property {number} pageInfo.offset - The offset used for pagination.
 * @property {number} pageInfo.limit - The maximum number of tokens returned per request.
 */
export interface NFTResponse {
    tokens: {
        tokens: Token[];
        pageInfo: {
            total: number;
            offset: number;
            limit: number;
        };
    };
}

/**
 * Interface representing a token.
 * @interface
 * @property {string} id - The unique identifier of the token.
 * @property {string} tokenId - The identifier of the tokenId.
 * @property {string} name - The name of the token.
 * @property {object} media - The media object containing the url of the media.
 * @property {string} media.url - The url of the media.
 * @property {object} [listPrice] - Optional object representing the list price of the token.
 * @property {string} listPrice.amount - The amount of the list price.
 * @property {string} listPrice.symbol - The symbol of the list price.
 */
export interface Token {
    id: string;
    tokenId: string;
    name: string;
    media: {
        url: string;
    };
    listPrice?: {
        amount: string;
        symbol: string;
    };
}


/**
 * Interface representing configuration options for the Stargaze service.
 * @typedef {Object} StargazeConfig
 * @property {string} endpoint - The endpoint URL for the service.
 */
export interface StargazeConfig {
    endpoint: string;
}

// Collection Types
/**
* Interface representing the statistics of a collection.
* @typedef {Object} CollectionStats
* @property {Object} floor - The floor price of the collection.
* @property {string} floor.amount - The amount of the floor price.
* @property {string} floor.symbol - The symbol of the floor price.
* @property {Object} totalVolume - The total volume of the collection.
* @property {string} totalVolume.amount - The amount of the total volume.
* @property {string} totalVolume.symbol - The symbol of the total volume.
* @property {number} owners - The number of owners of the collection.
* @property {number} listed - The number of items listed in the collection.
* @property {number} totalSupply - The total supply of items in the collection.
*/
export interface CollectionStats {
    floor: {
        amount: string;
        symbol: string;
    };
    totalVolume: {
        amount: string;
        symbol: string;
    };
    owners: number;
    listed: number;
    totalSupply: number;
}

/**
 * Interface for configuring the Stargaze service.
 * @interface StargazeConfig
 * @property {string} endpoint - The URL endpoint for the Stargaze service.
 */ 
         
export interface StargazeConfig {
    endpoint: string;
}

/**
 * Interface representing a token sale.
 * @typedef {Object} TokenSale
 * @property {string} id - The ID of the token sale.
 * @property {Object} token - Information about the token being sold.
 * @property {string} token.tokenId - The ID of the token.
 * @property {string} token.name - The name of the token.
 * @property {Object} token.media - Information about the media associated with the token.
 * @property {string} token.media.url - The URL of the media associated with the token.
 * @property {number} price - The price of the token sale.
 * @property {number} priceUsd - The price of the token sale in USD.
 * @property {string} date - The date of the token sale.
 * @property {string} saleDenomSymbol - The symbol used for the sale denomination.
 * @property {string} saleType - The type of token sale.
 * @property {Object} buyer - Information about the buyer.
 * @property {string} buyer.address - The address of the buyer.
 * @property {Object} seller - Information about the seller.
 * @property {string} seller.address - The address of the seller.
 */
export interface TokenSale {
    id: string;
    token: {
        tokenId: string;
        name: string;
        media: {
            url: string;
        };
    };
    price: number;
    priceUsd: number;
    date: string;
    saleDenomSymbol: string;
    saleType: string;
    buyer: {
        address: string;
    };
    seller: {
        address: string;
    };
}

/**
 * Interface representing the response object for token sales API.
 * @property {object} data - The main data object containing token sales information.
 * @property {object} data.tokenSales - Nested object containing token sales information.
 * @property {TokenSale[]} data.tokenSales.tokenSales - Array of TokenSale objects representing individual token sales.
 */
export interface TokenSalesResponse {
    data: {
        tokenSales: {
            tokenSales: TokenSale[];
        };
    };
}