import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { cosmos } from "interchain";
import type { ICosmosWallet } from "../interfaces";

/**
 * Definition of RPCQueryClient type that represents the awaited result of creating an RPC query client using the cosmos.ClientFactory.
 */
type RPCQueryClient = Awaited<
    ReturnType<typeof cosmos.ClientFactory.createRPCQueryClient>
>;

/**
 * Class representing a Cosmos wallet that interacts with the Cosmos blockchain.
 * * @class
 */
export class CosmosWallet implements ICosmosWallet {
    public rpcQueryClient: RPCQueryClient;
    public directSecp256k1HdWallet: DirectSecp256k1HdWallet;

/**
 * Constructor for creating a new instance of MyClass.
 * 
 * @param {DirectSecp256k1HdWallet} directSecp256k1HdWallet - The directSecp256k1HdWallet to be used.
 * @param {RPCQueryClient} rpcQueryClient - The rpcQueryClient to be used.
 */
    private constructor(
        directSecp256k1HdWallet: DirectSecp256k1HdWallet,
        rpcQueryClient: RPCQueryClient
    ) {
        this.directSecp256k1HdWallet = directSecp256k1HdWallet;
        this.rpcQueryClient = rpcQueryClient;
    }

/**
 * Creates a new CosmosWallet instance using the provided mnemonic, chain prefix, and RPC endpoint.
 * @param {string} mnemonic - The mnemonic phrase used to generate the wallet.
 * @param {string} chainPrefix - The chain prefix for the wallet.
 * @param {string} rpcEndpoint - The RPC endpoint for the network.
 * @returns {Promise<CosmosWallet>} A Promise that resolves to a new CosmosWallet instance.
 */
    public static async create(
        mnemonic: string,
        chainPrefix: string,
        rpcEndpoint: string
    ) {
        const directSecp256k1HdWallet =
            await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                prefix: chainPrefix,
            });

        const rpcQueryClient = await cosmos.ClientFactory.createRPCQueryClient({
            rpcEndpoint,
        });

        return new CosmosWallet(directSecp256k1HdWallet, rpcQueryClient);
    }

/**
 * Asynchronously retrieves the wallet address from the directSecp256k1HdWallet.
 * 
 * @returns {Promise<string>} The wallet address obtained from the directSecp256k1HdWallet.
 */
    public async getWalletAddress() {
        const [account] = await this.directSecp256k1HdWallet.getAccounts();

        return account.address;
    }

/**
 * Asynchronously retrieves the balances of all tokens held in the user's wallet.
 * 
 * @returns {Promise<object[]>} An array of balance objects representing the balances of all tokens in the wallet.
 */
    public async getWalletBalances() {
        const walletAddress = await this.getWalletAddress();

        const allBalances =
            await this.rpcQueryClient.cosmos.bank.v1beta1.allBalances({
                address: walletAddress,
            });

        return allBalances.balances;
    }
}
