/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemVulvaFuturisticVibratorInit(C: Character, Item: Item, Refresh: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemVulvaFuturisticVibratorLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemVulvaFuturisticVibratorDraw(): void;
declare function InventoryItemVulvaFuturisticVibratorPreviousAccessMode(current: any): "" | "ProhibitSelf" | "LockMember";
declare function InventoryItemVulvaFuturisticVibratorNextAccessMode(current: any): "" | "ProhibitSelf" | "LockMember";
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemVulvaFuturisticVibratorClick(): void;
declare function InventoryItemVulvaFuturisticVibratorClickSet(): void;
/** @type {ExtendedItemCallbacks.Exit} */
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
 * @param {VibratingItemOption} Option
 * @param {boolean} IgnoreSame
 */
declare function InventoryItemVulvaFuturisticVibratorSetMode(C: Character, Item: Item, Option: VibratingItemOption, IgnoreSame?: boolean): void;
/** @type {ExtendedItemCallbacks.Validate<VibratingItemOption>} */
declare function InventoryItemVulvaFuturisticVibratorValidate(C: Character, item: Item, newOption: VibratingItemOption, previousOption: VibratingItemOption): string;
/**
 * @param {Character} C
 * @param {Item} Item
 * @param {number} LastTime
 */
declare function InventoryItemVulvaFuturisticVibratorHandleChat(C: Character, Item: Item, LastTime: number): void;
/**
 * @typedef {{ CheckTime?: number, Mode?: VibratorMode, ChangeTime?: number, LastChange?: number }} FuturisticVibratorPersistentData
 */
/** @type {ExtendedItemCallbacks.ScriptDraw<FuturisticVibratorPersistentData>} */
declare function AssetsItemVulvaFuturisticVibratorScriptDraw(data: DynamicScriptCallbackData<FuturisticVibratorPersistentData>): void;
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
type FuturisticVibratorPersistentData = {
    CheckTime?: number;
    Mode?: VibratorMode;
    ChangeTime?: number;
    LastChange?: number;
};
