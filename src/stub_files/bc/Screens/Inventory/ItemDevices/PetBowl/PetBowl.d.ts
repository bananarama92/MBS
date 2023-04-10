/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemDevicesPetBowlInit(C: Character, Item: Item, Refresh: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemDevicesPetBowlLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemDevicesPetBowlDraw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemDevicesPetBowlClick(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemDevicesPetBowlExit(): void;
/**
 * Post-render drawing function. Draws custom text in a slight arc to mimic the
 * curvature of the bowl.
 * @type {ExtendedItemCallbacks.AfterDraw}
 */
declare function AssetsItemDevicesPetBowlAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData<Record<string, unknown>>): void;
