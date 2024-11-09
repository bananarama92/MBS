/** Backports of R91 bug fixes */

import { sortBy } from "lodash-es";

// @ts-ignore
import { MBS_MOD_API } from "./common";
import { waitFor, logger } from "./common";
import { bcLoaded } from "./common_bc";
import { BC_MIN_VERSION } from "./sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(bcLoaded).then(() => {
    switch (GameVersion) {
        case "R109": {
            if (MBS_MOD_API.getOriginalHash("CraftingDescription.Decode") === "D2A80436") {
                backportIDs.add(5237);
                MBS_MOD_API.patchFunction("CraftingDescription.Decode", {
                    "return [String.fromCharCode(bit1), String.fromCharCode(bit2)];":
                        "return [bit1, bit2].filter(Boolean).map(i => String.fromCharCode(i));",
                });
            }
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} backports`);
    }
});
