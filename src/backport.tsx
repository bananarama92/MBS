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

function _GetClickTouchListeners() {
    let holdAndClickTimeoutID: null | number = null;
    /** Whether a touch-based hold-and-click action was detected */
    let holdAndClick = false;
    /** Used by `focus` for checking whether the focus was triggered by a touch event */
    let isTouch = false;

    function touchstartTimeout(elem: HTMLButtonElement) {
        holdAndClickTimeoutID = null;
        holdAndClick = true;
        elem.toggleAttribute("data-show-tooltip", true);
    }

    function touchstart(this: HTMLButtonElement, ev: TouchEvent) {
        if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
            ev.stopImmediatePropagation();
            return;
        }
        isTouch = true;
    }

    function touchmove(this: HTMLButtonElement, _ev: TouchEvent) {
        if (holdAndClickTimeoutID != null) {
            clearTimeout(holdAndClickTimeoutID);
            holdAndClickTimeoutID = null;
        }
    }

    function touchend(this: HTMLButtonElement, ev: TouchEvent) {
        if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
            ev.stopImmediatePropagation();
            return;
        }

        if (!holdAndClick) {
            this.blur();
        }
    }

    function click(this: HTMLButtonElement, ev: MouseEvent | PointerEvent) {
        if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
            ev.stopImmediatePropagation();
        } else if (holdAndClick) {
            ev.stopImmediatePropagation();
        } else if (this.getAttribute("aria-disabled") === "true") {
            this.dispatchEvent(new PointerEvent("bcClickDisabled", ev));
            ev.stopImmediatePropagation();
        }
    }

    function focus(this: HTMLButtonElement, ev: FocusEvent) {
        if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
            ev.stopImmediatePropagation();
        } else if (isTouch) {
            holdAndClick = false;
            isTouch = false;
            holdAndClickTimeoutID ??= setTimeout(touchstartTimeout, 150, this);
        }
    }

    function blur(this: HTMLButtonElement, _ev: FocusEvent) {
        this.removeAttribute("data-show-tooltip");
        if (holdAndClickTimeoutID != null) {
            clearTimeout(holdAndClickTimeoutID);
            holdAndClickTimeoutID = null;
        }
        holdAndClick = false;
        isTouch = false;
    }

    return { click, touchend, touchmove, touchstart, blur, focus, touchcancel: touchend };
}

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

                let normalizeLink = document.head.querySelector("link[href='CSS/normalize.css']") as null | HTMLLinkElement;
                const nextSibling = document.head.querySelector("link[href='CSS/Styles.css']");
                if (!normalizeLink && nextSibling) {
                    backportIDs.add(5432);
                    normalizeLink = document.createElement("link");
                    normalizeLink.href = "CSS/normalize.css";
                    normalizeLink.rel = "stylesheet";
                    document.head.insertBefore(normalizeLink, nextSibling);
                }

                MBS_MOD_API.patchFunction("ElementButton.Create", {
                    "click: this._Click,":
                        "",
                    "touchend: this._MouseUp,":
                        "",
                    "touchcancel: this._MouseUp,":
                        "",
                    'elem.addEventListener("click", onClick);':
                        ";",
                });

                MBS_MOD_API.hookFunction("ElementButton.Create", 0, ([id, onClick, ...args], next) => {
                    const button = next([id, onClick, ...args]);
                    for (const [name, listener] of Object.entries(_GetClickTouchListeners())) {
                        button.addEventListener(name, listener as EventListenerOrEventListenerObject);
                    }
                    button.addEventListener("click", onClick);
                    return button;
                });

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
