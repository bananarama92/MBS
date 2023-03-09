/** @type {ExtendedItemInitCallback} */
declare function InventoryItemHoodCanvasHoodInit(Item: Item, C: Character, Refresh?: boolean): void;
/**
 * Loads the canvas hood's extended item properties
 * @returns {void} - Nothing
 */
declare function InventoryItemHoodCanvasHoodLoad(): void;
/**
 * Draw handler for the canvas hood's extended item screen
 * @returns {void} - Nothing
 */
declare function InventoryItemHoodCanvasHoodDraw(): void;
/**
 * Click handler for the canvas hood's extended item screen
 * @returns {void} - Nothing
 */
declare function InventoryItemHoodCanvasHoodClick(): void;
/**
 * Exits the canvas hood's extended item screen and cleans up inputs and text
 * @returns {void} - Nothing
 */
declare function InventoryItemHoodCanvasHoodExit(): void;
/**
 * Post-render drawing function. Draws custom text in a slight arc to mimic the
 * curvature of the character's head.
 * @type {DynamicAfterDrawCallback}
 */
declare function AssetsItemHoodCanvasHoodAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData): void;
