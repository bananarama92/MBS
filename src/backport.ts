/** Backports of R91 bug fixes */

import { waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";


/** Original values for objects that cannot be patched via ModSDK */
export let originalValues: Record<string, unknown>;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    originalValues = Object.freeze({});

    if (backportIDs.size) {
        console.log("MBS: Initializing R92 bug fix backports", backportIDs);
    } else {
        console.log("MBS: No R92 bug fix backports");
    }
});
