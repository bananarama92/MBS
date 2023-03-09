/** @type {ExtendedItemInitCallback} */
declare function InventoryItemMiscPasswordPadlockInit(Item: Item, C: Character): void;
declare function InventoryItemMiscPasswordPadlockLoad(): void;
declare function InventoryItemMiscPasswordPadlockDraw(): void;
declare function InventoryItemMiscPasswordPadlockDrawControls(): void;
declare function InventoryItemMiscPasswordPadlockClick(): void;
declare function InventoryItemMiscPasswordPadlockControlsClick(ExitCallback: any): void;
declare function InventoryItemMiscPasswordPadlockHandleOpenClick(ExitCallback: any): void;
declare function InventoryItemMiscPasswordPadlockHandleFirstSet(ExitCallback: any): void;
declare function InventoryItemMiscPasswordPadlockExit(): void;
declare function InventoryItemMiscPasswordPadlockIsSet(): boolean;
declare function InventoryItemMiscPasswordPadlockPublishPasswordChange(C: any): void;
declare const InventoryItemMiscPasswordPadlockPasswordRegex: RegExp;
