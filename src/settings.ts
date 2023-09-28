/** Function for managing all MBS related settings. */

"use strict";

import {
    waitFor,
    MBS_VERSION,
    Version,
    trimArray,
} from "common";
import {
    FWItemSet,
    FWCommand,
    settingsLoaded,
    sanitizeWheelFortuneIDs,
    MBS_MAX_SETS,
    FWObject,
} from "common_bc";

/** Check whether MBS has just been upgraded for the user in question. */
function detectUpgrade(versionString?: string): boolean {
    if (versionString === undefined) {
        console.log("MBS: Detecting first-time MBS initialization");
        return false;
    }

    const newVersion = Version.fromVersion(MBS_VERSION);
    let oldVersion: Version;
    try {
        oldVersion = Version.fromVersion(versionString);
    } catch (error) {
        console.warn(`MBS: Failed to parse previous MBS version: ${versionString}`);
        return false;
    }

    if (newVersion.greater(oldVersion)) {
        console.log(`MBS: Upgrading MBS from ${versionString} to ${MBS_VERSION}`);
        return true;
    } else if (newVersion.lesser(oldVersion)) {
        console.warn(`MBS: Downgrading MBS from ${versionString} to ${MBS_VERSION}`);
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

/** Show the MBS changelog to the player */
function showChangelog(): void {
    const mbs_tags = getGitTags();
    const message = `New MBS version detected: ${MBS_VERSION}

See below for the updated changelog:
https://github.com/bananarama92/MBS/${mbs_tags[0]}/CHANGELOG.md${mbs_tags[1]}`;
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
            console.warn(`MBS: Failed to load corrupted custom wheel of fortune item ${i}:`, ex);
        }
    });
    return wheelList;
}

/** Initialize the MBS settings. */
function initMBSSettings(): void {
    if (Player.OnlineSettings === undefined || Player.OnlineSharedSettings === undefined) {
        const settingsName = Player.OnlineSettings === undefined ? "OnlineSettings" : "OnlineSharedSettings";
        throw new Error(`"Player.${settingsName}" still unitialized`);
    }

    // Load saved settings and check whether MBS has been upgraded
    let settings: null | MBSProtoSettings = null;
    try {
        if (Player.OnlineSettings.MBS) {
            let stringData = LZString.decompressFromUTF16(Player.OnlineSettings.MBS);
            if (!stringData) {
                // Try again with pre-v0.6.23 compression
                stringData = LZString.decompressFromBase64(Player.OnlineSettings.MBS);
            }
            settings = JSON.parse(stringData || "null");
        }
    } catch (error) {
        console.warn("MBS: failed to load corrupted MBS settings", error);
    }

    settings = (settings !== null && typeof settings === "object") ? settings : {};
    if (settings.Version !== undefined && detectUpgrade(settings.Version)) {
        showChangelog();
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
    });

    // Ensure that the player's wheel of fortune settings are initialized
    if (Player.OnlineSharedSettings.WheelFortune == null) {
        Player.OnlineSharedSettings.WheelFortune = WheelFortuneDefault;
    }
}

/**
 * Update the online (shared) settings and push all MBS settings to the server.
 * @param push Whether to actually push to the server or to merely assign the online (shared) settings.
 */
export function pushMBSSettings(push: boolean = true): void {
    if (Player.OnlineSettings === undefined || Player.OnlineSharedSettings === undefined) {
        const settingsName = Player.OnlineSettings === undefined ? "OnlineSettings" : "OnlineSharedSettings";
        throw new Error(`"Player.${settingsName}" still unitialized`);
    }

    const settings = {
        ...Player.MBSSettings,
        FortuneWheelItemSets: Player.MBSSettings.FortuneWheelItemSets.map(i => i?.valueOf() ?? null),
        FortuneWheelCommands: Player.MBSSettings.FortuneWheelCommands.map(i => i?.valueOf() ?? null),
    };
    Player.OnlineSettings.MBS = LZString.compressToUTF16(JSON.stringify(settings));
    Player.OnlineSharedSettings.MBS = Object.freeze({
        Version: MBS_VERSION,
        FortuneWheelItemSets: Player.MBSSettings.FortuneWheelItemSets.map(set => set?.hidden === false ? set.valueOf() : null),
        FortuneWheelCommands: Player.MBSSettings.FortuneWheelCommands.map(set => set?.hidden === false ? set.valueOf() : null),
    });

    if (push) {
        Player.OnlineSharedSettings.WheelFortune = sanitizeWheelFortuneIDs(Player.OnlineSharedSettings.WheelFortune);
        ServerAccountUpdate.QueueData({
            OnlineSettings: Player.OnlineSettings,
            OnlineSharedSettings: Player.OnlineSharedSettings,
        });
    }
}

waitFor(settingsLoaded).then(() => {
    initMBSSettings();
    pushMBSSettings(false);
    console.log("MBS: Initializing settings module");
});
