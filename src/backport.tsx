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

type Character2 = Character & { _Stage: string, _CurrentDialog: string };

function updateGetters(char: Character) {
    if ("_Stage" in char && "_CurrentDialog" in char) {
        return;
    }

    const char2 = char as Character2;
    char2._Stage = char2.Stage;
    char2._CurrentDialog = char2.CurrentDialog;
    Object.defineProperty(char2, "Stage", {
        get(this: Character2) {
            return this._Stage;
        },
        set(this: Character2, value: string) {
            if (this._Stage === value) {
                return;
            }
            this._Stage = value;
            if (DialogMenuMode === "dialog") {
                DialogMenuMapping.dialog.Reload();
            }
        },
    });
    Object.defineProperty(char2, "CurrentDialog", {
        get(this: Character2) {
            return this._CurrentDialog;
        },
        set(this: Character2, value: string) {
            if (this._CurrentDialog === value) {
                return;
            }
            this._CurrentDialog = value;
            if (DialogMenuMode === "dialog") {
                DialogSetStatus(value);
            }
        },
    });
}

waitForBC("backport", {
    async afterLoad() {
        switch (GameVersion) {
            case "R113":
                if (MBS_MOD_API.getOriginalHash("CharacterCreate") === "F078CBBE") {
                    backportIDs.add(5410);
                    MBS_MOD_API.hookFunction("CharacterCreate", 11, (args, next) => {
                        const char = next(args);
                        updateGetters(char);
                        return char;
                    });
                    MBS_MOD_API.patchFunction("DialogLoad", {
                        "C.CurrentDialog = newDialog;":
                            "C._CurrentDialog = newDialog;",
                    });
                    Character.forEach(char => updateGetters(char));
                }

                if (
                    MBS_MOD_API.getOriginalHash("ElementButton.CreateForAsset") === "591D7DCF"
                    && MBS_MOD_API.getOriginalHash("ElementButton.CreateForActivity") === "3A1D0F81"
                ) {
                    backportIDs.add(5412);
                    MBS_MOD_API.patchFunction("ElementButton.CreateForAsset", {
                        "options.icons ??= [":
                            "options.icons = [",
                    });
                    MBS_MOD_API.patchFunction("ElementButton.CreateForActivity", {
                        "options.icons ??= [":
                            "options.icons = [",
                    });
                }

                if (!document.getElementById("mbs-backport-style")) {
                    document.body.append(<style id="mbs-backport-style">{styles.toString()}</style>);
                }
                break;
        }

        if (backportIDs.size) {
            logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
        } else {
            logger.log(`No R${BC_NEXT} backports`);
        }
    },
});
