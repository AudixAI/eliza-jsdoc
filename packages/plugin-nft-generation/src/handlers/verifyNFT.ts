import { IAgentRuntime } from "@elizaos/core";
import { PublicKey } from "@solana/web3.js";
import WalletSolana from "../provider/wallet/walletSolana.ts";

/**
 * Verifies the ownership of an NFT.
 *
 * @param {Object} params - The parameters for verifying the NFT ownership.
 * @param {IAgentRuntime} params.runtime - The runtime environment.
 * @param {string} params.collectionAddress - The address of the NFT collection.
 * @param {string} params.NFTAddress - The address of the NFT.
 * @returns {Object} An object indicating the success of the verification process.
 */
export async function verifyNFT({
    runtime,
    collectionAddress,
    NFTAddress,
}: {
    runtime: IAgentRuntime;
    collectionAddress: string;
    NFTAddress: string;
}) {
    const adminPublicKey = runtime.getSetting("SOLANA_ADMIN_PUBLIC_KEY");
    const adminPrivateKey = runtime.getSetting("SOLANA_ADMIN_PRIVATE_KEY");
    const adminWallet = new WalletSolana(
        new PublicKey(adminPublicKey),
        adminPrivateKey
    );
    await adminWallet.verifyNft({
        collectionAddress,
        nftAddress: NFTAddress,
    });
    return {
        success: true,
    };
}
