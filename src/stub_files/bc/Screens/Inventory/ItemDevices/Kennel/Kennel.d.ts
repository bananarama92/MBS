/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemDevicesKennelBeforeDraw({ PersistentData, L, Property }: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemDevicesKennelScriptDraw({ C, PersistentData, Item }: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
/**
 * @param {Character} C
 * @returns {string}
 */
declare function InventoryItemDevicesKennelGetAudio(C: Character): string;
