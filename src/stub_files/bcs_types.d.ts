interface FortuneWheelOptionBase {
    ID: string,
    Color: string,
    Script?: () => void,
    Description?: string,
    Default?: boolean,
}

interface FortuneWheelOption extends FortuneWheelOptionBase{
    Script: () => void,
    Description: string,
    Default: boolean,
}

interface FortuneWheelItemBase {
    /** The name of the item */
    Name: string,
    /** The group of the item */
    Group: AssetGroupName,
    /** An optional callback whose output denotes whether the item should be equiped */
    Equip?: () => boolean,
    /** Optional crafted item data */
    Craft?: Partial<CraftingItem>,
    /** An optional callback for post-processing the item after it's equiped and its type is set */
    ItemCallback?: FortuneWheelCallback;
}

interface FortuneWheelItem extends FortuneWheelItemBase {
    Craft?: CraftingItem,
}

type FortuneWheelNames = "leash_candy";
type FortuneWheelItemSets = Readonly<Record<FortuneWheelNames, readonly Readonly<FortuneWheelItem>[]>>;
type FortuneWheelOptions = Record<string, Readonly<FortuneWheelOption>>;
type FortuneWheelCallback = (item: Item) => void;
