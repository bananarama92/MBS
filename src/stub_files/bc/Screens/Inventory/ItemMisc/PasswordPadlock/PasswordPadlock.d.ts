/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemMiscPasswordPadlockInit(C: Character, Item: Item): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemMiscPasswordPadlockLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemMiscPasswordPadlockDraw(): void;
declare function InventoryItemMiscPasswordPadlockDrawControls(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemMiscPasswordPadlockClick(): void;
declare function InventoryItemMiscPasswordPadlockControlsClick(): void;
declare function InventoryItemMiscPasswordPadlockHandleOpenClick(): void;
declare function InventoryItemMiscPasswordPadlockHandleFirstSet(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemMiscPasswordPadlockExit(): void;
declare function InventoryItemMiscPasswordPadlockIsSet(): boolean;
declare function InventoryItemMiscPasswordPadlockPublishPasswordChange(C: any): void;
declare const InventoryItemMiscPasswordPadlockPasswordRegex: RegExp;
