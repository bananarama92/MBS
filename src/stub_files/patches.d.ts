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
    readonly Flag?: FortuneWheelFlags,
}
