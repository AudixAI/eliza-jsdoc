import axios from "axios";
import {
    loadOpenZeppelinFile,
} from "./generateERC721ContractCode.ts";

/**
 * Retrieves the sources for a given metadata and source code.
 * @param {Object} metadata - The metadata containing compilation target and sources.
 * @param {string} sourceCode - The source code to be retrieved.
 * @returns {Object} - An object containing the sources with file names as keys and content as values.
 */
function getSources(metadata, sourceCode) {
    const fileName = Object.keys(metadata.settings.compilationTarget)[0]
    const obj = {
        [fileName]: {
            content: sourceCode,
        },
    };
    const keys = Object.keys(metadata.sources);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== fileName) {
            obj[key] = {
                content: loadOpenZeppelinFile(key),
            };
        }
    }
    return obj;
}

/**
 * Verifies an EVM contract on a provided API endpoint.
 * 
 * @param {object} param0 - The parameters for contract verification.
 * @param {string} param0.contractAddress - The address of the contract to verify.
 * @param {string} param0.sourceCode - The source code of the contract.
 * @param {object} param0.metadata - Metadata for the contract including compiler version and settings.
 * @param {string} [param0.constructorArgs=""] - Optional constructor arguments for the contract.
 * @param {string} param0.apiEndpoint - The API endpoint for contract verification.
 * 
 * @returns {Promise<object>} - A Promise that resolves with the verification status of the contract.
 * @throws {Error} - Throws an error if the verification process fails.
 */
export async function verifyEVMContract({
    contractAddress,
    sourceCode,
    metadata,
    constructorArgs = "",
                                            apiEndpoint
}) {
    const verificationData = {
        module: "contract",
        action: "verifysourcecode",
        sourceCode: JSON.stringify({
            language: "Solidity",
            sources: getSources(metadata, sourceCode),
            settings: {
                optimizer: {
                    enabled: metadata.settings.optimizer?.enabled,
                    runs: metadata.settings.optimizer?.runs,
                },
            },
        }),
        codeformat: "solidity-standard-json-input",
        contractaddress: contractAddress,
        contractname: "test",
        compilerversion: `v${metadata.compiler.version}`,
        optimizationUsed: metadata.settings.optimizer?.enabled ? 1 : 0,
        runs: metadata.settings.optimizer?.runs || 200,
        constructorArguements: constructorArgs, // Remove '0x' prefix
    };

    try {
        const response = await axios.post(apiEndpoint, verificationData);
        if (response.data.status === "1") {
            const guid = response.data.result;

            // Check verification status
            const checkStatus = async () => {
                const statusResponse = await axios.get(apiEndpoint, {
                    params: {
                        module: "contract",
                        action: "checkverifystatus",
                        guid: guid,
                    },
                });
                return statusResponse.data;
            };

            // Poll for completion
            let status;
            do {
                await new Promise((resolve) => setTimeout(resolve, 3000));
                status = await checkStatus();
            } while (status.result === "Pending in queue");

            return status;
        }
        return response.data;
    } catch (error) {
        throw new Error(`Verification failed: ${error.message}`);
    }
}
