/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemDevicesDollBoxInit(C: Character, Item: Item, Refresh: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemDevicesDollBoxLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemDevicesDollBoxDraw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemDevicesDollBoxClick(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemDevicesDollBoxExit(): void;
/** @type {ExtendedItemCallbacks.AfterDraw} */
declare function AssetsItemDevicesDollBoxAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData<Record<string, unknown>>): void;
