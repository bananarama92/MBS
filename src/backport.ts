/** Backports of R91 bug fixes */

import { sortBy } from "lodash-es";

// @ts-ignore
import { MBS_MOD_API } from "./common";
import { waitFor, logger } from "./common";
import { bcLoaded } from "./common_bc";
import { BC_MIN_VERSION } from "./sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

declare const CraftingAssetsPopulate: undefined | (() => void);

/**
 * Construct a record mapping all crafting-valid asset names to a list of matching elligble assets.
 * Elligble assets are defined as crafting-valid assets with either a matching {@link Asset.Name} or {@link Asset.CraftGroup}.
 */
function craftingAssetsPopulate(): Record<string, readonly Asset[]> {
    const ret: Record<string, Asset[]> = {};
    const craftGroups: Record<string, Asset[]> = {};
    for (const a of Asset) {
        if (!a.Group.IsItem() || a.IsLock || !a.Wear || !a.Enable) {
            continue;
        } else if (a.CraftGroup) {
            craftGroups[a.CraftGroup] ??= [];
            craftGroups[a.CraftGroup].push(a);
        } else {
            ret[a.Name] ??= [];
            ret[a.Name].push(a);
        }
    }

    for (const assetList of Object.values(craftGroups)) {
        const names = new Set(assetList.map(a => a.Name));
        for (const name of names) {
            ret[name] ??= [];
            ret[name].push(...assetList);
        }
    }
    return ret;
}

waitFor(bcLoaded).then(() => {
    switch (GameVersion) {
        case "R102": {
            if (typeof CraftingAssetsPopulate === "undefined") {
                backportIDs.add(4900);
                const CRAFTING_ASSETS = Object.freeze(craftingAssetsPopulate());

                MBS_MOD_API.hookFunction("CraftingAppliesToItem", 10, (args) => {
                    const [craft, asset] = args as Parameters<typeof CraftingAppliesToItem>;
                    if (!craft || !asset) {
                        return false;
                    } else {
                        const elligbleAssets = CRAFTING_ASSETS[craft.Item] ?? [];
                        return elligbleAssets.includes(asset);
                    }
                });

                MBS_MOD_API.hookFunction("DialogCanUseCraftedItem", 10, (args) => {
                    const [character, craft] = args as Parameters<typeof DialogCanUseCraftedItem>;
                    const elligbleAssets = CRAFTING_ASSETS[craft.Item] ?? [];
                    return elligbleAssets.some(a => {
                        if (a.OwnerOnly && !character.IsOwnedByPlayer()) return false;
                        if (a.LoverOnly && !(character.IsOwnedByPlayer() || character.IsLoverOfPlayer())) return false;
                        if (a.FamilyOnly && !(character.IsOwnedByPlayer() || character.IsLoverOfPlayer() || character.IsFamilyOfPlayer())) return false;
                        return true;
                    });
                });
            }
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} bug fix backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} bug fix backports`);
    }
});
