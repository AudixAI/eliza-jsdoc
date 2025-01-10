import type { AssetList } from "@chain-registry/types";

/**
 * Returns a list of available assets by filtering out the ones that are present in the customAssets list.
 * @param {AssetList[]} assets - The list of all assets.
 * @param {AssetList[]} customAssets - The list of custom assets to be excluded from the result.
 * @returns {AssetList[]} - The list of available assets after applying the filter.
 */
export const getAvailableAssets = (
    assets: AssetList[],
    customAssets: AssetList[]
) => [
    ...assets?.filter(
        (asset) =>
            !(customAssets ?? [])
                ?.map((customAsset) => customAsset.chain_name)
                ?.includes(asset.chain_name)
    ),
    ...(customAssets ?? []),
];
