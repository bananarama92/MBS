/**
 * Loads the extended item properties
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesPetBowlLoad(): void;
/**
 * Draw handler for the extended item screen
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesPetBowlDraw(): void;
/**
 * Click handler for the extended item screen
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesPetBowlClick(): void;
/**
 * Exits the extended item screen and cleans up inputs and text
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesPetBowlExit(): void;
/**
 * Post-render drawing function. Draws custom text in a slight arc to mimic the
 * curvature of the bowl.
 * @type {DynamicAfterDrawCallback}
 */
declare function AssetsItemDevicesPetBowlAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData): void;
