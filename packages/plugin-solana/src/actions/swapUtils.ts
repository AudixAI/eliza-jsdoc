import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
    BlockhashWithExpiryBlockHeight,
    Connection,
    Keypair,
    PublicKey,
    RpcResponseAndContext,
    SimulatedTransactionResponse,
    TokenAmount,
    VersionedTransaction,
} from "@solana/web3.js";
import { settings, elizaLogger } from "@elizaos/core";

const solAddress = settings.SOL_ADDRESS;
const SLIPPAGE = settings.SLIPPAGE;
const connection = new Connection(
    settings.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a given method after a delay of 150 milliseconds.
 * 
 * @template T
 * @param {(...args: any[]) => Promise<T>} method - The method to be executed after the delay
 * @param {...any} args - The arguments to be passed to the method
 * @returns {Promise<T>} A promise that resolves with the result of the method execution
 */
export async function delayedCall<T>(
    method: (...args: any[]) => Promise<T>,
    ...args: any[]
): Promise<T> {
    await delay(150);
    return method(...args);
}

/**
 * Retrieves the decimal value of a token based on its mint address.
 * 
 * @param {Connection} connection - The connection object used to interact with the Solana blockchain
 * @param {string} mintAddress - The address of the token's mint
 * @returns {Promise<number>} - The decimal value of the token
 * @throws {Error} - If unable to fetch token decimals
 */
export async function getTokenDecimals(
    connection: Connection,
    mintAddress: string
): Promise<number> {
    const mintPublicKey = new PublicKey(mintAddress);
    const tokenAccountInfo =
        await connection.getParsedAccountInfo(mintPublicKey);

    // Check if the data is parsed and contains the expected structure
    if (
        tokenAccountInfo.value &&
        typeof tokenAccountInfo.value.data === "object" &&
        "parsed" in tokenAccountInfo.value.data
    ) {
        const parsedInfo = tokenAccountInfo.value.data.parsed?.info;
        if (parsedInfo && typeof parsedInfo.decimals === "number") {
            return parsedInfo.decimals;
        }
    }

    throw new Error("Unable to fetch token decimals");
}

/**
 * Get a swap quote from the Jup.ag API based on the specified parameters.
 * 
 * @param {Connection} connection - The Solana blockchain connection.
 * @param {string} baseToken - The input token's mint address.
 * @param {string} outputToken - The output token's mint address.
 * @param {number} amount - The amount of input token to swap (in base units).
 * @returns {Promise<any>} - A promise that resolves to the swap transaction as a Uint8Array.
 */
export async function getQuote(
    connection: Connection,
    baseToken: string,
    outputToken: string,
    amount: number
): Promise<any> {
    const decimals = await getTokenDecimals(connection, baseToken);
    const adjustedAmount = amount * 10 ** decimals;

    const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${baseToken}&outputMint=${outputToken}&amount=${adjustedAmount}&slippageBps=50`
    );
    const swapTransaction = await quoteResponse.json();
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    return new Uint8Array(swapTransactionBuf);
}

/**
 * Executes a swap transaction depending on the specified type ("buy" or "sell").
 * @param {VersionedTransaction} transaction - The transaction to be executed.
 * @param {"buy" | "sell"} type - The type of transaction ("buy" or "sell").
 * @returns {Promise<string>} The signature of the executed transaction.
 */
export const executeSwap = async (
    transaction: VersionedTransaction,
    type: "buy" | "sell"
) => {
    try {
        const latestBlockhash: BlockhashWithExpiryBlockHeight =
            await delayedCall(connection.getLatestBlockhash.bind(connection));
        const signature = await connection.sendTransaction(transaction, {
            skipPreflight: false,
        });
        const confirmation = await connection.confirmTransaction(
            {
                signature,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                blockhash: latestBlockhash.blockhash,
            },
            "finalized"
        );
        if (confirmation.value.err) {
            elizaLogger.log("Confirmation error", confirmation.value.err);

            throw new Error("Confirmation error");
        } else {
            if (type === "buy") {
                elizaLogger.log(
                    "Buy successful: https://solscan.io/tx/${signature}"
                );
            } else {
                elizaLogger.log(
                    "Sell successful: https://solscan.io/tx/${signature}"
                );
            }
        }

        return signature;
    } catch (error) {
        elizaLogger.log(error);
    }
};

/**
 * Sell function to perform a token swap transaction.
 * 
 * @param {PublicKey} baseMint - The public key of the base token.
 * @param {Keypair} wallet - The key pair representing the wallet performing the transaction.
 * @returns {Promise<SimulatedTransactionResponse | null>} - The result of the transaction simulation or null if unsuccessful.
 */
export const Sell = async (baseMint: PublicKey, wallet: Keypair) => {
    try {
        const tokenAta = await delayedCall(
            getAssociatedTokenAddress,
            baseMint,
            wallet.publicKey
        );
        const tokenBalInfo: RpcResponseAndContext<TokenAmount> =
            await delayedCall(
                connection.getTokenAccountBalance.bind(connection),
                tokenAta
            );

        if (!tokenBalInfo) {
            elizaLogger.log("Balance incorrect");
            return null;
        }

        const tokenBalance = tokenBalInfo.value.amount;
        if (tokenBalance === "0") {
            elizaLogger.warn(
                `No token balance to sell with wallet ${wallet.publicKey}`
            );
        }

        const sellTransaction = await getSwapTxWithWithJupiter(
            wallet,
            baseMint,
            tokenBalance,
            "sell"
        );
        // simulate the transaction
        if (!sellTransaction) {
            elizaLogger.log("Failed to get sell transaction");
            return null;
        }

        const simulateResult: RpcResponseAndContext<SimulatedTransactionResponse> =
            await delayedCall(
                connection.simulateTransaction.bind(connection),
                sellTransaction
            );
        if (simulateResult.value.err) {
            elizaLogger.log("Sell Simulation failed", simulateResult.value.err);
            return null;
        }

        // execute the transaction
        return executeSwap(sellTransaction, "sell");
    } catch (error) {
        elizaLogger.log(error);
    }
};

/**
 * Buy function to execute a swap transaction to buy an asset.
 * 
 * @param {PublicKey} baseMint - The public key of the base mint.
 * @param {Keypair} wallet - The wallet keypair used for the transaction.
 * @returns {Promise<null|TransactionSignature>} Returns null if transaction fails or the transaction signature if successful.
 */
export const Buy = async (baseMint: PublicKey, wallet: Keypair) => {
    try {
        const tokenAta = await delayedCall(
            getAssociatedTokenAddress,
            baseMint,
            wallet.publicKey
        );
        const tokenBalInfo: RpcResponseAndContext<TokenAmount> =
            await delayedCall(
                connection.getTokenAccountBalance.bind(connection),
                tokenAta
            );

        if (!tokenBalInfo) {
            elizaLogger.log("Balance incorrect");
            return null;
        }

        const tokenBalance = tokenBalInfo.value.amount;
        if (tokenBalance === "0") {
            elizaLogger.warn(
                `No token balance to sell with wallet ${wallet.publicKey}`
            );
        }

        const buyTransaction = await getSwapTxWithWithJupiter(
            wallet,
            baseMint,
            tokenBalance,
            "buy"
        );
        // simulate the transaction
        if (!buyTransaction) {
            elizaLogger.log("Failed to get buy transaction");
            return null;
        }

        const simulateResult: RpcResponseAndContext<SimulatedTransactionResponse> =
            await delayedCall(
                connection.simulateTransaction.bind(connection),
                buyTransaction
            );
        if (simulateResult.value.err) {
            elizaLogger.log("Buy Simulation failed", simulateResult.value.err);
            return null;
        }

        // execute the transaction
        return executeSwap(buyTransaction, "buy");
    } catch (error) {
        elizaLogger.log(error);
    }
};

/**
 * Retrieves a swap transaction with Jupiter based on the specified parameters.
 * 
 * @param {Keypair} wallet - The wallet keypair used for the transaction.
 * @param {PublicKey} baseMint - The public key of the base mint for the transaction.
 * @param {string} amount - The amount to be swapped.
 * @param {"buy" | "sell"} type - The type of swap transaction, either "buy" or "sell".
 * @returns {Promise<Transaction>} The swap transaction based on the specified parameters.
 */
export const getSwapTxWithWithJupiter = async (
    wallet: Keypair,
    baseMint: PublicKey,
    amount: string,
    type: "buy" | "sell"
) => {
    try {
        switch (type) {
            case "buy":
                return fetchBuyTransaction(wallet, baseMint, amount);
            case "sell":
                return fetchSellTransaction(wallet, baseMint, amount);
            default:
                return fetchSellTransaction(wallet, baseMint, amount);
        }
    } catch (error) {
        elizaLogger.log(error);
    }
};

/**
 * Fetches a buy transaction for a given wallet, base mint, and amount.
 *
 * @param {Keypair} wallet - The wallet keypair used for the transaction.
 * @param {PublicKey} baseMint - The base mint Public Key.
 * @param {string} amount - The amount for the transaction.
 * @returns {Transaction | null} The buy transaction if successful, otherwise null.
 */
export const fetchBuyTransaction = async (
    wallet: Keypair,
    baseMint: PublicKey,
    amount: string
) => {
    try {
        const quoteResponse = await (
            await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${solAddress}&outputMint=${baseMint.toBase58()}&amount=${amount}&slippageBps=${SLIPPAGE}`
            )
        ).json();
        const { swapTransaction } = await (
            await fetch("https://quote-api.jup.ag/v6/swap", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 100000,
                }),
            })
        ).json();
        if (!swapTransaction) {
            elizaLogger.log("Failed to get buy transaction");
            return null;
        }

        // deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        const transaction =
            VersionedTransaction.deserialize(swapTransactionBuf);

        // sign the transaction
        transaction.sign([wallet]);
        return transaction;
    } catch (error) {
        elizaLogger.log("Failed to get buy transaction", error);
        return null;
    }
};

/**
 * Fetches the sell transaction for a specified amount using the provided wallet keypair, base mint, and slippage.
 * 
 * @param {Keypair} wallet - The wallet keypair used to sign the transaction.
 * @param {PublicKey} baseMint - The base mint for the transaction.
 * @param {string} amount - The amount to be sold.
 * @returns {Promise<VersionedTransaction | null>} - The signed sell transaction or null if an error occurs.
 */
export const fetchSellTransaction = async (
    wallet: Keypair,
    baseMint: PublicKey,
    amount: string
) => {
    try {
        const quoteResponse = await (
            await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${baseMint.toBase58()}&outputMint=${solAddress}&amount=${amount}&slippageBps=${SLIPPAGE}`
            )
        ).json();

        // get serialized transactions for the swap
        const { swapTransaction } = await (
            await fetch("https://quote-api.jup.ag/v6/swap", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 52000,
                }),
            })
        ).json();
        if (!swapTransaction) {
            elizaLogger.log("Failed to get sell transaction");
            return null;
        }

        // deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        const transaction =
            VersionedTransaction.deserialize(swapTransactionBuf);

        // sign the transaction
        transaction.sign([wallet]);
        return transaction;
    } catch (error) {
        elizaLogger.log("Failed to get sell transaction", error);
        return null;
    }
};
