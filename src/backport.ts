/** Backports of R91 bug fixes */

import { waitFor, logger, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";
import { sortBy } from "lodash-es";
import { BC_MIN_VERSION } from "sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    switch (GameVersion) {
        case "R99": {
            if (MBS_MOD_API.getOriginalHash("CraftingDeserialize") === "208F6080") {
                backportIDs.add(4693);
                MBS_MOD_API.patchFunction("CraftingDeserialize", {
                    "ItemProperty,":
                        "",
                    "OverridePriority,":
                        "OverridePriority, ItemProperty,",
                });
            }
        }
    }
    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} bug fix backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} bug fix backports`);
    }
});
