/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemMiscOwnerTimerPadlockInit(C: Character, Item: Item, Push: boolean, Refresh: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemMiscOwnerTimerPadlockLoad(): void;
/**
 * @param {Character} C
 * @returns {boolean} - Whether the passed character is elligble for full control over the lock
 */
declare function InventoryItemMiscOwnerTimerPadlockValidator(C: Character): boolean;
/**
 * @param {(C: Character) => boolean} validator
 */
declare function InventoryItemMiscOwnerTimerPadlockDraw(validator?: (C: Character) => boolean): void;
/**
 * @param {(C: Character) => boolean} validator
 */
declare function InventoryItemMiscOwnerTimerPadlockClick(validator?: (C: Character) => boolean): void;
declare function InventoryItemMiscOwnerTimerPadlockAdd(TimeToAdd: any, PlayerMemberNumberToList: any): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemMiscOwnerTimerPadlockExit(): void;
declare const OwnerTimerChooseList: number[];
declare let OwnerTimerChooseIndex: number;
