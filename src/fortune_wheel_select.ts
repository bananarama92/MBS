/** Selection screen for custom wheel of fortune options */

"use strict";

import { LoopIterator } from "common";
import { FORTUNE_WHEEL_MAX_SETS, setScreenNoText } from "common_bc";
import { MBSCustomize, MBSSelect } from "glob_vars";

const START = Object.freeze({
    X: 250,
    Y: 200,
});
const SPACING = Object.freeze({
    X: 800,
    Y: 90,
});

const pageSelector = new LoopIterator([
    Object.freeze({
        index: 0,
        screen: "MBSFortuneWheel",
        name: "item",
        field: "FortuneWheelItemSets",
    }),
    Object.freeze({
        index: 1,
        screen: "MBSFortuneWheelCommand",
        name: "command",
        field: "FortuneWheelCommands",
    }),
]);

/** The background for the MBS wheel of fortune selection screen. */
export const MBSFortuneWheelSelectBackground = "Sheet";

export function MBSFortuneWheelSelectLoad(): void {
    if (MBSSelect.FortuneWheelItemSets === null) {
        console.warn("MBS: failed to load the current wheel of fortune item sets");
        return MBSFortuneWheelSelectExit();
    }
}

/** Draw the selection screen. */
export function MBSFortuneWheelSelectRun(): void {
    const wheelSets = MBSSelect[pageSelector.value.field];
    if (wheelSets === null) {
        return;
    }

    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    let header = `Select custom wheel of fortune ${pageSelector.value.name} set`;
    if (!isPlayer) {
        const name = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        header = `Select ${name}'s custom wheel of fortune ${pageSelector.value.name} set`;
    }
    DrawText(header, 1000, 105, "Black");
    DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");
    DrawButton(1720, 60, 90, 90, "", "White", "Icons/Next.png", "Exit");
    DrawButton(1610, 60, 90, 90, "", "White", "Icons/Prev.png", "Exit");

    const i_per_row = FORTUNE_WHEEL_MAX_SETS / 2;
    for (const [i, wheelSet] of wheelSets.entries()) {
        const y = START.Y + (i % i_per_row) * SPACING.Y;
        const dx = (i_per_row > i) ? 0 : SPACING.X;
        const checkboxDisabled = !isPlayer ? true : wheelSet === null;
        const buttonDisabled = !isPlayer && wheelSet === null;
        DrawCheckbox(START.X + dx, y, 64, 64, "", !(wheelSet?.hidden ?? true), checkboxDisabled);
        DrawButton(
            START.X + 100 + dx, y, 600, 64, `${i}: ${wheelSet?.name ?? "Empty"}`,
            buttonDisabled ? "Gray" : "White", "", "", buttonDisabled,
        );
    }
}

/** Handle clicks within the selection screen. */
export function MBSFortuneWheelSelectClick(): void {
    const wheelSets = MBSSelect[pageSelector.value.field];
    if (MouseIn(1830, 60, 90, 90)) {
        return MBSFortuneWheelSelectExit();
    } else if (MouseIn(1720, 60, 90, 90)) {
        pageSelector.next();
        return;
    } else if (MouseIn(1610, 60, 90, 90)) {
        pageSelector.previous();
        return;
    } else if (wheelSets === null) {
        return;
    }

    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    const i_per_row = FORTUNE_WHEEL_MAX_SETS / 2;
    for (const [i, wheelSet] of wheelSets.entries()) {
        const y = START.Y + (i % i_per_row) * SPACING.Y;
        const dx = (i_per_row > i) ? 0 : SPACING.X;
        const buttonDisabled = !isPlayer && wheelSet === null;
        if (MouseIn(START.X + dx, y, 64, 64) && wheelSet !== null && isPlayer) {
            wheelSet.hidden = !wheelSet.hidden;
            return;
        } else if (MouseIn(START.X + 100 + dx, y, 600, 64) && !buttonDisabled) {
            MBSCustomize.selectedIndex = i;
            setScreenNoText(pageSelector.value.screen);
            return;
        }
    }
}

/** Exit the selection screen. */
export function MBSFortuneWheelSelectExit(): void {
    CommonSetScreen("Minigame", "WheelFortune");
}
