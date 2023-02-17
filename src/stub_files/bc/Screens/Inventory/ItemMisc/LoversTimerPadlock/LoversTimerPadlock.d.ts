declare function InventoryItemMiscLoversTimerPadlockLoad(): void;
declare function InventoryItemMiscLoversTimerPadlockDraw(): void;
declare function InventoryItemMiscLoversTimerPadlockClick(): void;
/**
 * When a value is added to the timer, can be a negative one
 * @param {number} TimeToAdd
 * @param {boolean} PlayerMemberNumberToList
 */
declare function InventoryItemMiscLoversTimerPadlockAdd(TimeToAdd: number, PlayerMemberNumberToList?: boolean): void;
declare function InventoryItemMiscLoversTimerPadlockExit(): void;
declare const LoverTimerChooseList: number[];
declare let LoverTimerChooseIndex: number;
