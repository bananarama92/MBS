declare const LZString: import("lz-string").LZStringStatic;

interface CharacterOnlineSharedSettings {
    MBS: {
        Version: string,
        FortuneWheelSets: (null | {
            name: string,
            itemList: readonly FortuneWheelItem[],
            stripLevel: StripLevel,
            equipLevel: StripLevel,
            flags: FortuneWheelFlags[],
            custom: boolean,
            hidden: boolean,
            preRunCallback: FortuneWheelPreRunCallback | null,
        })[],
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
    readonly Parent?: import("common_bc").WheelFortuneItemSet,
    /** The character ID of the item option's owner or `null` if it's not a custom item */
    readonly OwnerID?: null | number,
    /** The type of lock flavor */
    readonly Flag?: FortuneWheelFlags,
}
