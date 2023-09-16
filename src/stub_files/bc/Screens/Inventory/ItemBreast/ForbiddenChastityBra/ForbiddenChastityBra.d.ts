/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemBreastForbiddenChastityBras1Load(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemBreastForbiddenChastityBras1Draw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemBreastForbiddenChastityBras1Click(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemBreastForbiddenChastityBras1Exit(): void;
declare function InventoryItemBreastForbiddenChastityBraResetCount(): void;
/**
 * @typedef {{ UpdateTime?: number, CheckTime?: number, LastMessageLen?: number, LastTriggerCount?: number, DisplayCount?: number }} ForbiddenChastityBraPersistentData
 */
/** @type {ExtendedItemCallbacks.BeforeDraw<ForbiddenChastityBraPersistentData>} */
declare function AssetsItemBreastForbiddenChastityBraBeforeDraw(data: DynamicDrawingData<ForbiddenChastityBraPersistentData>): DynamicBeforeDrawOverrides;
/**
 * @param {Item} Item
 */
declare function InventoryForbiddenChastityBraCheckPunish(Item: Item): "" | "Struggle" | "Orgasm" | "StandUp";
/**
 * @param {DynamicScriptCallbackData<ForbiddenChastityBraPersistentData>} data
 * @param {number} LastTime
 */
declare function AssetsItemBreastForbiddenChastityBraUpdate(data: DynamicScriptCallbackData<ForbiddenChastityBraPersistentData>, LastTime: number): void;
/** @type {ExtendedItemCallbacks.ScriptDraw<ForbiddenChastityBraPersistentData>} */
declare function AssetsItemBreastForbiddenChastityBraScriptDraw(data: DynamicScriptCallbackData<ForbiddenChastityBraPersistentData>): void;
type ForbiddenChastityBraPersistentData = {
    UpdateTime?: number;
    CheckTime?: number;
    LastMessageLen?: number;
    LastTriggerCount?: number;
    DisplayCount?: number;
};
