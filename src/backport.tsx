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
        case "R105": {
            if (MBS_MOD_API.getOriginalHash("ElementNumberInputBlur") === "1C8DFD30") {
                backportIDs.add(5108);
                MBS_MOD_API.patchFunction("ElementNumberInputBlur", {
                    "const min = Number(this.min);":
                        "const min = this.min ? Number(this.min) : -Infinity;",
                    "const max = Number(this.max);":
                        "const max = this.max ? Number(this.max) : Infinity;",
                });
            }

            if (MBS_MOD_API.getOriginalHash("PreferenceSubscreenVisibilityClick") === "F70765AB") {
                backportIDs.add(5109);
                MBS_MOD_API.patchFunction("PreferenceSubscreenVisibilityClick", {
                    "Player.ItemPermission[key] ??= permission;":
                        "Player.PermissionItems[key] ??= permission;",
                    "Player.ItemPermission[key].Permission = permission.Permission;":
                        "Player.PermissionItems[key].Hidden = permission.Hidden; Player.PermissionItems[key].Permission = permission.Permission;",
                });
                MBS_MOD_API.patchFunction("CharacterOnlineRefresh", {
                    "Char.PermissionItems = ServerUnPackItemPermissions(data, Char);":
                        ";",
                    "if (!Char.IsPlayer()) {":
                        "if (!Char.IsPlayer()) {Char.PermissionItems = ServerUnPackItemPermissions(data, Char);",
                });
            }
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} backports`);
    }
});
