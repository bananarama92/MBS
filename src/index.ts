/** Various additions and utility scripts for BC */

"use strict";

import { MBS_VERSION, waitFor } from "common";
import { validateBCVersion, validateHookHashes } from "sanity_checks";
import { settingsMBSLoaded } from "common_bc";
import { runTests } from "testing";

export { runTests, MBS_VERSION };

console.log(`MBS: Initializing MBS version ${MBS_VERSION}`);
waitFor(() => typeof GameVersion !== "undefined" && GameVersion !== "R0").then(() => validateBCVersion(GameVersion));
waitFor(settingsMBSLoaded).then(validateHookHashes);

import "settings";
import "fortune_wheel";
import "crafting";
import "window_register";
import "backport";
