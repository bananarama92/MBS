/** @type {ExtendedItemInitCallback} */
declare function InventoryItemDevicesDollBoxInit(Item: Item, C: Character, Refresh: boolean): void;
declare function InventoryItemDevicesDollBoxLoad(): void;
declare function InventoryItemDevicesDollBoxDraw(): void;
declare function InventoryItemDevicesDollBoxClick(): void;
declare function InventoryItemDevicesDollBoxExit(): void;
/** @type {DynamicAfterDrawCallback} */
declare function AssetsItemDevicesDollBoxAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData): void;
