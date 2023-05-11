declare const LZString: import("lz-string").LZStringStatic;

interface CharacterOnlineSharedSettings {
    MBS: {
        readonly Version: string,
        readonly FortuneWheelItemSets: (null | Readonly<FWSimpleItemSet>)[],
        readonly FortuneWheelCommands: (null | Readonly<FWSimpleCommand>)[],
    },
}

interface PlayerCharacter {
    MBSSettings: MBSSettings,
}

interface PlayerOnlineSettings {
    MBS: string,
}

/** Base type for fortune wheel options */
interface WheelFortuneOptionType {
    /** An optional description of the option */
    readonly Description?: string,
    /** Whether the option should be enabled by default */
    readonly Default?: boolean,
    /** Whether this is a custom user-specified option */
    readonly Custom?: boolean,
    /** The parent item set */
    readonly Parent?: import("common_bc").FWObject<WheelFortuneOptionType>,
    /** The type of lock flavor */
    readonly Flag?: FWFlag,
}

// R91 compatbility

/**
 * Sets a typed item's type and properties to the option provided.
 * @template {TypedItemOption | VibratingItemOption} T
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose type to set
 * @param {readonly T[]} options - The typed item options for the item
 * @param {T} option - The option to set
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @returns {string|undefined} - undefined or an empty string if the type was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
declare const TypedItemSetOption: undefined | (<T extends TypedItemOption | VibratingItemOption>(
    C: Character,
    item: Item,
    options: readonly T[],
    option: T,
    push?: boolean,
) => string | undefined);

/*
* Helper function for `InventoryWearCraft` for handling Modular items
* @param {Item} Item - The item being applied
* @param {Character} C - The character that must wear the item
* @param {string} Type - The type string for a modular item
* @returns {void}
*/
declare const InventoryWearCraftModular: undefined | ((Item: Item, C: Character, Type: string) => void);

/**
* Helper function for `InventoryWearCraft` for handling Typed items
* @param {Item} Item - The item being applied
* @param {Character} C - The character that must wear the item
* @param {string} Type - The type string for a modular item
* @returns {void}
*/
declare const InventoryWearCraftTyped: undefined | ((Item: Item, C: Character, Type: string) => void);

/**
* Helper function for `InventoryWearCraft` for handling Vibrating items
* @param {Item} Item - The item being applied
* @param {Character} C - The character that must wear the item
* @param {string} Type - The type string for a modular item
* @returns {void}
*/
declare const InventoryWearCraftVibrating: undefined | ((Item: Item, C: Character, Type: string) => void);

declare const ControllerActive: undefined | boolean;

/*
* removes all buttons from the lists
*/
declare const ClearButtons: undefined | (() => void);

interface Asset {
    TextMaxLength?: TextItemRecord<number>;
}
