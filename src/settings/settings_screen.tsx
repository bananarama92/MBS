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
    clearMBSSettings,
} from "./settings";

import styles from "./settings_screen.scss";

function preferenceLoadHook() {
    if (TextScreenCache != null) {
        TextScreenCache.cache[`Homepage${MBSPreferenceScreen.screen}`] = "MBS Settings";
    }

    const img = new Image();
    img.addEventListener("error", () => DrawGetImageOnError(img, false));
    img.src = "Icons/Maid.png";
    DrawCacheImage.set(`Icons/${MBSPreferenceScreen.screen}.png`, img);
}

export class PreferenceScreenProxy extends ScreenProxy {
    static readonly screen = "Preference";
    readonly screen = PreferenceScreenProxy.screen;

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
    }
}

export class MBSPreferenceScreen extends MBSScreen {
    static readonly screen = "MBS_PreferenceScreen";
    readonly screen = MBSPreferenceScreen.screen;

    constructor(parent: null | MBSScreen, shape: RectTuple = [525, 75, 1380, 850]) {
        super(parent, shape);

        document.body.appendChild(
            <div id={ID.root} class="HideOnPopup mbs-screen" screen-generated={this.screen}>
                <style id={ID.styles}>{styles.toString()}</style>

                <h1 id={ID.header}>{`Maid's Bondage Scripts ${MBS_VERSION}`}</h1>

                <div id={ID.exit} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.exitButton}
                        onClick={this.exit.bind(this)}
                        style={{ backgroundImage: "url('./Icons/Exit.png')" }}
                    />
                    <span class="mbs-button-tooltip" id={ID.exitTooltip} style={{ justifySelf: "right" }}>
                        Exit
                    </span>
                </div>

                <div id={ID.settingsGrid}>
                    <div class="mbs-preference-settings-pair" id={ID.settingsPair + "0"}>
                        <button
                            class="mbs-button"
                            id={ID.itemsButton}
                            style={{ backgroundImage: "url('./Icons/Changelog.png')" }}
                            onClick={this.#loadShop.bind(this)}
                        />
                        <p id={ID.itemsHeader}>{`Show new R${NEW_ASSETS_VERSION} items`}</p>
                    </div>

                    <div class="mbs-preference-settings-pair" id={ID.settingsPair + "1"}>
                        <button
                            class="mbs-button"
                            id={ID.wheelButton}
                            style={{ backgroundImage: "url('./Icons/Crafting.png')" }}
                            onClick={this.#loadWheel.bind(this)}
                        />
                        <p id={ID.wheelHeader}>{"Configure the wheel of fortune"}</p>
                    </div>

                    <div class="mbs-preference-settings-pair" id={ID.settingsPair + "2"}>
                        <input
                            type="checkbox"
                            id={ID.rollCheckbox}
                            onClick={() => {
                                Player.MBSSettings.RollWhenRestrained = !Player.MBSSettings.RollWhenRestrained;
                                pushMBSSettings([SettingsType.SETTINGS]);
                            }}
                        />
                        <p id={ID.rollHeader}>{"Allow wheel rolling while restrained"}</p>
                    </div>

                    <div class="mbs-preference-settings-pair" id={ID.settingsPair + "3"}>
                        <input
                            type="checkbox"
                            id={ID.lockCheckbox}
                            onClick={() => {
                                Player.MBSSettings.LockedWhenRestrained = !Player.MBSSettings.LockedWhenRestrained;
                                pushMBSSettings([SettingsType.SETTINGS]);
                            }}
                        />
                        <p id={ID.lockHeader}>{"Lock MBS settings while restrained"}</p>
                    </div>
                </div>

                <div id={ID.miscGrid}>
                    <div id={ID.reset} class="mbs-button-div">
                        <button
                            class="mbs-button"
                            id={ID.resetButton}
                            style={{ backgroundImage: "url('./Icons/ServiceBell.png')" }}
                            onClick={this.#settingsReset.bind(this)}
                        >
                            Reset MBS
                        </button>
                        <span class="mbs-button-tooltip" id={ID.resetTooltip}>
                            Clear all MBS data
                        </span>
                    </div>

                    <div id={ID.import} class="mbs-button-div">
                        <button class="mbs-button" id={ID.importButton} onClick={this.#settingsImport.bind(this)}>
                            Import
                        </button>
                        <span class="mbs-button-tooltip" id={ID.importTooltip}>
                            Import MBS settings
                        </span>
                    </div>

                    <div id={ID.export} class="mbs-button-div">
                        <button class="mbs-button" id={ID.exportButton} onClick={this.#settingsExport.bind(this)}>
                            Export
                        </button>
                        <span class="mbs-button-tooltip" id={ID.exportTooltip}>
                            Export MBS settings
                        </span>
                    </div>

                    <div id={ID.changelog} class="mbs-button-div">
                        <button
                            class="mbs-button"
                            id={ID.changelogButton}
                            style={{ backgroundImage: "url('./Icons/Changelog.png')" }}
                            onClick={() => open(getChangeLogURL(), "_blank")}
                        >
                            Latest Changes
                        </button>
                        <span class="mbs-button-tooltip" id={ID.changelogTooltip}>
                            Open the MBS changelog
                        </span>
                    </div>
                </div>
            </div>,
        );

        document.body.appendChild(
            <div id={ID.resetScreen} class="HideOnPopup mbs-screen" screen-generated={MBSPreferenceScreen.screen}>
                <div id={ID.resetBackground}>
                    <h1>MBS data reset</h1>
                    <p><strong>- Warning -</strong></p>
                    <p>If you confirm, <i>all</i> MBS data (including settings, overrides, and current states) will be permanently reset!</p>
                    <p>You will be able to continue using MBS, but all of your configuration will be reset to default!</p>
                    <p><strong>This action cannot be undone!</strong></p>
                    <div id={ID.resetGrid}>
                        <button
                            class="mbs-button"
                            onClick={this.#resetConfirm.bind(this)}
                            disabled={true}
                            id={ID.resetAccept}
                        >Confirm (10)</button>
                        <button
                            class="mbs-button"
                            onClick={this.exit.bind(this)}
                            id={ID.resetCancel}
                        >Cancel</button>
                    </div>
                </div>
            </div>,
        );

        if (
            MBS_MOD_API.getOriginalHash("MainHallRun") !== "735A1207"
            || MBS_MOD_API.getOriginalHash("MainHallClick") !== "7A6D741A"
        ) {
            // R103
            const grid = document.getElementById(ID.settingsGrid) as HTMLDivElement;
            const member = document.getElementById(`${ID.settingsPair}0`) as HTMLDivElement;
            grid.removeChild(member);
        }
    }

    #settingsImport() {
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
                return;
            }
            default:
                throw new Error(`Unknown status type: ${(status as any).status}`);
        }
    }

    #settingsExport() {
        const compressed = exportSettings();
        navigator.clipboard.writeText(compressed);
        alert("MBS settings copied to clipboard.");
    }

    #settingsReset() {
        const screen = document.getElementById(ID.resetScreen) as HTMLDivElement;
        const button = document.getElementById(ID.resetAccept) as HTMLButtonElement;
        screen.style.display = "block";
        button.disabled = true;
        this.#startTimer(button);
    }

    async #startTimer(button: HTMLButtonElement) {
        let i = 9;
        while (i >= 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            button.innerText = `Confirm (${i})`;
            i--;
        }
        button.innerText = "Confirm";
        button.disabled = false;
    }

    #resetConfirm() {
        clearMBSSettings();
        this.exit();
    }

    #loadShop() {
        const background = ServerPlayerIsInChatRoom() ? ChatRoomData?.Background : undefined;
        const prevScreen: [ModuleType, string] = ServerPlayerIsInChatRoom() ? ["Online", "ChatRoom"] : ["Character", "Preference"];
        this.exit();
        PreferenceExit();

        Shop2Vars.Mode = "Preview";
        Shop2Vars.Filters.MBS_VersionFilter = (item) => NEW_ASSETS[`${item.Asset.Group.Name}${item.Asset.Name}`] ? ["Buy", "Sell", "Preview"] : [];
        Shop2.Init(background, prevScreen);
        ServerBeep = {
            Message: "The MBS \"Show new items\" button will be removed in R103; use the Club Shop or /shop chat command instead",
            Timer: CommonTime() + 10000,
        };
    }

    #loadWheel() {
        const wheelStruct = {
            FortuneWheelItemSets: loadFortuneWheelObjects(Player, "FortuneWheelItemSets", "item sets"),
            FortuneWheelCommands: loadFortuneWheelObjects(Player, "FortuneWheelCommands", "commands"),
        };
        const subScreen = new FWSelectScreen(this, wheelStruct, Player, [95, 75, 1810, 850]);
        this.children.set(subScreen.screen, subScreen);
        subScreen.load();
    }

    load() {
        const checkboxes = {
            [ID.lockCheckbox]: "LockedWhenRestrained",
            [ID.rollCheckbox]: "RollWhenRestrained",
        } as const satisfies Record<string, keyof MBSSettings>;

        const disabled = Player.IsRestrained() && Player.MBSSettings.LockedWhenRestrained;
        for (const [id, field] of Object.entries(checkboxes)) {
            const checkbox = document.getElementById(id) as HTMLInputElement;
            checkbox.checked = Player.MBSSettings[field];
            checkbox.disabled = disabled;
        }
        super.load();
    }

    resize() {
        const root = document.getElementById(ID.root) as HTMLDivElement;
        const resetScreen = document.getElementById(ID.resetScreen) as HTMLDivElement;
        const resetDisplay = resetScreen.style.display;

        const canvas = MainCanvas.canvas;
        const fontSize = canvas.clientWidth <= canvas.clientHeight * 2 ? canvas.clientWidth / 50 : canvas.clientHeight / 25;
        ElementPositionFix(ID.root, fontSize, ...this.shape);
        ElementPositionFix(ID.resetScreen, fontSize, 0, 0, 2000, 1000);
        root.style.display = "grid";
        resetScreen.style.display = resetDisplay;
    }

    click() {}

    run() {
        DrawCharacter(Player, 50, 50, 0.9);
    }

    unload() {
        for (const id of [ID.root, ID.resetScreen]) {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = "none";
            }
        }
    }

    exit() {
        const resetScreen = document.getElementById(ID.resetScreen) as HTMLDivElement;
        if (resetScreen.style.display === "block") {
            resetScreen.style.display = "none";
        } else {
            ElementRemove(ID.root);
            ElementRemove(ID.resetScreen);
            this.exitScreens(false);
        }
    }
}

let preferenceState: PreferenceScreenProxy;

waitFor(bcLoaded).then(() => {
    MBS_MOD_API.hookFunction("PreferenceLoad", 0, (args, next) => {
        next(args);
        preferenceLoadHook();
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
        if (!previousScreen && PreferenceSubscreen as string === MBSPreferenceScreen.screen) {
            PreferenceExit();
            const subScreen = new MBSPreferenceScreen(preferenceState);
            preferenceState.children.set(subScreen.screen, subScreen);
            return subScreen.load();
        }
    });

    (PreferenceSubscreenList as string[]).push(MBSPreferenceScreen.screen);
    preferenceState = new PreferenceScreenProxy();
    if (CurrentScreen === "Preference") {
        preferenceLoadHook();
    }
});

const root = "mbs-preference";
const ID = Object.freeze({
    root,
    styles: `${root}-style`,

    header: `${root}-header`,
    exit: `${root}-exit`,
    exitButton: `${root}-exit-button`,
    exitTooltip: `${root}-exit-tooltip`,

    settingsGrid: `${root}-settings`,
    settingsPair: `${root}-settings-pair`,
    itemsButton: `${root}-items-button`,
    itemsHeader: `${root}-items-header`,
    wheelButton: `${root}-wheel-button`,
    wheelHeader: `${root}-wheel-header`,

    rollCheckbox: `${root}-roll-checkbox`,
    rollHeader: `${root}-roll-header`,
    lockCheckbox: `${root}-lock-checkbox`,
    lockHeader: `${root}-lock-header`,

    miscGrid: `${root}-misc`,
    reset: `${root}-reset`,
    resetButton: `${root}-reset-button`,
    resetTooltip: `${root}-reset-tooltip`,
    resetScreen: `${root}-reset-screen`,
    resetBackground: `${root}-reset-background`,
    resetGrid: `${root}-reset-grid`,
    resetAccept: `${root}-reset-accept`,
    resetCancel: `${root}-reset-cancel`,

    import: `${root}-import`,
    importButton: `${root}-import-button`,
    importTooltip: `${root}-import-tooltip`,
    export: `${root}-export`,
    exportButton: `${root}-export-button`,
    exportTooltip: `${root}-export-tooltip`,
    changelog: `${root}-changelog`,
    changelogButton: `${root}-changelog-button`,
    changelogTooltip: `${root}-changelog-tooltip`,
});
