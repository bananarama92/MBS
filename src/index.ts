/** Various additions and utility scripts for BC */

"use strict";

import { MBS_VERSION as MBS_VERSION, waitFor, parseVersion } from "common";

console.log(`MBS: Initializing MBS version ${MBS_VERSION}`);
waitFor(() => GameVersion !== undefined).then(() => {
    const BC_VERSION = parseVersion(GameVersion);
    const BC_R88 = parseVersion("R88");
    if (BC_VERSION < BC_R88) {
        throw new Error(`BC ${GameVersion} detected; MBS requires version R88 or later`);
    } else {
        console.log(`MBS: Detected BC ${GameVersion}`);
    }
});

import "settings";
import "fortune_wheel";
import "crafting";
import "window_register";
