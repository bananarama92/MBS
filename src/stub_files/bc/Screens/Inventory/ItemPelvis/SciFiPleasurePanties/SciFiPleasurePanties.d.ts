/**
 * Custom draw function for adding the `Shock` menu.
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @returns {void} - Nothing
 */
declare function InventoryItemPelvisSciFiPleasurePantiesDraw(OriginalFunction: () => void): void;
/**
 * Custom click function for adding the `Shock` menu.
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @param {boolean} Futuristic - Whether this concerns a futuristic item or not
 * @returns {void} - Nothing
 */
declare function InventoryItemPelvisSciFiPleasurePantiesClickHook(OriginalFunction: () => void, Futuristic?: boolean): void;
/** @type {ExtendedItemChatCallback<ModularItemOption>} */
declare function InventoryItemPelvisSciFiPleasurePantiesChatPrefix({ previousOption, newOption }: ExtendedItemChatData<ModularItemOption>): string;
