/** Selection screen for custom wheel of fortune options */

"use strict";

import { FORTUNE_WHEEL_MAX_SETS, setScreenNoText } from "common";
import { MBSCustomize } from "fortune_wheel_customize";

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

/** Load the selection screen. */
export function MBSFortuneWheelSelectLoad(): void {
    if (!WheelFortuneCharacter?.IsPlayer()) {
        MBSFortuneWheelSelectExit();
    }
}

/** Draw the selection screen. */
export function MBSFortuneWheelSelectRun(): void {
    DrawText("Select custom wheel of fortune item set", 1000, 105, "Black");
    DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");

    const i_per_row = FORTUNE_WHEEL_MAX_SETS / 2;
    Player.MBSSettings.FortuneWheelSets.forEach((itemSet, i) => {
        const y = START.Y + (i % i_per_row) * SPACING.Y;
        const dx = (i_per_row > i) ? 0 : SPACING.X;
        DrawCheckbox(START.X + dx, y, 64, 64, "", !(itemSet?.hidden ?? true), itemSet === null);
        DrawButton(START.X + 100 + dx, y, 600, 64, `${i}: ${itemSet?.name ?? "Empty"}`, "White");
    });
}

/** Handle clicks within the selection screen. */
export function MBSFortuneWheelSelectClick(): void {
    if (MouseIn(1830, 60, 90, 90)) {
        MBSFortuneWheelSelectExit();
    }

    const i_per_row = FORTUNE_WHEEL_MAX_SETS / 2;
    for (const [i, itemSet] of Player.MBSSettings.FortuneWheelSets.entries()) {
        const y = START.Y + (i % i_per_row) * SPACING.Y;
        const dx = (i_per_row > i) ? 0 : SPACING.X;
        if (MouseIn(START.X + dx, y, 64, 64) && itemSet !== null) {
            itemSet.hidden = !itemSet.hidden;
            return;
        } else if (MouseIn(START.X + 100 + dx, y, 600, 64)) {
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
