"use strict";

import { MBS_MOD_API, MBS_VERSION, waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";
import { MBSScreen, ScreenProxy } from "screen_abc";
import { FWSelectScreen, loadFortuneWheelObjects } from "fortune_wheel_select";

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
                Load: () => {
                    CommonSetScreen("Character", "Preference");
                    PreferenceLoad();
                },
                Unload: CommonNoop,
                Resize: CommonNoop,
                KeyDown: CommonNoop,
            },
        );
        this.character = Player;
    }
}

export class MBSPreferenceScreen extends MBSScreen {
    static readonly screen = "MBSPreferenceScreen";
    readonly screen = MBSPreferenceScreen.screen;
    readonly character: Character;

    constructor(parent: null | MBSScreen, character: Character) {
        super(parent);
        this.character = character;
    }

    click() {
        if (MouseIn(1815, 75, 90, 90)) {
            this.exit();
        } else if (MouseIn(500, 320, 90, 90)) {
            const wheelStruct = {
                FortuneWheelItemSets: loadFortuneWheelObjects(this.character, "FortuneWheelItemSets", "item sets"),
                FortuneWheelCommands: loadFortuneWheelObjects(this.character, "FortuneWheelCommands", "commands"),
            };
            const subScreen = new FWSelectScreen(this, wheelStruct, this.character);
            this.children.set(subScreen.screen, subScreen);
            subScreen.load();
        }
    }

    run() {
        MainCanvas.textAlign = "left";
        DrawText("- MBS preferences -", 500, 125, "Black");
        DrawText(`MBS Version: ${MBS_VERSION}`, 500, 225, "Black");
        DrawCharacter(Player, 50, 50, 0.9);
        MainCanvas.textAlign = "center";

        DrawButton(
            500, 320, 90, 90, "", "White", "Icons/Crafting.png",
            "Configure Wheel of Fortune",
        );
        DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Exit");
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
        PreferenceSubscreen = "";
        PreferenceMessage = "";
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
