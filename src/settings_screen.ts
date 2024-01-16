"use strict";

import { MBS_MOD_API, waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";
import { MBSScreen, ScreenProxy } from "screen_abc";
import { FWSelectScreen, loadFortuneWheelObjects } from "fortune_wheel_select";
import { pushMBSSettings, SettingsType, getChangeLogURL } from "settings";
import { ResetScreen } from "reset_screen";
import { NewItemsScreen, NEW_ASSETS_VERSION } from "new_items_screen";

export class PreferenceScreenProxy extends ScreenProxy {
    static readonly screen = "Preference";
    readonly screen = PreferenceScreenProxy.screen;
    readonly character: Character;

    constructor() {
        super(
            null,
            "Character",
            "Preference",
            {
                Run: PreferenceRun,
                Click: PreferenceClick,
                Exit: PreferenceExit,
                Load: () => CommonSetScreen("Character", "Preference"),
            },
        );
        this.character = Player;
    }
}

export class MBSPreferenceScreen extends MBSScreen {
    static readonly screen = "MBSPreferenceScreen";
    readonly screen = MBSPreferenceScreen.screen;
    readonly character: Character;
    readonly clickList: readonly ClickAction[];

    constructor(parent: null | MBSScreen, character: Character) {
        super(parent);
        this.character = character;
        this.clickList = [
            {
                coords: [1815, 75, 90, 90],
                requiresPlayer: false,
                next: () => this.exit(),
            },
            {
                coords: [500, 172, 90, 90],
                requiresPlayer: true,
                next: () => {
                    const subScreen = new NewItemsScreen(this);
                    this.children.set(subScreen.screen, subScreen);
                    subScreen.load();
                },
            },
            {
                coords: [500, 282, 90, 90],
                requiresPlayer: false,
                next: () => {
                    const wheelStruct = {
                        FortuneWheelItemSets: loadFortuneWheelObjects(this.character, "FortuneWheelItemSets", "item sets"),
                        FortuneWheelCommands: loadFortuneWheelObjects(this.character, "FortuneWheelCommands", "commands"),
                    };
                    const subScreen = new FWSelectScreen(this, wheelStruct, this.character);
                    this.children.set(subScreen.screen, subScreen);
                    subScreen.load();
                },
            },
            {
                coords: [500, 394, 64, 64],
                requiresPlayer: true,
                next: () => {
                    if (
                        this.character.IsPlayer()
                        && !(this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained())
                    ) {
                        this.character.MBSSettings.RollWhenRestrained = !this.character.MBSSettings.RollWhenRestrained;
                        pushMBSSettings([SettingsType.SETTINGS]);
                    }
                },
            },
            {
                coords: [500, 470, 64, 64],
                requiresPlayer: true,
                next: () => {
                    if (
                        this.character.IsPlayer()
                        && !(this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained())
                    ) {
                        this.character.MBSSettings.LockedWhenRestrained = !this.character.MBSSettings.LockedWhenRestrained;
                        pushMBSSettings([SettingsType.SETTINGS]);
                    }
                },
            },
            {
                coords: [1500, 620, 400, 80],
                requiresPlayer: true,
                next: () => {
                    const subScreen = new ResetScreen(this);
                    this.children.set(subScreen.screen, subScreen);
                    subScreen.load();
                },
            },
            {
                coords: [1500, 720, 400, 80],
                requiresPlayer: false,
                next: () => {
                    globalThis.open(getChangeLogURL(), "_blank");
                },
            },
        ];
    }

    click() {
        const isPlayer = this.character.IsPlayer();
        for (const { coords, requiresPlayer, next } of this.clickList) {
            const canClick = isPlayer ? true : !requiresPlayer;
            if (MouseIn(...coords) && canClick) {
                next();
                return;
            }
        }
    }

    run() {
        MainCanvas.textAlign = "left";
        DrawText(`- Maid's Bondage Scripts ${MBS_VERSION} -`, 500, 125, "Black");
        DrawCharacter(this.character, 50, 50, 0.9);
        DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Exit");

        DrawButton(500, 172, 90, 90, "", "White", "Icons/Changelog.png");
        DrawText(`MBS: Show new R${NEW_ASSETS_VERSION} items`, 625, 207, "Black");

        DrawButton(500, 282, 90, 90, "", "White", "Icons/Crafting.png", "Configure Wheel of Fortune");
        DrawText("Configure the Wheel of Fortune", 625, 317, "Black");

        if (this.character.IsPlayer()) {
            const disable = (this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained());
            DrawCheckbox(500, 394, 64, 64, "", this.character.MBSSettings.RollWhenRestrained, disable);
            DrawText("Allow wheel spinning while restrainted", 575, 427, "Black");

            DrawCheckbox(500, 470, 64, 64, "", this.character.MBSSettings.LockedWhenRestrained, disable);
            DrawText("Lock MBS settings while restrained", 575, 502, "Black");

            DrawButton(1500, 620, 400, 80, "", "#ffc9c9", "", "Clear all MBS data");
            DrawImageResize("Icons/ServiceBell.png", 1510, 630, 60, 60);
            DrawTextFit("Reset", 1580, 660, 320, "Black");

            DrawButton(1500, 720, 400, 80, "", "White", "", "Open the MBS changelog", false);
            DrawImageResize("Icons/Changelog.png", 1510, 730, 60, 60);
            DrawTextFit("Latest Changes", 1580, 760, 320, "Black");
        }
        MainCanvas.textAlign = "center";
    }

    exit() {
        this.exitScreens(false);
    }
}

MBS_MOD_API.hookFunction("PreferenceLoad", 0, (args, next) => {
    next(args);
    if (TextScreenCache != null) {
        TextScreenCache.cache[`Homepage${MBSPreferenceScreen.screen}`] = "MBS Settings";
    }

    const img = new Image();
    img.addEventListener("error", function () {
        DrawGetImageOnError(img, false);
    });
    img.src = "Icons/Maid.png";
    DrawCacheImage.set(`Icons/${MBSPreferenceScreen.screen}.png`, img);
});

MBS_MOD_API.hookFunction("PreferenceClick", 0, (args, next) => {
    const previousScreen = PreferenceSubscreen;
    next(args);
    if (!previousScreen && <string>PreferenceSubscreen === MBSPreferenceScreen.screen) {
        PreferenceExit();
        const subScreen = new MBSPreferenceScreen(preferenceState, preferenceState.character);
        preferenceState.children.set(subScreen.screen, subScreen);
        return subScreen.load();
    }
});

let preferenceState: PreferenceScreenProxy;

waitFor(settingsMBSLoaded).then(() => {
    (<string[]>PreferenceSubscreenList).push(
        MBSPreferenceScreen.screen,
    );
    preferenceState = new PreferenceScreenProxy();
});
