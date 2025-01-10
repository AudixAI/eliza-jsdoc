import PinataClient from "@pinata/sdk";

/**
 * Uploads a JSON object to IPFS using Pinata client.
 * 
 * @param {PinataClient} pinata - The Pinata client for interacting with Pinata API.
 * @param {any} jsonMetadata - The JSON object to be uploaded to IPFS.
 * @returns {Promise<string>} The IPFS hash of the uploaded JSON object.
 */
export async function uploadJSONToIPFS(
    pinata: PinataClient,
    jsonMetadata: any
): Promise<string> {
    const { IpfsHash } = await pinata.pinJSONToIPFS(jsonMetadata);
    return IpfsHash;
}
