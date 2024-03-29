import { MBS_MOD_API, waitFor, logger } from "../common";
import { bcLoaded } from "../common_bc";
import { MBSScreen, ScreenProxy } from "../screen_abc";
import { FWSelectScreen, loadFortuneWheelObjects } from "../fortune_wheel";
import { NEW_ASSETS_VERSION, NEW_ASSETS } from "../new_items_screen";

import {
    pushMBSSettings,
    SettingsType,
    getChangeLogURL,
    importSettings,
    exportSettings,
    logSettingsSize,
    SettingsStatus,
} from "./settings";
import { ResetScreen } from "./reset_screen";

// Partially adapted from LSCG
//
// LSCG, Copyright 2023 Little Sera, GPLv3
// https://github.com/littlesera/LSCG

export class PreferenceScreenProxy extends ScreenProxy {
    static readonly screen = "Preference";
    readonly screen = PreferenceScreenProxy.screen;
    readonly character: PlayerCharacter;

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
    readonly character: PlayerCharacter;
    readonly elements: Record<string, UIElement>;

    constructor(parent: null | MBSScreen) {
        super(parent);
        this.character = Player;

        const descriptionOffset = 125;
        this.elements = {
            header: {
                coords: [500, 125, 0, 0],
                run: (x, y) => DrawText(`- Maid's Bondage Scripts ${MBS_VERSION} -`, x, y, "Black"),
            },
            previewCharacter: {
                coords: [50, 50, 0, 0],
                run: (x, y) => DrawCharacter(this.character, x, y, 0.9),
            },
            exit: {
                coords: [1815, 75, 90, 90],
                run: (...coords) => DrawButton(...coords, "", "White", "Icons/Exit.png", "Exit"),
                click: () => this.exit(),
            },
            reset: {
                coords: [1500, 520, 400, 80],
                run: (x, y, w, h) => {
                    const iconMarigin = 10;
                    DrawButton(x, y, w, h, "", "#ffc9c9", "", "Clear all MBS data");
                    DrawImageResize("Icons/ServiceBell.png", x + iconMarigin, y + iconMarigin, h - 2 * iconMarigin, h - 2 * iconMarigin);
                    DrawTextFit("Reset MBS", x + h, y + (h / 2), w - h, "Black");
                },
                click: () => {
                    const subScreen = new ResetScreen(this);
                    this.children.set(subScreen.screen, subScreen);
                    subScreen.load();
                },
            },
            import: {
                coords: [1500, 620, 190, 80],
                run: (x, y, w, h) => {
                    MainCanvas.textAlign = "center";
                    DrawButton(x, y, w, h, "Import", "White", "", "Import MBS settings");
                    MainCanvas.textAlign = "left";
                },
                click: () => {
                    const settingsString = prompt(
                        "Please paste MBS settings.\nImporting settings will overwrite existing settings. Are you sure?",
                    );
                    if (!settingsString) {
                        return;
                    }

                    const status = importSettings(settingsString);
                    switch (status.status) {
                        case SettingsStatus.OK:
                            logger.log("Settings successfully updated");
                            return alert("Settings successfully updated!");
                        case SettingsStatus.ERROR:
                            return alert("ERROR: Detected corrupted MBS settings.\nNo changes were made.");
                        case SettingsStatus.EMPTY_SETTINGS:
                            return alert("ERROR: Detected empty or corrupted MBS settings.\nNo changes were made.");
                        case SettingsStatus.WARN: {
                            const isConfirm = confirm(
                                "WARNING: MBS successfully parsed the settings but found one or more invalid fields; "
                                + "please check the browser console for more details."
                                + "\nAre you sure you want to continue?",
                            );
                            if (isConfirm) {
                                Player.MBSSettings = status.settings;
                                pushMBSSettings([SettingsType.SETTINGS, SettingsType.SHARED], true);
                                logSettingsSize();
                                logger.log("Settings successfully updated");
                                alert("Settings successfully updated!");
                            }
                        }
                    }
                },
            },
            export: {
                coords: [1710, 620, 190, 80],
                run: (x, y, w, h) => {
                    MainCanvas.textAlign = "center";
                    DrawButton(x, y, w, h, "Export", "White", "", "Export MBS settings");
                    MainCanvas.textAlign = "left";
                },
                click: () => {
                    const compressed = exportSettings();
                    navigator.clipboard.writeText(compressed);
                    alert("MBS settings copied to clipboard.");
                },
            },
            changelog: {
                coords: [1500, 720, 400, 80],
                run: (x, y, w, h) => {
                    const iconMarigin = 10;
                    DrawButton(x, y, w, h, "", "White", "", "Open the MBS changelog");
                    DrawImageResize("Icons/Changelog.png", x + iconMarigin, y + iconMarigin, h - 2 * iconMarigin, h - 2 * iconMarigin);
                    DrawTextFit("Latest Changes", x + h, y + (h / 2), w - h, "Black");
                },
                click: () => {
                    open(getChangeLogURL(), "_blank");
                },
            },
            newAssets: {
                coords: [500, 172, 90, 90],
                run: (x, y, w, h) => {
                    DrawButton(x, y, w, h, "", "White", "Icons/Changelog.png");
                    DrawText(`MBS: Show new R${NEW_ASSETS_VERSION} items`, x + descriptionOffset, y + h / 2, "Black");
                },
                click: () => {
                    const background = ServerPlayerIsInChatRoom() ? ChatRoomData?.Background : undefined;
                    const prevScreen: [ModuleType, string] = ServerPlayerIsInChatRoom() ? ["Online", "ChatRoom"] : ["Character", "Preference"];
                    this.exitScreens(true);
                    PreferenceExit();
                    Shop2Vars.Mode = "Preview";
                    Shop2Vars.Filters.MBS_VersionFilter = (item) => NEW_ASSETS[`${item.Asset.Group.Name}${item.Asset.Name}`] ? ["Buy", "Sell", "Preview"] : [];
                    Shop2.Init(background, prevScreen);
                    ServerBeep = {
                        Message: "The MBS \"Show new items\" button will be removed in R103; use the Club Shop or /shop chat command instead",
                        Timer: CommonTime() + 10000,
                    };
                },
            },
            wheelConfig: {
                coords: [500, 282, 90, 90],
                run: (x, y, w, h) => {
                    DrawButton(x, y, w, h, "", "White", "Icons/Crafting.png", "Configure Wheel of Fortune");
                    DrawText("Configure the Wheel of Fortune", x + descriptionOffset, y + h / 2, "Black");
                },
                click: () => {
                    const wheelStruct = {
                        FortuneWheelItemSets: loadFortuneWheelObjects(this.character, "FortuneWheelItemSets", "item sets"),
                        FortuneWheelCommands: loadFortuneWheelObjects(this.character, "FortuneWheelCommands", "commands"),
                    };
                    const subScreen = new FWSelectScreen(this, wheelStruct, this.character);
                    this.children.set(subScreen.screen, subScreen);
                    subScreen.load();
                },
            },
            rollWhenRestrained: {
                coords: [500, 394, 64, 64],
                run: (x, y, w, h) => {
                    const disabled = (this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained());
                    DrawCheckbox(x, y, w, h, "", this.character.MBSSettings.RollWhenRestrained, disabled);
                    DrawText("Allow wheel spinning while restrainted", x + descriptionOffset, y + h / 2, "Black");
                },
                click: () => {
                    const disabled = (this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained());
                    if (!disabled) {
                        this.character.MBSSettings.RollWhenRestrained = !this.character.MBSSettings.RollWhenRestrained;
                        pushMBSSettings([SettingsType.SETTINGS]);
                    }
                },
            },
            lockedWhenRestrained: {
                coords: [500, 470, 64, 64],
                run: (x, y, w, h) => {
                    const disabled = (this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained());
                    DrawCheckbox(x, y, w, h, "", this.character.MBSSettings.LockedWhenRestrained, disabled);
                    DrawText("Lock MBS settings while restrained", x + descriptionOffset, y + h / 2, "Black");
                },
                click: () => {
                    const disabled = (this.character.MBSSettings.LockedWhenRestrained && this.character.IsRestrained());
                    if (!disabled) {
                        this.character.MBSSettings.LockedWhenRestrained = !this.character.MBSSettings.LockedWhenRestrained;
                        pushMBSSettings([SettingsType.SETTINGS]);
                    }
                },
            },
        };

        if (
            MBS_MOD_API.getOriginalHash("MainHallRun") !== "735A1207"
            || MBS_MOD_API.getOriginalHash("MainHallClick") !== "7A6D741A"
        ) {
            // R103
            delete this.elements.newAssets;
        }
    }

    click(event: MouseEvent | TouchEvent) {
        return Object.values(this.elements).some((e) => {
            if (e.click && MouseIn(...e.coords)) {
                e.click(event);
                return true;
            } else {
                return false;
            }
        });
    }

    run() {
        MainCanvas.textAlign = "left";
        Object.values(this.elements).forEach((e) => e.run(...e.coords));
        MainCanvas.textAlign = "center";
    }

    exit() {
        this.exitScreens(false);
    }
}

let preferenceState: PreferenceScreenProxy;

waitFor(bcLoaded).then(() => {
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

    MBS_MOD_API.hookFunction("ServerPlayerIsInChatRoom", 0, (args, next) => {
        if (CurrentScreen == MBSPreferenceScreen.screen && InformationSheetPreviousScreen == "ChatRoom") {
            return true;
        } else {
            return next(args);
        }
    });

    MBS_MOD_API.hookFunction("PreferenceClick", 0, (args, next) => {
        const previousScreen = PreferenceSubscreen;
        next(args);
        if (!previousScreen && <string>PreferenceSubscreen === MBSPreferenceScreen.screen) {
            PreferenceExit();
            const subScreen = new MBSPreferenceScreen(preferenceState);
            preferenceState.children.set(subScreen.screen, subScreen);
            return subScreen.load();
        }
    });

    (<string[]>PreferenceSubscreenList).push(
        MBSPreferenceScreen.screen,
    );
    preferenceState = new PreferenceScreenProxy();
});
