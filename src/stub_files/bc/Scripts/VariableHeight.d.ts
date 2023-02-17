/**
 * Registers a variable height extended item. This automatically creates the item's load, draw and click functions.
 * @param {Asset} asset - The asset being registered
 * @param {VariableHeightConfig | undefined} config - The variable height configuration
 * @param {ItemProperties | undefined} property - The default properties to use
 * @param {ExtendedItemOption[]} [parentOptions=null] - The variable height configuration of the option's parent item, if any
 * @returns {void} - Nothing
 */
declare function VariableHeightRegister(asset: Asset, config: VariableHeightConfig | undefined, property: ItemProperties | undefined, parentOptions?: ExtendedItemOption[]): void;
/**
 * Generates an asset's variable height data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {VariableHeightConfig} config - The variable height configuration
 * @returns {VariableHeightData} - The generated variable height data for the asset
 */
declare function VariableHeightCreateData(asset: Asset, { MaxHeight, MinHeight, Slider, Dialog, ChatTags, GetHeightFunction, SetHeightFunction }: VariableHeightConfig, property: any, parentOptions: any): VariableHeightData;
/**
 * Creates an asset's extended item load function
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightCreateLoadFunction({ defaultProperty, maxHeight, minHeight, slider, functionPrefix, getHeight, setHeight }: VariableHeightData): void;
/**
 * Creates an asset's extended item draw function
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightCreateDrawFunction({ functionPrefix, asset, slider }: VariableHeightData): void;
/**
 * Creates an asset's extended item click function
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightCreateClickFunction({ parentOptions, functionPrefix, dialog, asset, chatTags, getHeight }: VariableHeightData): void;
/**
 * Creates an asset's extended item exit function
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightCreateExitFunction({ functionPrefix }: VariableHeightData): void;
/**
 * Creates an asset's extended item chatroom message publishing function
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
declare function VariableHeightCreatePublishFunction({ functionPrefix, dialog, asset, chatTags, getHeight }: VariableHeightData): void;
/**
 * Exit handler for the item's extended item screen. Updates the character and removes UI components.
 * @returns {void} - Nothing
 */
declare function VariableHeightExit(): void;
/**
 * Publishes a custom action to the chat for the height change
 * @param {Object} dialog - The keywords for the dialog entries to look up
 * @param {Asset} asset - The asset for the variable height item
 * @param {CommonChatTags[]} chatTags - The tags to map to a dictionary entry
 * @param {Function} getHeight - Function to find the current setting from a property
 * @returns {void} - Nothing
 */
declare function VariableHeightPublish(dialog: any, asset: Asset, chatTags: CommonChatTags[], getHeight: Function): void;
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
