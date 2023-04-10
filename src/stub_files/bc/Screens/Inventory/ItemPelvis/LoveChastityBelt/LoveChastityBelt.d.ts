/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
declare function InventoryItemPelvisLoveChastityBeltDraw(Data: ModularItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
declare function InventoryItemPelvisLoveChastityBeltClick(Data: ModularItemData, OriginalFunction: () => void): void;
/**
 * Custom `SetType` function for the Love Chastity Belt's front shield.
 * @param {ModularItemModule} module - The module that changed
 * @param {number} index - The index of the newly chosen option within the module
 * @param {ModularItemData} data - The modular item's data
 * @returns {void} - Nothing
 * @see {@link ModularItemSetType}
 */
declare function InventoryItemPelvisLoveChastityBeltSetType(module: ModularItemModule, index: number, data: ModularItemData): void;
/** @type {ExtendedItemScriptHookStruct<ModularItemData, ModularItemOption>["validate"]} */
declare function InventoryItemPelvisLoveChastityBeltValidate(Data: ModularItemData, OriginalFunction: (C: Character, item: Item, newOption: ModularItemOption, previousOption: ModularItemOption) => string, C: Character, Item: Item, Option: ModularItemOption, CurrentOption: ModularItemOption): string;
/** Map the names of the love chastity belt front + black shield options to its scifi pleasure panties equivalent. */
declare const InventoryItemPelvisLoveChastityBeltCrotchShield: Map<string, string>;
