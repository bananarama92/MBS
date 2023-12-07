/** Function for setting the types of extended items. */

"use strict";

import { logger } from "common";
import { validateCharacter } from "common_bc";

/**
 * Load and assign the type to the passed item without refreshing.
 * @param item The Item in question
 * @param character The player or simple character
 * @param type The item's `Type` (or `Mode` in the case of vibrating items)
 * @param typeRecord the item's type
 */
export function itemSetType(
    item: Item,
    character: Character,
    type?: null | string,
    typeRecord?: TypeRecord,
): void {
    validateCharacter(character);
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    }

    const asset = item.Asset;
    if (!asset.Extended) {
        return;
    }

    if (GameVersion === "R98") {
        if (type == null) {
            return;
        } else if (asset.Archetype) {
            const setType = ITEM_SET_TYPE_DICT[asset.Archetype];
            setType(character, item, type);
        } else {
            logger.warn(`${item.Asset.Group.Name}${item.Asset.Name}: Unsupported non-archetypical item, aborting type-setting`);
        }
    } else {
        if (typeRecord !== undefined) {
            ExtendedItemSetOptionByRecord(character, item, typeRecord, { refresh: false, push: false });
        } else if (type !== undefined) {
            const typeRecord = ExtendedItemTypeToRecord(item.Asset, type);
            ExtendedItemSetOptionByRecord(character, item, typeRecord, { refresh: false, push: false });
        }
    }
}

/**
 * Construct a baseline property object for the passed object and given type.
 * @param item The Item in question
 * @param character The player or simple character
 * @param type The item's `Type` (or `Mode` in the case of vibrating items)
 */
export function getBaselineProperty(asset: Asset, character: Character, type?: null | string, typeRecord?: TypeRecord): ItemProperties {
    const item: Item = { Asset: asset };
    ExtendedItemInit(character, item, false, false);
    itemSetType(item, character, type, typeRecord);
    return item.Property ?? {};
}

/** Type-setting callback type for {@link ITEM_SET_TYPE_DICT} */
type setTypeCallback = (C: Character, item: Item, type: string) => void;

/** A record with template functions for setting the {@link ItemProperties.Type} of various archetypical items. */
const ITEM_SET_TYPE_DICT: Readonly<Record<ExtendedArchetype, setTypeCallback>> = Object.freeze({
    // @ts-expect-error: R98-exclusive
    typed: (...args) => TypedItemSetOptionByName(...args, false, null, null, false),
    // @ts-expect-error: R98-exclusive
    vibrating: (...args) => VibratorModeSetOptionByName(...args, false, undefined, undefined, false),
    // @ts-expect-error: R98-exclusive
    modular: (...args) => ModularItemSetOptionByName(...args, false, null, false),
    variableheight: () => { return; },
    text: () => { return; },
});
