/** Public MBS API for retrieving wheel outfit data. */

import { FWItemSet } from "common_bc";
import { toItemBundles } from "item_bundle";

let MBSAPIDummy: null | Character = null;

function getDummyChar(): Character {
    if (MBSAPIDummy === null) {
        MBSAPIDummy = CharacterLoadSimple("MBSAPI");
    }
    return MBSAPIDummy;
}

/**
 * Get a record mapping all (user-specified) outfit names to the actual outfit data.
 * @returns All MBS outfit data
 */
export const getAll: typeof mbs.wheelOutfits.getAll = function getAll() {
    const itemSets = Player.MBSSettings.FortuneWheelItemSets;
    const itemRecord: Record<string, WheelBundle> = {};
    for (const [i, set] of CommonEnumerate(itemSets)) {
        if (set === null) {
            continue;
        }
        itemRecord[set.name] = {
            name: set.name,
            index: i,
            items: toItemBundles(set.itemList, getDummyChar()),
        };
    }
    return itemRecord;
};

/**
 * Get a single wheel outfit by its name.
 * @param name The name of the wheel outfit
 * @returns The wheel outfit or `undefined` if it cannot be found
 */
export const getByName: typeof mbs.wheelOutfits.getByName = function getByName(name) {
    if (typeof name !== "string") {
        throw new TypeError(`Invalid "name" type: ${typeof name}`);
    }

    let index: number = -1;
    const itemSet = Player.MBSSettings.FortuneWheelItemSets.find((i, j) => {
        const match = i?.name === name;
        if (match) {
            index = j;
        }
        return match;
    });

    return itemSet == null ? undefined : {
        name,
        index,
        items: toItemBundles(itemSet.itemList, getDummyChar()),
    };
};

/**
 * Get a single wheel outfit by its index.
 * @param index The wheel outfit or `undefined` if it cannot be found
 * @returns The MBS outfit data or `undefined`
 */
export const getByIndex: typeof mbs.wheelOutfits.getByIndex = function getByIndex(index) {
    if (typeof index !== "number") {
        throw new TypeError(`Invalid "index" type: ${typeof index}`);
    }

    const itemSet = Player.MBSSettings.FortuneWheelItemSets[index];
    return itemSet == null ? undefined : {
        name: itemSet.name,
        index,
        items: toItemBundles(itemSet.itemList, getDummyChar()),
    };
};

/** Return a list of all the players wheel outfit names. */
export const getNames: typeof mbs.wheelOutfits.getNames = function getNames() {
    return Player.MBSSettings.FortuneWheelItemSets.filter(i => i !== null).map(i => (<FWItemSet>i).name);
};

/** Return a list of all the players wheel outfit indices. */
export const getIndices: typeof mbs.wheelOutfits.getIndices = function getIndices() {
    return Player.MBSSettings.FortuneWheelItemSets.filter(i => i !== null).map((_, i) => i);
};
