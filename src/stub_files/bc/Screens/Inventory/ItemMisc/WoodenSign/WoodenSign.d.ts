/** @type {ExtendedItemCallbacks.Init} */
declare function InventoryItemMiscWoodenSignInit(C: Character, Item: Item, Refresh?: boolean): boolean;
/** @type {ExtendedItemCallbacks.Load} */
declare function InventoryItemMiscWoodenSignLoad(): void;
/** @type {ExtendedItemCallbacks.Draw} */
declare function InventoryItemMiscWoodenSignDraw(): void;
/** @type {ExtendedItemCallbacks.Click} */
declare function InventoryItemMiscWoodenSignClick(): void;
/** @type {ExtendedItemCallbacks.Exit} */
declare function InventoryItemMiscWoodenSignExit(): void;
/** @type {ExtendedItemCallbacks.AfterDraw} */
declare function AssetsItemMiscWoodenSignAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData<Record<string, unknown>>): void;
