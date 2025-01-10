import NodeCache from "node-cache";
import {
    Cluster,
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
} from "@solana/web3.js";
import {
    createNft,
    findMetadataPda,
    mplTokenMetadata,
    fetchDigitalAsset,
    updateV1,
    verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    generateSigner,
    keypairIdentity,
    percentAmount,
    publicKey,
    // sol,
    TransactionBuilder,
    Umi,
} from "@metaplex-foundation/umi";
import { getExplorerLink } from "@solana-developers/helpers";
// import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import bs58 from "bs58";
import { elizaLogger } from "@elizaos/core";

/**
 * Represents a Solana wallet used for interacting with Solana blockchain.
 * @class
 */
export class WalletSolana {
    private cache: NodeCache;
    private umi: Umi;
    private cluster: Cluster;

/**
 * Constructor for Wallet class.
 * @param {PublicKey} walletPublicKey - The public key of the wallet.
 * @param {string} walletPrivateKeyKey - The private key of the wallet.
 * @param {Connection} [connection] - The connection to use (optional).
 */
    constructor(
        private walletPublicKey: PublicKey,
        private walletPrivateKeyKey: string,
        private connection?: Connection
    ) {
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes

        if (!connection) {
            this.cluster = (process.env.SOLANA_CLUSTER as Cluster) || "devnet";
            this.connection = new Connection(clusterApiUrl(this.cluster), {
                commitment: "finalized",
            });
        }
        const umi = createUmi(this.connection.rpcEndpoint);
        umi.use(mplTokenMetadata());
        const umiUser = umi.eddsa.createKeypairFromSecretKey(
            this.privateKeyUint8Array
        );
        umi.use(keypairIdentity(umiUser));
        this.umi = umi;
    }

/**
 * Fetches a digital asset using the specified address.
 * 
 * @param {string} address - The address of the digital asset.
 * @returns {Promise} - A promise that resolves with the fetched digital asset.
 */
    async fetchDigitalAsset (address: string) {
        return fetchDigitalAsset(this.umi, publicKey(address))
    }
/**
 * Asynchronously fetches the balance for a wallet using the specified wallet public key.
 * @returns {Object} An object containing the balance value and its converted format in SOL.
 */
    async getBalance() {
        const balance = await this.connection.getBalance(this.walletPublicKey);
        return {
            value: balance,
            formater: `${balance / LAMPORTS_PER_SOL} SOL`,
        };
    }

/**
 * Returns the private key as a Uint8Array after decoding it from Base58 encoding.
 */
    get privateKeyUint8Array() {
        return bs58.decode(this.walletPrivateKeyKey);
    }

/**
 * Asynchronously creates a new collection with the provided parameters.
 * 
 * @param {Object} param0 - Parameters for creating the collection.
 * @param {string} param0.name - The name of the collection.
 * @param {string} param0.symbol - The symbol for the collection.
 * @param {string} param0.adminPublicKey - The public key of the admin user.
 * @param {string} param0.uri - The URI for the collection.
 * @param {number} param0.fee - The fee amount for the collection.
 * 
 * @returns {Promise<{ success: boolean, link: string, address: string, error: string | null }>} A promise that resolves to an object with the success status, link to the collection address, collection address, and any potential error message.
 */
    async createCollection({
        name,
        symbol,
        adminPublicKey,
        uri,
        fee,
    }: {
        name: string;
        symbol: string;
        adminPublicKey: string;
        uri: string;
        fee: number;
    }): Promise<{
        success: boolean;
        link: string;
        address: string;
        error?: string | null;
    }> {
        try {
            const collectionMint = generateSigner(this.umi);
            let transaction = new TransactionBuilder();
            const info = {
                name,
                symbol,
                uri,
            };
            transaction = transaction.add(
                createNft(this.umi, {
                    ...info,
                    mint: collectionMint,
                    sellerFeeBasisPoints: percentAmount(fee),
                    isCollection: true,
                })
            );

            transaction = transaction.add(
                updateV1(this.umi, {
                    mint: collectionMint.publicKey,
                    newUpdateAuthority: publicKey(adminPublicKey), // updateAuthority's public key
                })
            );

            await transaction.sendAndConfirm(this.umi, {
                confirm: {},
            });

            const address = collectionMint.publicKey;
            return {
                success: true,
                link: getExplorerLink("address", address, this.cluster),
                address,
                error: null,
            };
        } catch (e) {
            return {
                success: false,
                link: "",
                address: "",
                error: e.message,
            };
        }
    }

/**
 * Creates and mints a new NFT on the blockchain.
 *
 * @param {string} collectionAddress - The address of the NFT collection.
 * @param {string} adminPublicKey - The public key of the admin.
 * @param {string} name - The name of the NFT.
 * @param {string} symbol - The symbol of the NFT.
 * @param {string} uri - The URI of the NFT.
 * @param {number} fee - The fee to be charged for the NFT.
 * @returns {Promise<{ success: boolean, link: string, address: string, error: string | null }>} The result of the minting process.
 */
    async mintNFT({
        collectionAddress,
        adminPublicKey,
        name,
        symbol,
        uri,
        fee,
    }: {
        collectionAddress: string;
        adminPublicKey: string;
        name: string;
        symbol: string;
        uri: string;
        fee: number;
    }): Promise<{
        success: boolean;
        link: string;
        address: string;
        error?: string | null;
    }> {
        try {
            const umi = this.umi;
            const mint = generateSigner(umi);

            let transaction = new TransactionBuilder();
            elizaLogger.log("collection address", collectionAddress);
            const collectionAddressKey = publicKey(collectionAddress);

            const info = {
                name,
                uri,
                symbol,
            };
            transaction = transaction.add(
                createNft(umi, {
                    mint,
                    ...info,
                    sellerFeeBasisPoints: percentAmount(fee),
                    collection: {
                        key: collectionAddressKey,
                        verified: false,
                    },
                })
            );

            transaction = transaction.add(
                updateV1(umi, {
                    mint: mint.publicKey,
                    newUpdateAuthority: publicKey(adminPublicKey), // updateAuthority's public key
                })
            );

            await transaction.sendAndConfirm(umi);

            const address = mint.publicKey;
            return {
                success: true,
                link: getExplorerLink("address", address, this.cluster),
                address,
                error: null,
            };
        } catch (e) {
            return {
                success: false,
                link: "",
                address: "",
                error: e.message,
            };
        }
    }

/**
 * Verifies if an NFT belongs to a specific collection.
 * 
 * @param {object} param0 - The input parameters
 * @param {string} param0.collectionAddress - The address of the collection
 * @param {string} param0.nftAddress - The address of the NFT
 * @returns {Promise<{ isVerified: boolean, error: string | null }>} An object containing the verification result and optional error message
 */
    async verifyNft({
        collectionAddress,
        nftAddress,
    }: {
        collectionAddress: string;
        nftAddress: string;
    }): Promise<{
        isVerified: boolean;
        error: string | null;
    }> {
        try {
            const umi = this.umi;
            const collectionAddressKey = publicKey(collectionAddress);
            const nftAddressKey = publicKey(nftAddress);

            let transaction = new TransactionBuilder();
            transaction = transaction.add(
                verifyCollectionV1(umi, {
                    metadata: findMetadataPda(umi, { mint: nftAddressKey }),
                    collectionMint: collectionAddressKey,
                    authority: umi.identity,
                })
            );

            await transaction.sendAndConfirm(umi);

            elizaLogger.log(
                `✅ NFT ${nftAddress} verified as member of collection ${collectionAddress}! See Explorer at ${getExplorerLink(
                    "address",
                    nftAddress,
                    this.cluster
                )}`
            );
            return {
                isVerified: true,
                error: null,
            };
        } catch (e) {
            return {
                isVerified: false,
                error: e.message,
            };
        }
    }
}

export default WalletSolana;
