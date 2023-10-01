/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData | ModularItemData>} */
declare function InventoryItemBreastForbiddenChastityBraDrawHook(data: TypedItemData | ModularItemData, originalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Click<TypedItemData | ModularItemData>} */
declare function InventoryItemBreastForbiddenChastityBraClickHook(data: TypedItemData | ModularItemData, originalFunction: () => void): void;
/**
 * @typedef {{ UpdateTime?: number, CheckTime?: number, LastMessageLen?: number, LastTriggerCount?: number, DisplayCount?: number }} ForbiddenChastityBraPersistentData
 */
/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData | TypedItemData, ForbiddenChastityBraPersistentData>} */
declare function AssetsItemBreastForbiddenChastityBraScriptDrawHook(data: TypedItemData | ModularItemData, originalFunction: (drawData: DynamicScriptCallbackData<ForbiddenChastityBraPersistentData>) => void, drawData: DynamicScriptCallbackData<ForbiddenChastityBraPersistentData>): void;
type ForbiddenChastityBraPersistentData = {
    UpdateTime?: number;
    CheckTime?: number;
    LastMessageLen?: number;
    LastTriggerCount?: number;
    DisplayCount?: number;
};
