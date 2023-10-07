/** @type {ExtendedItemScriptHookCallbacks.Draw<ExtendedItemData>} */
declare function InventoryItemNeckAccessoriesCollarShockUnitDrawHook(Data: ExtendedItemData<any>, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Click<ExtendedItemData>} */
declare function InventoryItemNeckAccessoriesCollarShockUnitClickHook(Data: ExtendedItemData<any>, OriginalFunction: () => void): void;
declare function InventoryItemNeckAccessoriesCollarShockUnitResetCount(): void;
/**
 * @typedef {{ ChangeTime?: number, DisplayCount?: number, LastTriggerCount?: number }} ShockUnitPersistentData
 */
/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<ExtendedItemData, ShockUnitPersistentData>} */
declare function AssetsItemNeckAccessoriesCollarShockUnitBeforeDrawHook(data: ExtendedItemData<any>, originalFunction: (drawData: DynamicDrawingData<ShockUnitPersistentData>) => DynamicBeforeDrawOverrides, drawData: DynamicDrawingData<ShockUnitPersistentData>): DynamicBeforeDrawOverrides;
/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ExtendedItemData, ShockUnitPersistentData>} */
declare function AssetsItemNeckAccessoriesCollarShockUnitScriptDrawHook(data: ExtendedItemData<any>, originalFunction: (drawData: DynamicScriptCallbackData<ShockUnitPersistentData>) => void, drawData: DynamicScriptCallbackData<ShockUnitPersistentData>): void;
type ShockUnitPersistentData = {
    ChangeTime?: number;
    DisplayCount?: number;
    LastTriggerCount?: number;
};
