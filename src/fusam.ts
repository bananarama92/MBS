"use strict";

import { waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";

waitFor(settingsMBSLoaded).then(() => {
    if (typeof FUSAM !== "undefined" && typeof FUSAM.registerDebugMethod === "function") {
        FUSAM.registerDebugMethod("mbs", () => JSON.stringify(Player.MBSSettings, undefined, 4));
    }
});
