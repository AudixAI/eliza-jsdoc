import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load OpenZeppelin contract source code
/**
 * Load the OpenZeppelin contract file from the specified path.
 *
 * @param {string} contractPath - The path to the OpenZeppelin contract file.
 * @returns {string} The content of the OpenZeppelin contract file as a UTF-8 encoded string.
 */
export function loadOpenZeppelinFile(contractPath) {
    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const __dirname = path.dirname(__filename); // get the name of the directory

    const fullPath = path.resolve(__dirname, '../../../', "node_modules", contractPath);
    return fs.readFileSync(fullPath, "utf8");
}

// Dynamic import callback for Solidity
/**
 * Function that resolves imports based on the import path.
 * If the import path starts with "@openzeppelin/", it will load the OpenZeppelin file.
 * Otherwise, it will return an error message stating that the file was not found.
 *
 * @param {string} importPath - The import path to resolve.
 * @returns {object} - An object with either the contents of the loaded file or an error message.
 */ 

export function importResolver(importPath) {
    if (importPath.startsWith("@openzeppelin/")) {
        return {
            contents: loadOpenZeppelinFile(importPath),
        };
    }
    return { error: "File not found" };
}

// Compile contract with custom import callback
/**
 * Compiles Solidity source code with specified contract name and returns ABI, bytecode, and metadata.
 * @param {string} contractName - The name of the contract to compile.
 * @param {string} sourceCode - The Solidity source code of the contract.
 * @returns {object} An object containing the compiled contract's ABI, bytecode, and metadata.
 */
export function compileWithImports(contractName, sourceCode) {
    const input = {
        language: "Solidity",
        sources: {
            [`${contractName}.sol`]: {
                content: sourceCode,
            },
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": ["*"],
                },
            },
        },
    };

    const output = JSON.parse(
        solc.compile(JSON.stringify(input), { import: importResolver })
    );

    if (output.errors) {
        output.errors.forEach((err) => console.error(err));
    }
    const contractFile = output.contracts[`${contractName}.sol`][`${contractName}`];

    const metadata = JSON.parse(contractFile.metadata);
    return {
        abi: contractFile.abi,
        bytecode: contractFile.evm.bytecode.object,
        metadata
    };
}
