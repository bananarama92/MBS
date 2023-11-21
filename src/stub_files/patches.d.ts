interface CharacterOnlineSharedSettings {
    /** UTF16-compressed MBS shared settings */
    MBS: string,
    /** The MBS version */
    MBSVersion: string,
}

interface PlayerCharacter {
    /** MBS settings */
    MBSSettings: MBSSettings,
}

interface PlayerOnlineSettings {
    /** UTF16-compressed MBS settings */
    MBS: string,
    /** @deprecated moved to {@link CharacterOnlineSharedSettings.MBSVersion} as of v0.6.26 */
    MBSVersion?: string,
}

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
    /** The weight of a particular option within the wheel of fortune */
    readonly Weight?: number,
}
