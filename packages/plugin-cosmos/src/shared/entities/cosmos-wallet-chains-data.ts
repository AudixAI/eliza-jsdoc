import { getChainByChainName } from "@chain-registry/utils";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { chains } from "chain-registry";
import { CosmosWallet } from "./cosmos-wallet";
import type {
    ICosmosPluginCustomChainData,
    ICosmosWalletChains,
    ICosmosWalletChainsData,
} from "../interfaces";
import { getAvailableChains } from "../helpers/cosmos-chains";

/**
 * Represents a collection of Cosmos wallets for different chains.
 * @implements { ICosmosWalletChains }
 */
export class CosmosWalletChains implements ICosmosWalletChains {
    public walletChainsData: ICosmosWalletChainsData = {};

/**
 * Constructor for creating an instance of the class.
 * @param {ICosmosWalletChainsData} walletChainsData - Data for Cosmos wallet chains
 */
    private constructor(walletChainsData: ICosmosWalletChainsData) {
        this.walletChainsData = walletChainsData;
    }

/**
 * Create Cosmos wallets for the specified mnemonic and available chains.
 * 
 * @param {string} mnemonic - The mnemonic used to generate the wallets.
 * @param {string[]} availableChainNames - The names of the available chains to create wallets for.
 * @param {ICosmosPluginCustomChainData["chainData"][]} [customChainsData] - Optional custom chain data.
 * @returns {Promise<CosmosWalletChains>} A Promise that resolves to a new instance of CosmosWalletChains.
 */
    public static async create(
        mnemonic: string,
        availableChainNames: string[],
        customChainsData?: ICosmosPluginCustomChainData["chainData"][]
    ) {
        const walletChainsData: ICosmosWalletChainsData = {};
        const availableChains = getAvailableChains(chains, customChainsData);

        for (const chainName of availableChainNames) {
            const chain = getChainByChainName(availableChains, chainName);

            if (!chain) {
                throw new Error(`Chain ${chainName} not found`);
            }

            const wallet = await CosmosWallet.create(
                mnemonic,
                chain.bech32_prefix,
                chain.apis.rpc[0].address
            );

            const chainRpcAddress = chain.apis?.rpc?.[0].address;

            if (!chainRpcAddress) {
                throw new Error(`RPC address not found for chain ${chainName}`);
            }

            const signingCosmWasmClient =
                await SigningCosmWasmClient.connectWithSigner(
                    chain.apis.rpc[0].address,
                    wallet.directSecp256k1HdWallet
                );

            walletChainsData[chainName] = {
                wallet,
                signingCosmWasmClient,
            };
        }

        return new CosmosWalletChains(walletChainsData);
    }

/**
 * Retrieve the wallet address for a specific blockchain chain.
 * @param {string} chainName - The name of the blockchain chain to retrieve the wallet address from.
 * @returns {Promise<string>} The wallet address for the specified blockchain chain.
 */
    public async getWalletAddress(chainName: string) {
        return await this.walletChainsData[chainName].wallet.getWalletAddress();
    }

/**
 * Retrieves the signing CosmWasm client for the specified chain name.
 * 
 * @param {string} chainName - The name of the chain to retrieve the signing CosmWasm client for.
 * @returns {*} The signing CosmWasm client for the specified chain name.
 */
    public getSigningCosmWasmClient(chainName: string) {
        return this.walletChainsData[chainName].signingCosmWasmClient;
    }
}
