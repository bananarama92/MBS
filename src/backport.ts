/** Backports of R91 bug fixes */

import { sortBy } from "lodash-es";

import { waitFor, logger, MBS_MOD_API } from "./common";
import { BC_MIN_VERSION } from "./sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(() => typeof GameVersion === "string").then(() => {
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
            break;
        }
        case "R100Beta1": {
            backportIDs.add(4740);
            MBS_MOD_API.patchFunction("PreferenceArousalSettingsValidate.Activity", {
                "ret.push(...cloneDeep":
                    "ret.push(...CommonCloneDeep",
            });
            MBS_MOD_API.patchFunction("PreferenceArousalSettingsValidate.Zone", {
                "ret.push(...cloneDeep":
                    "ret.push(...CommonCloneDeep",
            });
            MBS_MOD_API.patchFunction("PreferenceArousalSettingsValidate.Fetish", {
                "ret.push(...cloneDeep":
                    "ret.push(...CommonCloneDeep",
            });

            backportIDs.add(4741);
            MBS_MOD_API.patchFunction("PreferenceOnlineSharedSettingsValidate.GameVersion", {
                "const version = ":
                    "let version = ",
                "if (C.IsPlayer() && CommonCompareVersion(GameVersion, C.OnlineSharedSettings.GameVersion) < 0)":
                    "if (C.IsPlayer())",
                "CommonVersionUpdated = true;":
                    'if (CommonCompareVersion(GameVersion, version ?? "R0") < 0) { CommonVersionUpdated = true; } version = GameVersion;',
            });
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} bug fix backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} bug fix backports`);
    }
});
