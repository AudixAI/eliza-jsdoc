

/**
 * GoPlusType enum containing different types of security checks.
 * @enum {string}
 * @readonly
 * @property {string} EVMTOKEN_SECURITY_CHECK - Security check for EVM token.
 * @property {string} SOLTOKEN_SECURITY_CHECK - Security check for Sol token.
 * @property {string} SUITOKEN_SECURITY_CHECK - Security check for Sui token.
 * @property {string} RUGPULL_SECURITY_CHECK - Security check for rugpull.
 * @property {string} NFT_SECURITY_CHECK - Security check for NFT.
 * @property {string} ADRESS_SECURITY_CHECK - Security check for address.
 * @property {string} APPROVAL_SECURITY_CHECK - Security check for approval.
 * @property {string} ACCOUNT_ERC20_SECURITY_CHECK - Security check for ERC20 account.
 * @property {string} ACCOUNT_ERC721_SECURITY_CHECK - Security check for ERC721 account.
 * @property {string} ACCOUNT_ERC1155_SECURITY_CHECK - Security check for ERC1155 account.
 * @property {string} SIGNATURE_SECURITY_CHECK - Security check for signature.
 * @property {string} URL_SECURITY_CHECK - Security check for URL.
 */
export const GoPlusType = {
    EVMTOKEN_SECURITY_CHECK: "EVMTOKEN_SECURITY_CHECK",
    SOLTOKEN_SECURITY_CHECK: "SOLTOKEN_SECURITY_CHECK",
    SUITOKEN_SECURITY_CHECK: "SUITOKEN_SECURITY_CHECK",
    RUGPULL_SECURITY_CHECK: "RUGPULL_SECURITY_CHECK",
    NFT_SECURITY_CHECK: "NFT_SECURITY_CHECK",
    ADRESS_SECURITY_CHECK: "ADRESS_SECURITY_CHECK",
    APPROVAL_SECURITY_CHECK: "APPROVAL_SECURITY_CHECK",
    ACCOUNT_ERC20_SECURITY_CHECK: "ACCOUNT_ERC20_SECURITY_CHECK",
    ACCOUNT_ERC721_SECURITY_CHECK: "ACCOUNT_ERC721_SECURITY_CHECK",
    ACCOUNT_ERC1155_SECURITY_CHECK: "ACCOUNT_ERC1155_SECURITY_CHECK",
    SIGNATURE_SECURITY_CHECK: "SIGNATURE_SECURITY_CHECK",
    URL_SECURITY_CHECK: "URL_SECURITY_CHECK",
}

/**
 * Represents a type that can be any of the values defined in the `GoPlusType` type.
 */
export type GoPlusType = (typeof GoPlusType)[keyof typeof GoPlusType]

/**
 * Represents the type definition for a GoPlusParamType object.
 * @typedef {Object} GoPlusParamType
 * @property {GoPlusType} type - The type of the object.
 * @property {string} [network] - Optional network information.
 * @property {string} [token] - Optional token information.
 * @property {string} [contract] - Optional contract information.
 * @property {string} [wallet] - Optional wallet information.
 * @property {string} [url] - Optional URL information.
 * @property {string} [data] - Optional data information.
 */
export type GoPlusParamType = {
    "type": GoPlusType,
    "network"?: string,
    "token"?: string,
    "contract"?: string,
    "wallet"?: string,
    "url"?: string,
    "data"?: string,
}

/**
 * Class representing GoPlusManage which handles various API requests related to security and detection.
 * @class
 */
export class GoPlusManage {
    private apiKey: string;

/**
 * Constructor for creating a new instance with an optional API key.
 * @param {string} apiKey - The API key to use for authentication.
 */
    constructor(apiKey: string = null) {
        this.apiKey = apiKey;
    }

/**
* Makes a GET request to the specified API endpoint.
* @param {string} api - The API endpoint to request data from.
* @returns {Promise<any>} The JSON response from the API.
*/
    async requestGet(api: string) {
        const myHeaders = new Headers();
        if (this.apiKey) {
            myHeaders.append("Authorization", this.apiKey);
        }
        const url = `https://api.gopluslabs.io/${api}`
        const res = await fetch(url, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
            })

        return await res.json();
    }

/**
 * Retrieves token security information based on the chain ID and contract address.
 * 
 * @param {string} chainId - The chain ID for which token security information is being retrieved.
 * @param {string} address - The contract address for which token security information is being retrieved.
 * @returns {Promise<any>} - The token security information retrieved from the API.
 */
    async tokenSecurity(chainId: string, address: string) {
        const api = `api/v1/token_security/${chainId}?contract_addresses=${address}`;
        return await this.requestGet(api)
    }

/**
 * Detects rugpull for a specific contract address on a given chain.
 *
 * @param {string} chainId - The ID of the blockchain network.
 * @param {string} address - The contract address being checked for rugpull.
 * @returns {Promise<any>} - A Promise that resolves with the result of the rugpull detection.
 */
    async rugpullDetection(chainId: string, address: string) {
        const api = `api/v1/rugpull_detecting/${chainId}?contract_addresses=${address}`;
        return await this.requestGet(api)
    }

/**
 * Retrieves security information for a Solana token using GET method.
 * @param {string} address - The contract address of the Solana token.
 * @returns {Promise<any>} - The security information for the specified token.
 */
    async solanaTokenSecurityUsingGET(address: string) {
        const api = `api/v1/solana/token_security?contract_addresses=${address}`;
        return await this.requestGet(api)
    }

/**
 * Retrieves token security information for a specified address using a GET request.
 * 
 * @param {string} address - The contract address to get token security information for.
 * @returns {Promise<any>} - A Promise that resolves with the token security information.
 */
    async suiTokenSecurityUsingGET(address: string) {
        const api = `api/v1/sui/token_security?contract_addresses=${address}`;
        return await this.requestGet(api)
    }

/**
 * Retrieves security information for a specific NFT on the blockchain.
 * 
 * @param {string} chainId - The ID of the blockchain network.
 * @param {string} address - The address of the NFT contract.
 * @returns {Promise} A Promise that resolves with the security information of the NFT.
 */
    async nftSecurity(chainId: string, address: string) {
        const api = `api/v1/nft_security/${chainId}?contract_addresses=${address}`;
        return await this.requestGet(api)
    }

/**
 * Fetches the security details of a specific address from the API
 * @param {string} address - The address to retrieve security details for
 * @returns {Promise<any>} - A promise that resolves with the security details of the address
 */
    async addressSecurity(address: string) {
        const api = `api/v1/address_security/${address}`;
        return await this.requestGet(api)
    }

/**
 * Fetch approval security information for a specific chain and contract address.
 *
 * @param {string} chainId - Chain ID for which approval security information is requested.
 * @param {string} contract - Contract address for which approval security information is requested.
 * @returns {Promise} - Promise that resolves with the approval security data.
 */
    async approvalSecurity(chainId: string, contract: string) {
        const api = `api/v1/approval_security/${chainId}?contract_addresses=${contract}`;
        return await this.requestGet(api)
    }

/**
 * Async function to fetch ERC20 approval security for a specific wallet on a given chain.
 * 
 * @param {string} chainId - The ID of the blockchain chain.
 * @param {string} wallet - The wallet address for which to fetch approval security.
 * @returns {Promise} A Promise that resolves with the result of the API call.
 */
    async erc20ApprovalSecurity(chainId: string, wallet: string) {
        const api = `api/v2/token_approval_security/${chainId}?addresses=${wallet}`;
        return await this.requestGet(api)
    }

/**
 * Fetches NFT721 approval security for the specified chain ID and wallet address.
 * 
 * @param {string} chainId - The ID of the blockchain network.
 * @param {string} wallet - The wallet address of the user.
 * @returns {Promise} - A promise that resolves with the NFT721 approval security data.
 */
    async erc721ApprovalSecurity(chainId: string, wallet: string) {
        const api = `api/v2/nft721_approval_security/${chainId}?addresses=${wallet}`;
        return await this.requestGet(api)
    }

/**
 * Async function to retrieve ERC1155 approval security for a specific chain and wallet address.
 *
 * @param {string} chainId - The chain id for which the approval security is being retrieved.
 * @param {string} wallet - The wallet address for which the approval security is being retrieved.
 * @returns {Promise} A promise that resolves with the approval security data.
 */
    async erc1155ApprovalSecurity(chainId: string, wallet: string) {
        const api = `api/v2/nft1155_approval_security/${chainId}?addresses=${wallet}`;
        return await this.requestGet(api)
    }

/**
 * Decode input data for a specific chain using the GoPlusLabs API.
 * @param {string} chainId - The ID of the chain to decode the input for.
 * @param {string} data - The input data to be decoded.
 * @returns {Promise<any>} - A promise that resolves to the decoded input data response.
 */
    async inputDecode(chainId: string, data: string) {
        const body = JSON.stringify({
            chain_id: chainId,
            data: data,
        })
        const res = await fetch("https://api.gopluslabs.io/api/v1/abi/input_decode", {
            "headers": {
              "accept": "*/*",
              "accept-language": "en,zh-CN;q=0.9,zh;q=0.8",
              "content-type": "application/json"
            },
            "body": body,
            "method": "POST"
          });
        return await res.json();
    }

/**
 * Check the security status of a DApp and determine if the provided URL is a phishing site.
 * 
 * @param {string} url - The URL of the DApp or website to be checked.
 * @returns {Promise<{ data1: any, data2: any }>} - An object containing the security status of the DApp and whether the URL is a phishing site.
 */
    async dappSecurityAndPhishingSite(url: string) {
        const api = `api/v1/dapp_security?url=${url}`;
        const data1 = await this.requestGet(api)

        const api2 = `api/v1/phishing_site?url=${url}`;
        const data2 = await this.requestGet(api2)
        return {
            data1,
            data2
        }
    }
}