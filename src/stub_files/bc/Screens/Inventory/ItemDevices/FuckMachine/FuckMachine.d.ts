/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemDevicesFuckMachineBeforeDraw({ PersistentData, L, Y, Property }: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemDevicesFuckMachineScriptDraw(data: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
