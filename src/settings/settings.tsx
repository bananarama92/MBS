/** Function for managing all MBS related settings. */

import { omit, sumBy } from "lodash-es";

import {
    Version,
    trimArray,
    logger,
    isArray,
    entries,
    fromEntries,
} from "../common";
import {
    FWItemSet,
    FWCommand,
    sanitizeWheelFortuneIDs,
    MBS_MAX_SETS,
    MBS_MAX_ID_SETS,
    FWObject,
    waitForBC,
} from "../common_bc";
import { FORTUNE_WHEEL_DEFAULT_BASE } from "../fortune_wheel";
import { deleteDB } from "../crafting";
import { garblingJSON } from "../garbling";

import { showChangelog } from "./changelog";
import { measureDataSize, MAX_DATA, byteToKB } from "./storage_usage";

export type SettingsType = 0 | 1;

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
        logger.warn(`Failed to parse previous MBS version: ${versionString}`, error);
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


/** Show any errors encountered during settings parsing to the player via a beep. */
function showSettingsError(err: SettingsStatus.Base["err"]): void {
    const errFormat = fromEntries(entries(err).map(([k, v]): [string, string[]] => {
        return [
            k,
            v.map(i => i.join(", ")),
        ];
    }));
    const errString = JSON.stringify(errFormat, undefined, 4);
    const message = `Encountered one or more errors while parsing MBS settings:\n\n${errString}`;
    if (typeof Player.MemberNumber === "number") {
        ServerAccountBeep({
            MemberNumber: Player.MemberNumber,
            MemberName: "MBS",
            ChatRoomName: "MBS Settings Error",
            Private: true,
            Message: message,
            ChatRoomSpace: "",
            BeepType: "",
        });
    }
}

export function parseFWObjects<
    T extends FWSimpleItemSet | FWSimpleCommand,
    RT extends FWObject<FWObjectOption>,
>(
    constructor: (wheelList: (null | RT)[], kwargs: T) => RT,
    protoWheelList: (null | T)[],
    errList: [msg: string, ...rest: unknown[]][],
): (null | RT)[] {
    // Pad/trim the item sets if necessary
    if (!Array.isArray(protoWheelList)) {
        protoWheelList = [];
        errList.push([`Re-initializing invalid wheel of fortune item list: ${typeof protoWheelList}`]);
    } else if (protoWheelList.length > MBS_MAX_SETS) {
        trimArray(protoWheelList, MBS_MAX_SETS);
        errList.push([`Trimming too long wheel of fortune item list: ${protoWheelList.length}/${MBS_MAX_SETS}`]);
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
            errList.push([`Failed to load corrupted custom wheel of fortune item ${i}`, ex]);
        }
    });
    return wheelList;
}

function parsePresetArray(
    presets: (null | WheelPreset)[],
    errList: [msg: string, ...rest: unknown[]][],
): (null | WheelPreset)[] {
    // Pad/trim the item sets if necessary
    if (!Array.isArray(presets)) {
        presets = [];
        errList.push([`Re-initializing invalid wheel of fortune preset list: ${typeof presets}`]);
    } else if (presets.length > MBS_MAX_ID_SETS) {
        trimArray(presets, MBS_MAX_ID_SETS);
        errList.push([`Trimming too long wheel of fortune preset list: ${presets.length}/${MBS_MAX_ID_SETS}`]);
    }

    const ret: (null | WheelPreset)[] = Object.seal(Array(MBS_MAX_ID_SETS).fill(null));
    presets.forEach((preset, i) => {
        if (preset === null) {
            return;
        } else if (Array.isArray(preset) || typeof preset !== "object" || typeof preset.ids !== "string") {
            errList.push([`Failed to load corrupted custom wheel of fortune preset ${i}`]);
            return;
        }

        const { name, ids } = preset;
        ret[i] = {
            name: (typeof name === "string" && name.length > 0 && name.length <= 20) ? name : `Preset ${i}`,
            ids,
        };
    });
    return ret;
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

/** Parsed the passed protosettings */
function parseProtoSettings(s: MBSProtoSettings): SettingsStatus.Base {
    const err: Required<SettingsStatus.Base["err"]> = {
        AlternativeGarbling: [],
        CraftingCache: [],
        DropTrailing: [],
        FortuneWheelCommands: [],
        FortuneWheelItemSets: [],
        FortuneWheelPresets: [],
        LockedWhenRestrained: [],
        GarblePerSyllable: [],
        RollWhenRestrained: [],
        ShowChangelog: [],
        Version: [],
    };

    const scalars = {
        AlternativeGarbling: false,
        DropTrailing: false,
        GarblePerSyllable: false,
        LockedWhenRestrained: false,
        RollWhenRestrained: true,
        ShowChangelog: true,
    } satisfies { [k in keyof typeof err]?: number | boolean | string };

    for (const [field, defaultValue] of entries(scalars as Record<keyof typeof scalars, unknown>)) {
        if (s[field] === undefined) {
            continue;
        } else if (typeof s[field] !== typeof defaultValue) {
            err[field] = [[`Invalid type, expected a ${typeof defaultValue}: ${typeof err[field]}`]];
        } else {
            (scalars as Record<string, unknown>)[field] = s[field];
        }
    }

    const settings: MBSSettings = {
        AlternativeGarbling: scalars.AlternativeGarbling,
        CraftingCache: typeof s.CraftingCache === "string" ? s.CraftingCache : undefined,
        DropTrailing: scalars.DropTrailing,
        FortuneWheelCommands: parseFWObjects(FWCommand.fromObject, s.FortuneWheelCommands ?? [], err.FortuneWheelCommands),
        FortuneWheelItemSets: parseFWObjects(FWItemSet.fromObject, s.FortuneWheelSets ?? s.FortuneWheelItemSets ?? [], err.FortuneWheelItemSets),
        FortuneWheelPresets: parsePresetArray(s.FortuneWheelPresets ?? [], err.FortuneWheelPresets),
        LockedWhenRestrained: scalars.LockedWhenRestrained,
        GarblePerSyllable: scalars.GarblePerSyllable,
        RollWhenRestrained: scalars.RollWhenRestrained,
        ShowChangelog: scalars.ShowChangelog,
        Version: MBS_VERSION,
    };
    if (settings.AlternativeGarbling) {
        garblingJSON.init();
    }
    const ok = sumBy(Object.values(err).map(lst => lst.length)) === 0;
    return {
        settings,
        ok,
        err: fromEntries(entries(err).filter(([_, v]) => v.length > 0)),
    };

}

/** Initialize the MBS settings. */
function initMBSSettings(
    settings: null | MBSProtoSettings = null,
    allowFailure: boolean = true,
): SettingsStatus.Base {
    if (Player.OnlineSharedSettings === undefined) {
        throw new Error("\"Player.OnlineSharedSettings\" still uninitialized");
    }

    // Load saved settings and check whether MBS has been upgraded
    settings ??= {
        ...unpackSettings(Player.OnlineSettings?.MBS, "OnlineSettings"),
        ...unpackSettings(Player.ExtensionSettings.MBS, "ExtensionSettings"),
        ...unpackSettings(Player.OnlineSharedSettings.MBS, "OnlineSharedSettings"),
    };

    const newVersion = (
        settings.Version !== undefined
        && detectUpgrade(Player.OnlineSharedSettings.MBSVersion ?? Player.OnlineSettings?.MBSVersion)
    );

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

    const settingsStatus = parseProtoSettings(settings);
    if (settingsStatus.ok || allowFailure) {
        Player.MBSSettings = settingsStatus.settings;
        if (Player.MBSSettings.ShowChangelog && newVersion) {
            const version = Version.fromVersion(MBS_VERSION);
            showChangelog(`v${version.major}${version.minor}${version.micro}`);
        }
    }
    if (!settingsStatus.ok) {
        logger.warn("Encountered and fixed one or more errors while parsing MBS settings", settingsStatus.err);
        if (allowFailure) {
            showSettingsError(settingsStatus.err);
        }
    }

    // Ensure that the player's wheel of fortune settings are initialized
    Player.OnlineSharedSettings.WheelFortune ??= WheelFortuneDefault;

    return settingsStatus;
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
    Player.Crafting = Player.Crafting.slice(0, GameVersion === "R120" ? 80 : 200);
    Player.MBSSettings = Object.seal({
        AlternativeGarbling: false,
        CraftingCache: undefined,
        DropTrailing: false,
        FortuneWheelCommands: Object.seal(Array(MBS_MAX_SETS).fill(null)),
        FortuneWheelItemSets: Object.seal(Array(MBS_MAX_SETS).fill(null)),
        FortuneWheelPresets: Object.seal(Array(MBS_MAX_ID_SETS).fill(null)),
        GarblePerSyllable: false,
        LockedWhenRestrained: false,
        RollWhenRestrained: true,
        ShowChangelog: true,
        Version: MBS_VERSION,
    });
    deleteDB(Player.MemberNumber);

    ServerAccountUpdate.QueueData({
        ExtensionSettings: Player.ExtensionSettings,
        OnlineSharedSettings: Player.OnlineSharedSettings,
    }, true);

    logger.log("Settings successfully reset");
    logSettingsSize();
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

/** Log the players {@link ExtensionSettings} and {@link OnlineSharedSettings} size. */
export function logSettingsSize() {
    const fields = ["ExtensionSettings", "OnlineSharedSettings"] as const;
    for (const fieldName of fields) {
        const dataB = measureDataSize(Player[fieldName]);
        const dataKB = Object.fromEntries(Object.entries(dataB).map(([k, v]) => [k, byteToKB(v)]));
        const nKB = byteToKB(sumBy(Object.values(dataB), (i) => Number.isNaN(i) ? 0 : i));
        if (nKB >= (MAX_DATA * 0.9 / 1000)) {
            logger.warn(`Total ${fieldName} data usage at ${nKB} / ${MAX_DATA / 1000} KB`, dataKB);
        } else {
            logger.log(`Total ${fieldName} data usage at ${nKB} / ${MAX_DATA / 1000} KB`, dataKB);
        }
    }
}

/**
 * Stringify, compress and return the players MBS settings
 * @returns The Base64-compressed MBS settings
 */
export function exportSettings() {
    return LZString.compressToBase64(JSON.stringify(Player.MBSSettings));
}

export const SettingsStatus = Object.freeze({
    OK: 0,
    ERROR: 1,
    EMPTY_SETTINGS: 2,
    WARN: 3,
}) satisfies Record<string, SettingsStatus>;

/**
 * Import and assign the passed compressed MBS settings.
 * @param base64 The Base64-compressed MBS settings
 * @returns Whether the settings were successfully parsed
 */
export function importSettings(base64: string): SettingsStatus.Expanded {
    logger.log("Importing new MBS settings");

    let protoSettings: null | MBSProtoSettings = null;
    let err: unknown = null;
    try {
        protoSettings = JSON.parse(LZString.decompressFromBase64(base64.trim()) || "{}");
    } catch (error) {
        err = error;
    }

    if (err || protoSettings === null || typeof protoSettings !== "object" || isArray(protoSettings)) {
        logger.error("Aborting, failed to parse corrupted MBS settings", err);
        return { status: SettingsStatus.ERROR, ok: false };
    } else if (Object.keys(protoSettings).length === 0) {
        logger.error("Aborting, detected empty or corrupted MBS settings");
        return { status: SettingsStatus.EMPTY_SETTINGS, ok: false };
    }

    const status = initMBSSettings(protoSettings, false);
    if (!status.ok) {
        return { status: SettingsStatus.WARN, ...status };
    }

    pushMBSSettings([SettingsType.SETTINGS, SettingsType.SHARED], true);
    logSettingsSize();
    return { status: SettingsStatus.OK, ...status };
}

waitForBC("settings", {
    async afterLogin() {
        initMBSSettings();
        pushMBSSettings([SettingsType.SETTINGS, SettingsType.SHARED], false);
        logger.log("Initializing settings module");
        logSettingsSize();
    },
});
