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
        case "R108": {
            if (
                MBS_MOD_API.getOriginalHash("CraftingExit") === "FB1A1DB2"
                && MBS_MOD_API.getOriginalHash("CraftingEventListeners._ClickAccept") === "49327A7A"
            ) {
                backportIDs.add(5207);

                MBS_MOD_API.patchFunction("CraftingEventListeners._ClickAccept", {
                    "CraftingSelectedItem = null;":
                        ";",
                    'CraftingModeSet("Slot");':
                        ";",
                });

                MBS_MOD_API.hookFunction("CraftingEventListeners._ClickAccept", 0, (args, next) => {
                    const ret = next(args);
                    CraftingExit(false);
                    return ret;
                });

                MBS_MOD_API.hookFunction("CraftingExit", 0, (args, next) => {
                    const ret = next(args);
                    if (CraftingMode === "Slot") {
                        CraftingDestroy = false;
                    }
                    return ret;
                });
            }

            if (MBS_MOD_API.getOriginalHash("CraftingAssetsPopulate") === "23A1297B") {
                backportIDs.add(5205);

                MBS_MOD_API.patchFunction("CraftingAssetsPopulate", {
                    "if (a1.Group.Name === a1.DynamicGroupName) {":
                        "if (a1.CraftGroup === a1.Name && a2.CraftGroup !== a2.Name) {",
                    "} else if (a2.Group.Name === a2.DynamicGroupName) {":
                        "} else if (a1.CraftGroup !== a1.Name && a2.CraftGroup === a2.Name) { return 1; } else if (a1.Group.Name === a1.DynamicGroupName && a2.Group.Name !== a2.DynamicGroupName) { return -1; } else if (a1.Group.Name !== a1.DynamicGroupName && a2.Group.Name === a2.DynamicGroupName) {",
                });
            }

            if (MBS_MOD_API.getOriginalHash("CraftingEventListeners._ClickAsset") === "C69D32E9") {
                backportIDs.add(5208);

                MBS_MOD_API.patchFunction("CraftingEventListeners._ClickAsset", {
                    "const needsPropertyUpdate = CraftingSelectedItem.Asset && CraftingSelectedItem.Asset !== assets[0];":
                        "const needsPropertyUpdate = !CraftingSelectedItem.Asset || CraftingSelectedItem.Asset !== assets[0];",
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
