import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { elizaLogger } from "@elizaos/core";

/**
 * Retrieves the current price of a token in SOL (Solana) from the specified API.
 * 
 * @param {string} tokenSymbol - The symbol of the token to retrieve the price for.
 * @returns {Promise<number>} The current price of the token in SOL.
 */
export async function getTokenPriceInSol(tokenSymbol: string): Promise<number> {
    const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${tokenSymbol}`
    );
    const data = await response.json();
    return data.data[tokenSymbol].price;
}

/**
 * Get the balance of a specific token for a given wallet public key.
 * @param {Connection} connection - The connection to the Solana blockchain.
 * @param {PublicKey} walletPublicKey - The public key of the wallet.
 * @param {PublicKey} tokenMintAddress - The address of the token mint.
 * @returns {Promise<number>} The balance of the token in the wallet.
 */
async function getTokenBalance(
    connection: Connection,
    walletPublicKey: PublicKey,
    tokenMintAddress: PublicKey
): Promise<number> {
    const tokenAccountAddress = await getAssociatedTokenAddress(
        tokenMintAddress,
        walletPublicKey
    );

    try {
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        const tokenAmount = tokenAccount.amount as unknown as number;
        return tokenAmount;
    } catch (error) {
        elizaLogger.error(
            `Error retrieving balance for token: ${tokenMintAddress.toBase58()}`,
            error
        );
        return 0;
    }
}

/**
 * Retrieves the balances of different tokens for a given wallet.
 * 
 * @param {Connection} connection - The connection object to interact with the Solana blockchain.
 * @param {PublicKey} walletPublicKey - The public key of the wallet for which to retrieve token balances.
 * @returns {Promise<{ [tokenName: string]: number }>} An object containing the balances of tokens with their corresponding token names.
 */
async function getTokenBalances(
    connection: Connection,
    walletPublicKey: PublicKey
): Promise<{ [tokenName: string]: number }> {
    const tokenBalances: { [tokenName: string]: number } = {};

    // Add the token mint addresses you want to retrieve balances for
    const tokenMintAddresses = [
        new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
        new PublicKey("So11111111111111111111111111111111111111112"), // SOL
        // Add more token mint addresses as needed
    ];

    for (const mintAddress of tokenMintAddresses) {
        const tokenName = getTokenName(mintAddress);
        const balance = await getTokenBalance(
            connection,
            walletPublicKey,
            mintAddress
        );
        tokenBalances[tokenName] = balance;
    }

    return tokenBalances;
}

/**
 * Returns the token name corresponding to the provided mint address.
 * @param {PublicKey} mintAddress The mint address of the token
 * @returns {string} The token name associated with the mint address, or "Unknown Token" if no match is found
 */
function getTokenName(mintAddress: PublicKey): string {
    // Implement a mapping of mint addresses to token names
    const tokenNameMap: { [mintAddress: string]: string } = {
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
        So11111111111111111111111111111111111111112: "SOL",
        // Add more token mint addresses and their corresponding names
    };

    return tokenNameMap[mintAddress.toBase58()] || "Unknown Token";
}

export { getTokenBalance, getTokenBalances };
