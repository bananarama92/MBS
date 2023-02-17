/**
 * Construct an item-specific ID for a properties input element (_e.g._ an opacity slider).
 * @param {string} Name - The name of the input element
 * @param {Item} Item - The item for whom the ID should be constructed; defaults to {@link DialogFocusItem}
 * @returns {string} - The ID of the property
 */
declare function PropertyGetID(Name: string, Item?: Item): string;
/**
 * Load function for items with opacity sliders. Constructs the opacity slider.
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {string} thumbIcon The icon to use for the range input's "thumb" (handle).
 * @returns {HTMLInputElement} - The new or pre-existing range input element of the opacity slider
 */
declare function PropertyOpacityLoad(OriginalFunction?: null | (() => void), thumbIcon?: string): HTMLInputElement;
/**
 * Draw function for items with opacity sliders. Draws the opacity slider and further opacity-related information.
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {number} XOffset - An offset for all text and slider X coordinates
 * @param {number} YOffset - An offset for all text and slider Y coordinates
 * @param {string} LabelKeyword - The keyword of the opacity label
 * @returns {void} Nothing
 */
declare function PropertyOpacityDraw(OriginalFunction?: null | (() => void), XOffset?: number, YOffset?: number, LabelKeyword?: string): void;
/**
 * Exit function for items with opacity sliders. Updates the items opacity, deletes the slider and (optionally) refreshes the character and item.
 * @param {boolean} Refresh - Whether character parameters and the respective item should be refreshed or not
 * @returns {boolean} Whether the opacity was updated or not
 */
declare function PropertyOpacityExit(Refresh?: boolean): boolean;
/**
 * Validation function for items with opacity sliders.
 * @template {ExtendedItemOption | ModularItemOption} OptionType
 * @param {ExtendedItemValidateCallback<OptionType>} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @param {Character} C - The character to validate the option
 * @param {Item} Item - The equipped item
 * @param {OptionType} Option - The selected option
 * @param {OptionType} CurrentOption - The currently selected option
 * @returns {string} - Set and returns {@link DialogExtendedMessage} if the chosen option is not possible.
 */
declare function PropertyOpacityValidate<OptionType extends ExtendedItemOption | ModularItemOption>(OriginalFunction: ExtendedItemValidateCallback<OptionType>, C: Character, Item: Item, Option: OptionType, CurrentOption: OptionType): string;
/**
 * Helper fuction for publishing shock-related actions.
 * @param {Character} C - The shocked character; defaults to the {@link CharacterGetCurrent} output
 * @param {Item} Item - The shocking item; defaults to {@link DialogFocusItem}
 * @param {boolean} Automatic - Whether the shock was triggered automatically or otherwise manually
 */
declare function PropertyShockPublishAction(C?: Character, Item?: Item, Automatic?: boolean): void;
/**
 * Check if a given message warants automatic punishment given the provided sensitivety level
 * @param {0 | 1 | 2 | 3} Sensitivity - The auto-punishment sensitivety
 * @param {string} msg - The to-be checked message
 * @returns {boolean} Whether the passed message should trigger automatic speech-based punishment
 */
declare function PropertyAutoPunishParseMessage(Sensitivity: 0 | 1 | 2 | 3, msg: string): boolean;
/**
 * Check whether the last uttered message should trigger automatic punishment from the provided item
 * @param {Item} Item - The item in question
 * @param {number | null} LastMessageLen - The length of {@link ChatRoomLastMessage} prior to the last message (if applicable)
 * @returns {boolean} Whether the last message should trigger automatic speech-based punishment
 */
declare function PropertyAutoPunishDetectSpeech(Item: Item, LastMessageLen?: number | null): boolean;
/**
 * Load function for items with text input fields.
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {PropertyTextEventListenerRecord} EventListeners - A record with custom event listeners for one or more input fields.
 * @returns {HTMLInputElement[]} An array with the new or pre-existing text input elements
 */
declare function PropertyTextLoad(OriginalFunction?: null | (() => void), EventListeners?: PropertyTextEventListenerRecord): HTMLInputElement[];
/**
 * Draw handler for extended item screens with text input fields.
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {number} X - Center point of the text input field(s) on the X axis
 * @param {number} Y - Center point of the first text input field on the Y axis
 * @param {number} YSpacing - The spacing of Y coordinates between multiple input fields
 * @returns {HTMLInputElement[]} An array with all text input elements
 */
declare function PropertyTextDraw(OriginalFunction?: null | (() => void), X?: number, Y?: number, YSpacing?: number): HTMLInputElement[];
/**
 * Exit function for items with text input fields.
 * @param {boolean} Refresh - Whether character parameters and the respective item should be refreshed or not
 * @param {string} TextChange - The action tag for changing (but not removing) the text
 * @param {string} TextRemove - The action tag for the complete removal of the text
 * @returns {void} Nothing
 */
declare function PropertyTextExit(Refresh?: boolean, TextChange?: string, TextRemove?: string): void;
/**
 * Validation function for items with text input fields.
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point.
 * @param {Item} Item - The equipped item
 * @returns {boolean} - Whether the validation was successful
 */
declare function PropertyTextValidate(OriginalFunction: null | (() => void), Item?: Item): boolean;
/**
 * Property.js
 * -----------
 * A module with common helper functions for the handling of specific {@link ItemProperties} properties.
 * Note that more generic extended item functions should be confined to `ExtendedItem.js`.
 */
/**
 * A Map that maps input element IDs to their original value is defined in, _.e.g_, {@link PropertyOpacityLoad}.
 * Used as fallback in case an invalid opacity value is encountered when exiting.
 * @type {Map<string, any>}
 */
declare const PropertyOriginalValue: Map<string, any>;
declare function PropertyOpacityChange(C: any, Item: any, Opacity: any): void;
/**
 * A set of group names whose auto-punishment has successfully been handled by {@link PropertyAutoPunishDetectSpeech}.
 * If a group name is absent from the set then it's eligible for action-based punishment triggers.
 * The initial set is populated by {@link AssetLoadAll} after all asset groups are defined.
 * @type {Set<AssetGroupName>}
 */
declare let PropertyAutoPunishHandled: Set<AssetGroupName>;
/**
 * A list of keywords that can trigger automatic punishment when included in `/me`- or `*`-based messages
 * @type {readonly string[]}
 */
declare const PropertyAutoPunishKeywords: readonly string[];
/**
 * Throttled callback for handling text changes.
 * @type {PropertyTextEventListener}
 */
declare const PropertyTextChange: PropertyTextEventListener;
/**
 * Throttled callback for handling text changes that do not require a canvas.
 * @type {PropertyTextEventListener}
 */
declare const PropertyTextChangeNoCanvas: PropertyTextEventListener;
