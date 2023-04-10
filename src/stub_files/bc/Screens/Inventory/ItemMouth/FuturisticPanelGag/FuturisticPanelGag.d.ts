/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
declare function InventoryItemMouthFuturisticPanelGagDrawHook(Data: ModularItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
declare function InventoryItemMouthFuturisticPanelGagClickHook(Data: ModularItemData, OriginalFunction: () => void): void;
/**
 * Send message for an automatic gag inflation.
 * @param {Character} C - The selected character
 * @param {Item} Item - The item in question
 * @param {string} OptionName - The name of the newly choosen option within the `Gag` module
 * @param {boolean} Deflate - Whether the gag is deflated or not
 * @return {void} Nothing
 */
declare function InventoryItemMouthFuturisticPanelGagPublishActionTrigger(C: Character, Item: Item, OptionName: string, Deflate: boolean): void;
/**
 * Helper function for handling automatic gag inflation and deflation.
 * @param {Character} C - The selected character
 * @param {Item} Item - The item in question
 * @param {boolean} Deflate - Whether this function is triggered by an automatic deflation or not
 * @param {number[]} PreviousModuleValues - The current modules values prior to inflation
 * @return {number[]} - The new module values
 */
declare function InventoryItemMouthFuturisticPanelGagTriggerGetOptions(C: Character, Item: Item, Deflate: boolean, PreviousModuleValues: number[]): number[];
/**
 * Helper function for handling automatic gag inflation and deflation.
 * @param {Character} C - The selected character
 * @param {Item} Item - The item in question
 * @param {boolean} Deflate - Whether this function is triggered by an automatic deflation or not
 * @return {void}
 */
declare function InventoryItemMouthFuturisticPanelGagTrigger(C: Character, Item: Item, Deflate: boolean): void;
/**
 * @typedef {{ LastMessageLen?: number, UpdateTime?: number, ChangeTime?: number }} FuturisticPanelGagPersistentData
 */
/** @type {ExtendedItemCallbacks.ScriptDraw<FuturisticPanelGagPersistentData>} */
declare function AssetsItemMouthFuturisticPanelGagScriptUpdatePlayer(data: DynamicScriptCallbackData<FuturisticPanelGagPersistentData>): void;
/** @type {ExtendedItemCallbacks.ScriptDraw<FuturisticPanelGagPersistentData>} */
declare function AssetsItemMouthFuturisticPanelGagScriptDraw(data: DynamicScriptCallbackData<FuturisticPanelGagPersistentData>): void;
/** @type {ExtendedItemCallbacks.BeforeDraw<FuturisticPanelGagPersistentData>} */
declare function AssetsItemMouthFuturisticPanelGagBeforeDraw(data: DynamicDrawingData<FuturisticPanelGagPersistentData>): DynamicBeforeDrawOverrides;
type FuturisticPanelGagPersistentData = {
    LastMessageLen?: number;
    UpdateTime?: number;
    ChangeTime?: number;
};
