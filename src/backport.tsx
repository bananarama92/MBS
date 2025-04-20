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

    const touchstartTimeout = function (elem: HTMLButtonElement, ev: TouchEvent) {
        holdAndClickTimeoutID = null;
        holdAndClick = true;
        elem.dispatchEvent(new PointerEvent("bcTouchHold", ev));
    } satisfies TimerHandler;

    function touchstart(this: HTMLButtonElement, ev: TouchEvent) {
        if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
            ev.stopImmediatePropagation();
            return;
        }

        holdAndClick = false;
        holdAndClickTimeoutID ??= setTimeout(touchstartTimeout, 300, this, ev);
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
        } else {
            ev.preventDefault();
        }
    }

    function click(this: HTMLButtonElement, ev: MouseEvent | PointerEvent) {
        if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
            ev.stopImmediatePropagation();
        } else if (holdAndClick) {
            ev.stopImmediatePropagation();
            holdAndClick = false;
        } else if (this.getAttribute("aria-disabled") === "true") {
            this.dispatchEvent(new PointerEvent("bcClickDisabled", ev));
            ev.stopImmediatePropagation();
        }
    }

    function blur(this: HTMLButtonElement, _ev: FocusEvent) {
        this.removeAttribute("data-show-tooltip");
        if (holdAndClickTimeoutID != null) {
            clearTimeout(holdAndClickTimeoutID);
            holdAndClickTimeoutID = null;
        }
        holdAndClick = false;
    }

    function bcTouchHold(this: HTMLButtonElement) {
        this.focus({ preventScroll: true });
        this.toggleAttribute("data-show-tooltip", true);
    }

    return { click, touchend, touchmove, touchstart, blur, bcTouchHold, touchcancel: touchend };
}

waitForBC("backport", {
    async afterLoad() {
        switch (GameVersion) {
            case "R115": {
                const hash = MBS_MOD_API.getOriginalHash("ElementButton.Create");
                if (hash === "1FB1B43A" || hash === "238C310E") {
                    backportIDs.add(5347);
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
                        const button = next([id, () => null, ...args]);
                        for (const [name, listener] of Object.entries(_GetClickTouchListeners())) {
                            button.addEventListener(name, listener as EventListenerOrEventListenerObject);
                        }
                        button.addEventListener("click", onClick);
                        return button;
                    });
                }
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
