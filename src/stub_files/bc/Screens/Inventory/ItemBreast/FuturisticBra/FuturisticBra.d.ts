/**
 * @param {Character} C
 * @returns {{bpm: number, breathing: "Low" | "Med" | "High" | "Action", temp: number}}
 */
declare function InventoryItemBreastFuturisticBraUpdate(C: Character): {
    bpm: number;
    breathing: "Low" | "Med" | "High" | "Action";
    temp: number;
};
/**
 * Custom draw function for adding the `Shock` menu.
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} - Nothing
 */
declare function InventoryItemBreastFuturisticBraDraw(OriginalFunction: () => void): void;
/** @type {DynamicBeforeDrawCallback} */
declare function AssetsItemBreastFuturisticBraBeforeDraw(data: DynamicDrawingData): DynamicBeforeDrawOverrides;
/** @type {DynamicAfterDrawCallback} */
declare function AssetsItemBreastFuturisticBraAfterDraw({ C, A, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, G, Color }: DynamicDrawingData): void;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemBreastFuturisticBraScriptDraw(data: DynamicScriptCallbackData): void;
