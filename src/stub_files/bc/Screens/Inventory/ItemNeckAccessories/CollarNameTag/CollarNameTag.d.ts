/**
 * Draw the item extension screen
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} - Nothing
 */
declare function InventoryItemNeckAccessoriesCollarNameTagDraw(OriginalFunction: () => void): void;
/**
 * Catches the item extension clicks
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} - Nothing
 */
declare function InventoryItemNeckAccessoriesCollarNameTagClick(OriginalFunction: () => void): void;
/**
 * Construct an array with X & Y coordinates for the name tag extended item menu.
 * @param {number} Count - The number of buttons
 * @returns {[number, number][]} - The array with X & Y coordinates
 */
declare function InventoryItemNeckAccessoriesCollarNameTagGetXY(Count: number, X?: number, Y?: number): [number, number][];
/**
 * Custom publish action function
 * @param {Character} C - The character wearing the item
 * @param {ExtendedItemOption} Option - The currently selected item option
 * @param {ExtendedItemOption} PreviousOption - The previously selected item option
 * @return {void} - Nothing
 */
declare function InventoryItemNeckAccessoriesCollarNameTagPublishAction(C: Character, Option: ExtendedItemOption, PreviousOption: ExtendedItemOption): void;
