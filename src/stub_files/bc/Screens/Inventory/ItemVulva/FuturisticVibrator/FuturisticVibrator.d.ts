/** @type {ExtendedItemInitCallback} */
declare function InventoryItemVulvaFuturisticVibratorInit(Item: Item, C: Character, Refresh: boolean): void;
declare function InventoryItemVulvaFuturisticVibratorLoad(): void;
declare function InventoryItemVulvaFuturisticVibratorDraw(): void;
declare function InventoryItemVulvaFuturisticVibratorPreviousAccessMode(current: any): "" | "ProhibitSelf" | "LockMember";
declare function InventoryItemVulvaFuturisticVibratorNextAccessMode(current: any): "" | "ProhibitSelf" | "LockMember";
declare function InventoryItemVulvaFuturisticVibratorClick(): void;
declare function InventoryItemVulvaFuturisticVibratorClickSet(): void;
declare function InventoryItemVulvaFuturisticVibratorExit(): void;
/**
 * @param {string} msg
 * @param {string[]} TriggerValues
 * @returns {string[]}
 */
declare function InventoryItemVulvaFuturisticVibratorDetectMsg(msg: string, TriggerValues: string[]): string[];
/**
 * @param {Character} C
 * @param {Item} Item
 * @param {ItemVulvaFuturisticVibratorAccessMode} Option
 */
declare function InventoryItemVulvaFuturisticVibratorSetAccessMode(C: Character, Item: Item, Option: ItemVulvaFuturisticVibratorAccessMode): void;
/**
 * @param {Item} Item
 * @param {boolean} Increase
 * @returns {VibratorMode}
 */
declare function InventoryItemVulvaFuturisticVibratorGetMode(Item: Item, Increase: boolean): VibratorMode;
/**
 * @param {Character} C
 * @param {Item} Item
 * @param {ExtendedItemOption} Option
 * @param {boolean} IgnoreSame
 */
declare function InventoryItemVulvaFuturisticVibratorSetMode(C: Character, Item: Item, Option: ExtendedItemOption, IgnoreSame?: boolean): void;
/**
 * @param {Character} C
 * @param {Item} Item
 * @param {number} LastTime
 */
declare function InventoryItemVulvaFuturisticVibratorHandleChat(C: Character, Item: Item, LastTime: number): void;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemVulvaFuturisticVibratorScriptDraw(data: DynamicScriptCallbackData): void;
declare var ItemVulvaFuturisticVibratorTriggers: string[];
/** @type {string[]} */
declare var ItemVulvaFuturisticVibratorTriggerValues: string[];
/** @type {{EVERYONE: "", PROHIBIT_SELF: "ProhibitSelf", LOCK_MEMBER_ONLY: "LockMember"}} */
declare const ItemVulvaFuturisticVibratorAccessMode: {
    EVERYONE: "";
    PROHIBIT_SELF: "ProhibitSelf";
    LOCK_MEMBER_ONLY: "LockMember";
};
declare const ItemVulvaFuturisticVibratorAccessModes: ("" | "ProhibitSelf" | "LockMember")[];
