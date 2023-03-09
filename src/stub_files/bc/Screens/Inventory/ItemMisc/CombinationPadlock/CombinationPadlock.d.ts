/** @type {ExtendedItemInitCallback} */
declare function InventoryItemMiscCombinationPadlockInit(Item: Item, C: Character): void;
declare function InventoryItemMiscCombinationPadlockLoad(): void;
declare function InventoryItemMiscCombinationPadlockModifyInput(e: any): void;
declare function InventoryItemMiscCombinationPadlockDraw(): void;
declare function InventoryItemMiscCombinationPadlockUnlock(C: any, Item: any): void;
declare function InventoryItemMiscCombinationPadlockClick(): void;
declare function InventoryItemMiscCombinationPadlockExit(): void;
declare let CombinationPadlockPlayerIsBlind: boolean;
declare let CombinationPadlockBlindCombinationOffset: any;
declare let CombinationPadlockCombinationLastValue: string;
declare let CombinationPadlockNewCombinationLastValue: string;
declare let CombinationPadlockLoaded: boolean;
