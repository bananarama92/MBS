/** Function for setting the types of extended items. */

"use strict";

import { validateCharacter } from "common_bc";

/**
 * Load and assign the type to the passed item without refreshing.
 * @param item The Item in question
 * @param character The player or simple character
 * @param type The item's `Type` (or `Mode` in the case of vibrating items)
 * @param refresh Whether to refresh the character after equipping every single item and changing its type.
 * Setting this value `false` is generally not safe, as asset prerequisite checks rely on the character being properly refreshed.
 * Should be fine for preview characters though, and it does save a lot of time
 */
export function itemSetType(item: Item, character: Character, type: null | string, refresh: boolean = true): void {
    validateCharacter(character);
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    }

    const asset = item.Asset;
    if (!asset.Extended) {
        return;
    }

    if (type === null) {
        return;
    } else if (asset.Archetype) {
        const setType = ITEM_SET_TYPE_DICT[asset.Archetype];
        return setType(character, item, type, refresh);
    } else {
        console.warn(`${item.Asset.Group.Name}${item.Asset.Name}: Unsupported non-archetypical item, aborting type-setting`);
    }
}

/**
 * Construct a baseline property object for the passed object and given type.
 * @param item The Item in question
 * @param character The player or simple character
 * @param type The item's `Type` (or `Mode` in the case of vibrating items)
 */
export function getBaselineProperty(asset: Asset, character: Character, type: null | string): ItemProperties {
    const item: Item = { Asset: asset };
    ExtendedItemInit(character, item, false, false);
    itemSetType(item, character, type, false);
    return item.Property ?? {};
}

/** Type-setting callback type for {@link ITEM_SET_TYPE_DICT} */
type setTypeCallback = (C: Character, item: Item, type: string, refresh: boolean) => void;

/** A record with template functions for setting the {@link ItemProperties.Type} of various archetypical items. */
const ITEM_SET_TYPE_DICT: Readonly<Record<ExtendedArchetype, setTypeCallback>> = Object.freeze({
    typed: (C, item, type, refresh) => TypedItemSetOptionByName(C, item, type, false, null, null, refresh),
    vibrating: (C, item, type, refresh) => VibratorModeSetOptionByName(C, item, type, false, undefined, undefined, refresh),
    modular: (C, item, type, refresh) => ModularItemSetOptionByName(C, item, type, false, null, refresh),
    variableheight: () => { return; },
    text: () => { return; },
});

