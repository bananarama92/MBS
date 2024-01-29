/** Backports of R91 bug fixes */

import { sortBy } from "lodash-es";

import { waitFor, logger, MBS_MOD_API } from "./common";
import { BC_MIN_VERSION } from "./sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(() => typeof MainCanvas !== "undefined").then(() => {
    switch (GameVersion) {
        case "R100": {
            if (MBS_MOD_API.getOriginalHash("CharacterResetFacialExpression") === "C22A83C0") {
                backportIDs.add(4777);
                MBS_MOD_API.patchFunction("CharacterResetFacialExpression", {
                    "const name = /** @type {ExpressionGroupName} */ (group.Name);":
                        "const name = group.Name === 'Eyes' ? 'Eyes1' : group.Name;",
                });
            }

            if (MBS_MOD_API.getOriginalHash("ArcadeKinkyDungeonStart") === "A62E58E4") {
                let kdPatch = false;
                backportIDs.add(4779);
                MBS_MOD_API.hookFunction("ArcadeKinkyDungeonStart", 0, (args, next) => {
                    next(args);
                    if (!kdPatch) {
                        waitFor(() => typeof ArcadeKinkyDungeonStart === "function").then(() => {
                            MBS_MOD_API.patchFunction("KDApplyItemLegacy", {
                                'placed.Property.LockedBy = inv.lock ? "MetalPadlock" : undefined;':
                                    'placed.Property ??= {}; placed.Property.LockedBy = inv.lock ? "MetalPadlock" : undefined;',
                            });
                            kdPatch = true;
                        });
                    }
                });
            }

            backportIDs.add(4780);
            const data = ModularItemDataLookup["ItemMouthFuturisticHarnessBallGag"];
            const module = data?.modules?.find(m => m.Name === "Gag");
            module?.Options?.forEach(o => delete o.Property.OriginalSetting);
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} bug fix backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} bug fix backports`);
    }
});
