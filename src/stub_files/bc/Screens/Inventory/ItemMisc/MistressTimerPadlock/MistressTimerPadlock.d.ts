declare function InventoryItemMiscMistressTimerPadlockLoad(): void;
declare function InventoryItemMiscMistressTimerPadlockDraw(): void;
declare function InventoryItemMiscMistressTimerPadlockClick(): void;
/**
 * When a value is added to the timer, can be a negative one
 * @param {number} TimeToAdd
 * @param {boolean} PlayerMemberNumberToList
 */
declare function InventoryItemMiscMistressTimerPadlockAdd(TimeToAdd: number, PlayerMemberNumberToList: boolean): void;
declare function InventoryItemMiscMistressTimerPadlockExit(): void;
declare const MistressTimerChooseList: number[];
declare let MistressTimerChooseIndex: number;
