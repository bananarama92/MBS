import { logger } from "../common";
import { waitForBC } from "../common_bc";
import { MBSScreen, ScreenProxy, ScreenParams } from "../screen_abc";
import { FWSelectScreen, loadFortuneWheelObjects } from "../fortune_wheel";

import { getChangeLogURL } from "./changelog";
import {
    pushMBSSettings,
    SettingsType,
    importSettings,
    exportSettings,
    logSettingsSize,
    SettingsStatus,
    clearMBSSettings,
} from "./settings";
import { garblingJSON } from "../garbling";

import styles from "./settings_screen.scss";

export class PreferenceScreenProxy extends ScreenProxy {
    static readonly screen = "Preference";
    constructor() {
        const load = async () => {
            await CommonSetScreen("Character", "Preference");
            PreferenceOpenSubscreen("Extensions");
        };

        super(
            null,
            "Character",
            "Preference",
            {
                Run: PreferenceRun,
                Click: PreferenceClick,
                Exit: PreferenceExit,
                Load: load,
            },
        );
    }
}

type BoolSettings = keyof { [k in keyof MBSSettings as MBSSettings[k] extends boolean ? k : never]: MBSSettings[k] };

const root = "mbs-preference";
const ID = Object.freeze({
    root,
    styles: `${root}-style`,

    header: `${root}-header`,
    menubar: `${root}-menubar`,
    exit: `${root}-exit`,
    exitButton: `${root}-exit-button`,

    settingsGrid: `${root}-settings`,
    wheelButton: `${root}-wheel-button`,

    wheelHeader: `${root}-wheel-header`,
    miscHeader: `${root}-misc-header`,
    garbleHeader: `${root}-garble-header`,

    wheelLabel: `${root}-wheel-label`,
    rollRestrainedLabel: `${root}-roll-restrained-label`,
    lockSettingsLabel: `${root}-lock-settings-label`,
    garbleLabel: `${root}-garble-label`,
    garbleTrailingLabel: `${root}-garble-trailing-label`,
    garbleSyllableLabel: `${root}-garble-syllable-label`,
    extendedCraftLabel: `${root}-extended-craft-label`,
    changelogLabel: `${root}-changelog-label`,

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
    export: `${root}-export`,
    changelog: `${root}-changelog`,
});

export class MBSPreferenceScreen extends MBSScreen {
    static readonly screen = "MBS_PreferenceScreen";
    static readonly ids = ID;
    static readonly screenParamsDefault = {
        [root]: Object.freeze({
            shape: [525, 75, 1380, 850] as RectTuple,
            visibility: "visible",
        }),
        [ID.resetScreen]: Object.freeze({
            shape: [0, 0, 2000, 1000] as RectTuple,
            visibility: "hidden",
        }),
    };

    constructor(parent: null | MBSScreen, params: null | ScreenParams.Partial = null) {
        super(parent, MBSPreferenceScreen.screenParamsDefault, params);

        document.body.appendChild(
            <div id={ID.root} class="mbs-screen" aria-labelledby={ID.header}>
                <style id={ID.styles}>{styles.toString()}</style>

                <h1 id={ID.header}>{`Maid's Bondage Scripts ${MBS_VERSION}`}</h1>

                {ElementMenu.Create(
                    ID.menubar,
                    [
                        ElementButton.Create(
                            ID.exit,
                            this.exit.bind(this),
                            { image: "Icons/Exit.png", tooltip: "Exit" },
                        ),
                    ],
                    { direction: "rtl" },
                )}

                <main id={ID.settingsGrid} role="form" aria-label="Configure MBS">
                    <section aria-labelledby={ID.wheelHeader}>
                        <h2 id={ID.wheelHeader}>Wheel of fortune settings</h2>
                        <p class="mbs-preference-settings-pair">
                            {ElementButton.Create(ID.wheelButton, this.#loadWheel.bind(this), { image: "Icons/Crafting.png" }, { button: { attributes: { "aria-labelledby": ID.wheelLabel } } })}
                            <span id={ID.wheelLabel}>Configure the wheel of fortune</span>
                        </p>
                        <p class="mbs-preference-settings-pair">
                            <input type="checkbox" class="checkbox" name="RollWhenRestrained" onClick={this.#boolSwitch.bind(this)} aria-labelledby={ID.rollRestrainedLabel}/>
                            <span id={ID.rollRestrainedLabel}>Allow wheel rolling while restrained</span>
                        </p>
                        <p class="mbs-preference-settings-pair">
                            <input type="checkbox" class="checkbox" name="LockedWhenRestrained" onClick={this.#boolSwitch.bind(this)} aria-labelledby={ID.lockSettingsLabel}/>
                            <span id={ID.lockSettingsLabel}>Lock MBS settings while restrained</span>
                        </p>
                    </section>

                    <section aria-labelledby={ID.garbleHeader}>
                        <h2 id={ID.garbleHeader}>Garbling settings</h2>
                        <p class="mbs-preference-settings-pair">
                            <input type="checkbox" class="checkbox" name="AlternativeGarbling" onClick={this.#boolSwitch.bind(this)} aria-labelledby={ID.garbleLabel}/>
                            <span id={ID.garbleLabel}>
                                <p>
                                    <strong>Experimental</strong>: whether gags will use an alternative form of, more phonetically accurate, speech garbling
                                    based on <a href="https://github.com/CordeliaMist/Dalamud-GagSpeak" target="_blank">Dalamud-GagSpeak</a>
                                </p>
                                <p>
                                    Incompatible-ish with <a href="https://wce-docs.vercel.app/docs/intro" target="_blank">WCE/FBC</a>'s
                                    garbling anti-cheat as of the moment
                                </p>
                            </span>
                        </p>
                        <p class="mbs-preference-settings-pair">
                            <input type="checkbox" class="checkbox" name="DropTrailing" onClick={this.#boolSwitch.bind(this)} aria-labelledby={ID.garbleTrailingLabel}/>
                            <span id={ID.garbleTrailingLabel}>
                                Whether to heaviest gags will drop up to half of all trailing characters
                                when alternate garbling is enabled
                            </span>
                        </p>
                        <p class="mbs-preference-settings-pair">
                            <input type="checkbox" class="checkbox" name="GarblePerSyllable" onClick={this.#boolSwitch.bind(this)} aria-labelledby={ID.garbleSyllableLabel}/>
                            <span id={ID.garbleSyllableLabel}>
                                Interpolate between the three alternative garbling levels, allowing for a more gradual increase
                                in garbling strength (on a syllable by syllable basis) as the gag level increases
                            </span>
                        </p>
                    </section>

                    <section aria-labelledby={ID.miscHeader}>
                        <h2 id={ID.miscHeader}>Misc settings</h2>
                        <div class="mbs-preference-settings-pair">
                            <input type="checkbox" class="checkbox" name="ShowChangelog" onClick={this.#boolSwitch.bind(this)} aria-labelledby={ID.changelogLabel}/>
                            <span id={ID.changelogLabel}>Show the MBS changelog in chat whenever a new MBS version is released</span>
                        </div>
                    </section>
                </main>

                <menu id={ID.miscGrid}>
                    <li>{ElementButton.Create(
                        ID.resetButton,
                        this.#settingsReset.bind(this),
                        { image: "Icons/ServiceBell.png", label: "Reset MBS", tooltip: "Clear all MBS data", labelPosition: "center" },
                    )}</li>
                    <li>{ElementButton.Create(
                        ID.import,
                        this.#settingsImport.bind(this),
                        { image: "Icons/Upload.png", label: "Import", tooltip: "Import MBS settings", labelPosition: "center" },
                    )}</li>
                    <li>{ElementButton.Create(
                        ID.export,
                        this.#settingsExport.bind(this),
                        { image: "Icons/Download.png", label: "Export", tooltip: "Export MBS settings", labelPosition: "center" },
                    )}</li>
                    <li>{ElementButton.Create(
                        ID.changelog,
                        () => open(getChangeLogURL(), "_blank"),
                        { image: "Icons/Changelog.png", label: "Latest Changes", tooltip: "Open the MBS changelog", labelPosition: "center" },
                    )}</li>
                </menu>
            </div>,
        );

        document.body.appendChild(
            <div id={ID.resetScreen} class="mbs-screen" screen-generated={MBSPreferenceScreen.screen}>
                <div id={ID.resetBackground}>
                    <h1>MBS data reset</h1>
                    <p><strong>- Warning -</strong></p>
                    <p>If you confirm, <i>all</i> MBS data (including settings, overrides, and current states) will be permanently reset!</p>
                    <p>You will be able to continue using MBS, but all of your configuration will be reset to default!</p>
                    <p><strong>This action cannot be undone!</strong></p>
                    <div id={ID.resetGrid}>
                        {ElementButton.Create(ID.resetAccept, () => this.#resetConfirm(), { disabled: true, label: "Confirm (10)" })}
                        {ElementButton.Create(ID.resetCancel, () => this.exit(), { label: "Cancel" })}
                    </div>
                </div>
            </div>,
        );
    }

    #boolSwitch(event: MouseEvent) {
        const field = (event.target as HTMLInputElement).name as BoolSettings;
        if (field in Player.MBSSettings) {
            Player.MBSSettings[field] = !Player.MBSSettings[field];
            pushMBSSettings([SettingsType.SETTINGS]);
            switch (field) {
                case "AlternativeGarbling":
                    if (Player.MBSSettings[field]) garblingJSON.init();
                    break;
                case "LockedWhenRestrained":
                    this.#lockInputs();
                    break;
            }
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
        screen.hidden = false;
        button.disabled = true;
        this.#startTimer(button);
    }

    async #startTimer(button: HTMLButtonElement) {
        const label = button.querySelector(".button-label");
        let i = 9;
        while (i >= 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            label?.replaceChildren(`Confirm (${i})`);
            i--;
        }
        label?.replaceChildren("Confirm");
        button.disabled = false;
    }

    #resetConfirm() {
        clearMBSSettings();
        this.exit();
    }

    async #loadWheel() {
        const wheelStruct = {
            FortuneWheelItemSets: loadFortuneWheelObjects(Player, "FortuneWheelItemSets", "item sets"),
            FortuneWheelCommands: loadFortuneWheelObjects(Player, "FortuneWheelCommands", "commands"),
        };

        const [x, y, w, h] = this.screenParams[this.ids.root].shape;
        const params = { [FWSelectScreen.ids.root]: { shape: [95, y, w + (x - 95), h] as RectTuple } };
        this.loadChild(FWSelectScreen, wheelStruct, Player, params);
    }

    #lockInputs() {
        const disabled = Player.IsRestrained() && Player.MBSSettings.LockedWhenRestrained;
        for (const inp of document.querySelectorAll(`#${ID.settingsGrid} input[type="checkbox"]`) as NodeListOf<HTMLInputElement>) {
            if (inp.name in Player.MBSSettings) {
                inp.checked = Player.MBSSettings[inp.name as BoolSettings];
                inp.disabled = disabled;
            }
        }
    }

    async load() {
        this.#lockInputs();
        super.load();
    }

    draw() {
        DrawCharacter(Player, 50, 50, 0.9);
    }

    exit() {
        const resetScreen = document.getElementById(ID.resetScreen) as HTMLDivElement;
        if (!resetScreen.hidden) {
            resetScreen.hidden = true;
        } else {
            super.exit();
            this.exitScreens(false);
        }
    }
}

let preferenceState: PreferenceScreenProxy;

waitForBC("settings_screen", {
    async afterLoad() {
        preferenceState = new PreferenceScreenProxy();

        PreferenceRegisterExtensionSetting({
            Identifier: "MBS",
            load() {
                PreferenceExit();
                preferenceState.loadChild(MBSPreferenceScreen);
            },
            run() {},
            click() {},
            exit() {},
            ButtonText: "MBS Settings",
            Image: "Icons/Maid.png",
        });
    },
});
