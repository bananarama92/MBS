/** Function for managing all MBS related settings. */

import { omit } from "lodash-es";

import {
    waitFor,
    Version,
    trimArray,
    logger,
} from "../common";
import {
    FWItemSet,
    FWCommand,
    settingsLoaded,
    sanitizeWheelFortuneIDs,
    MBS_MAX_SETS,
    FWObject,
} from "../common_bc";
import { FORTUNE_WHEEL_DEFAULT_BASE } from "../fortune_wheel";
import { BC_SLOT_MAX_ORIGINAL } from "../crafting";

type SettingsType = 0 | 1;

/** An enum with to-be synced settings types */
export const SettingsType = Object.freeze({
    /** @see {@link Player.ExtensionSettings} */
    SETTINGS: 0,
    /** @see {@link Player.OnlineSharedSettings} */
    SHARED: 1,
});

/** Check whether MBS has just been upgraded for the user in question. */
function detectUpgrade(versionString?: string): boolean {
    if (versionString === undefined) {
        logger.log("Detecting first-time MBS initialization");
        return false;
    }

    const newVersion = Version.fromVersion(MBS_VERSION);
    let oldVersion: Version;
    try {
        oldVersion = Version.fromVersion(versionString);
    } catch (error) {
        logger.warn(`Failed to parse previous MBS version: ${versionString}`);
        return false;
    }

    if (newVersion.greater(oldVersion)) {
        logger.log(`Upgrading MBS from ${versionString} to ${MBS_VERSION}`);
        return true;
    } else if (newVersion.lesser(oldVersion)) {
        logger.warn(`Downgrading MBS from ${versionString} to ${MBS_VERSION}`);
        return false;
    } else {
        return false;
    }
}

/** Construct a git tag and a tag for the `changelog.md` file given the current MBS version. */
function getGitTags(): [gitTag: string, mdTag: string] {
    const version = Version.fromVersion(MBS_VERSION);
    const mdTag = `#v${version.major}${version.minor}${version.micro}`;
    return version.beta ? ["blob/devel", ""] : ["blob/main", mdTag];
}

/** Return the URL to the MBS changelog */
export function getChangeLogURL(): string {
    const mbs_tags = getGitTags();
    return `https://github.com/bananarama92/MBS/${mbs_tags[0]}/CHANGELOG.md${mbs_tags[1]}`;
}

/** Show the MBS changelog to the player */
function showChangelog(): void {
    const message = `New MBS version detected: ${MBS_VERSION}

See below for the updated changelog:
${getChangeLogURL()}`;
    ServerAccountBeep({
        MemberNumber: Player.MemberNumber,
        MemberName: "MBS",
        ChatRoomName: "MBS Changelog",
        Private: true,
        Message: message,
        ChatRoomSpace: "",
    });
}

export function parseFWObjects<
    T extends FWSimpleItemSet | FWSimpleCommand,
    RT extends FWObject<FWObjectOption>,
>(
    constructor: (wheelList: (null | RT)[], kwargs: T) => RT,
    protoWheelList?: (null | T)[],
): (null | RT)[] {
    // Pad/trim the item sets if necessary
    if (!Array.isArray(protoWheelList)) {
        protoWheelList = [];
    } else if (protoWheelList.length > MBS_MAX_SETS) {
        trimArray(protoWheelList, MBS_MAX_SETS);
    }

    const wheelList: (null | RT)[] = Object.seal(Array(MBS_MAX_SETS).fill(null));
    protoWheelList.forEach((simpleObject, i) => {
        if (simpleObject === null) {
            return;
        }
        try {
            const wheelObject = wheelList[i] = constructor(wheelList, simpleObject);
            wheelObject.register(false);
        } catch (ex) {
            logger.warn(`Failed to load corrupted custom wheel of fortune item ${i}:`, ex);
        }
    });
    return wheelList;
}

/**
 * Load the compressed MBS (shared) settings
 * @param s The to-be unpacked settings
 * @param type The settings type (shared or normal)
 * @param warn Whether to emit a warning if the settings unpacking raises
 * @returns The unpacked settings
 */
export function unpackSettings(
    s: undefined | string,
    type: "OnlineSettings" | "ExtensionSettings" | "OnlineSharedSettings",
    warn: boolean = true,
): MBSProtoSettings {
    let settings: null | MBSProtoSettings = null;
    try {
        if (s && typeof s === "string") {
            let stringData = LZString.decompressFromUTF16(s);
            if (!stringData) {
                // Try again with pre-v0.6.23 compression
                stringData = LZString.decompressFromBase64(s);
            }
            settings = JSON.parse(stringData || "null");
        }
    } catch (error) {
        if (warn) {
            logger.warn(`failed to load corrupted MBS ${type}`, error);
        }
    }
    return (settings !== null && typeof settings === "object") ? settings : {};
}

/** Initialize the MBS settings. */
function initMBSSettings(): void {
    if (Player.OnlineSharedSettings === undefined) {
        throw new Error("\"Player.OnlineSharedSettings\" still uninitialized");
    }

    // Load saved settings and check whether MBS has been upgraded
    const settings = {
        ...unpackSettings(Player.OnlineSettings?.MBS, "OnlineSettings"),
        ...unpackSettings(Player.ExtensionSettings.MBS, "ExtensionSettings"),
        ...unpackSettings(Player.OnlineSharedSettings.MBS, "OnlineSharedSettings"),
    };

    if (settings.Version !== undefined && detectUpgrade(Player.OnlineSharedSettings.MBSVersion ?? Player.OnlineSettings?.MBSVersion)) {
        showChangelog();
    }

    // Moved to `Player.OnlineSharedSettings` as of v0.6.26
    let syncOnlineSettings = false;
    if (Player.OnlineSettings?.MBSVersion !== undefined) {
        delete Player.OnlineSettings.MBSVersion;
        syncOnlineSettings = true;
    }

    // Moved to `Player.ExtensionSettings` as of v1.1.0
    if (Player.OnlineSettings?.MBS) {
        delete Player.OnlineSettings.MBS;
        syncOnlineSettings = true;
    }

    // Remove pre-v1.1.0 `Player.OnlineSettings` leftovers
    if (syncOnlineSettings) {
        ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
    }

    // Check the crafting cache
    if (typeof settings.CraftingCache !== "string") {
        settings.CraftingCache = "";
    }

    // Swap out the deprecated alias
    if (settings.FortuneWheelSets !== undefined) {
        settings.FortuneWheelItemSets = settings.FortuneWheelSets;
    }

    Player.MBSSettings = Object.seal({
        Version: MBS_VERSION,
        CraftingCache: settings.CraftingCache,
        FortuneWheelItemSets: parseFWObjects(FWItemSet.fromObject, settings.FortuneWheelItemSets ?? []),
        FortuneWheelCommands: parseFWObjects(FWCommand.fromObject, settings.FortuneWheelCommands ?? []),
        LockedWhenRestrained: typeof settings.LockedWhenRestrained === "boolean" ? settings.LockedWhenRestrained : false,
        RollWhenRestrained: typeof settings.RollWhenRestrained === "boolean" ? settings.RollWhenRestrained : true,
    });

    // Ensure that the player's wheel of fortune settings are initialized
    if (Player.OnlineSharedSettings.WheelFortune == null) {
        Player.OnlineSharedSettings.WheelFortune = WheelFortuneDefault;
    }
}

/**
 * Clear all MBS settings.
 */
export function clearMBSSettings(): void {
    // @ts-expect-error
    delete Player.ExtensionSettings.MBS;
    if (Player.OnlineSharedSettings !== undefined) {
        // @ts-expect-error
        delete Player.OnlineSharedSettings.MBSVersion;
        // @ts-expect-error
        delete Player.OnlineSharedSettings.MBS;
        Player.OnlineSharedSettings.WheelFortune = FORTUNE_WHEEL_DEFAULT_BASE;
    }

    WheelFortuneOption = WheelFortuneOption.filter(o => o.Custom !== true);
    WheelFortuneDefault = FORTUNE_WHEEL_DEFAULT_BASE;
    Player.Crafting = Player.Crafting?.slice(0, BC_SLOT_MAX_ORIGINAL);
    Player.MBSSettings = Object.seal({
        Version: MBS_VERSION,
        CraftingCache: "",
        FortuneWheelItemSets: Object.seal(Array(MBS_MAX_SETS).fill(null)),
        FortuneWheelCommands: Object.seal(Array(MBS_MAX_SETS).fill(null)),
        LockedWhenRestrained: false,
        RollWhenRestrained: true,
    });

    ServerAccountUpdate.QueueData({
        ExtensionSettings: Player.ExtensionSettings,
        OnlineSharedSettings: Player.OnlineSharedSettings,
    }, true);
}

/**
 * Update the online (shared) settings and push all MBS settings to the server.
 * @param settingsType Which type of settings should be updated
 * @param push Whether to actually push to the server or to merely assign the online (shared) settings.
 */
export function pushMBSSettings(settingsType: readonly SettingsType[], push: boolean = true): void {
    if (Player.OnlineSharedSettings === undefined) {
        throw new Error("Player.OnlineSharedSettings is still uninitialized");
    }

    const data: Record<string, any> = {};

    if (settingsType.includes(SettingsType.SETTINGS)) {
        const settings = omit(Player.MBSSettings, "FortuneWheelItemSets", "FortuneWheelCommands");
        Player.ExtensionSettings.MBS = LZString.compressToUTF16(JSON.stringify(settings));
        if (push) {
            data["ExtensionSettings.MBS"] = Player.ExtensionSettings.MBS;
        }
    }

    if (settingsType.includes(SettingsType.SHARED)) {
        const settings = Object.freeze({
            FortuneWheelItemSets: Player.MBSSettings.FortuneWheelItemSets,
            FortuneWheelCommands: Player.MBSSettings.FortuneWheelCommands,
        });
        Player.OnlineSharedSettings.MBS = LZString.compressToUTF16(JSON.stringify(settings));
        Player.OnlineSharedSettings.MBSVersion = MBS_VERSION;
        if (push) {
            Player.OnlineSharedSettings.WheelFortune = sanitizeWheelFortuneIDs(Player.OnlineSharedSettings.WheelFortune);
            data.OnlineSharedSettings = Player.OnlineSharedSettings;
        }
    }

    if (push) {
        ServerAccountUpdate.QueueData(data);
    }
}

waitFor(settingsLoaded).then(() => {
    initMBSSettings();
    pushMBSSettings([SettingsType.SETTINGS, SettingsType.SHARED], false);
    logger.log("Initializing settings module");
});