/** @type {DynamicBeforeDrawCallback} */
declare function AssetsWingsSteampunkWingsBeforeDraw({ PersistentData, L, LayerType: lt }: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsWingsSteampunkWingsScriptDraw({ C, Item, PersistentData }: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
