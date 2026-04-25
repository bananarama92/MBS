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

function isOwner(this: Character): boolean {
    return Player.IsOwnedByCharacter(this);
}

waitForBC("backport", {
    async afterLoad() {
        switch (GameVersion) {
            case "R127": {
                if (
                    MBS_MOD_API.getOriginalHash("CharacterCreate") === "3E75642F"
                    && MBS_MOD_API.getOriginalHash("Player.CanChangeClothesOn") === "978C7F10"
                ) {
                    backportIDs.add(6258);
                    MBS_MOD_API.hookFunction("CharacterCreate", 0, (args, next) => {
                        const ret = next(args);
                        ret.CanChangeClothesOn = canChangeClothesOn;
                        return ret;
                    });
                    MBS_MOD_API.patchFunction("Player.CanChangeClothesOn", {
                        ["InventoryGet(CurrentCharacter, \"ItemNeck\") !== null"]:
                            "InventoryGet(C, \"ItemNeck\") !== null",
                        ["InventoryGet(CurrentCharacter, \"ItemNeck\").Asset.Name"]:
                            "InventoryGet(C, \"ItemNeck\").Asset.Name",
                    });
                    for (const char of Character) {
                        if (!char.IsPlayer()) {
                            char.CanChangeClothesOn = canChangeClothesOn;
                        }
                    }
                }

                if (MBS_MOD_API.getOriginalHash("InventoryRemove") === "1D6A6339") {
                    backportIDs.add(6267);
                    MBS_MOD_API.patchFunction("InventoryRemove", {
                        "BlindFlashQueue = true;":
                            "if (C.IsPlayer()) { BlindFlashQueue = true; }",
                    });
                }

                if (
                    MBS_MOD_API.getOriginalHash("CharacterCreate") === "3E75642F"
                    && MBS_MOD_API.getOriginalHash("Player.IsOwner") === "A57439A6"
                ) {
                    backportIDs.add(6273);
                    MBS_MOD_API.hookFunction("CharacterCreate", 0, (args, next) => {
                        const ret = next(args);
                        ret.IsOwner = isOwner;
                        return ret;
                    });
                    MBS_MOD_API.patchFunction("Player.IsOwner", {
                        ["if (this.IsNpc() && !NPCEventGet(this, \"PlayerCollaring\")) return false;"]:
                            ";",
                    });
                    for (const char of Character) {
                        if (!char.IsPlayer()) {
                            char.IsOwner = isOwner;
                        }
                    }
                }

                if (
                    MBS_MOD_API.getOriginalHash("ServerRoomSearch") === "A765CB69"
                    && MBS_MOD_API.getOriginalHash("ChatRoomSetLastChatRoom") === "1417FC0B"
                ) {
                    backportIDs.add(6271);
                    MBS_MOD_API.patchFunction("ServerRoomSearch", {
                        "CommonObjectEqual(ServerRoomSearchLastQuery, request)":
                            "CommonDeepEqual(ServerRoomSearchLastQuery, request)",
                    });
                    MBS_MOD_API.patchFunction("ChatRoomSetLastChatRoom", {
                        "} else {":
                            "} else if (Player.LastChatRoom !== null || Player.LastMapData !== null) {",
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
