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
    /** @deprecated moved to {@link ExtensionSettings.MBS} as of v1.1.0 */
    MBS?: string,
    /** @deprecated moved to {@link CharacterOnlineSharedSettings.MBSVersion} as of v0.6.26 */
    MBSVersion?: string,
}

interface ExtensionSettings {
    /** UTF16-compressed MBS settings */
    MBS: string,
}

interface WheelFortuneOptionType {
    /** An optional description of the option */
    readonly Description?: string,
    /** Whether the option should be enabled by default */
    readonly Default?: boolean,
    /** Whether this is a custom user-specified option */
    readonly Custom?: boolean,
    /** The parent item set */
    readonly Parent?: import("../common_bc").FWObject<WheelFortuneOptionType>,
    /** The type of lock flavor */
    readonly Flag?: FWFlag,
    /** The weight of a particular option within the wheel of fortune */
    readonly Weight?: number,
}

// R110 backport
declare let CommandsChangelog: undefined | {
    Parse(innerHTML: string, options?: null | { id?: null | string, href?: null | string, startID?: null | string, stopID?: null | string }): HTMLDivElement,
    Publish(innerHTML: string, options?: null | { id?: null | string, href?: null | string, startID?: null | string, stopID?: null | string }): HTMLDivElement,
    _FilterContent(root: Element, startID: string, stopID?: null | string): void,
    _GetH1Button(id: string, header: HTMLHeadingElement, level: number): HTMLButtonElement,
    _GetHNButton(id: string, header: HTMLHeadingElement, level: number): HTMLButtonElement,
    _ParseHeader(root: Element, id: string, href: string, headerLevel: number, headerPrefix?: null | string): void,
    _ParseImg(root: Element): void,
    _ParseA(root: Element): void,
    _SetTranslationText(changelog: Element): Promise<void>,
};
