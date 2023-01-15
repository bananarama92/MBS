interface FortuneWheelOptionBase {
    /** A single-character UTF16 string with the option's ID */
    ID: string,
    /** The color of the option button */
    Color: FortuneWheelColor,
    /** An optional script that will be executed whenever the option is picked */
    Script?: () => void,
    /** An optional description of the option */
    Description?: string,
    /** Whether the option should be enabled by default */
    Default?: boolean,
}

interface FortuneWheelOption extends FortuneWheelOptionBase{
    /** An script that will be executed whenever the option is picked */
    Script: () => void,
    /** An description of the option */
    Description: string,
    /** Whether the option should be enabled by default */
    Default: boolean,
}

interface FortuneWheelItemBase {
    /** The name of the item */
    Name: string,
    /** The group of the item */
    Group: AssetGroupName,
    /** The optional color of the item */
    Color?: readonly string[],
    /** An optional callback whose output denotes whether the item should be equiped */
    Equip?: () => boolean,
    /** Optional crafted item data */
    Craft?: Partial<CraftingItem>,
    /** An optional callback for post-processing the item after it's equiped and its type is set */
    ItemCallback?: FortuneWheelCallback;
}

interface FortuneWheelItem extends FortuneWheelItemBase {
    /** Optional crafted item data */
    Craft?: CraftingItem,
}

type FortuneWheelNames = "leash_candy" | "mummy" | "maid";
type FortuneWheelItemSets = Record<FortuneWheelNames, Readonly<FortuneWheelItem>[]>;
type FortuneWheelOptions = Record<string, Readonly<FortuneWheelOption>>;
type FortuneWheelCallback = (item: Item) => void;
type FortuneWheelColor = "Blue" | "Gold" | "Gray" | "Green" | "Orange" | "Purple" | "Red" | "Yellow";

interface MBSSettings {
    /** The MBS version */
    readonly Version: string,
    /** A backup string containing the serialized crafting data of all crafting items beyond the BC default */
    CraftingCache: string,
}
