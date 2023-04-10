/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemPelvisObedienceBeltEngraving0Load(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemPelvisObedienceBeltEngraving0Draw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemPelvisObedienceBeltEngraving0Click(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemPelvisObedienceBeltEngraving0Exit(): void;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemPelvisObedienceBeltShockModule1Load(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemPelvisObedienceBeltShockModule1Draw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemPelvisObedienceBeltShockModule1Click(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemPelvisObedienceBeltShockModule1Exit(): void;
/**
 * @param {Item} Item
 */
declare function InventoryObedienceBeltCheckPunish(Item: Item): "" | "Orgasm" | "StandUp";
/**
 * @param {DynamicScriptCallbackData<ObedienceBeltPersistentData>} data
 * @param {number} LastTime
 */
declare function AssetsItemPelvisObedienceBeltUpdate(data: DynamicScriptCallbackData<ObedienceBeltPersistentData>, LastTime: number): void;
/**
 * @typedef {{ UpdateTime?: number, LastMessageLen?: number, CheckTime?: number }} ObedienceBeltPersistentData
 */
/** @type {ExtendedItemCallbacks.ScriptDraw<ObedienceBeltPersistentData>} */
declare function AssetsItemPelvisObedienceBeltScriptDraw(data: DynamicScriptCallbackData<ObedienceBeltPersistentData>): void;
/** @type {ExtendedItemCallbacks.AfterDraw<ObedienceBeltPersistentData>} */
declare function AssetsItemPelvisObedienceBeltAfterDraw({ C, A, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color }: DynamicDrawingData<ObedienceBeltPersistentData>): void;
type ObedienceBeltPersistentData = {
    UpdateTime?: number;
    LastMessageLen?: number;
    CheckTime?: number;
};
