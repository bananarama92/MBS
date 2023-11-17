/** Backports of R91 bug fixes */

import { waitFor, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";
import {BC_MIN_VERSION} from "sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    if (MBS_MOD_API.getOriginalHash("ValidationSanitizeLock") === "21B423BF") {
        backportIDs.add(4597);
        MBS_MOD_API.patchFunction("ValidationSanitizeLock", {
            "if (!lock || !InventoryDoesItemAllowLock(item)) {":
                'if (!lock && item.Asset.Effect.includes("Lock")) { return; } else if (!lock || !InventoryDoesItemAllowLock(item)) {',
        });
    }

    if (MBS_MOD_API.getOriginalHash("VibratorModeInit") === "F8634616") {
        backportIDs.add(4597);
        MBS_MOD_API.patchFunction("VibratorModeInit", {
            "delete newProps.OverridePriority;":
                "delete newProps.OverridePriority; delete newProps.Effect;",
        });
    }

    if (backportIDs.size) {
        console.log(`MBS: Initializing R${BC_NEXT} bug fix backports`, backportIDs);
    } else {
        console.log(`MBS: No R${BC_NEXT} bug fix backports`);
    }
});
