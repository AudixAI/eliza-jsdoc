import { Account, starknetId } from "starknet";

export const isStarkDomain = (domain: string): boolean => {
    return /^(?:[a-z0-9-]{1,48}(?:[a-z0-9-]{1,48}[a-z0-9-])?\.)*[a-z0-9-]{1,48}\.stark$/.test(
        domain
    );
};

export const getAddressFromName = async (
    account: Account,
    name: string
): Promise<string> => {
    const address = await account.getAddressFromStarkName(name);
    if (!address.startsWith("0x") || address === "0x0") {
        throw new Error("Invalid address");
    }
    return address;
};

/**
 * Function to generate a transfer subdomain call for transferring a subdomain to a recipient.
 * @param {string} account - The account address initiating the transfer.
 * @param {string} domain - The domain of the subdomain being transferred.
 * @param {string} recipient - The account address of the recipient.
 * @returns {Object[]} An array of objects representing the transfer subdomain call, including contract address, entrypoint, and calldata.
 */
export const getTransferSubdomainCall = (
    account: string,
    domain: string,
    recipient: string
) => {
    const namingContract = process.env.STARKNETID_NAMING_CONTRACT;
    const identityContract = process.env.STARKNETID_IDENTITY_CONTRACT;
    const newTokenId: number = Math.floor(Math.random() * 1000000000000);
    const domainParts = domain.replace(".stark", "").split(".");

    const encodedDomain: string[] = domainParts.map((d) =>
        starknetId.useEncoded(d).toString(10)
    );

    return [
        {
            contractAddress: identityContract,
            entrypoint: "mint",
            calldata: [newTokenId],
        },
        {
            contractAddress: namingContract,
            entrypoint: "transfer_domain",
            calldata: [domainParts.length, ...encodedDomain, newTokenId],
        },
        {
            contractAddress: identityContract,
            entrypoint: "transfer_from",
            calldata: [account, recipient, newTokenId, 0],
        },
    ];
};
