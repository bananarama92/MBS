declare let InventoryItemMiscLoversTimerPadlockInit: undefined | ((C: Character, Item: Item) => boolean);
declare function InventoryItemMiscLoversTimerPadlocInit(C: Character, Item: Item): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemMiscLoversTimerPadlockLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemMiscLoversTimerPadlockDraw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemMiscLoversTimerPadlockClick(): void;
declare function InventoryItemMiscLoversTimerPadlockAdd(TimeToAdd: any, PlayerMemberNumberToList: any): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemMiscLoversTimerPadlockExit(): void;
declare const LoverTimerChooseList: number[];
declare let LoverTimerChooseIndex: number;
