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
        case "R111": {
            backportIDs.add(5309);
            backportIDs.add(5349);
            backportIDs.add(5357);
            document.body.append(<style id="mbs-backport">{styles.toString()}</style>);

            MBS_MOD_API.patchFunction("ElementMenu.AppendButton", {
                'menuitem.role = "menuitem";':
                    'menuitem.setAttribute("role", "menuitem");',
            });

            MBS_MOD_API.patchFunction("ElementMenu.PrependItem", {
                'menuitem.role = "menuitem";':
                    'menuitem.setAttribute("role", "menuitem");',
            });

            MBS_MOD_API.patchFunction("ElementMenu.Create", {
                'menuitem.role ||= "menuitem";':
                    'if (!menuitem.getAttribute("role")) { menuitem.setAttribute("role", "menuitem"); }',
                'if (menuitem.role !== "menuitem" && menuitem.role !== "menuitemradio" && menuitem.role !== "menuitemcheckbox") {':
                    'if (menuitem.getAttribute("role") !== "menuitem" && menuitem.getAttribute("role") !== "menuitemradio" && menuitem.getAttribute("role") !== "menuitemcheckbox") {',
            });

            MBS_MOD_API.patchFunction("ElementButton.Create", {
                "if (menuItemRoles.some(i => elem.role === i)) {":
                    'if (menuItemRoles.some(i => elem.getAttribute("role") === i)) {',
            });

            MBS_MOD_API.patchFunction("ElementButton._ClickRadio", {
                'const isRadio = this.role === "radio";':
                    'const role = this.getAttribute("role"); const isRadio = role === "radio";',
                'const filter = (e) => e.role === "radiogroup" || !ElementCheckVisibility(e);':
                    'const filter = (e) => e.getAttribute("role") === "radiogroup" || !ElementCheckVisibility(e);',
                "const first = ElementButton._QueryDFS(parent, `[role='${this.role}']`, filter).next();":
                    "const first = ElementButton._QueryDFS(parent, `[role='${role}']`, filter).next();",
                '? (e) => e.role === "radiogroup"':
                    '? (e) => e.getAttribute("role") === "radiogroup"',
                ': (e) => e.role === "menu" || e.role === "menuitem";':
                    ': (e) => e.getAttribute("role") === "menu" || e.getAttribute("role") === "menuitem";',
                "let prev = ElementButton._QueryDFS(parent, `[role='${this.role}'][aria-checked='true']`, filter).next();":
                    "let prev = ElementButton._QueryDFS(parent, `[role='${role}'][aria-checked='true']`, filter).next();",
                "prev = ElementButton._QueryDFS(parent, `[role='${this.role}'][tabindex='0']`, filter).next();":
                    "prev = ElementButton._QueryDFS(parent, `[role='${role}'][tabindex='0']`, filter).next();",
            });

            if (MBS_MOD_API.getOriginalHash("DialogInventoryAdd") === "BEC87E67") {
                backportIDs.add(5348);

                MBS_MOD_API.patchFunction("DialogInventoryAdd", {
                    "DialogSortOrder.PlayerFavoriteUsable.toString() + (item.Craft.Name || item.Asset.Description);":
                        '`${DialogSortOrder.PlayerFavoriteUsable}${item.Asset.Description}${item.Craft.Name ?? ""}`;',
                    "DialogSortOrder.PlayerFavoriteUnusable.toString() + (item.Craft.Name || item.Asset.Description);":
                        '`${DialogSortOrder.PlayerFavoriteUnusable}${item.Asset.Description}${item.Craft.Name ?? ""}`;',
                });

                MBS_MOD_API.patchFunction("DialogInventoryCreateItem", {
                    "SortOrder: sortOrder.toString() + (item.Craft?.Name || asset.Description),":
                        'SortOrder: `${sortOrder}${asset.Description}${item.Craft?.Name ?? ""}`,',
                });
            }

            if (
                MBS_MOD_API.getOriginalHash("ValidationLockWasModified") === "BBCA20B5"
                && MBS_MOD_API.getOriginalHash("ValidationResolveLockModification") === "95227225"
            ) {
                backportIDs.add(5360);

                MBS_MOD_API.patchFunction("ValidationResolveLockModification", {
                    "((lockAdded || lockModified || lockSwapped) && (newLockBlocked || itemBlocked));":
                        "((lockAdded || lockModified || lockSwapped) && (newLockBlocked || itemBlocked)) || (lockModified && previousProperty.Effect?.includes(\"Lock\") && !newProperty.Effect?.includes(\"Lock\"));",
                });

                MBS_MOD_API.patchFunction("ValidationLockWasModified", {
                    "ValidationAllLockProperties.some((key) => !CommonDeepEqual(previousProperty[key], newProperty[key]));":
                        "previousProperty.Effect?.includes(\"Lock\") !== newProperty.Effect?.includes(\"Lock\") || ValidationAllLockProperties.some((key) => !CommonDeepEqual(previousProperty[key], newProperty[key]));",
                });
            }
            break;
        }
        case "R112Beta1": {
            if (MBS_MOD_API.getOriginalHash("ElementButton.Create") === "9F62BA64") {
                backportIDs.add(5364);

                MBS_MOD_API.patchFunction("ElementButton.Create", {
                    "[tooltipRoleAttribute]: tooltipRoleAttribute ? `${id}-tooltip` : undefined,":
                        "[tooltipRoleAttribute]: tooltip ? `${id}-tooltip` : undefined,",
                });
            }
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} backports`);
    }
});
