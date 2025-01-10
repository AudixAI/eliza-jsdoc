import {
    IAgentRuntime,
    Service,
    ServiceType,
    IIrysService,
    UploadIrysResult,
    DataIrysFetchedFromGQL,
    GraphQLTag,
    IrysMessageType,
    generateMessageResponse,
    ModelClass,
    IrysDataType,
    IrysTimestamp,
} from "@elizaos/core";
import { Uploader } from "@irys/upload";
import { BaseEth } from "@irys/upload-ethereum";
import { GraphQLClient, gql } from 'graphql-request';
import crypto from 'crypto';

/**
 * Interface representing a NodeGQL object.
 * @property {string} id - The unique identifier of the NodeGQL object.
 * @property {string} address - The address associated with the NodeGQL object.
 */
interface NodeGQL {
    id: string;
    address: string;
}

/**
 * Interface representing a response object containing transaction IDs and addresses.
 * @typedef TransactionsIdAddress
 * @property {boolean} success - Indicates if the request was successful.
 * @property {NodeGQL[]} data - An array of NodeGQL objects containing transaction IDs and addresses.
 * @property {string} [error] - Optional. A message indicating an error if the request was unsuccessful.
 */
interface TransactionsIdAddress {
    success: boolean;
    data: NodeGQL[];
    error?: string;
}

/**
 * Interface representing a GraphQL transaction object.
 * @typedef {object} TransactionGQL
 * @property {object[]} transactions List of transactions
 * @property {object[]} edges List of edges containing node information
 * @property {string} edges.node.id The ID of the transaction node
 * @property {string} edges.node.address The address of the transaction node
 */
interface TransactionGQL {
    transactions: {
        edges: {
            node: {
                id: string;
                address: string;
            }
        }[]
    }
}

/**
 * IrysService class that extends Service and implements IIrysService interface.
 * Contains static serviceType, runtime, irysUploader, and endpoints for transactions and data.
 * 
 * @class
 */
export class IrysService extends Service implements IIrysService {
    static serviceType: ServiceType = ServiceType.IRYS;

    private runtime: IAgentRuntime | null = null;
    private irysUploader: any | null = null;
    private endpointForTransactionId: string = "https://uploader.irys.xyz/graphql";
    private endpointForData: string = "https://gateway.irys.xyz";

/**
 * Asynchronously initializes the IrysService with the given runtime.
 * 
 * @param {IAgentRuntime} runtime - The runtime to be set for the IrysService.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
    async initialize(runtime: IAgentRuntime): Promise<void> {
        console.log("Initializing IrysService");
        this.runtime = runtime;
    }

/**
 * Asynchronously fetches the transaction IDs and addresses from the GraphQL endpoint.
 * 
 * @param owners Array of strings representing the owners of the transactions (default: null)
 * @param tags Array of GraphQLTag objects representing tags associated with the transactions (default: null)
 * @param timestamp IrysTimestamp object representing the timestamp filter for the transactions (default: null)
 * @returns Promise<TransactionsIdAddress> Promise that resolves to an object containing success status and array of transaction node objects
 */
    private async getTransactionId(owners: string[] = null, tags: GraphQLTag[] = null, timestamp: IrysTimestamp = null): Promise<TransactionsIdAddress> {
        const graphQLClient = new GraphQLClient(this.endpointForTransactionId);
        const QUERY = gql`
            query($owners: [String!], $tags: [TagFilter!], $timestamp: TimestampFilter) {
                transactions(owners: $owners, tags: $tags, timestamp: $timestamp) {
                    edges {
                        node {
                            id,
                            address
                        }
                    }
                }
            }
        `;
        try {
            const variables = {
                owners: owners,
                tags: tags,
                timestamp: timestamp
            }
            const data: TransactionGQL = await graphQLClient.request(QUERY, variables);
            const listOfTransactions : NodeGQL[] = data.transactions.edges.map((edge: any) => edge.node);
            console.log("Transaction IDs retrieved")
            return { success: true, data: listOfTransactions };
        } catch (error) {
            console.error("Error fetching transaction IDs", error);
            return { success: false, data: [], error: "Error fetching transaction IDs" };
        }
    }

/**
 * Initializes the Irys uploader with the provided EVM wallet private key.
 * @returns {Promise<boolean>} A Promise that resolves to true if the initialization is successful, and false otherwise.
 */
    private async initializeIrysUploader(): Promise<boolean> {
        if (this.irysUploader) return true;
        if (!this.runtime) return false;

        try {
            const EVM_WALLET_PRIVATE_KEY = this.runtime.getSetting("EVM_WALLET_PRIVATE_KEY");
            if (!EVM_WALLET_PRIVATE_KEY) return false;

            const irysUploader = await Uploader(BaseEth).withWallet(EVM_WALLET_PRIVATE_KEY);
            this.irysUploader = irysUploader;
            return true;
        } catch (error) {
            console.error("Error initializing Irys uploader:", error);
            return false;
        }
    }

/**
 * Fetches data from a transaction ID using GraphQL endpoint.
 * @param {string} transactionId - The transaction ID to fetch data from.
 * @returns {Promise<DataIrysFetchedFromGQL>} The data fetched from the transaction ID.
 */
    private async fetchDataFromTransactionId(transactionId: string): Promise<DataIrysFetchedFromGQL> {
        console.log(`Fetching data from transaction ID: ${transactionId}`);
        const response = await fetch(`${this.endpointForData}/${transactionId}`);
        if (!response.ok) return { success: false, data: null, error: "Error fetching data from transaction ID" };
        return {
            success: true,
            data: response,
        };
    }
/**
 * Converts the input value into an array of values. If the input value is already an array,
 * it is returned as is. Otherwise, it is wrapped in an array before being returned.
 * 
 * @param {any} value - The input value to be converted
 * @returns {any[]} - An array of values
 */
    private converToValues(value: any): any[] {
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    }

/**
 * Orchestrates a request based on the input parameters.
 * @param {string} requestMessage - The message for the request.
 * @param {GraphQLTag[]} tags - The tags associated with the request.
 * @param {IrysTimestamp} [timestamp=null] - The optional timestamp for the request.
 * @returns {Promise<DataIrysFetchedFromGQL>} A promise that resolves to the fetched data from the GraphQL query.
 */
    private async orchestrateRequest(requestMessage: string, tags: GraphQLTag[], timestamp: IrysTimestamp = null): Promise<DataIrysFetchedFromGQL> {
        let serviceCategory = tags.find((tag) => tag.name == "Service-Category")?.values;
        let protocol = tags.find((tag) => tag.name == "Protocol")?.values;
        let minimumProviders = Number(tags.find((tag) => tag.name == "Minimum-Providers")?.values);
        /*
            Further implementation of the orchestrator
            { name: "Validation-Threshold", values: validationThreshold },
            { name: "Test-Provider", values: testProvider },
            { name: "Reputation", values: reputation },
        */
        const tagsToRetrieve : GraphQLTag[] = [
            { name: "Message-Type", values: [IrysMessageType.DATA_STORAGE] },
            { name: "Service-Category", values: this.converToValues(serviceCategory) },
            { name: "Protocol", values: this.converToValues(protocol) },
        ];
        const data = await this.getDataFromAnAgent(null, tagsToRetrieve, timestamp);
        if (!data.success) return { success: false, data: null, error: data.error };
        const dataArray = data.data as Array<any>;
        try {
            for (let i = 0; i < dataArray.length; i++) {
                const node = dataArray[i];
                const templateRequest = `
                Determine the truthfulness of the relationship between the given context and text.
                Context: ${requestMessage}
                Text: ${node.data}
                Return True or False
            `;
            const responseFromModel = await generateMessageResponse({
                runtime: this.runtime,
                context: templateRequest,
                modelClass: ModelClass.MEDIUM,
            });
            console.log("RESPONSE FROM MODEL : ", responseFromModel)
            if (!responseFromModel.success || ((responseFromModel.content?.toString().toLowerCase().includes('false')) && (!responseFromModel.content?.toString().toLowerCase().includes('true')))) {
                dataArray.splice(i, 1);
                    i--;
                }
            }
        } catch (error) {
            if (error.message.includes("TypeError: Cannot read properties of undefined (reading 'settings')")) {
                return { success: false, data: null, error: "Error in the orchestrator" };
            }
        }
        let responseTags: GraphQLTag[] = [
            { name: "Message-Type", values: [IrysMessageType.REQUEST_RESPONSE] },
            { name: "Service-Category", values: [serviceCategory] },
            { name: "Protocol", values: [protocol] },
            { name: "Request-Id", values: [tags.find((tag) => tag.name == "Request-Id")?.values[0]] },
        ];
        if (dataArray.length == 0) {
            const response = await this.uploadDataOnIrys("No relevant data found from providers", responseTags, IrysMessageType.REQUEST_RESPONSE);
            console.log("Response from Irys: ", response);
            return { success: false, data: null, error: "No relevant data found from providers" };
        }
        const listProviders = new Set(dataArray.map((provider: any) => provider.address));
        if (listProviders.size < minimumProviders) {
            const response = await this.uploadDataOnIrys("Not enough providers", responseTags, IrysMessageType.REQUEST_RESPONSE);
            console.log("Response from Irys: ", response);
            return { success: false, data: null, error: "Not enough providers" };
        }
        const listData = dataArray.map((provider: any) => provider.data);
        const response = await this.uploadDataOnIrys(listData, responseTags, IrysMessageType.REQUEST_RESPONSE);
        console.log("Response from Irys: ", response);
        return {
            success: true,
            data: listData
        }
    }

    // Orchestrator
/**
 * Uploads data to Irys platform with specified tags, message type, and optional timestamp.
 * 
 * @param data The data to be uploaded to Irys
 * @param tags An array of GraphQL tags to be associated with the data
 * @param messageType The type of message being sent to Irys
 * @param timestamp Optional timestamp for the data upload
 * @returns A promise that resolves to an UploadIrysResult object indicating success or failure of the upload
 */
    private async uploadDataOnIrys(data: any, tags: GraphQLTag[], messageType: IrysMessageType, timestamp: IrysTimestamp = null): Promise<UploadIrysResult> {
        if (!(await this.initializeIrysUploader())) {
            return {
                success: false,
                error: "Irys uploader not initialized",
            };
        }

        // Transform tags to the correct format
        const formattedTags = tags.map(tag => ({
            name: tag.name,
            value: Array.isArray(tag.values) ? tag.values.join(',') : tag.values
        }));

        const requestId = String(crypto.createHash('sha256').update(new Date().toISOString()).digest('hex'));
        formattedTags.push({
            name: "Request-Id",
            value: requestId
        });
        try {
            const dataToStore = {
                data: data,
            };
            const receipt = await this.irysUploader.upload(JSON.stringify(dataToStore), { tags: formattedTags });
            if (messageType == IrysMessageType.DATA_STORAGE || messageType == IrysMessageType.REQUEST_RESPONSE) {
                return { success: true, url: `https://gateway.irys.xyz/${receipt.id}`};
            } else if (messageType == IrysMessageType.REQUEST) {
                const response = await this.orchestrateRequest(data, tags, timestamp);
                return {
                    success: response.success,
                    url: `https://gateway.irys.xyz/${receipt.id}`,
                    data: response.data,
                    error: response.error ? response.error : null
                }

            }
            return { success: true, url: `https://gateway.irys.xyz/${receipt.id}` };
        } catch (error) {
            return { success: false, error: "Error uploading to Irys, " + error };
        }
    }

/**
 * Uploads a file or image on Irys with the provided data and tags.
 * 
 * @param {string} data - The data to be uploaded on Irys.
 * @param {GraphQLTag[]} tags - An array of GraphQLTag objects containing the tags for the uploaded file.
 * @returns {Promise<UploadIrysResult>} - A promise that resolves to an object containing the upload result (success or failure) and the URL of the uploaded file on Irys.
 */
    private async uploadFileOrImageOnIrys(data: string, tags: GraphQLTag[]): Promise<UploadIrysResult> {
        if (!(await this.initializeIrysUploader())) {
            return {
                success: false,
                error: "Irys uploader not initialized"
            };
        }

        const formattedTags = tags.map(tag => ({
            name: tag.name,
            value: Array.isArray(tag.values) ? tag.values.join(',') : tag.values
        }));

        try {
            const receipt = await this.irysUploader.uploadFile(data, { tags: formattedTags });
            return { success: true, url: `https://gateway.irys.xyz/${receipt.id}` };
        } catch (error) {
            return { success: false, error: "Error uploading to Irys, " + error };
        }
    }

/**
 * Normalizes the values in an array by ensuring each value is within a specified range.
 * @param {number[]} arr - The array of numbers to normalize.
 * @param {number} min - The minimum value that each element in the array should be.
 * @param {number} [max] - The maximum value that each element in the array should be (optional).
 * @returns {void}
 */
    private normalizeArrayValues(arr: number[], min: number, max?: number): void {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.max(min, max !== undefined ? Math.min(arr[i], max) : arr[i]);
        }
    }

/**
 * Function to normalize the size of an array.
 * If the input array has only one element, it returns that element.
 * If the input array has multiple elements, it returns the array as is.
 * @param {any[]} arr - The input array to normalize.
 * @returns {any} The normalized array size - either a single element or the original array.
 */
    private normalizeArraySize(arr: any[]): any {
        if (arr.length == 1) {
            return arr[0];
        }
        return arr;
    }

/**
 * Asynchronously uploads data to Irys platform.
 * 
 * @param {any} data - Data to be uploaded.
 * @param {IrysDataType} dataType - Type of data being uploaded (FILE, IMAGE, etc.).
 * @param {IrysMessageType} messageType - Type of message (REQUEST, RESPONSE, etc.).
 * @param {string[]} serviceCategory - Category of service for the data.
 * @param {string[]} protocol - Protocol used for uploading the data.
 * @param {number[]} validationThreshold - Array of validation thresholds (optional).
 * @param {number[]} minimumProviders - Array of minimum provider values (optional).
 * @param {boolean[]} testProvider - Array of boolean values for test providers (optional).
 * @param {number[]} reputation - Array of reputation values for providers (optional).
 * @returns {Promise<UploadIrysResult>} Result of the upload operation.
 */
       
    async workerUploadDataOnIrys(data: any, dataType: IrysDataType, messageType: IrysMessageType, serviceCategory: string[], protocol: string[], validationThreshold: number[] = [], minimumProviders: number[] = [], testProvider: boolean[] = [], reputation: number[] = []): Promise<UploadIrysResult> {
        this.normalizeArrayValues(validationThreshold, 0, 1);
        this.normalizeArrayValues(minimumProviders, 0);
        this.normalizeArrayValues(reputation, 0, 1);

        const tags = [
            { name: "Message-Type", values: messageType },
            { name: "Service-Category", values: this.normalizeArraySize(serviceCategory) },
            { name: "Protocol", values: this.normalizeArraySize(protocol) },
        ] as GraphQLTag[];

        if (messageType == IrysMessageType.REQUEST) {
            if (validationThreshold.length > 0) {
                tags.push({ name: "Validation-Threshold", values: this.normalizeArraySize(validationThreshold) });
            }
            if (minimumProviders.length > 0) {
                tags.push({ name: "Minimum-Providers", values: this.normalizeArraySize(minimumProviders) });
            }
            if (testProvider.length > 0) {
                tags.push({ name: "Test-Provider", values: this.normalizeArraySize(testProvider) });
            }
            if (reputation.length > 0) {
                tags.push({ name: "Reputation", values: this.normalizeArraySize(reputation) });
            }
        }
        if (dataType == IrysDataType.FILE || dataType == IrysDataType.IMAGE) {
            return await this.uploadFileOrImageOnIrys(data, tags);
        }

        return await this.uploadDataOnIrys(data, tags, messageType);
    }

/**
 * Uploads data on Irys platform with specified tags.
 * 
 * @param {any} data - The data to be uploaded.
 * @param {IrysDataType} dataType - The type of data being uploaded.
 * @param {string[]} serviceCategory - The service category tags.
 * @param {string[]} protocol - The protocol tags.
 * @returns {Promise<UploadIrysResult>} The result of the upload operation.
 */
    async providerUploadDataOnIrys(data: any, dataType: IrysDataType, serviceCategory: string[], protocol: string[]): Promise<UploadIrysResult> {
        const tags = [
            { name: "Message-Type", values: [IrysMessageType.DATA_STORAGE] },
            { name: "Service-Category", values: serviceCategory },
            { name: "Protocol", values: protocol },
        ] as GraphQLTag[];

        if (dataType == IrysDataType.FILE || dataType == IrysDataType.IMAGE) {
            return await this.uploadFileOrImageOnIrys(data, tags);
        }

        return await this.uploadDataOnIrys(data, tags, IrysMessageType.DATA_STORAGE);
    }

/**
 * Asynchronously fetches data from an agent using their wallet public keys, tags, and timestamp.
 * 
 * @param {string[]} agentsWalletPublicKeys - The wallet public keys of the agent to fetch data from.
 * @param {GraphQLTag[]} tags - The tags associated with the data to fetch.
 * @param {IrysTimestamp} timestamp - The timestamp to specify the data to fetch.
 * @returns {Promise<DataIrysFetchedFromGQL>} A promise that resolves to an object containing the fetched data.
 */
    async getDataFromAnAgent(agentsWalletPublicKeys: string[] = null, tags: GraphQLTag[] = null, timestamp: IrysTimestamp = null): Promise<DataIrysFetchedFromGQL> {
        try {
            const transactionIdsResponse = await this.getTransactionId(agentsWalletPublicKeys, tags, timestamp);
            if (!transactionIdsResponse.success) return { success: false, data: null, error: "Error fetching transaction IDs" };
            const transactionIdsAndResponse = transactionIdsResponse.data.map((node: NodeGQL) => node);
            const dataPromises: Promise<any>[] = transactionIdsAndResponse.map(async (node: NodeGQL) => {
                const fetchDataFromTransactionIdResponse = await this.fetchDataFromTransactionId(node.id);
                if (await fetchDataFromTransactionIdResponse.data.headers.get('content-type') == "application/octet-stream") {
                    let data = null;
                    const responseText = await fetchDataFromTransactionIdResponse.data.text();
                    try {
                        data = JSON.parse(responseText);
                    } catch (error) {
                        data = responseText;
                    }
                    return {
                        data: data,
                        address: node.address
                    }
                }
                else {
                    return {
                        data: fetchDataFromTransactionIdResponse.data.url,
                        address: node.address
                    }
                }
            });
            const data = await Promise.all(dataPromises);
            return { success: true, data: data };
        } catch (error) {
            return { success: false, data: null, error: "Error fetching data from transaction IDs " + error };
        }
    }
}

export default IrysService;