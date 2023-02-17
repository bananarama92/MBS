/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemNeckShockCollarBeforeDraw(data: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemNeckShockCollarScriptDraw(data: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
