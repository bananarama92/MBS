/** Function for managing all MBS related settings. */

"use strict";

import {
    waitFor,
    MBS_VERSION,
    range,
    WheelFortuneItemSet,
    settingsLoaded,
    FORTUNE_WHEEL_MAX_SETS,
} from "common";

/** Initialize the MBS settings. */
function initMBSSettings(): void {
    Player.MBSSettings = <MBSSettings>{ Version: MBS_VERSION };
    const data = LZString.decompressFromBase64(Player.OnlineSettings.MBS || "");
    const s = (data == null) ? null : JSON.parse(data);
    if (typeof s === "object") {
        Object.assign(Player.MBSSettings, s, { Version: MBS_VERSION });
    }

    if (typeof Player.MBSSettings.CraftingCache !== "string") {
        Player.MBSSettings.CraftingCache = "";
    }

    let fortuneWheelSets = Player.MBSSettings.FortuneWheelSets;
    if (!Array.isArray(fortuneWheelSets)) {
        fortuneWheelSets = Array(FORTUNE_WHEEL_MAX_SETS).map(() => null);
    } else {
        // Trim the array or pad with `null` if required
        if (fortuneWheelSets.length > FORTUNE_WHEEL_MAX_SETS) {
            fortuneWheelSets = fortuneWheelSets.slice(0, FORTUNE_WHEEL_MAX_SETS);
        } else if (fortuneWheelSets.length < FORTUNE_WHEEL_MAX_SETS) {
            for (const _ of range(fortuneWheelSets.length, FORTUNE_WHEEL_MAX_SETS)) {
                fortuneWheelSets.push(null);
            }
        }
        fortuneWheelSets.forEach((itemSet, i, array) => {
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
    Player.MBSSettings.FortuneWheelSets = Object.seal(fortuneWheelSets);
    Player.MBSSettings = Object.seal(Player.MBSSettings);
}

/** Update the shared settings and push all MBS settings to the server */
export function pushMBSSettings(): void {
    const settings = {
        ...Player.MBSSettings,
        FortuneWheelSets: Player.MBSSettings.FortuneWheelSets.map(i => i?.valueOf() ?? null),
    };
    Player.OnlineSettings.MBS = LZString.compressToBase64(JSON.stringify(settings));
    ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });

    Player.OnlineSharedSettings.MBS = Object.freeze({
        Version: MBS_VERSION,
        FortuneWheelSets: Player.MBSSettings.FortuneWheelSets.map(itemSet => itemSet?.hidden === false ? itemSet.valueOf() : null),
    });
    ServerAccountUpdate.QueueData({ OnlineSharedSettings: Player.OnlineSharedSettings });
}

waitFor(settingsLoaded).then(() => {
    initMBSSettings();
    pushMBSSettings();
    console.log(`MBS: Initializing settings module (BC ${GameVersion})`);
});
