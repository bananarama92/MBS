/** @type {ExtendedItemScriptHookCallbacks.Load<TypedItemData>} */
declare function InventoryItemDevicesWoodenBoxLoadHook(Data: TypedItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData>} */
declare function InventoryItemDevicesWoodenBoxDrawHook(Data: TypedItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Exit<TypedItemData>} */
declare function InventoryItemDevicesWoodenBoxExitHook(): void;
/**
 * Dynamic AfterDraw function. Draws text onto the box.
 * @type {ExtendedItemCallbacks.AfterDraw}
 */
declare function AssetsItemDevicesWoodenBoxAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }: DynamicDrawingData<Record<string, unknown>>): void;
