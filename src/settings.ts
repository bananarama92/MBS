"use strict";

import { waitFor, MBS_VERSION } from "common";

/** Initialize the MBS settings. */
function initMBSSettings(): void {
    if (typeof Player.MBSSettings != "object") {
        if (Player.MBSSettings === undefined) {
            Player.MBSSettings = JSON.parse(
                LZString.decompressFromBase64(Player.OnlineSettings.MBS) || "",
            );
        } else {
            Player.MBSSettings = <MBSSettings>{};
        }
    }

    // @ts-ignore
    Player.MBSSettings.Version = MBS_VERSION;
    if (typeof Player.MBSSettings.CraftingCache !== "string") {
        Player.MBSSettings.CraftingCache = "";
    }
    Object.seal(Player.MBSSettings);
}

/** Push the MBS settings to the server */
export function pushMBSSettings(): void {
    Player.OnlineSettings.MBS = LZString.compressToBase64(JSON.stringify(Player.MBSSettings));
    ServerAccountUpdate.QueueData({
        OnlineSettings: Player.OnlineSettings,
    });
}

waitFor(() => Player?.OnlineSettings != undefined).then(() => {
    initMBSSettings();
    pushMBSSettings();
    console.log(`MBS: Initializing settings module (BC ${GameVersion})`);
});
