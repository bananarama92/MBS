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
    Name: string,
    Group: AssetGroupName,
    Equip?: () => boolean,
    Craft?: Partial<CraftingItem>,
    ItemCallbacks?: Record<string, FortuneWheelCallback>;
}

interface FortuneWheelItem extends FortuneWheelItemBase {
    Craft?: CraftingItem,
}

type FortuneWheelNames = "leash_candy";
type FortuneWheelItemSets = Readonly<Record<FortuneWheelNames, readonly Readonly<FortuneWheelItem>[]>>;
type FortuneWheelOptions = Record<string, Readonly<FortuneWheelOption>>;
type FortuneWheelCallback = (item: Item) => void;
