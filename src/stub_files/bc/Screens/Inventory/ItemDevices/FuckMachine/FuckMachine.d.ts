/**
 * @typedef {{ DildoState?: number, Modifier?: number, Speed?: number, FuckChangeTime?: number, Mode?: VibratorMode, ChangeTime?: number, LastChange?: number }} FuckMachinePersistentData
 */
/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<VibratingItemData, FuckMachinePersistentData>} */
declare function AssetsItemDevicesFuckMachineBeforeDrawHook(data: VibratingItemData, originalFunction: (drawData: DynamicDrawingData<FuckMachinePersistentData>) => DynamicBeforeDrawOverrides, { PersistentData, L, Y, Property }: DynamicDrawingData<FuckMachinePersistentData>): DynamicBeforeDrawOverrides;
/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<VibratingItemData, FuckMachinePersistentData>} */
declare function AssetsItemDevicesFuckMachineScriptDrawHook(data: VibratingItemData, originalFunction: (drawData: DynamicScriptCallbackData<FuckMachinePersistentData>) => void, drawData: DynamicScriptCallbackData<FuckMachinePersistentData>): void;
type FuckMachinePersistentData = {
    DildoState?: number;
    Modifier?: number;
    Speed?: number;
    FuckChangeTime?: number;
    Mode?: VibratorMode;
    ChangeTime?: number;
    LastChange?: number;
};
