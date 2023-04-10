/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemDevicesFuturisticCrateDevice1Init(C: Character, Item: Item, Refresh: boolean): boolean;
declare function InventoryItemDevicesFuturisticCrateDevice1Load(): void;
declare function InventoryItemDevicesFuturisticCrateDevice1Draw(): void;
declare function InventoryItemDevicesFuturisticCrateDevice1Click(): void;
declare function InventoryItemDevicesFuturisticCrateDevice1Exit(): void;
/**
 * @typedef {FuckMachinePersistentData} FuturisticCratePersistentData
 */
/** @type {ExtendedItemCallbacks.BeforeDraw<FuturisticCratePersistentData>} */
declare function AssetsItemDevicesFuturisticCrateBeforeDraw({ PersistentData, L, X, Y, Property }: DynamicDrawingData<FuckMachinePersistentData>): DynamicBeforeDrawOverrides;
/** @type {ExtendedItemCallbacks.ScriptDraw<FuturisticCratePersistentData>} */
declare function AssetsItemDevicesFuturisticCrateScriptDraw(data: DynamicScriptCallbackData<FuckMachinePersistentData>): void;
type FuturisticCratePersistentData = FuckMachinePersistentData;
