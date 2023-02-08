/** Various additions and utility scripts for BC */

"use strict";

import { MBS_VERSION as MBS_VERSION, waitFor, Version } from "common";

console.log(`MBS: Initializing MBS version ${MBS_VERSION}`);
waitFor(() => GameVersion !== undefined).then(() => {
    const BC_VERSION = Version.fromBCVersion(GameVersion);
    const BC_R88 = Version.fromBCVersion("R88");
    if (BC_VERSION.lesser(BC_R88)) {
        throw new Error(`BC ${GameVersion} detected; MBS requires version R88 or later`);
    } else {
        console.log(`MBS: Detected BC ${GameVersion}`);
    }
});

import "settings";
import "fortune_wheel";
import "crafting";
import "window_register";
