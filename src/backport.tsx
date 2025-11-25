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
            case "R122": {
                if (
                    MBS_MOD_API.getOriginalHash("ColorPickerReload") === "E2407218"
                    && MBS_MOD_API.getOriginalHash("ItemColorLoad") === "2222E0A5"
                ) {
                    backportIDs.add(6036);
                    MBS_MOD_API.patchFunction("ColorPickerReload", {
                        "ColorPicker.setColor(fieldset, { colorString: singularColor, opacity: singularOpacity }, { overrideEditOpacity: true });":
                            "ColorPicker.setColor(fieldset, { colorString: singularColor, opacity: singularOpacity }, { overrideEditOpacity: true, dispatch: options.dispatch });",
                    });
                    // Workaround for SDK patches being unable to handle functions without an explicit `function` keyword
                    ColorPicker.setColor = eval(`(() => function ${ColorPicker.setColor.toString()})()`);
                    MBS_MOD_API.patchFunction("ColorPicker.setColor", {
                        'fieldset.dispatchEvent(new CustomEvent("input", { detail: { source: outputInput.name } }));':
                            'if (options.dispatch ?? true) { fieldset.dispatchEvent(new CustomEvent("input", { detail: { source: outputInput.name } })); }',
                    });
                    MBS_MOD_API.patchFunction("ItemColorLoad", {
                        "await ColorPickerInit({ shape });":
                            "await ColorPickerInit({ shape, dispatch: false });",
                    });
                }

                if (MBS_MOD_API.getOriginalHash("ItemColorNextColor") === "518C2598") {
                    backportIDs.add(6033);
                    MBS_MOD_API.patchFunction("ItemColorNextColor", {
                        "const newColors = [...ItemColorState.colors];":
                            ";",
                        "colorIndicesToSet.forEach(i => newColors[i] = ItemColorState.defaultColors[i]);":
                            "colorIndicesToSet.forEach(i => ItemColorItem.Color[i] = ItemColorState.colors[i] = ItemColorState.defaultColors[i]);",
                        "colorIndicesToSet.forEach(i => newColors[i] = nextColor);":
                            "colorIndicesToSet.forEach(i => ItemColorItem.Color[i] = ItemColorState.colors[i] = nextColor);",
                        "ItemColorItem.Color = newColors;":
                            ";",
                    });
                }

                backportIDs.add(6035);
                ServerPlayerChatRoom.register(
                    { screen: "GameMagicBattle" },
                    { screen: "GameClubCard" },
                );
                break;
            }
        }

        if (!document.getElementById("mbs-backport-style")) {
            document.body.append(<style id="mbs-backport-style">{styles.toString()}</style>);
        }

        if (backportIDs.size) {
            logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
        } else {
            logger.log(`No R${BC_NEXT} backports`);
        }
    },
});
