/**
 * Draw the item extension screen
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} Nothing
 */
declare function InventoryItemNeckAccessoriesCollarShockUnitDrawFunc(OriginalFunction: () => void): void;
/**
 * Catches the item extension clicks
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} Nothing
 */
declare function InventoryItemNeckAccessoriesCollarShockUnitClickFunc(OriginalFunction: () => void): void;
declare function InventoryItemNeckAccessoriesCollarShockUnitResetCount(): void;
/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemNeckAccessoriesCollarShockUnitBeforeDraw(data: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemNeckAccessoriesCollarShockUnitScriptDraw(data: DynamicScriptCallbackData): void;
