/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemPelvisForbiddenChastityBelts1Load(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemPelvisForbiddenChastityBelts1Draw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemPelvisForbiddenChastityBelts1Click(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemPelvisForbiddenChastityBelts1Exit(): void;
declare function InventoryItemPelvisForbiddenChastityBeltResetCount(): void;
/**
 * @typedef {{ UpdateTime?: number, CheckTime?: number, LastMessageLen?: number, LastTriggerCount?: number, DisplayCount?: number }} ForbiddenChastityBeltPersistentData
 */
/** @type {ExtendedItemCallbacks.BeforeDraw<ForbiddenChastityBeltPersistentData>} */
declare function AssetsItemPelvisForbiddenChastityBeltBeforeDraw(data: DynamicDrawingData<ForbiddenChastityBeltPersistentData>): DynamicBeforeDrawOverrides;
/**
 * @param {Item} Item
 */
declare function InventoryForbiddenChastityBeltCheckPunish(Item: Item): "" | "Struggle" | "Orgasm" | "StandUp";
/**
 * @param {DynamicScriptCallbackData<FuturisticChastityBeltPersistentData>} data
 * @param {number} LastTime
 */
declare function AssetsItemPelvisForbiddenChastityBeltUpdate(data: DynamicScriptCallbackData<FuturisticChastityBeltPersistentData>, LastTime: number): void;
/** @type {ExtendedItemCallbacks.ScriptDraw<ForbiddenChastityBeltPersistentData>} */
declare function AssetsItemPelvisForbiddenChastityBeltScriptDraw(data: DynamicScriptCallbackData<ForbiddenChastityBeltPersistentData>): void;
type ForbiddenChastityBeltPersistentData = {
    UpdateTime?: number;
    CheckTime?: number;
    LastMessageLen?: number;
    LastTriggerCount?: number;
    DisplayCount?: number;
};
