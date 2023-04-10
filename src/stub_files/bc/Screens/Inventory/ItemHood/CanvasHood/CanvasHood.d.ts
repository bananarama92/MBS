/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemHoodCanvasHoodInit(C: Character, Item: Item, Refresh?: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemHoodCanvasHoodLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemHoodCanvasHoodDraw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemHoodCanvasHoodClick(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemHoodCanvasHoodExit(): void;
/**
 * Post-render drawing function. Draws custom text in a slight arc to mimic the
 * curvature of the character's head.
 * @type {ExtendedItemCallbacks.AfterDraw}
 */
declare function AssetsItemHoodCanvasHoodAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData<Record<string, unknown>>): void;
