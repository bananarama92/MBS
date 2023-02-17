declare function InventoryItemMiscOwnerTimerPadlockLoad(): void;
declare function InventoryItemMiscOwnerTimerPadlockDraw(): void;
declare function InventoryItemMiscOwnerTimerPadlockClick(): void;
/**
 * When a value is added to the timer, can be a negative one
 * @param {number} TimeToAdd
 * @param {boolean} PlayerMemberNumberToList
 */
declare function InventoryItemMiscOwnerTimerPadlockAdd(TimeToAdd: number, PlayerMemberNumberToList?: boolean): void;
declare function InventoryItemMiscOwnerTimerPadlockExit(): void;
declare const OwnerTimerChooseList: number[];
declare let OwnerTimerChooseIndex: number;
