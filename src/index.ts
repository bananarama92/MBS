/** Various additions and utility scripts for BC */

import { waitFor, MBS_MOD_API, logger } from "./common";
import { validateBCVersion, validateHookHashes } from "./sanity_checks";
import { bcLoaded } from "./common_bc";
import { toItemBundles as _toItemBundles } from "./fortune_wheel";
import { unpackSettings as _unpackSettings } from "./settings";
import { wheelOutfits, getDebug, API_VERSION } from "./api";
import { runTests } from "./testing";

import styles from "./index.css";

const _getFunctionHash = MBS_MOD_API.getOriginalHash;
const _version = MBS_VERSION;

export {
    runTests,
    _version as MBS_VERSION,
    API_VERSION,
    wheelOutfits,
    getDebug,
    _getFunctionHash,
    _toItemBundles,
    _unpackSettings,
};

logger.log(`Initializing MBS version ${MBS_VERSION}`);
waitFor(() => bcLoaded(false)).then(() => {
    validateBCVersion(GameVersion);
    validateHookHashes();

    const styleElement = document.createElement("style");
    styleElement.id = "MBS_CSS";
    styleElement.appendChild(document.createTextNode(styles.toString()));
    document.head.appendChild(styleElement);
});

import "./window_register";
import "./crafting";
import "./backport";

// Workaround for checking whether mbs satisfies its declared interface
// Xref microsoft/TypeScript#38511
import * as __self__ from "./index";
__self__ satisfies typeof mbs;
