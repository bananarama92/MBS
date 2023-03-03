/** Configuration screen for custom wheel of fortune options */

"use strict";

import { toItemBundles } from "item_bundle";
import {
    getTextInputElement,
    FWSelectedItemSet,
    FWItemSet,
    FORTUNE_WHEEL_FLAGS,
} from "common_bc";
import { fortuneWheelEquip, StripLevel, getStripCondition } from "equipper";
import { MBSScreen, FWObjectScreen, ExitAction } from "screen_abc";

/** A mapping that maps {@link StripLevel} values to a description. */
const STRIP_MAPPING = Object.freeze({
    [StripLevel.NONE]: "None",
    [StripLevel.CLOTHES]: "Clothes",
    [StripLevel.UNDERWEAR]: "Clothes and underwear",
    [StripLevel.COSPLAY]: "Clothes, underwear and cosplay items",
    [StripLevel.ALL]: "Clothes, underwear, cosplay items and body",
});

export class FWItemSetScreen extends FWObjectScreen<FWItemSet> {
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
                    if (this.settings.isValid(this.index)) {
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
            ...FORTUNE_WHEEL_FLAGS.map((flag, i): ClickAction => {
                const y = 550 + (i % 3) * 100;
                const x = (i < 3) ? 1200 : 1500;
                return {
                    coords: [x, y, 64, 64],
                    next: () => {
                        const flags = this.settings.flags;
                        flags.has(flag) ? flags.delete(flag) : flags.add(flag);
                    },
                    requiresPlayer: true,
                };
            }),
        ];
    }

    /** Loads the club crafting room in slot selection mode, creates a dummy character for previews. */
    load(): void {
        super.load();

        // Unhide all input elements
        const nameElement = getTextInputElement("name", this.settings, "Name", [1100, 300, 700, 64], "", 70);
        const outfitElement = getTextInputElement("outfitCache", this.settings, "Outfit code", [1150, 450, 700, 64]);
        if (!this.character.IsPlayer()) {
            nameElement.setAttribute("disabled", true);
            outfitElement.setAttribute("disabled", true);
        }

        // Load the settings
        const itemSet = this.wheelObject;
        if (itemSet !== null) {
            nameElement.value = itemSet.name;
            this.settings.readSettings(itemSet);
            this.settings.outfitCache = outfitElement.value = LZString.compressToBase64(
                JSON.stringify(toItemBundles(itemSet.itemList, this.preview)),
            );
        } else {
            this.settings.reset();
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
        } else if (!this.settings.isValid(this.index)) {
            acceptDisabled = true;
            acceptColor = "Gray";
            acceptDescription += (this.settings.name === null) ? ": Missing name" : ": Duplicate name";
        } else if (this.settings.itemList === null) {
            acceptDisabled = true;
            acceptColor = "Gray";
            acceptDescription += ": Missing outfit";
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
        FORTUNE_WHEEL_FLAGS.forEach((flag, i) => {
            const y = 550 + (i % 3) * 100;
            const x = (i < 3) ? 1200 : 1500;
            DrawText(flag, x + 75, y + 32, "Black");
            DrawCheckbox(x, y, 64, 64, "", this.settings.flags.has(flag), !isPlayer);
        });
        MainCanvas.textAlign = "center";
    }

    unload(): void {
        ElementRemove("MBSname");
        ElementRemove("MBSoutfitCache");
    }
}
