/** Selection screen for custom wheel of fortune options */

"use strict";

import { FORTUNE_WHEEL_MAX_SETS, setScreenNoText } from "common";
import { MBSCustomize, MBSSelect } from "fortune_wheel";

const START = Object.freeze({
    X: 250,
    Y: 200,
});
const SPACING = Object.freeze({
    X: 800,
    Y: 100,
});

/** The background for the MBS wheel of fortune selection screen. */
export const MBSFortuneWheelSelectBackground = "Sheet";

export function MBSFortuneWheelSelectLoad(): void {
    if (MBSSelect.currentFortuneWheelSets === null) {
        return MBSFortuneWheelSelectExit();
    }
}

/** Draw the selection screen. */
export function MBSFortuneWheelSelectRun(): void {
    if (MBSSelect.currentFortuneWheelSets === null) {
        return;
    }

    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    let header = "Select custom wheel of fortune item set";
    if (!isPlayer) {
        const name = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        header = `Select ${name}'s custom wheel of fortune item set`;
    }
    DrawText(header, 1000, 105, "Black");
    DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");

    const i_per_row = FORTUNE_WHEEL_MAX_SETS / 2;
    MBSSelect.currentFortuneWheelSets.forEach((itemSet, i) => {
        const y = START.Y + (i % i_per_row) * SPACING.Y;
        const dx = (i_per_row > i) ? 0 : SPACING.X;
        const checkboxDisabled = !isPlayer ? true : itemSet === null;
        const buttonDisabled = !isPlayer && itemSet === null;
        DrawCheckbox(START.X + dx, y, 64, 64, "", !(itemSet?.hidden ?? true), checkboxDisabled);
        DrawButton(
            START.X + 100 + dx, y, 600, 64, `${i}: ${itemSet?.name ?? "Empty"}`,
            buttonDisabled ? "Gray" : "White", "", "", buttonDisabled,
        );
    });
}

/** Handle clicks within the selection screen. */
export function MBSFortuneWheelSelectClick(): void {
    if (MBSSelect.currentFortuneWheelSets === null) {
        return;
    } else if (MouseIn(1830, 60, 90, 90)) {
        return MBSFortuneWheelSelectExit();
    }

    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    const i_per_row = FORTUNE_WHEEL_MAX_SETS / 2;
    for (const [i, itemSet] of MBSSelect.currentFortuneWheelSets.entries()) {
        const y = START.Y + (i % i_per_row) * SPACING.Y;
        const dx = (i_per_row > i) ? 0 : SPACING.X;
        const buttonDisabled = !isPlayer && itemSet === null;
        if (MouseIn(START.X + dx, y, 64, 64) && itemSet !== null && isPlayer) {
            itemSet.hidden = !itemSet.hidden;
            return;
        } else if (MouseIn(START.X + 100 + dx, y, 600, 64) && !buttonDisabled) {
            MBSCustomize.selectedIndex = i;
            setScreenNoText("MBSFortuneWheel");
            return;
        }
    }
}

/** Exit the selection screen. */
export function MBSFortuneWheelSelectExit(): void {
    CommonSetScreen("Minigame", "WheelFortune");
}
