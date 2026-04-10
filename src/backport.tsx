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
            case "R126": {
                // See `#mbs-backport-style` style sheet
                backportIDs.add(6224);

                if (MBS_MOD_API.getOriginalHash("ColorPickerResize") === "8F439B67") {
                    backportIDs.add(6232);
                    MBS_MOD_API.hookFunction("ColorPickerResize", 0, (args, next) => {
                        const ret = next(args);
                        const picker: null | HTMLColorTintElement = document.querySelector(`#${ColorPicker.ids.root} bc-tint-input`);
                        if (picker) {
                            const shapeRect = picker.getBoundingClientRect();
                            picker.style.setProperty("height", `${shapeRect.width}px`);
                        }
                        return ret;
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
