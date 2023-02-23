/** Configuration screen for custom wheel of fortune options */

"use strict";

import {
    getTextInputElement,
    WheelFortuneSelectedCommand,
    setScreenNoText,
} from "common_bc";

import { MBSSelect, MBSCustomize } from "glob_vars";
import { MBSFortuneWheelSelectExit } from "fortune_wheel_select";

/** The background for the MBS wheel of fortune customization screen. */
export const MBSFortuneWheelCommand = "Sheet";

/** Various exit-related actions for {@link MBSFortuneWheelExit}. */
const ExitAction = Object.freeze({
    /** Exit without any special actions. */
    NONE: 0,
    /** Save and exit. */
    SAVE: 1,
    /** Delete and exit. */
    DELETE: 2,
});

/** An object for holding the settings of the currently selected custom option. */
export const commandSettings = new WheelFortuneSelectedCommand();

/** Loads the club crafting room in slot selection mode, creates a dummy character for previews. */
export function MBSFortuneWheelCommandLoad(): void {
    if (MBSSelect.FortuneWheelCommands === null) {
        console.warn("MBS: failed to load the current wheel of fortune command");
        return MBSFortuneWheelCommandExit();
    }

    // Unhide all input elements
    const nameElement = getTextInputElement("name", commandSettings, "Role play command", [900, 500, 700, 64], "", 140);
    if (!WheelFortuneCharacter?.IsPlayer()) {
        nameElement.setAttribute("disabled", true);
    }

    // Load the settings
    const commandSet = MBSSelect.FortuneWheelCommands[MBSCustomize.selectedIndex];
    if (commandSet !== null) {
        commandSettings.readSettings(commandSet);
        nameElement.value = commandSet.name;
    } else {
        commandSettings.reset();
    }
}

/** Draw the customization screen. */
export function MBSFortuneWheelRun(): void {
    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    let header = "Customize wheel of fortune command";
    if (!isPlayer) {
        const name = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        header = `View ${name}'s wheel of fortune command customization`;
    }
    DrawText(header, 1000, 105, "Black");
    DrawButton(75, 60, 90, 90, "", isPlayer ? "White" : "Gray", "Icons/Trash.png", "Delete", !isPlayer);
    DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");
    DrawButton(1720, 60, 90, 90, "", "White", "Icons/Cancel.png", "Cancel");

    let acceptDisabled = false;
    let acceptColor = "White";
    let acceptDescription = "Accept";
    if (!isPlayer) {
        acceptDisabled = true;
        acceptColor = "Gray";
    } else if (!commandSettings.isValidName(MBSCustomize.selectedIndex)) {
        acceptDisabled = true;
        acceptColor = "Gray";
        acceptDescription += (commandSettings.name === null) ? ": Missing name" : ": Duplicate name";
    }
    DrawButton(1610, 60, 90, 90, "", acceptColor, "Icons/Accept.png", acceptDescription, acceptDisabled);
    ElementPosition("MBSname", 900, 500, 700, 6);
}

/** Map button coordinates to their respective callback. */
const CLICK_MAP: Map<
    [X: number, Y: number, W: number, H: number],
    { callback: () => void, requiresPlayer: boolean }
> = new Map([
    [
        [75, 60, 90, 90],
        {
            callback: () => MBSFortuneWheelCommandExit(false, ExitAction.DELETE),
            requiresPlayer: true,
        },
    ],
    [
        [1830, 60, 90, 90],
        {
            callback: () => MBSFortuneWheelCommandExit(true, ExitAction.NONE),
            requiresPlayer: false,
        },
    ],
    [
        [1720, 60, 90, 90],
        {
            callback: () => MBSFortuneWheelCommandExit(false, ExitAction.NONE),
            requiresPlayer: false,
        },
    ],
    [
        [1610, 60, 90, 90],
        {
            callback: () => {
                if (commandSettings.isValidName(MBSCustomize.selectedIndex)) {
                    MBSFortuneWheelCommandExit(false, ExitAction.SAVE);
                }
            },
            requiresPlayer: true,
        },
    ],
]);

/** Handle clicks within the customization screen. */
export function MBSFortuneWheelCommandClick(): void {
    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    for (const [args, { callback, requiresPlayer }] of CLICK_MAP) {
        const canClick = isPlayer ? true : !requiresPlayer;
        if (MouseIn(...args) && canClick) {
            callback();
        }
    }
}

/**
 * Helper screen-change function for {@link MBSFortuneWheelExit}.
 * @param fullExit Whether to return to the initial wheel of fortune screen.
 */
function customizeExit(fullExit: boolean): void {
    if (fullExit) {
        MBSFortuneWheelSelectExit();
    } else {
        setScreenNoText("MBSFortuneWheelSelect");
    }
}

/**
 * Exit the customization screen.
 * @param fullExit Whether to return to the initial wheel of fortune screen.
 * @param action Whether to do nothing, save the custom item settings or delete to them.
 */
export function MBSFortuneWheelCommandExit(fullExit: boolean = true, action: ExitAction = ExitAction.NONE): void {
    ElementRemove("MBSname");

    if (!WheelFortuneCharacter?.IsPlayer() || MBSSelect.FortuneWheelCommands === null) {
        return customizeExit(fullExit);
    }

    const settings = Player.MBSSettings.FortuneWheelCommands;
    switch (action) {
        case ExitAction.NONE:
            break;
        case ExitAction.SAVE: {
            if (commandSettings.isValidName(MBSCustomize.selectedIndex)) {
                const hidden = settings[MBSCustomize.selectedIndex]?.hidden ?? false;
                settings[MBSCustomize.selectedIndex] = commandSettings.writeSettings(hidden);
                settings[MBSCustomize.selectedIndex]?.registerOptions();
            }
            break;
        }
        case ExitAction.DELETE: {
            const option = settings[MBSCustomize.selectedIndex];
            settings[MBSCustomize.selectedIndex] = null;
            option?.unregisterOptions();
            break;
        }
        default:
            throw new Error(`Unsupported action: ${action}`);
    }
    customizeExit(fullExit);
}
