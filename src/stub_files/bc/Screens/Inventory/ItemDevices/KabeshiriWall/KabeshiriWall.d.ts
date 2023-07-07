/** @type {ExtendedItemScriptHookCallbacks.Load<ModularItemData>} */
declare function InventoryItemDevicesKabeshiriWallLoadHook(data: ModularItemData, originalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
declare function InventoryItemDevicesKabeshiriWallDrawHook(data: ModularItemData, originalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.PublishAction<ModularItemData, any>} */
declare function InventoryItemDevicesKabeshiriWallPublishActionHook(data: ModularItemData, originalFunction: (C: Character, item: Item, newOption: any, previousOption: any) => void, C: Character, item: Item, newOption: any, previousOption: any): void;
/** @type {ExtendedItemScriptHookCallbacks.Exit<ModularItemData>} */
declare function InventoryItemDevicesKabeshiriWallExitHook(data: ModularItemData, originalFunction: () => void): void;
/**
 * Dynamic AfterDraw function. Draws text onto the box.
 * @type {ExtendedItemScriptHookCallbacks.AfterDraw<ModularItemData>}
 */
declare function AssetsItemDevicesKabeshiriWallAfterDrawHook(_: ModularItemData, originalFunction: (drawData: DynamicDrawingData<Record<string, unknown>>) => void, { C, A, CA, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }: DynamicDrawingData<Record<string, unknown>>): void;
