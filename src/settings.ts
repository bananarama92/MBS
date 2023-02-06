/** Function for managing all MBS related settings. */

"use strict";

import {
    waitFor,
    MBS_VERSION,
    range,
    Version,
} from "common";
import {
    WheelFortuneItemSet,
    settingsLoaded,
    sanitizeWheelFortuneIDs,
    FORTUNE_WHEEL_MAX_SETS,
} from "common_bc";

/** Check whether MBS has just been upgraded for the user in question. */
function detectUpgrade(versionString?: string): versionString is string {
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

/** Initialize the MBS settings. */
function initMBSSettings(): void {
    Player.MBSSettings = <MBSSettings>{ Version: MBS_VERSION };
    const data = LZString.decompressFromBase64(Player.OnlineSettings.MBS || "");
    let s: Partial<MBSSettings> = (data == null) ? null : JSON.parse(data);
    s = (s !== null && typeof s === "object") ? s : {};
    if (detectUpgrade(s.Version)) {
        showChangelog();
    }
    Object.assign(Player.MBSSettings, s, { Version: MBS_VERSION });

    if (typeof Player.MBSSettings.CraftingCache !== "string") {
        Player.MBSSettings.CraftingCache = "";
    }

    let fortuneWheelSets = Player.MBSSettings.FortuneWheelSets;
    if (!Array.isArray(fortuneWheelSets)) {
        fortuneWheelSets = Array(FORTUNE_WHEEL_MAX_SETS).fill(null);
    }
    if (fortuneWheelSets.length > FORTUNE_WHEEL_MAX_SETS) {
        fortuneWheelSets = fortuneWheelSets.slice(0, FORTUNE_WHEEL_MAX_SETS);
    } else if (fortuneWheelSets.length < FORTUNE_WHEEL_MAX_SETS) {
        for (const _ of range(fortuneWheelSets.length, FORTUNE_WHEEL_MAX_SETS)) {
            fortuneWheelSets.push(null);
        }
    }

    Player.MBSSettings.FortuneWheelSets = Object.seal(fortuneWheelSets);
    Player.MBSSettings = Object.seal(Player.MBSSettings);
    Player.MBSSettings.FortuneWheelSets.forEach((itemSet, i, array) => {
        if (itemSet !== null) {
            try {
                array[i] = WheelFortuneItemSet.fromObject(itemSet);
                array[i]?.registerOptions(false);
            } catch (ex) {
                console.warn(`MBS: Failed to load corrupted custom wheel of fortune item ${i}:`, ex);
                array[i] = null;
            }
        } else {
            array[i] = null;
        }
    });
}

/**
 * Update the online (shared) settings and push all MBS settings to the server.
 * @param push Whether to actually push to the server or to merely assign the online (shared) settings.
 */
export function pushMBSSettings(push: boolean = true): void {
    const settings = {
        ...Player.MBSSettings,
        FortuneWheelSets: Player.MBSSettings.FortuneWheelSets.map(i => i?.valueOf() ?? null),
    };
    Player.OnlineSettings.MBS = LZString.compressToBase64(JSON.stringify(settings));
    Player.OnlineSharedSettings.MBS = Object.freeze({
        Version: MBS_VERSION,
        FortuneWheelSets: Player.MBSSettings.FortuneWheelSets.map(itemSet => itemSet?.hidden === false ? itemSet.valueOf() : null),
    });
    if (Player.OnlineSharedSettings.WheelFortune != null) {
        Player.OnlineSharedSettings.WheelFortune = sanitizeWheelFortuneIDs(Player.OnlineSharedSettings.WheelFortune);
    }

    if (push) {
        ServerAccountUpdate.QueueData({
            OnlineSettings: Player.OnlineSettings,
            OnlineSharedSettings: Player.OnlineSharedSettings,
        });
    }
}

waitFor(settingsLoaded).then(() => {
    initMBSSettings();
    pushMBSSettings();
    console.log("MBS: Initializing settings module");
});
