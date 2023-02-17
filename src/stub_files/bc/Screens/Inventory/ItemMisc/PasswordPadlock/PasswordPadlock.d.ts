declare function InventoryItemMiscPasswordPadlockLoad(): void;
declare function InventoryItemMiscPasswordPadlockDraw(): void;
declare function InventoryItemMiscPasswordPadlockDrawControls(): void;
declare function InventoryItemMiscPasswordPadlockClick(): void;
/**
 * @param {() => void} ExitCallback
 */
declare function InventoryItemMiscPasswordPadlockControlsClick(ExitCallback: () => void): void;
/**
 * @param {() => void} ExitCallback
 */
declare function InventoryItemMiscPasswordPadlockHandleOpenClick(ExitCallback: () => void): void;
/**
 * @param {() => void} ExitCallback
 */
declare function InventoryItemMiscPasswordPadlockHandleFirstSet(ExitCallback: () => void): void;
declare function InventoryItemMiscPasswordPadlockExit(): void;
declare function InventoryItemMiscPasswordPadlockIsSet(): boolean;
/**
 * @param {Character} C
 */
declare function InventoryItemMiscPasswordPadlockPublishPasswordChange(C: Character): void;
declare const InventoryItemMiscPasswordPadlockPasswordRegex: RegExp;
