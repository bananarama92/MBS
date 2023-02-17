declare function InventoryItemDevicesFuturisticCrateDevice1Load(): void;
declare function InventoryItemDevicesFuturisticCrateDevice1Draw(): void;
declare function InventoryItemDevicesFuturisticCrateDevice1Click(): void;
declare function InventoryItemDevicesFuturisticCrateDevice1Exit(): void;
/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemDevicesFuturisticCrateBeforeDraw({ PersistentData, L, X, Y, Property }: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemDevicesFuturisticCrateScriptDraw(data: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
