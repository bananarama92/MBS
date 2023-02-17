/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemNeckAutoShockCollarBeforeDraw(data: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemNeckAutoShockCollarScriptDraw(data: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
