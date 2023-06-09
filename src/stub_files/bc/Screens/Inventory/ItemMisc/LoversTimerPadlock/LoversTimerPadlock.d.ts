/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemMiscLoversTimerPadlockInit(C: Character, Item: Item, refresh: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemMiscLoversTimerPadlockLoad(): void;
/**
 * @param {Character} C
 * @returns {boolean} - Whether the passed character is elligble for full control over the lock
 */
declare function InventoryItemMiscLoversTimerPadlockValidator(C: Character): boolean;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemMiscLoversTimerPadlockDraw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemMiscLoversTimerPadlockClick(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemMiscLoversTimerPadlockExit(): void;
declare const LoverTimerChooseList: number[];
declare let LoverTimerChooseIndex: number;
