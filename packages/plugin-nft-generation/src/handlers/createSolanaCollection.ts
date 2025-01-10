import { AwsS3Service } from "@elizaos/plugin-node";
import {
    composeContext,
    elizaLogger,
    generateImage,
    getEmbeddingZeroVector,
    IAgentRuntime,
    Memory,
    ServiceType,
    stringToUuid,
} from "@elizaos/core";
import {
    saveBase64Image,
    saveHeuristImage,
} from "@elizaos/plugin-image-generation";
import { PublicKey } from "@solana/web3.js";
import WalletSolana from "../provider/wallet/walletSolana.ts";
import { collectionImageTemplate } from "../templates.ts";

/**
 * Asynchronously creates metadata for a collection including uploading an image, generating a JSON file, and uploading it to AWS S3.
 * @param {Object} options - The options object
 * @param {IAgentRuntime} options.runtime - The agent runtime
 * @param {string} options.collectionName - The name of the collection
 * @param {number} [options.fee] - Optional fee for the collection
 * @returns {Promise<Object>} - The collection information with name, symbol, admin public key, fee, and uri
 */
export async function createCollectionMetadata({
    runtime,
    collectionName,
    fee,
}: {
    runtime: IAgentRuntime;
    collectionName: string;
    fee?: number;
}) {
    const userId = runtime.agentId;
    elizaLogger.log("User ID:", userId);
    const awsS3Service: AwsS3Service = runtime.getService(ServiceType.AWS_S3);
    const agentName = runtime.character.name;
    const roomId = stringToUuid("nft_generate_room-" + agentName);
    // Create memory for the message
    const memory: Memory = {
        agentId: userId,
        userId,
        roomId,
        content: {
            text: "",
            source: "nft-generator",
        },
        createdAt: Date.now(),
        embedding: getEmbeddingZeroVector(),
    };
    const state = await runtime.composeState(memory, {
        collectionName,
    });

    const prompt = composeContext({
        state,
        template: collectionImageTemplate,
    });
    const images = await generateImage(
        {
            prompt,
            width: 300,
            height: 300,
        },
        runtime
    );
    if (images.success && images.data && images.data.length > 0) {
        const image = images.data[0];
        const filename = `collection-image`;
        if (image.startsWith("http")) {
            elizaLogger.log("Generating image url:", image);
        }
        // Choose save function based on image data format
        const filepath = image.startsWith("http")
            ? await saveHeuristImage(image, filename)
            : saveBase64Image(image, filename);

        const logoPath = await awsS3Service.uploadFile(
            filepath,
            `/${collectionName}`,
            false
        );
        const adminPublicKey = runtime.getSetting("SOLANA_ADMIN_PUBLIC_KEY");
        const collectionInfo = {
            name: `${collectionName}`,
            symbol: `${collectionName.toUpperCase()[0]}`,
            adminPublicKey,
            fee: fee || 0,
            uri: "",
        };
        const jsonFilePath = await awsS3Service.uploadJson(
            {
                name: collectionInfo.name,
                description: `${collectionInfo.name}`,
                image: logoPath.url,
            },
            "metadata.json",
            `${collectionName}`
        );
        collectionInfo.uri = jsonFilePath.url;

        return collectionInfo;

    }

    return null;
}

/**
 * Create a Solana collection with the given collection name and optional fee.
 * 
 * @param {Object} params - The parameters for creating the Solana collection.
 * @param {IAgentRuntime} params.runtime - The runtime interface for the agent.
 * @param {string} params.collectionName - The name of the collection to be created.
 * @param {number} [params.fee] - The optional fee for the collection.
 * 
 * @returns {Object} - An object containing information about the created Solana collection, including network, address, link, and collectionInfo.
 *                   - Returns null if the collection info is not available.
 */
export async function createSolanaCollection({
    runtime,
    collectionName,
    fee,
}: {
    runtime: IAgentRuntime;
    collectionName: string;
    fee?: number;
}) {
    const collectionInfo = await createCollectionMetadata({
        runtime,
        collectionName,
        fee,
    });
    if (!collectionInfo) return null
    const publicKey = runtime.getSetting("SOLANA_PUBLIC_KEY");
    const privateKey = runtime.getSetting("SOLANA_PRIVATE_KEY");
    const wallet = new WalletSolana(new PublicKey(publicKey), privateKey);

    const collectionAddressRes = await wallet.createCollection({
        ...collectionInfo,
    });

    return {
        network: "solana",
        address: collectionAddressRes.address,
        link: collectionAddressRes.link,
        collectionInfo,
    };
}
