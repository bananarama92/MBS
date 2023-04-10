/**
 * Registers a variable height extended item. This automatically creates the item's load, draw and click functions.
 * @param {Asset} asset - The asset being registered
 * @param {VariableHeightConfig | undefined} config - The variable height configuration
 * @param {ItemProperties | undefined} property - The default properties to use
 * @param {TypedItemOption[]} [parentOptions=null] - The variable height configuration of the option's parent item, if any
 * @returns {void} - Nothing
 */
declare function VariableHeightRegister(asset: Asset, config: VariableHeightConfig | undefined, property: ItemProperties | undefined, parentOptions?: TypedItemOption[]): void;
/**
 * Generates an asset's variable height data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {VariableHeightConfig} config - The variable height configuration
 * @param {ItemProperties} property
 * @param {TypedItemOption[]} parentOptions
 * @returns {VariableHeightData} - The generated variable height data for the asset
 */
declare function VariableHeightCreateData(asset: Asset, { MaxHeight, MinHeight, Slider, DialogPrefix, ChatTags, Dictionary, GetHeightFunction, SetHeightFunction, ScriptHooks }: VariableHeightConfig, property: ItemProperties, parentOptions: TypedItemOption[]): VariableHeightData;
/**
 * @param {VariableHeightData} data - The variable height data for the asset
 */
declare function VariableHeightLoad({ maxHeight, minHeight, slider, getHeight, setHeight, dialogPrefix }: VariableHeightData): void;
/**
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightDraw({ slider }: VariableHeightData): void;
/**
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightClick(data: VariableHeightData): void;
/**
 * Exit handler for the item's extended item screen. Updates the character and removes UI components.
 * @returns {void} - Nothing
 */
declare function VariableHeightExit(): void;
/**
 * Publishes a custom action to the chat for the height change
 * @param {VariableHeightData} data
 * @param {Character} C
 * @param {Item} item
 * @param {VariableHeightOption} newOption
 * @param {VariableHeightOption} previousOption
 */
declare function VariableHeightPublishAction(data: VariableHeightData, C: Character, item: Item, newOption: VariableHeightOption, previousOption: VariableHeightOption): void;
/**
 * Retrieve the current height position override if set, accounting for inversion
 * @param {ItemProperties} property - Property of the item determining the variable height
 * @returns {number | null} - The height value between 0 and 1, null if missing or invalid
 */
declare function VariableHeightGetOverrideHeight(property: ItemProperties): number | null;
/**
 * Reposition the character vertically when upside-down, accounting for height ratio and inversion
 * @param {ItemProperties} property - Property of the item determining the variable height
 * @param {number} height - The 0 to 1 height setting to use
 * @param {number} maxHeight - The maximum number of the item's height range
 * @param {number} minHeight - The minimum number of the item's height range
 * @returns {void} - Nothing
 */
declare function VariableHeightSetOverrideHeight(property: ItemProperties, height: number, maxHeight: number, minHeight: number): void;
/**
 * Initialize the variable height item properties
 * @param {VariableHeightData} Data
 * @param {Item} Item - The item in question
 * @param {Character} C - The character that has the item equiped
 * @param {boolean} Refresh -  Whether the character and relevant item should be refreshed and pushed to the server
 * @returns {boolean} Whether properties were initialized or not
 */
declare function VariableHeightInit(Data: VariableHeightData, C: Character, Item: Item, Refresh: boolean): boolean;
/**
 * The name of vertical slider element
 * @const {string}
 */
declare const VariableHeightSliderId: "VariableHeightSlider";
/**
 * The name of the numerical percentage input element
 * @const {string}
 */
declare const VariableHeightNumerId: "VariableHeightNumber";
/**
 * Tracks the original properties to revert back to if the user cancels their changes
 * @type ItemProperties
 */
declare let VariableHeightPreviousProperty: ItemProperties;
/**
 * A lookup for the variable height configurations for each registered variable height item
 * @const
 * @type {Record<string, VariableHeightData>}
 */
declare const VariableHeightDataLookup: Record<string, VariableHeightData>;
declare function VariableHeightChange(height: any, maxHeight: any, minHeight: any, setHeight: any, fromElementId: any): void;
