/**
 * Helper function for the futuristic hook scripts.
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {() => void} DeniedFunction - The function that is called when validation fails.
 * @returns {boolean} - Whether the validation was successful or not.
 */
declare function FuturisticAccess(OriginalFunction: null | (() => void), DeniedFunction: () => void): boolean;
/**
 * Hook script for injecting futuristic features into an archetypical item
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @returns {boolean} - Whether the validation was successful or not.
 */
declare function FuturisticAccessLoad(OriginalFunction?: null | (() => void)): boolean;
/**
 * Hook script for injecting futuristic features into an archetypical item
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @returns {boolean} - Whether the validation was successful or not.
 */
declare function FuturisticAccessClick(OriginalFunction?: null | (() => void)): boolean;
/**
 * Hook script for injecting futuristic features into an archetypical item
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @returns {boolean} - Whether the validation was successful or not.
 */
declare function FuturisticAccessDraw(OriginalFunction?: null | (() => void)): boolean;
/**
 * Hook script for injecting futuristic features into an archetypical item
 * @returns {void} - Nothing
 */
declare function FuturisticAccessExit(): void;
/**
 * Hook script for injecting futuristic features into a typed or modular item
 * @param {ExtendedItemValidateCallback<OptionType>} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @param {Character} C - The character to validate the option
 * @param {Item} Item - The equipped item
 * @param {OptionType} Option - The selected option
 * @param {OptionType} CurrentOption - The currently selected option
 * @returns {string} - Returns false and sets DialogExtendedMessage, if the chosen option is not possible.
 * @template OptionType
 */
declare function FuturisticAccessValidate<OptionType>(OriginalFunction: ExtendedItemValidateCallback<OptionType>, C: Character, Item: Item, Option: OptionType, CurrentOption: OptionType): string;
declare function InventoryItemFuturisticLoadAccessDenied(): void;
declare function InventoryItemFuturisticDrawAccessDenied(): void;
declare function InventoryItemFuturisticClickAccessDenied(): void;
declare function InventoryItemFuturisticExitAccessDenied(): void;
/**
 * Validates, if the chosen option is possible. Sets the global variable 'DialogExtendedMessage' to the appropriate error message, if not.
 * @param {Character} C - The character to validate the option
 * @param {Item} Item - The equipped item
 * @returns {string} - Returns false and sets DialogExtendedMessage, if the chosen option is not possible.
 */
declare function InventoryItemFuturisticValidate(C: Character, Item?: Item): string;
declare function InventoryItemFuturisticPublishAccessDenied(C: any): void;
declare var FuturisticAccessDeniedMessage: string;
declare var FuturisticAccessCollarGroups: string[];
declare var FuturisticAccessArmGroups: string[];
declare var FuturisticAccessLegGroups: string[];
declare var FuturisticAccessChastityGroups: string[];
