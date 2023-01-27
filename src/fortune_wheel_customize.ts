/** Configuration screen for custom wheel of fortune options */

"use strict";

import { toItemBundle } from "item_bundle";
import {
    getTextInputElement,
    WheelFortuneSelectedItemSet,
    FORTUNE_WHEEL_FLAGS,
    setScreenNoText,
} from "common";
import { fortuneWheelEquip, StripLevel, getStripCondition } from "equiper";

/** The background for the MBS wheel of fortune customization screen. */
export const MBSFortuneWheelBackground = "Sheet";

/** Customization releated variables */
export const MBSCustomize: {
    /** The selected item index within {@link MBSSettings.FortuneWheelSets} */
    selectedIndex: number,
    /** The preview character */
    preview: null | Character,
} = Object.seal({ selectedIndex: 0, preview: null });

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
export const itemSettings = new WheelFortuneSelectedItemSet();

/** A mapping that maps {@link StripLevel} values to a description. */
const STRIP_MAPPING = Object.freeze({
    [StripLevel.NONE]: "None",
    [StripLevel.CLOTHES]: "Clothes",
    [StripLevel.UNDERWEAR]: "Clothes and underwear",
    [StripLevel.COSPLAY]: "Clothes, underwear and cosplay items",
    [StripLevel.ALL]: "Clothes, underwear, cosplay items and body",
});

/** Reload the appearance of the {@link MBSCustomize.preview} character based on the current {@link itemSettings}. */
function reloadPreviewAppearance(): void {
    if (MBSCustomize.preview === null) {
        MBSCustomize.preview = CharacterLoadSimple("MBSCustomize.preview");
    }

    MBSCustomize.preview.Appearance = [...Player.Appearance];
    MBSCustomize.preview.OnlineSharedSettings = Player.OnlineSharedSettings;
    CharacterReleaseTotal(MBSCustomize.preview);
    if (itemSettings.itemList === null) {
        return;
    }

    const condition = getStripCondition(itemSettings.equipLevel, MBSCustomize.preview);
    const family = MBSCustomize.preview.AssetFamily;
    const items = itemSettings.itemList.filter(({Name, Group}) => {
        const asset = AssetGet(family, Group, Name);
        if (asset == null) {
            return false;
        } else if (asset.Group.Category !== "Appearance") {
            return true;
        } else {
            return condition(asset);
        }
    });
    fortuneWheelEquip(
        "MBSCustomize.preview", items,
        itemSettings.stripLevel, null, null, MBSCustomize.preview,
    );
}

/** Loads the club crafting room in slot selection mode, creates a dummy character for previews. */
export function MBSFortuneWheelLoad(): void {
    if (MBSCustomize.preview === null) {
        MBSCustomize.preview = CharacterLoadSimple(`MBSFortuneWheelPreview-${Player.MemberNumber}`);
    }

    // Unhide all input elements
    const nameElement = getTextInputElement("name", itemSettings, "Name", [1100, 300, 700, 64], "", 70);
    const outfitElement = getTextInputElement("outfitCache", itemSettings, "Outfit code", [1150, 450, 700, 64]);
    if (!WheelFortuneCharacter?.IsPlayer()) {
        nameElement.setAttribute("disabled", true);
        outfitElement.setAttribute("disabled", true);
    }

    // Load the settings
    const itemSet = Player.MBSSettings.FortuneWheelSets[MBSCustomize.selectedIndex];
    if (itemSet !== null) {
        itemSettings.readItemSet(itemSet);
        nameElement.value = itemSet.name;
        itemSettings.outfitCache = outfitElement.value = LZString.compressToBase64(JSON.stringify(toItemBundle(
            itemSet.itemList, MBSCustomize.preview,
        )));
    } else {
        itemSettings.reset();
    }

    // Load and dress the preview character
    reloadPreviewAppearance();
}

/** Draw the customization screen. */
export function MBSFortuneWheelRun(): void {
    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    let header = "Customize wheel of fortune item set";
    if (!isPlayer) {
        const name = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        header = `View ${name}'s wheel of fortune item set customization`;
    }
    DrawText(header, 1000, 105, "Black");
    DrawButton(75, 60, 90, 90, "", isPlayer ? "White" : "Gray", "Icons/Trash.png", "Delete", !isPlayer);
    DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");
    DrawButton(1720, 60, 90, 90, "", "White", "Icons/Cancel.png", "Cancel");

    let acceptDisabled = false;
    let acceptColor = "White";
    let acceptDescription = "Accept";
    if (!itemSettings.isValidName(MBSCustomize.selectedIndex)) {
        acceptDisabled = true;
        acceptColor = "Gray";
        acceptDescription += (itemSettings.name === null) ? ": Missing name" : ": Duplicate name";
    } else if (itemSettings.itemList === null) {
        acceptDisabled = true;
        acceptColor = "Gray";
        acceptDescription += ": Missing outfit";
    } else if (!isPlayer) {
        acceptDisabled = true;
        acceptColor = "Gray";
    }
    DrawButton(1610, 60, 90, 90, "", acceptColor, "Icons/Accept.png", acceptDescription, acceptDisabled);

    if (MBSCustomize.preview !== null) {
        DrawCharacter(MBSCustomize.preview, 300, 100, 0.85, false);
    }

    const parseDisabled = itemSettings.outfitCache === null || !isPlayer;
    const parseColor = parseDisabled ? "Gray" : "White";
    const parseDescription = itemSettings.outfitCache === null ? "Missing outfit code" : "Parse the outfit code";
    DrawButton(1500, 375, 225, 64, "Parse", parseColor, undefined, parseDescription, parseDisabled);
    ElementPosition("MBSname", 1100, 300, 700, 64);
    ElementPosition("MBSoutfitCache", 1100, 400, 700, 64);

    DrawBackNextButton(750, 550, 350, 64, STRIP_MAPPING[itemSettings.stripLevel], "White", "",
        () => STRIP_MAPPING[itemSettings.stripIter.previous(false)],
        () => STRIP_MAPPING[itemSettings.stripIter.next(false)],
        !isPlayer,
    );
    DrawBackNextButton(750, 700, 350, 64, STRIP_MAPPING[itemSettings.equipLevel], "White", "",
        () => STRIP_MAPPING[itemSettings.equipIter.previous(false)],
        () => STRIP_MAPPING[itemSettings.equipIter.next(false)],
        !isPlayer,
    );

    MainCanvas.textAlign = "left";
    DrawText("Supported lock types:", 1200, 500 + 16, "Black");
    DrawText("Clothing strip level:", 750, 500 + 16, "Black");
    DrawText("Clothing equip level:", 750, 650 + 16, "Black");
    FORTUNE_WHEEL_FLAGS.forEach((flag, i) => {
        const y = 550 + (i % 3) * 100;
        const x = (i < 3) ? 1200 : 1500;
        DrawText(flag, x + 75, y + 32, "Black");
        DrawCheckbox(x, y, 64, 64, "", itemSettings.flags.has(flag), !isPlayer);
    });
    MainCanvas.textAlign = "center";
}

/** Map button coordinates to their respective callback. */
const CLICK_MAP: Map<
    [X: number, Y: number, W: number, H: number],
    { callback: () => void, requiresPlayer: boolean }
> = new Map([
    [
        [75, 60, 90, 90],
        {
            callback: () => MBSFortuneWheelExit(false, ExitAction.DELETE),
            requiresPlayer: true,
        },
    ],
    [
        [1830, 60, 90, 90],
        {
            callback: () => MBSFortuneWheelExit(true, ExitAction.NONE),
            requiresPlayer: false,
        },
    ],
    [
        [1720, 60, 90, 90],
        {
            callback: () => MBSFortuneWheelExit(false, ExitAction.NONE),
            requiresPlayer: false,
        },
    ],
    [
        [1610, 60, 90, 90],
        {
            callback: () => {
                if (itemSettings.isValidName(MBSCustomize.selectedIndex) && itemSettings.itemList !== null) {
                    MBSFortuneWheelExit(false, ExitAction.SAVE);
                }
            },
            requiresPlayer: true,
        },
    ],
    [
        [1500, 375, 225, 64],
        {
            callback: () => {
                if (itemSettings.loadFromBase64()) {
                    reloadPreviewAppearance();
                }
            },
            requiresPlayer: true,
        },
    ],
    [
        [750, 550, 175, 64],
        {
            callback: () => {
                itemSettings.stripIter.previous();
                reloadPreviewAppearance();
            },
            requiresPlayer: true,
        },
    ],
    [
        [925, 550, 175, 64],
        {
            callback: () => {
                itemSettings.stripIter.next();
                reloadPreviewAppearance();
            },
            requiresPlayer: true,
        },
    ],
    [
        [750, 700, 175, 64],
        {
            callback: () => {
                itemSettings.equipIter.previous();
                reloadPreviewAppearance();
            },
            requiresPlayer: true,
        },
    ],
    [
        [925, 700, 175, 64],
        {
            callback: () => {
                itemSettings.equipIter.next();
                reloadPreviewAppearance();
            },
            requiresPlayer: true,
        },
    ],
]);
FORTUNE_WHEEL_FLAGS.forEach((flag, i) => {
    const y = 550 + (i % 3) * 100;
    const x = (i < 3) ? 1200 : 1500;
    CLICK_MAP.set(
        [x, y, 64, 64],
        {
            callback: () => {
                const flags = itemSettings.flags;
                flags.has(flag) ? flags.delete(flag) : flags.add(flag);
            },
            requiresPlayer: true,
        },
    );
});

/** Handle clicks within the customization screen. */
export function MBSFortuneWheelClick(): void {
    const isPlayer = WheelFortuneCharacter?.IsPlayer();
    for (const [args, { callback, requiresPlayer }] of CLICK_MAP) {
        const canClick = isPlayer ? true : !requiresPlayer;
        if (MouseIn(...args) && canClick) {
            callback();
        }
    }
}

/**
 * Exit the customization screen.
 * @param fullExit Whether to return to the initial wheel of fortune screen.
 * @param action Whether to do nothing, save the custom item settings or delete to them.
 */
export function MBSFortuneWheelExit(fullExit: boolean = true, action: ExitAction = ExitAction.NONE): void {
    ElementRemove("MBSname");
    ElementRemove("MBSoutfitCache");

    if (!WheelFortuneCharacter?.IsPlayer()) {
        action = ExitAction.NONE;
    }

    const settings = Player.MBSSettings.FortuneWheelSets;
    switch (action) {
        case ExitAction.NONE:
            break;
        case ExitAction.SAVE: {
            if (itemSettings.isValidName(MBSCustomize.selectedIndex) && itemSettings.itemList !== null) {
                const hidden = settings[MBSCustomize.selectedIndex]?.hidden ?? false;
                settings[MBSCustomize.selectedIndex] = itemSettings.writeItemSet(hidden);
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
            throw `Unsupported action: ${action}`;
    }

    if (fullExit) {
        CommonSetScreen("Minigame", "WheelFortune");
    } else {
        setScreenNoText("MBSFortuneWheelSelect");
    }
}
