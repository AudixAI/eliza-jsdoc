import { encodeAbiParameters } from "viem";
import { fileURLToPath } from "url";
import { compileWithImports } from "./generateERC721ContractCode.ts";
import path from "path";
import fs from "fs";
import CustomERC721 from "../contract/CustomERC721.sol"

// 动态生成 ERC-721 合约代码
/**
 * Generates ERC721 contract code by replacing the placeholder 'NFTContractName' with the provided NFT contract name.
 * 
 * @param {string} NFTContractName - The name of the NFT contract to be inserted into the ERC721 contract code.
 * @returns {string} - The ERC721 contract code with the NFT contract name inserted.
 */
export function generateERC721ContractCode(NFTContractName) {
    return CustomERC721.replace("NFTContractName", NFTContractName)
}

// 使用 Solidity 编译器生成 ABI 和 Bytecode
/**
 * Compiles a contract with the given name and source code.
 * @param {string} contractName - The name of the contract to be compiled.
 * @param {string} sourceCode - The source code of the contract to be compiled.
 * @returns {Object} Object containing ABI, bytecode, and metadata of the compiled contract.
 */
export function compileContract(contractName, sourceCode) {
    const res = compileWithImports(contractName, sourceCode);
    const { abi, bytecode, metadata } = res;
    return { abi, bytecode, metadata };
}

// 部署合约
/**
 * Deploys a contract using the provided wallet client and public client.
 * 
 * @param {Object} params - The parameters for deploying the contract.
 * @param {Object} params.walletClient - The wallet client used for deploying the contract.
 * @param {Object} params.publicClient - The public client used for waiting for the transaction receipt.
 * @param {string} params.abi - The ABI of the contract.
 * @param {string} params.bytecode - The bytecode of the contract.
 * @param {Array} params.args - The arguments to be passed to the contract constructor.
 * @returns {string} The address where the contract has been deployed.
 */
export async function deployContract({
    walletClient,
    publicClient,
    abi,
    bytecode,
    args,
}) {
    console.log("Deploying contract...");

    const txHash = await walletClient.deployContract({
        abi,
        bytecode,
        args,
    });

    console.log(`Deployment transaction hash: ${txHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
    });
    console.log(`Contract deployed at address: ${receipt.contractAddress}`);
    return receipt.contractAddress;
}

// 调用 mint 方法
/**
 * Mint an NFT by writing a contract transaction on the blockchain using walletClient and publicClient.
 * @param {Object} options - The options object.
 * @param {any} options.contractAddress - The address of the contract to interact with.
 * @param {any} options.abi - The ABI of the contract.
 * @param {any} options.recipient - The address of the NFT recipient.
 * @param {any} options.walletClient - The client used to interact with the wallet.
 * @param {any} options.publicClient - The client used to interact with the public blockchain.
 * @returns {Promise<any>} Returns a promise that resolves to the transaction receipt after minting the NFT.
 */
export async function mintNFT({
    walletClient,
    publicClient,
    contractAddress,
    abi,
    recipient,
}: {
    contractAddress: any;
    abi: any;
    recipient: any;
    walletClient: any;
    publicClient: any;
}) {
    console.log("Minting NFT...");
    const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: "mint",
        args: [recipient],
    });

    console.log(`Mint transaction hash: ${txHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
    });
    console.log("Mint successful!");
    return receipt;
}

// 编码构造函数参数
/**
 * Encodes the constructor arguments for a contract based on the given ABI and arguments array.
 * 
 * @param {Array} abi - The ABI array containing the input parameters for the constructor.
 * @param {Array} args - The arguments array to be encoded.
 * @returns {String} - The encoded constructor arguments data.
 */
export function encodeConstructorArguments(abi, args) {
    const argsData = encodeAbiParameters(abi[0].inputs, args);

    return argsData.slice(2);
}
