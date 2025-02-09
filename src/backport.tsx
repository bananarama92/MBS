/** Backports of BC bug fixes */

import { sortBy } from "lodash-es";

// @ts-ignore: ignore "variable is declared but never read" warnings; always keep the symbol in accessible
import { MBS_MOD_API } from "./common";
import { waitFor, logger } from "./common";
import { bcLoaded } from "./common_bc";
import { BC_MIN_VERSION } from "./sanity_checks";

import styles from "./backport.scss";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(bcLoaded).then(() => {
    switch (GameVersion) {
        case "R112":
            if (
                MBS_MOD_API.getOriginalHash("DialogMenuMapping.items._ReloadStatus") === "F29AC8A4"
                && MBS_MOD_API.getOriginalHash("DialogMenuMapping.items.clickStatusCallbacks.InventoryGroupIsAvailable") === "86642438"
            ) {
                backportIDs.add(5377);
                MBS_MOD_API.hookFunction("DialogMenuMapping.items._ReloadStatus", 0, (args) => {
                    const [root, _status, C, focusGroup, options] = args as never as [HTMLElement, HTMLElement, Character, AssetItemGroup, Pick<DialogMenu.ReloadOptions, "status" | "statusTimer">];
                    const asset: undefined | Asset = undefined;
                    let showIcon = false;
                    let textContent = options.status;
                    if (textContent == null) {
                        if (InventoryGroupIsBlockedByOwnerRule(C, focusGroup.Name)) {
                            textContent = InterfaceTextGet("ZoneBlockedOwner");
                            showIcon = true;
                        } else if (InventoryIsBlockedByDistance(C)) {
                            textContent = InterfaceTextGet("ZoneBlockedRange");
                            showIcon = true;
                        } else if (InventoryGroupIsBlocked(C, focusGroup.Name)) {
                            textContent = InterfaceTextGet("ZoneBlocked");
                            showIcon = true;
                        } else if (!Player.CanInteract()) {
                            textContent = InterfaceTextGet("AccessBlocked");
                            showIcon = true;
                        } else {
                            textContent = InterfaceTextGet("SelectItemGroup");
                        }
                    }

                    root.toggleAttribute("data-show-icon", showIcon);
                    DialogSetStatus(textContent, options.statusTimer ?? 0, { asset, group: focusGroup, C });
                });
                MBS_MOD_API.patchFunction("DialogMenuMapping.items.clickStatusCallbacks.InventoryGroupIsAvailable", {
                    "return equippedItem ? InventoryGroupIsAvailable(C, C.FocusGroup.Name, false) : null;":
                        "return equippedItem ? InventoryGroupIsAvailable(C, clickedItem.Asset.Group.Name, false) : null;",
                });
            }

            if (
                MBS_MOD_API.getOriginalHash("CharacterSetFacialExpression") === "EC032BEE"
                && MBS_MOD_API.getOriginalHash("DialogLeave") === "AD3A0840"
                && MBS_MOD_API.getOriginalHash("DialogLeaveFocusItemHandlers.DialogFocusItem.Appearance") === "C1F40E3E"
            ) {
                backportIDs.add(5378);
                backportIDs.add(5389);
                MBS_MOD_API.patchFunction("CharacterSetFacialExpression", {
                    "CharacterRefresh(C, !inChatRoom && !isTransient);":
                        "CharacterRefresh(C, !inChatRoom && !isTransient, false);",
                });
                MBS_MOD_API.patchFunction("DialogLeave", {
                    "if (CurrentCharacter) {":
                        "if (StruggleMinigameIsRunning()) { StruggleMinigameStop(); } AudioDialogStop(); Player.FocusGroup = null; if (CurrentCharacter) { CurrentCharacter.FocusGroup = null;",
                    "DialogChangeFocusToGroup(CurrentCharacter, null);":
                        ";",
                });
                MBS_MOD_API.patchFunction("DialogLeaveFocusItemHandlers.DialogFocusItem.Appearance", {
                    "DialogLeave()":
                        "{ const focusGroup = Player.FocusGroup; DialogLeave(); Player.FocusGroup = focusGroup; }",
                });
            }

            if (!document.getElementById("mbs-backport-style")) {
                backportIDs.add(5383);
                document.body.append(<style id="mbs-backport-style">{styles.toString()}</style>);
            }
            break;
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} backports`);
    }
});
