/** Function for setting the types of extended items. */

import { validateCharacter } from "../common_bc";

/**
 * Load and assign the type to the passed item without refreshing.
 * @param item The Item in question
 * @param character The player or simple character
 * @param typeRecord the item's type
 */
export function itemSetType(
    item: Item,
    character: Character,
    typeRecord: TypeRecord,
): void {
    validateCharacter(character);
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    }
    ExtendedItemSetOptionByRecord(character, item, typeRecord, { refresh: false, push: false });
}

/**
 * Construct a baseline property object for the passed object and given type.
 * @param item The Item in question
 * @param character The player or simple character
 * @param typeRecord The item's `TypeRecord`
 */
export function getBaselineProperty(asset: Asset, character: Character, typeRecord?: TypeRecord): ItemProperties {
    const item: Item = { Asset: asset };
    ExtendedItemInit(character, item, false, false);
    if (typeRecord) itemSetType(item, character, typeRecord);
    return item.Property ?? {};
}
