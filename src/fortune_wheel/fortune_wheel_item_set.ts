/** Configuration screen for custom wheel of fortune options */

import { clamp } from "lodash-es";

import {
    getTextInputElement,
    getNumberInputElement,
    FWSelectedItemSet,
    FWItemSet,
} from "../common_bc";
import { MBSScreen, MBSObjectScreen, ExitAction } from "../screen_abc";
import { byteToKB } from "../settings";

import { toItemBundles } from "./item_bundle";
import { fortuneWheelEquip, StripLevel, getStripCondition } from "./equipper";

/** A mapping that maps {@link StripLevel} values to a description. */
const STRIP_MAPPING = Object.freeze({
    [StripLevel.NONE]: "None",
    [StripLevel.CLOTHES]: "Clothes",
    [StripLevel.UNDERWEAR]: "Clothes and underwear",
    [StripLevel.COSPLAY]: "Clothes, underwear and cosplay items",
    [StripLevel.ALL]: "Clothes, underwear, cosplay items and body",
});

const TIME_PATTERN = new RegExp(
    "(([0-9]?[0-9])d)?"
    + "(([0-9]?[0-9])h)?"
    + "(([0-9]?[0-9])m)?"
    + "(([0-9]?[0-9])s)?",
);

/**
 * Convert number-based time into a string compatible with the {@link createTimerElement} input element
 * @param time The time in seconds
 * @returns The stringified time
 */
function toInputTime(time: number): string {
    time = clamp(time, 60, 60 * 240);
    const unitsTime = { d: 0, h: 0, m: 0, s: 0 };

    unitsTime.d = Math.min(7, Math.floor(time / (24 * 60 * 60)));
    time -= unitsTime.d * (24 * 60 * 60);

    unitsTime.h = Math.floor(time / (60 * 60));
    time -= unitsTime.h * (60 * 60);

    unitsTime.m = Math.floor(time / 60);
    time -= unitsTime.m * 60;

    unitsTime.s = time;
    let time_str = unitsTime.d ? `${unitsTime.d}d` : "";
    time_str += `${unitsTime.h.toString().padStart(2, "0")}h${unitsTime.m.toString().padStart(2, "0")}m${unitsTime.s.toString().padStart(2, "0")}s`;
    return time_str;
}

/**
 * Convert a time string produced by the {@link createTimerElement} input element into a number in units of seconds
 * @param time The stringified time
 * @returns The time in seconds
 */
function fromInputTime(time: string): number | null {
    const match = time.match(TIME_PATTERN);
    if (match === null) {
        return null;
    }

    const [d, h, m, s] = [match[2], match[4], match[6], match[8]];
    let seconds = 0;
    seconds += d === undefined ? 0 : Number.parseInt(d, 10) * (24 * 60 * 60);
    seconds += h === undefined ? 0 : Number.parseInt(h, 10) * (60 * 60);
    seconds += m === undefined ? 0 : Number.parseInt(m, 10) * 60;
    seconds += s === undefined ? 0 : Number.parseInt(s, 10);
    return seconds;
}

/**
 * Construct the timer input field for the timer-lock based flags
 * @param flag The timer lock flag
 * @param index The index of the flag within the flag list
 */
function createTimerElement(flag: FWFlagTimerPasswordPadlock, index: number, readonly: boolean): void {
    const element = ElementCreateInput(`MBSFlag${index}`, "text", toInputTime(flag.time), 11);
    if (element != null) {
        element.pattern = TIME_PATTERN.source;
        if (readonly) {
            element.setAttribute("disabled", true);
        }
        element.onchange = function onchange() {
            const { value } = <HTMLInputElement>this;
            const seconds = fromInputTime(value);
            if (seconds !== null) {
                flag.time = clamp(seconds ?? 60, 60, 60 * 240);
            }
        };
    }
}

export class FWItemSetScreen extends MBSObjectScreen<FWItemSet> {
    static readonly screen = "MBS_FWItemSetScreen";
    readonly screen = FWItemSetScreen.screen;
    static readonly background = "Sheet";
    readonly settings: FWSelectedItemSet;
    readonly preview: Character;
    readonly clickList: readonly ClickAction[];

    constructor(parent: null | MBSScreen, wheelList: (null | FWItemSet)[], index: number, character: Character) {
        super(parent, wheelList, index, character);
        this.settings = new FWSelectedItemSet(wheelList);
        this.preview = CharacterLoadSimple(`MBSFortuneWheelPreview-${Player.MemberNumber}`);
        this.clickList = [
            {
                coords: [75, 60, 90, 90],
                next: () => this.exit(false, ExitAction.DELETE),
                requiresPlayer: true,
            },
            {
                coords: [1830, 60, 90, 90],
                next: () => this.exit(true, ExitAction.NONE),
                requiresPlayer: false,
            },
            {
                coords: [1720, 60, 90, 90],
                next: () => this.exit(false, ExitAction.NONE),
                requiresPlayer: false,
            },
            {
                coords: [1610, 60, 90, 90],
                next: () => {
                    if (this.settings.isValid(this.index) && this.hasStorageSpace()) {
                        this.exit(false, ExitAction.SAVE);
                    }
                },
                requiresPlayer: true,
            },
            {
                coords: [1500, 375, 225, 64],
                next: () => {
                    if (this.settings.loadFromBase64()) {
                        this.#reloadPreviewAppearance();
                    }
                },
                requiresPlayer: true,
            },
            {
                coords: [750, 550, 175, 64],
                next: () => {
                    this.settings.stripIter.previous();
                    this.#reloadPreviewAppearance();
                },
                requiresPlayer: true,
            },
            {
                coords: [925, 550, 175, 64],
                next: () => {
                    this.settings.stripIter.next();
                    this.#reloadPreviewAppearance();
                },
                requiresPlayer: true,
            },
            {
                coords: [750, 700, 175, 64],
                next: () => {
                    this.settings.equipIter.previous();
                    this.#reloadPreviewAppearance();
                },
                requiresPlayer: true,
            },
            {
                coords: [925, 700, 175, 64],
                next: () => {
                    this.settings.equipIter.next();
                    this.#reloadPreviewAppearance();
                },
                requiresPlayer: true,
            },
            ...this.settings.flags.map((flag, i): ClickAction => {
                const y = 550 + (i % 4) * 100;
                const x = (i < 4) ? 1200 : 1550;
                return {
                    coords: [x, y, 64, 64],
                    next: () => {
                        flag.enabled = !flag.enabled;
                    },
                    requiresPlayer: true,
                };
            }),
        ];
    }

    /** Loads the club crafting room in slot selection mode, creates a dummy character for previews. */
    load(): void {
        super.load();
        const readonly = !this.character.IsPlayer();

        // Unhide all input elements
        const nameElement = getTextInputElement("name", this.settings, "Name", [1100, 300, 700, 64], "", 70);
        const outfitElement = getTextInputElement("outfitCache", this.settings, "Outfit code", [1150, 450, 700, 64]);
        const weightElement = getNumberInputElement("weight", this.settings, [750, 850, 64, 64], 1, 1, 9);
        if (readonly) {
            nameElement.setAttribute("disabled", true);
            outfitElement.setAttribute("disabled", true);
            weightElement.setAttribute("disabled", true);
        }

        // Load the settings
        const itemSet = this.mbsObject;
        if (itemSet !== null) {
            nameElement.value = itemSet.name;
            weightElement.value = itemSet.weight.toString();
            this.settings.readSettings(itemSet);
            this.settings.outfitCache = outfitElement.value = LZString.compressToBase64(
                JSON.stringify(toItemBundles(itemSet.itemList, this.preview)),
            );
        } else {
            this.settings.reset();
        }

        for (const [i, flag] of this.settings.flags.entries()) {
            switch (flag.type) {
                case "TimerPasswordPadlock": {
                    createTimerElement(flag, i, readonly);
                    break;
                }
            }
        }

        // Load and dress the preview character
        this.#reloadPreviewAppearance();
    }

    /** Reload the appearance of thepreview character based on the current settings. */
    #reloadPreviewAppearance(): void {
        this.preview.Appearance = [...Player.Appearance];
        this.preview.OnlineSharedSettings = Player.OnlineSharedSettings;
        CharacterReleaseTotal(this.preview);
        if (this.settings.itemList === null) {
            return;
        }

        const condition = getStripCondition(this.settings.equipLevel, this.preview);
        const family = this.preview.AssetFamily;
        const items = this.settings.itemList.filter(({Name, Group}) => {
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
            "MBSPreview", items,
            this.settings.stripLevel, null, null, this.preview,
        );
    }

    /** Draw the customization screen. */
    run(): void {
        const isPlayer = this.character.IsPlayer();
        let header = "Customize wheel of fortune item set";
        if (!isPlayer) {
            const name = this.character.Nickname ?? this.character.Name;
            header = `View ${name}'s wheel of fortune item set customization`;
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
        } else if (this.settings.itemList === null) {
            acceptDisabled = true;
            acceptColor = "Gray";
            acceptDescription += ": Missing outfit";
        } else if (!this.settings.isValid(this.index)) {
            acceptDisabled = true;
            acceptColor = "Gray";
            if (this.settings.name === null) {
                acceptDescription += ": Missing name";
            } else if (this.settings.flags.every(i => !i.enabled)) {
                acceptDescription += ": Must enable at least one lock flag";
            } else {
                acceptDescription += ": Duplicate name";
            }
        } else if (!this.hasStorageSpace()) {
            acceptDisabled = true;
            acceptColor = "Gray";
            acceptDescription = `Max allowed OnlineSharedSettings storage size exceeded (${byteToKB(this.dataSize.value)} / ${byteToKB(this.dataSize.max)} KB)`;
        }
        DrawButton(1610, 60, 90, 90, "", acceptColor, "Icons/Accept.png", acceptDescription, acceptDisabled);
        DrawCharacter(this.preview, 300, 175, 0.78, false);

        const parseDisabled = this.settings.outfitCache === null || !isPlayer;
        const parseColor = parseDisabled ? "Gray" : "White";
        const parseDescription = this.settings.outfitCache === null ? "Missing outfit code" : "Parse the outfit code";
        DrawButton(1500, 375, 225, 64, "Parse", parseColor, undefined, parseDescription, parseDisabled);
        ElementPosition("MBSname", 1100, 300, 700, 64);
        ElementPosition("MBSoutfitCache", 1100, 400, 700, 64);

        DrawBackNextButton(750, 550, 350, 64, STRIP_MAPPING[this.settings.stripLevel], "White", "",
            () => STRIP_MAPPING[this.settings.stripIter.previous(false)],
            () => STRIP_MAPPING[this.settings.stripIter.next(false)],
            !isPlayer,
        );
        DrawBackNextButton(750, 700, 350, 64, STRIP_MAPPING[this.settings.equipLevel], "White", "",
            () => STRIP_MAPPING[this.settings.equipIter.previous(false)],
            () => STRIP_MAPPING[this.settings.equipIter.next(false)],
            !isPlayer,
        );

        MainCanvas.textAlign = "left";
        DrawText("Supported lock types:", 1200, 500 + 16, "Black");
        DrawText("Clothing strip level:", 750, 500 + 16, "Black");
        DrawText("Clothing equip level:", 750, 650 + 16, "Black");
        DrawText("Wheel option weight:", 750, 800 + 16, "Black");
        ElementPosition("MBSweight", 790, 870, 80);
        for (const [i, flag] of this.settings.flags.entries()) {
            const y = 550 + (i % 4) * 100;
            const x = (i < 4) ? 1200 : 1550;
            switch (flag.type) {
                case "ExclusivePadlock":
                    DrawText("Exclusive", x + 75, y + 32, "Black");
                    break;
                case "HighSecurityPadlock":
                    DrawText("High Security", x + 75, y + 32, "Black");
                    break;
                case "TimerPasswordPadlock":
                    ElementPosition(`MBSFlag${i}`, x + 200, y + 29, 250, 60);
                    break;
                case null:
                    DrawText("No Lock", x + 75, y + 32, "Black");
                    break;
            }
            DrawCheckbox(x, y, 64, 64, "", flag.enabled, !isPlayer);
        }
        MainCanvas.textAlign = "center";
    }

    unload(): void {
        ElementRemove("MBSname");
        ElementRemove("MBSoutfitCache");
        ElementRemove("MBSweight");
        for (const [i, flag] of this.settings.flags.entries()) {
            switch (flag.type) {
                case "TimerPasswordPadlock":
                    ElementRemove(`MBSFlag${i}`);
                    break;
            }
        }
    }
}
