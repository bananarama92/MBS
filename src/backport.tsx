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

waitForBC("backport", {
    async afterLoad() {
        switch (GameVersion) {
            case "R113": {
                if (MBS_MOD_API.getOriginalHash("CharacterCreate") === "E571DB6D") {
                    backportIDs.add(5433);
                    MBS_MOD_API.hookFunction("CharacterCreate", 0, (args, next) => {
                        const ret = next(args);
                        ret.ClickedOption = null;
                        return ret;
                    });
                    MBS_MOD_API.hookFunction("DialogLeave", 0, (args, next) => {
                        if (CurrentCharacter) {
                            CurrentCharacter.ClickedOption = null;
                        }
                        return next(args);
                    });
                    MBS_MOD_API.hookFunction("DialogMenuMapping.dialog._ClickButton", 0, ([button, char, clickedDialog, ...args], next) => {
                        char.ClickedOption = clickedDialog.Option;
                        return next([button, char, clickedDialog, ...args]);
                    });
                    MBS_MOD_API.patchFunction("DialogRemove", {
                        "const dialogIndex = C.Dialog.findIndex(dialog => dialog.Stage === C.Stage && dialog.Option != null && DialogPrerequisite(dialog));":
                            "const dialogIndex = C.Dialog.findIndex(dialog => dialog.Stage === C.Stage && dialog.Option === C.ClickedOption && dialog.Option != null && DialogPrerequisite(dialog));",
                    });
                }

                if (MBS_MOD_API.getOriginalHash("InventoryItemMiscPasswordPadlockDrawControls") === "AC76D6DE") {
                    backportIDs.add(5429);
                    MBS_MOD_API.patchFunction("InventoryItemMiscPasswordPadlockDrawControls", {
                        ", 1000, 640, 1000, 120, null, null, 2);":
                            ', 1000, 640, 1000, 120, "white", null, 2);',
                    });
                }

                if (MBS_MOD_API.getOriginalHash("InventoryItemDevicesWheelFortuneLoadHook") === "CDE51F46") {
                    backportIDs.add(5440);
                    MBS_MOD_API.patchFunction("InventoryItemDevicesWheelFortuneLoadHook", {
                        "WheelFortuneCharacter = CurrentCharacter;":
                            "WheelFortuneCharacter = CharacterGetCurrent();",
                    });
                }

                if (MBS_MOD_API.getOriginalHash("CommonDynamicFunctionParams") === "F9CFFE56") {
                    backportIDs.add(5447);
                    MBS_MOD_API.patchFunction("CommonDynamicFunctionParams", {
                        'var Params = FunctionName.substring(openParenthesisIndex + 1, closedParenthesisIndex).split(",");':
                            'var ParamsString = FunctionName.substring(openParenthesisIndex + 1, closedParenthesisIndex); var Params = ParamsString.length === 0 ? [] : ParamsString.split(",");',
                    });
                }

                const gag2 = AssetGet("Female3DCG", "ItemMouth2", "TonguePiercingGag");
                const gag3 = AssetGet("Female3DCG", "ItemMouth3", "TonguePiercingGag");
                const idx2 = gag2?.Block?.findIndex(i => i === "ItemMouth2") ?? -1;
                const idx3 = gag3?.Block?.findIndex(i => i === "ItemMouth3") ?? -1;
                if (gag2 && gag3 && idx2 !== -1 && idx3 !== -1) {
                    backportIDs.add(5438);
                    (gag2.Block as AssetGroupItemName[])[idx2] = "ItemMouth";
                    (gag3.Block as AssetGroupItemName[])[idx3] = "ItemMouth";
                }

                let normalizeLink = document.head.querySelector("link[href='CSS/normalize.css']") as null | HTMLLinkElement;
                const nextSibling = document.head.querySelector("link[href='CSS/Styles.css']");
                if (!normalizeLink && nextSibling) {
                    backportIDs.add(5432);
                    normalizeLink = document.createElement("link");
                    normalizeLink.href = "CSS/normalize.css";
                    normalizeLink.rel = "stylesheet";
                    document.head.insertBefore(normalizeLink, nextSibling);
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
