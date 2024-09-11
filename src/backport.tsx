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
        case "R107": {
            break;
        }
        case "R108Beta1": {
            if (
                MBS_MOD_API.getOriginalHash("PreferenceExit") === "180F0DB5"
                && MBS_MOD_API.getOriginalHash("PreferenceSubscreenExtensionsExit") === "FF486E53"
            ) {
                backportIDs.add(5188);
                MBS_MOD_API.patchFunction("PreferenceExit", {
                    "if (!PreferenceSubscreenExit())":
                        "if (PreferenceSubscreenExit())",
                });
                MBS_MOD_API.patchFunction("PreferenceSubscreenExtensionsExit", {
                    "if (PreferenceExtensionsCurrent.exit()) {":
                        "if (PreferenceExtensionsCurrent.exit() ?? true) {",
                });

                const prefSubscreen = PreferenceSubscreens.find(({ name }) => name === "Extensions");
                if (prefSubscreen) {
                    prefSubscreen.exit = PreferenceSubscreenExtensionsExit;
                }
            }

            if (MBS_MOD_API.getOriginalHash("CraftingLoad") === "AF96A27B") {
                backportIDs.add(5187);
                MBS_MOD_API.patchFunction("CraftingLoad", {
                    'attributes: { id: CraftingID.root, "screen-generated": CurrentScreen },':
                        'attributes: { id: CraftingID.root, "screen-generated": CurrentScreen, "aria-busy": "true" },',
                    'parent.setAttribute("data-loaded", true);':
                        'parent.setAttribute("data-loaded", true); parent.setAttribute("aria-busy", "false");',
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
