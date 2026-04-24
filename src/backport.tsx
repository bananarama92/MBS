/** Backports of BC bug fixes */

import { sortBy } from "lodash-es";

// @ts-ignore: ignore "variable is declared but never read" warnings; always keep the symbol in accessible
import { MBS_MOD_API } from "./common";
import { logger } from "./common";
import { waitForBC } from "./common_bc";
import { BC_MIN_VERSION } from "./sanity_checks";

import styles from "./backport.scss";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

function canChangeClothesOn(this: Character, C: Character): boolean {
    if (this.IsPlayer() && C.IsPlayer()) {
        return (
            !C.IsRestrained() &&
            !ManagementIsClubSlave() &&
            OnlineGameAllowChange() &&
            AsylumGGTSAllowChange(this) &&
            !LogQuery("BlockChange", "Rule") &&
            (!LogQuery("BlockChange", "OwnerRule") || !Player.IsFullyOwned())
        );
    } else {
        return (
            this.CanInteract() &&
            C.MemberNumber != null &&
            C.AllowItem &&
            !C.IsEnclose() &&
            InventoryGet(C, "ItemNeck")?.Asset.Name !== "ClubSlaveCollar"
        );
    }
}

waitForBC("backport", {
    async afterLoad() {
        switch (GameVersion) {
            case "R127": {
                if (MBS_MOD_API.getOriginalHash("CharacterCreate") === "3E75642F") {
                    backportIDs.add(6258);
                    MBS_MOD_API.hookFunction("CharacterCreate", 0, (args, next) => {
                        const ret = next(args);
                        ret.CanChangeClothesOn = canChangeClothesOn;
                        return ret;
                    });
                    Character.forEach(C => C.CanChangeClothesOn = canChangeClothesOn);
                }
                if (MBS_MOD_API.getOriginalHash("InventoryRemove") === "1D6A6339") {
                    backportIDs.add(6267);
                    MBS_MOD_API.patchFunction("InventoryRemove", {
                        "BlindFlashQueue = true;":
                            "if (C.IsPlayer()) { BlindFlashQueue = true; }",
                    });
                }
                if (!document.getElementById("mbs-backport-style")) {
                    document.body.append(<style id="mbs-backport-style">{styles.toString()}</style>);
                }
                break;
            }
        }

        if (backportIDs.size) {
            logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
        } else {
            logger.log(`No R${BC_NEXT} backports`);
        }
    },
});
