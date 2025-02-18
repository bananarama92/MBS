/** Various additions and utility scripts for BC */

import "tsx-dom";

import { MBS_MOD_API, logger } from "./common";
import { validateHookHashes } from "./sanity_checks";
import { waitForBC } from "./common_bc";
import { toItemBundles as _toItemBundles } from "./fortune_wheel";
import { unpackSettings as _unpackSettings } from "./settings";
import { wheelOutfits, getDebug, API_VERSION, css } from "./api";
import { runTests } from "./testing";

import styles from "./index.scss";

const _getOriginalHash = MBS_MOD_API.getOriginalHash;
const _version = MBS_VERSION;

export {
    runTests,
    _version as MBS_VERSION,
    API_VERSION,
    wheelOutfits,
    getDebug,
    css,
    _getOriginalHash,
    _toItemBundles,
    _unpackSettings,
};

logger.log(`Initializing MBS version ${MBS_VERSION}`);
waitForBC("mbs", {
    async afterLoad() {
        validateHookHashes();
        document.body.appendChild(<style id="mbs-style">{styles.toString()}</style>);
    },
});

import "./window_register";
import "./crafting";
import "./backport";
import "./new_items_screen";
import "./garbling";

// Workaround for checking whether mbs satisfies its declared interface
// Xref microsoft/TypeScript#38511
import * as __self__ from "./index";
__self__ satisfies typeof mbs;
