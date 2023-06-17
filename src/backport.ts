/** Backports of R91 bug fixes */

import { waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    if (backportIDs.size) {
        console.log("MBS: Initializing R94 bug fix backports", backportIDs);
    } else {
        console.log("MBS: No R94 bug fix backports");
    }
});
