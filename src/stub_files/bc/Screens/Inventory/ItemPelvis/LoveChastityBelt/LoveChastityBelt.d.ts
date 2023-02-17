/**
 * Draw the item extension screen.
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} Nothing
 */
declare function InventoryItemPelvisLoveChastityBeltDraw(OriginalFunction: () => void): void;
/**
 * Catches the item extension clicks
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} Nothing
 */
declare function InventoryItemPelvisLoveChastityBeltClick(OriginalFunction: () => void): void;
/**
 * Custom `SetType` function for the Love Chastity Belt's front shield.
 * @param {ModularItemModule} module - The module that changed
 * @param {number} index - The index of the newly chosen option within the module
 * @param {ModularItemData} data - The modular item's data
 * @returns {void} - Nothing
 * @see {@link ModularItemSetType}
 */
declare function InventoryItemPelvisLoveChastityBeltSetType(module: ModularItemModule, index: number, data: ModularItemData): void;
/** @type {ExtendedItemValidateScriptHookCallback<ModularItemOption>} */
declare function InventoryItemPelvisLoveChastityBeltValidate(OriginalFunction: ExtendedItemValidateCallback<ModularItemOption>, C: Character, Item: Item, Option: ModularItemOption, CurrentOption: ModularItemOption): string;
/** Map the names of the love chastity belt front + black shield options to its scifi pleasure panties equivalent. */
declare const InventoryItemPelvisLoveChastityBeltCrotchShield: Map<string, string>;
