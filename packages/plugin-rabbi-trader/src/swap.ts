import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

/**
* Interface representing the parameters needed for a swap transaction.
* @typedef {object} SwapParams
* @property {string} fromToken - The token to swap from.
* @property {string} toToken - The token to swap to.
* @property {number} amount - The amount of tokens to swap.
* @property {number} slippage - The maximum acceptable slippage percentage.
* @property {string} [swapMode=ExactIn] - The swap mode, either "ExactIn" or "ExactOut". Default is "ExactIn".
*/
export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: number;
  slippage: number;
  swapMode?: "ExactIn" | "ExactOut";
}

/**
 * Executes a swap transaction on the Solana blockchain.
 * @param {Connection} connection - Connection object to communicate with the Solana blockchain.
 * @param {PublicKey} walletPubkey - Public key of the owner wallet.
 * @param {SwapParams} params - Parameters for the swap transaction.
 * @returns {Promise<{ signature: string }>} Object containing the signature of the transaction.
 */
export async function executeSwap(
  connection: Connection,
  walletPubkey: PublicKey,
  params: SwapParams,
): Promise<{ signature: string }> {
  // Create transaction
  const tx = new Transaction();

  // Add swap instruction
  const swapIx = await createSwapInstruction(connection, walletPubkey, params);
  tx.add(swapIx);

  // Get recent blockhash
  const { blockhash } = await connection.getRecentBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = walletPubkey;

  // Send and confirm transaction
  const signature = await connection.sendTransaction(tx, []);
  await connection.confirmTransaction(signature);

  return { signature };
}

/**
 * Create a swap instruction for transferring tokens.
 * 
 * @param connection - The connection to the Solana blockchain.
 * @param walletPubkey - The public key of the wallet initiating the swap.
 * @param params - The parameters for the swap transaction.
 * @returns A Promise that resolves to a TransactionInstruction for the swap transaction.
 */
export async function createSwapInstruction(
  connection: Connection,
  walletPubkey: PublicKey,
  params: SwapParams,
): Promise<TransactionInstruction> {
  // For now, just create a simple SOL transfer instruction
  return SystemProgram.transfer({
    fromPubkey: walletPubkey,
    toPubkey: new PublicKey(params.toToken),
    lamports: params.amount * LAMPORTS_PER_SOL,
  });
}

/**
 * Retrieves the token account for a specified wallet public key and mint.
 * For SOL transfers, just return the wallet public key.
 * 
 * @param {Connection} connection - Connection to the Solana blockchain
 * @param {PublicKey} walletPubkey - Public key of the wallet
 * @param {PublicKey} mint - Public key of the mint
 * @returns {Promise<PublicKey>} - The token account public key
 */
export async function getTokenAccount(
  connection: Connection,
  walletPubkey: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  // For SOL transfers, just return the wallet pubkey
  return walletPubkey;
}
