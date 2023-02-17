/**
 * Loads the wooden box's extended item properties
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesWoodenBoxLoad(OriginalFunction: () => void): void;
/**
 * Draw handler for the wooden box's extended item screen
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesWoodenBoxDraw(OriginalFunction: () => void): void;
/**
 * Exits the wooden box's extended item screen, sends a chatroom message if appropriate, and cleans up inputs and text
 * @returns {void} - Nothing
 */
declare function InventoryItemDevicesWoodenBoxExit(): void;
/**
 * Dynamic AfterDraw function. Draws text onto the box.
 * @type {DynamicAfterDrawCallback}
 */
declare function AssetsItemDevicesWoodenBoxAfterDraw({ C, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }: DynamicDrawingData): void;
