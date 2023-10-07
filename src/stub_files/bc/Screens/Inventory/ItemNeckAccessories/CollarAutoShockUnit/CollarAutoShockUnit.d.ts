/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
declare function InventoryItemNeckAccessoriesCollarAutoShockUnitDrawHook(Data: ModularItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
declare function InventoryItemNeckAccessoriesCollarAutoShockUnitClickHook(Data: ModularItemData, OriginalFunction: () => void): void;
/**
 * @typedef {{ ChangeTime?: number, LastMessageLen?: number }} AutoShockUnitPersistentData
 */
/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<ExtendedItemData, AutoShockUnitPersistentData>} */
declare function AssetsItemNeckAccessoriesCollarAutoShockUnitBeforeDrawHook(data: ExtendedItemData<any>, originalFunction: (drawData: DynamicDrawingData<AutoShockUnitPersistentData>) => DynamicBeforeDrawOverrides, drawData: DynamicDrawingData<AutoShockUnitPersistentData>): DynamicBeforeDrawOverrides;
/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ExtendedItemData, AutoShockUnitPersistentData>} */
declare function AssetsItemNeckAccessoriesCollarAutoShockUnitScriptDrawHook(data: ExtendedItemData<any>, originalFunction: (drawData: DynamicScriptCallbackData<AutoShockUnitPersistentData>) => void, drawData: DynamicScriptCallbackData<AutoShockUnitPersistentData>): void;
type AutoShockUnitPersistentData = {
    ChangeTime?: number;
    LastMessageLen?: number;
};
