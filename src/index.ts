/** Various additions and utility scripts for BC */

"use strict";

import { MBS_VERSION, waitFor, MBS_MOD_API, API_VERSION } from "common";
import { validateBCVersion, validateHookHashes } from "sanity_checks";
import { settingsMBSLoaded } from "common_bc";
import { runTests } from "testing";
import { toItemBundles as _toItemBundles } from "item_bundle";
import { unpackSettings as _unpackSettings } from "settings";
import * as wheelOutfits from "api/wheel_outfits";

const _getFunctionHash = MBS_MOD_API.getOriginalHash;

export {
    runTests,
    MBS_VERSION,
    API_VERSION,
    wheelOutfits,
    _getFunctionHash,
    _toItemBundles,
    _unpackSettings,
};

console.log(`MBS: Initializing MBS version ${MBS_VERSION}`);
waitFor(() => typeof GameVersion === "string" && GameVersion !== "R0").then(() => validateBCVersion(GameVersion));
waitFor(settingsMBSLoaded).then(validateHookHashes);

import "settings";
import "fortune_wheel";
import "crafting";
import "window_register";
import "backport";
import "settings_screen";

// Workaround for checking whether mbs satisfies its declared interface
// Xref microsoft/TypeScript#38511
import * as __self__ from "index";
__self__ satisfies typeof mbs;
