/**
 * Registers a typed extended item. This automatically creates the item's load, draw and click functions. It will also
 * generate the asset's AllowType array.
 * @param {Asset} asset - The asset being registered
 * @param {TypedItemConfig | undefined} config - The item's typed item configuration
 * @returns {void} - Nothing
 */
declare function TypedItemRegister(asset: Asset, config: TypedItemConfig | undefined): void;
/**
 * Generates an asset's typed item data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {TypedItemConfig} config - The item's extended item configuration
 * @returns {TypedItemData} - The generated typed item data for the asset
 */
declare function TypedItemCreateTypedItemData(asset: Asset, { Options, Dialog, ChatTags, Dictionary, ChatSetting, DrawImages, ChangeWhenLocked, ScriptHooks, BaselineProperty, }: TypedItemConfig): TypedItemData;
/**
 * Creates an asset's extended item load function
 * @param {TypedItemData} data - The typed item data for the asset
 * @returns {void} - Nothing
 */
declare function TypedItemCreateLoadFunction({ options, functionPrefix, dialog, scriptHooks, BaselineProperty }: TypedItemData): void;
/**
 * Creates an asset's extended item draw function
 * @param {TypedItemData} data - The typed item data for the asset
 * @returns {void} - Nothing
 */
declare function TypedItemCreateDrawFunction({ options, functionPrefix, dialog, drawImages, scriptHooks }: TypedItemData): void;
/**
 * Creates an asset's extended item click function
 * @param {TypedItemData} data - The typed item data for the asset
 * @returns {void} - Nothing
 */
declare function TypedItemCreateClickFunction({ options, functionPrefix, drawImages, scriptHooks }: TypedItemData): void;
/**
 * Creates an asset's extended item exit function
 * @param {TypedItemData} data - The typed item data for the asset
 * @returns {void} - Nothing
 */
declare function TypedItemCreateExitFunction({ functionPrefix, scriptHooks }: TypedItemData): void;
/**
 * Creates an asset's extended item chatroom message publishing function
 * @param {TypedItemData} typedItemData - The typed item data for the asset
 * @returns {void} - Nothing
 */
declare function TypedItemCreatePublishFunction(typedItemData: TypedItemData): void;
/**
 * Creates an asset's extended item PublishAction function
 * @param {TypedItemData} data - The typed item data for the asset
 * @returns {void} - Nothing
 */
declare function TypedItemCreatePublishActionFunction({ scriptHooks, functionPrefix }: TypedItemData): void;
/**
 * Generates an asset's AllowType property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
declare function TypedItemGenerateAllowType({ asset, options }: TypedItemData): void;
/**
 * Generates an asset's AllowEffect property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
declare function TypedItemGenerateAllowEffect({ asset, options }: TypedItemData): void;
/**
 * Generates an asset's AllowBlock property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
declare function TypedItemGenerateAllowBlock({ asset, options }: TypedItemData): void;
/**
 * Generates an asset's AllowHide & AllowHideItem properties based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
declare function TypedItemGenerateAllowHide({ asset, options }: TypedItemData): void;
/**
 * Generates an asset's AllowTint property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
declare function TypedItemGenerateAllowTint({ asset, options }: TypedItemData): void;
/**
 * Generates an asset's AllowLockType property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
declare function TypedItemGenerateAllowLockType({ asset, options }: TypedItemData): void;
/**
 * Sets the AllowLock and AllowLockType properties on an asset based on an AllowLockType array and the total number of
 * possible types.
 * @param {Asset} asset - The asset to set properties on
 * @param {readonly string[]} allowLockType - The AllowLockType array indicating which of the asset's types permit locks
 * @param {number} typeCount - The total number of types available on the asset
 * @returns {void} - Nothing
 */
declare function TypedItemSetAllowLockType(asset: Asset, allowLockType: readonly string[], typeCount: number): void;
/**
 * @param {Asset} asset - The asset whose subscreen is being registered
 * @param {TypedItemConfig} config - The parent item's typed item configuration
 */
declare function TypedItemRegisterSubscreens(asset: Asset, config: TypedItemConfig): void;
/**
 * Constructs the chat message dictionary for the typed item based on the items configuration data.
 * @param {ExtendedItemChatData<ExtendedItemOption>} ChatData - The chat data that triggered the message.
 * @param {TypedItemData} data - The typed item data for the asset
 * @returns {ChatMessageDictionary} - The dictionary for the item based on its required chat tags
 */
declare function TypedItemBuildChatMessageDictionary(ChatData: ExtendedItemChatData<ExtendedItemOption>, { asset, chatTags, dictionary }: TypedItemData): ChatMessageDictionary;
/**
 * Returns the options configuration array for a typed item
 * @param {AssetGroupName} groupName - The name of the asset group
 * @param {string} assetName - The name of the asset
 * @returns {ExtendedItemOption[]|null} - The options array for the item, or null if no typed item data was found
 */
declare function TypedItemGetOptions(groupName: AssetGroupName, assetName: string): ExtendedItemOption[] | null;
/**
 * Returns a list of typed item option names available for the given asset, or an empty array if the asset is not typed
 * @param {AssetGroupName} groupName - The name of the asset group
 * @param {string} assetName - The name of the asset
 * @returns {string[]} - The option names available for the asset, or an empty array if the asset is not typed or no
 * typed item data was found
 */
declare function TypedItemGetOptionNames(groupName: AssetGroupName, assetName: string): string[];
/**
 * Returns the named option configuration object for a typed item
 * @param {AssetGroupName} groupName - The name of the asset group
 * @param {string} assetName - The name of the asset
 * @param {string} optionName - The name of the option
 * @returns {ExtendedItemOption|null} - The named option configuration object, or null if none was found
 */
declare function TypedItemGetOption(groupName: AssetGroupName, assetName: string, optionName: string): ExtendedItemOption | null;
/**
 * Validates a selected option. A typed item may provide a custom validation function. Returning a non-empty string from
 * the validation function indicates that the new option is not compatible with the character's current state (generally
 * due to prerequisites or other requirements).
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose options are being validated
 * @param {ExtendedItemOption|ModularItemOption} option - The new option
 * @param {ExtendedItemOption|ModularItemOption} previousOption - The previously applied option
 * @returns {string|undefined} - undefined or an empty string if the validation passes. Otherwise, returns a string
 * message informing the player of the requirements that are not met.
 */
declare function TypedItemValidateOption(C: Character, item: Item, option: ExtendedItemOption | ModularItemOption, previousOption: ExtendedItemOption | ModularItemOption): string | undefined;
/**
 * Sets a typed item's type and properties to the option whose name matches the provided option name parameter.
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item | AssetGroupName} itemOrGroupName - The item whose type to set, or the group name for the item
 * @param {string} optionName - The name of the option to set
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @returns {string|undefined} - undefined or an empty string if the type was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
declare function TypedItemSetOptionByName(C: Character, itemOrGroupName: Item | AssetGroupName, optionName: string, push?: boolean): string | undefined;
/**
 * Sets a typed item's type and properties to the option provided.
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose type to set
 * @param {readonly ExtendedItemOption[]} options - The typed item options for the item
 * @param {ExtendedItemOption} option - The option to set
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @returns {string|undefined} - undefined or an empty string if the type was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
declare function TypedItemSetOption(C: Character, item: Item, options: readonly ExtendedItemOption[], option: ExtendedItemOption, push?: boolean): string | undefined;
/**
 * Finds the currently set option on the given typed item
 * @param {Item} item - The equipped item
 * @param {readonly ExtendedItemOption[]} options - The list of available options for the item
 * @returns {ExtendedItemOption} - The option which is currently applied to the item, or the first item in the options
 * array if no type is set.
 */
declare function TypedItemFindPreviousOption(item: Item, options: readonly ExtendedItemOption[]): ExtendedItemOption;
/**
 * Sets a typed item's type to a random option, respecting prerequisites and option validation.
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item | AssetGroupName} itemOrGroupName - The item whose type to set, or the group name for the item
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @returns {string|undefined} - undefined or an empty string if the type was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
declare function TypedItemSetRandomOption(C: Character, itemOrGroupName: Item | AssetGroupName, push?: boolean): string | undefined;
/**
 * Return {@link TypedItemData.dialog.chatPrefix} if it's a string or call it using chat data based on a fictional extended item option.
 * @param {string} Name - The name of the pseudo-type
 * @param {TypedItemData} Data - The extended item data
 * @returns {string} The dialogue prefix for the custom chatroom messages
 */
declare function TypedItemCustomChatPrefix(Name: string, Data: TypedItemData): string;
/**
 * Initialize the typed item properties
 * @type {ExtendedItemInitCallback}
 * @see {@link ExtendedItemInit}
 */
declare function TypedItemInit(Item: Item, C: Character, Refresh?: boolean): void;
/**
 * TypedItem.js
 * ------------
 * This file contains utilities related to typed extended items (items that allow switching between a selection of
 * different states). It is generally not necessary to call functions in this file directly - these are called from
 * Asset.js when an item is first registered.
 *
 * All dialogue for typed items should be added to `Dialog_Player.csv`. To implement a typed item, you need the
 * following dialogue entries (these dialogue keys can also be configured through the item's configuration if custom
 * dialogue keys are needed):
 *  * "<GroupName><AssetName>Select" - This is the text that will be displayed at the top of the extended item screen
 *    (usually a prompt for the player to select a type)
 *  * For each type:
 *    * "<GroupName><AssetName><TypeName>" - This is the display name for the given type
 *  * If the item's chat setting is configured to `TO_ONLY`, you will need a chatroom message for each type, which will
 *    be sent when that type is selected. It should have the format "<GroupName><AssetName>Set<TypeName>" (e.g.
 *    "ItemArmsLatexBoxtieLeotardSetPolished" - "SourceCharacter polishes the latex of DestinationCharacter leotard
 *    until it's shiny")
 *  * If the item's chat setting is configured to `FROM_TO`, you will need a chatroom message for each possible type
 *    pairing, which will be sent when the item's type changes from the first type to the second type. It should have
 *    the format "<GroupName><AssetName>Set<Type1>To<Type2>".
 */
/**
 * A lookup for the typed item configurations for each registered typed item
 * @const
 * @type {Record<string, TypedItemData>}
 * @see {@link TypedItemData}
 */
declare const TypedItemDataLookup: Record<string, TypedItemData>;
/**
 * An enum encapsulating the possible chatroom message settings for typed items
 * - TO_ONLY - The item has one chatroom message per type (indicating that the type has been selected)
 * - FROM_TO - The item has a chatroom message for from/to type pairing
 * - SILENT - The item doesn't publish an action when a type is selected.
 * @type {Record<"TO_ONLY"|"FROM_TO"|"SILENT", TypedItemChatSetting>}
 */
declare const TypedItemChatSetting: Record<"TO_ONLY" | "FROM_TO" | "SILENT", TypedItemChatSetting>;
