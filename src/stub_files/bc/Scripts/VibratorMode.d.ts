/**
 * Registers a vibrator item. This automatically creates the item's load, draw, click and scriptDraw functions.
 * @param {Asset} asset - The asset being registered
 * @param {VibratingItemConfig | undefined} config - The item's vibrator item configuration
 * @returns {void} - Nothing
 */
declare function VibratorModeRegister(asset: Asset, config?: VibratingItemConfig | undefined): void;
/**
 * Generates an asset's vibrating item data
 * @param {Asset} asset - The asset to generate vibrating item data for
 * @param {VibratingItemConfig} config - The item's extended item configuration
 * @returns {VibratingItemData} - The generated vibrating item data for the asset
 */
declare function VibratorModeCreateData(asset: Asset, { Options, ScriptHooks }: VibratingItemConfig): VibratingItemData;
/**
 * Creates an asset's extended item load function
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeCreateLoadFunction({ options, functionPrefix, scriptHooks }: VibratingItemData): void;
/**
 * Creates an asset's extended item draw function
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeCreateDrawFunction({ options, functionPrefix, scriptHooks }: VibratingItemData): void;
/**
 * Creates an asset's extended item click function
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeCreateClickFunction({ options, functionPrefix, scriptHooks }: VibratingItemData): void;
/**
 * Creates an asset's extended item exit function
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeCreateExitFunction({ functionPrefix, scriptHooks }: VibratingItemData): void;
/**
 * Creates an asset's dynamic script draw function
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeCreateScriptDrawFunction({ dynamicAssetsFunctionPrefix }: VibratingItemData): void;
/**
 * Sets asset properties common to all vibrating items
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeSetAssetProperties(data: VibratingItemData): void;
/**
 * Sets the AllowEffect property for a vibrating item
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeSetAllowEffect({ asset, options }: VibratingItemData): void;
/**
 * Sets the Effect property for a vibrating item
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
declare function VibratorModeSetEffect({ asset }: VibratingItemData): void;
/**
 * Common load function for vibrators
 * @param {VibratorModeSet[]} [Options] - The vibrator mode sets to load the item with
 * @returns {void} - Nothing
 */
declare function VibratorModeLoad(Options?: VibratorModeSet[]): void;
/**
 * Common draw function for vibrators
 * @param {VibratorModeSet[]} Options - The vibrator mode sets to draw for the item
 * @param {number} [Y] - The y-coordinate at which to start drawing the controls
 * @returns {void} - Nothing
 */
declare function VibratorModeDraw(Options: VibratorModeSet[], Y?: number): void;
/**
 * Common draw function for drawing the control sets of the extended item menu screen for a vibrator
 * @param {VibratorModeSet[]} Options - The vibrator mode sets to draw for the item
 * @param {number} [Y] - The y-coordinate at which to start drawing the controls
 * @returns {void} - Nothing
 */
declare function VibratorModeDrawControls(Options: VibratorModeSet[], Y?: number): void;
/**
 * Common click function for vibrators
 * @param {VibratorModeSet[]} Options - The vibrator mode sets for the item
 * @param {number} [Y] - The y-coordinate at which the extended item controls were drawn
 * @returns {void} - Nothing
 */
declare function VibratorModeClick(Options: VibratorModeSet[], Y?: number): void;
/**
 * Gets a vibrator mode from VibratorModeOptions
 * @param {VibratorMode} ModeName - The name of the mode from VibratorMode, e.g. VibratorMode.OFF
 * @returns {ExtendedItemOption} - The option gotten
 */
declare function VibratorModeGetOption(ModeName: VibratorMode): ExtendedItemOption;
/**
 * Manually set a vibrating item's mode
 * @param {Item} Item
 * @param {VibratorMode} Mode
 */
declare function VibratorModeSetMode(Item: Item, Mode: VibratorMode): void;
/**
 * Sets a vibrating item's option and publishes the corresponding chatroom message
 * @param {ExtendedItemOption} Option - The extended item option defining the new mode to be set
 * @returns {void} - Nothing
 */
declare function VibratorModeSetOption(Option: ExtendedItemOption): void;
/**
 * Helper function to set dynamic properties on an item
 * @param {object} Property - The Property object to initialise
 * @returns {void} - Nothing
 */
declare function VibratorModeSetDynamicProperties(Property: object): void;
/**
 * Common dynamic script draw function for vibrators. This function is called every frame. TO make use of dynamic script draw on vibrators,
 * ensure your item has a `Assets<AssetGroup><AssetName>ScriptDraw` function defined that calls this function, and that your asset
 * definition in Female3DCG.js has `DynamicScriptDraw: true` set. See the Heart Piercings for examples.
 * @type {DynamicScriptDrawCallback}
 */
declare function VibratorModeScriptDraw(Data: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
/**
 * Vibrator update function for the Random mode
 * @param {Item} Item - The item that is being updated
 * @param {Character} C - The character that the item is equipped on
 * @param {object} PersistentData - Persistent animation data for the item
 * @returns {void} - Nothing
 */
declare function VibratorModeUpdateRandom(Item: Item, C: Character, PersistentData: object): void;
/**
 * Vibrator update function for the Escalate mode
 * @param {Item} Item - The item that is being updated
 * @param {Character} C - The character that the item is equipped on
 * @param {object} PersistentData - Persistent animation data for the item
 * @returns {void} - Nothing
 */
declare function VibratorModeUpdateEscalate(Item: Item, C: Character, PersistentData: object): void;
/**
 * Vibrator update function for the Tease mode
 * @param {Item} Item - The item that is being updated
 * @param {Character} C - The character that the item is equipped on
 * @param {object} PersistentData - Persistent animation data for the item
 * @returns {void} - Nothing
 */
declare function VibratorModeUpdateTease(Item: Item, C: Character, PersistentData: object): void;
/**
 * Vibrator update function for the Deny mode
 * @param {Item} Item - The item that is being updated
 * @param {Character} C - The character that the item is equipped on
 * @param {object} PersistentData - Persistent animation data for the item
 * @returns {void} - Nothing
 */
declare function VibratorModeUpdateDeny(Item: Item, C: Character, PersistentData: object): void;
/**
 * Vibrator update function for the Edge mode
 * @param {Item} Item - The item that is being updated
 * @param {Character} C - The character that the item is equipped on
 * @param {object} PersistentData - Persistent animation data for the item
 * @returns {void} - Nothing
 */
declare function VibratorModeUpdateEdge(Item: Item, C: Character, PersistentData: object): void;
/**
 * Vibrator update function for vibrator state machine modes
 * @param {Item} Item - The item that is being updated
 * @param {Character} C - The character that the item is equipped on
 * @param {object} PersistentData - Persistent animation data for the item
 * @param {VibratorModeState[]} TransitionsFromDefault - The possible vibrator states that may be transitioned to from
 * the default state
 * @returns {void} - Nothing
 */
declare function VibratorModeUpdateStateBased(Item: Item, C: Character, PersistentData: object, TransitionsFromDefault: VibratorModeState[]): void;
/**
 * Vibrator update function for vibrator state machine modes in the Default state
 * @param {Character} C - The character that the item is equipped on
 * @param {number} Arousal - The current arousal of the character
 * @param {number} TimeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
 * @param {VibratorIntensity} OldIntensity - The current intensity of the vibrating item
 * @param {VibratorModeState[]} TransitionsFromDefault - The possible vibrator states that may be transitioned to from
 * the default state
 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
 */
declare function VibratorModeStateUpdateDefault(C: Character, Arousal: number, TimeSinceLastChange: number, OldIntensity: VibratorIntensity, TransitionsFromDefault: VibratorModeState[]): StateAndIntensity;
/**
 * Vibrator update function for vibrator state machine modes in the Deny state
 * @param {Character} C - The character that the item is equipped on
 * @param {number} Arousal - The current arousal of the character
 * @param {number} TimeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
 * @param {VibratorIntensity} OldIntensity - The current intensity of the vibrating item
 * the default state
 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
 */
declare function VibratorModeStateUpdateDeny(C: Character, Arousal: number, TimeSinceLastChange: number, OldIntensity: VibratorIntensity): StateAndIntensity;
/**
 * Vibrator update function for vibrator state machine modes in the Orgasm state
 * @param {Character} C - The character that the item is equipped on
 * @param {number} Arousal - The current arousal of the character
 * @param {number} TimeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
 * @param {VibratorIntensity} OldIntensity - The current intensity of the vibrating item
 * the default state
 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
 */
declare function VibratorModeStateUpdateOrgasm(C: Character, Arousal: number, TimeSinceLastChange: number, OldIntensity: VibratorIntensity): StateAndIntensity;
/**
 * Vibrator update function for vibrator state machine modes in the Rest state
 * @param {Character} C - The character that the item is equipped on
 * @param {number} Arousal - The current arousal of the character
 * @param {number} TimeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
 * @param {VibratorIntensity} OldIntensity - The current intensity of the vibrating item
 * the default state
 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
 */
declare function VibratorModeStateUpdateRest(C: Character, Arousal: number, TimeSinceLastChange: number, OldIntensity: VibratorIntensity): StateAndIntensity;
/**
 * Correctly sets the Property on a vibrator according to the new property. This function preserves persistent effects on the item like lock
 * effects.
 * @param {Item} Item - The item on which to set the new properties
 * @param {object} Property - The new properties to set. The Property object may include dynamic setter functions
 * @returns {void} - Nothing
 */
declare function VibratorModeSetProperty(Item: Item, Property: object): void;
/**
 * Publishes a chatroom message for an automatic change in vibrator intensity. Does nothing if the vibrator's intensity
 * did not change.
 * @param {Character} C - The character that the vibrator is equipped on
 * @param {Item} Item - The vibrator item
 * @param {number} OldIntensity - The previous intensity of the vibrator
 * @param {number} Intensity - The new intensity of the vibrator
 * @returns {void} - Nothing
 */
declare function VibratorModePublish(C: Character, Item: Item, OldIntensity: number, Intensity: number): void;
/**
 * An enum for the possible vibrator modes
 * @readonly
 * @type {{OFF: "Off", LOW: "Low", MEDIUM: "Medium", HIGH: "High", MAXIMUM: "Maximum", RANDOM: "Random", ESCALATE: "Escalate", TEASE: "Tease", DENY: "Deny", EDGE: "Edge"}}
 */
declare var VibratorMode: {
    OFF: "Off";
    LOW: "Low";
    MEDIUM: "Medium";
    HIGH: "High";
    MAXIMUM: "Maximum";
    RANDOM: "Random";
    ESCALATE: "Escalate";
    TEASE: "Tease";
    DENY: "Deny";
    EDGE: "Edge";
};
/**
 * An enum for the possible vibrator states when a vibrator is in a state machine mode
 * @type {{DEFAULT: "Default", DENY: "Deny", ORGASM: "Orgasm", REST: "Rest"}}
 */
declare var VibratorModeState: {
    DEFAULT: "Default";
    DENY: "Deny";
    ORGASM: "Orgasm";
    REST: "Rest";
};
/**
 * An enum for the vibrator configuration sets that a vibrator can have
 * @type {{STANDARD: "Standard", ADVANCED: "Advanced"}}
 */
declare var VibratorModeSet: {
    STANDARD: "Standard";
    ADVANCED: "Advanced";
};
/**
 * A record of the various available vibrator sets of vibrator modes
 *
 * Note: Those really are ExtendedItemOption, but the ability for the advanced
 *       modes to automatically chose an intensity require a type override.
 *       VibratorModeSetDynamicProperties that those dynamic properties will
 *       get turned into the appropriate type.
 *
 * @type {{
 *     Standard: ExtendedItemOption[],
 *     Advanced: (ExtendedItemOption | {
 *         Name: string,
 *         Property: {
 *             Mode: VibratorMode,
 *             Intensity: number | (() => number),
 *             Effect: EffectName[] | ((Intensity: number) => EffectName[]),
 *         },
 *     })[]
 * }}
 * @constant
 */
declare var VibratorModeOptions: {
    Standard: ExtendedItemOption[];
    Advanced: (ExtendedItemOption | {
        Name: string;
        Property: {
            Mode: VibratorMode;
            Intensity: number | (() => number);
            Effect: EffectName[] | ((Intensity: number) => EffectName[]);
        };
    })[];
};
/**
 * An alias for the vibrators OFF mode. See {@link VibratorModeOptions}.
 */
declare const VibratorModeOff: ExtendedItemOption;
/**
 * A lookup for the vibrator configurations for each registered vibrator item
 * @const
 * @type {Record<string, VibratingItemData>}
 */
declare const VibratorModeDataLookup: Record<string, VibratingItemData>;
