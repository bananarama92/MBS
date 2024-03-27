import { validateInt, waitFor } from "../common";
import { sanitizeWheelFortuneIDs, MBS_MAX_SETS, FWItemSet, FWCommand, bcLoaded } from "../common_bc";
import { MBSScreen } from "../screen_abc";
import { pushMBSSettings, SettingsType } from "../settings";

import { getFlagDescription } from "./lock_flags";
import { FORTUNE_WHEEL_ITEM_SETS } from "./fortune_wheel";
import styles from "./preset_screen.scss";

/** A {@link TextCache} cache for the `MiniGame/WheelFortune` screen */
let SCREEN_CACHE: TextCache;

const BUILTIN_BC_OPTIONS_HEADERS: string[] = [];
const BUILTIN_BC_OPTIONS: { header: string, ids: Record<string, null | string> }[] = [];

waitFor(bcLoaded).then(() => {
    const csvPath = "Screens/MiniGame/WheelFortune/Text_WheelFortune.csv";
    SCREEN_CACHE = new TextCache(csvPath, "MISSING VALUE FOR TAG: ");
});

function _initBuiltinBCOptions() {
    if (BUILTIN_BC_OPTIONS.length) {
        return;
    }

    const pattern = /^([a-zA-Z0-9_\s]+) for ([0-9]+) (minutes|hours)$/;
    const builtinOptions = WheelFortuneOption.filter(o => o.Custom === undefined);

    // Group builtin wheel options together by duration (if applicable)
    const optionRecord: Record<string, { header: string, ids: Record<string, null | string> }> = {};
    for (const o of builtinOptions) {
        const description = SCREEN_CACHE.get(`Option${o.ID}`);
        const match = pattern.exec(description);
        if (!match) {
            optionRecord[description] = { ids: { [o.ID]: null} , header: description };
            continue;
        }

        const [key, unit] = [match[1], match[3]];
        let duration = Number.parseInt(match[2]);
        if (unit === "hours") {
            duration *= 60;
        }

        const obj = optionRecord[key];
        if (obj) {
            obj.ids[o.ID] = `${duration} Minutes`;
        } else {
            optionRecord[key] = { ids: { [o.ID]: `${duration} Minutes` }, header: description };
        }
    }

    for (const obj of Object.values(optionRecord)) {
        BUILTIN_BC_OPTIONS_HEADERS.push(obj.header);
        BUILTIN_BC_OPTIONS.push(obj);
    }
}

export class WheelPresetScreen extends MBSScreen {
    static readonly background = "Sheet";
    static readonly screen = `MBS_${WheelPresetScreen.name}`;
    readonly screen = WheelPresetScreen.screen;

    /** The characters current list of presets. Will be updated inplace. */
    readonly presets: (null | WheelPreset)[];
    /** A set of {@link SettingsType} values that should be pushed upon calling {@link WheelPresetScreen.exit} */
    readonly queueServer: Set<import("../settings").SettingsType>;
    /** The currently to-be configured preset. */
    activePreset: { name: string, ids: Set<string> } = { name: "<PLACEHOLDER>", ids: new Set() };

    /** The index within {@link WheelPresetScreen.presets} */
    #index: number = 0;

    get presetUnsaved() {
        return this.presets[this.#index] === null;
    }

    /** Get or set the index within {@link WheelPresetScreen.presets}, updating {@link WheelPresetScreen.activePreset} in order to match */
    get index() { return this.#index; }
    set index(value: number) {
        validateInt(value, "index", 0, this.presets.length - 1);
        const state = this.presets[value];
        this.#index = value;
        this.activePreset = state !== null ? { name: state.name, ids: new Set(state.ids) } : {
            name: `Preset ${value}`,
            ids: new Set(Player.OnlineSharedSettings?.WheelFortune ?? WheelFortuneDefault),
        };
    }

    constructor(
        parent: null | MBSScreen,
        presets: (null | WheelPreset)[],
    ) {
        _initBuiltinBCOptions();
        super(parent);
        this.presets = presets;
        this.index = 0;
        this.queueServer = new Set();

        document.body.appendChild(
            <div id={ID.root} class="HideOnPopup">
                <style id={ID.styles}>{styles.toString()}</style>

                <div id={ID.header}>Wheel of Fortune Presets (unsaved)</div>
                <div id={ID.delete} class="mbs-dropdown-button">
                    <button
                        class="mbs-button"
                        id={ID.deleteButton}
                        style={{ backgroundImage: "url('./Icons/Trash.png')" }}
                        onClick={this.deletePreset.bind(this)}
                        disabled={true}
                    />
                    <div class="mbs-tooltip" id={ID.deleteTooltip}>Delete the current preset:\nCannot delete unsaved wheel preset</div>
                </div>
                <div id={ID.accept} class="mbs-dropdown-button">
                    <button
                        class="mbs-button"
                        id={ID.acceptButton}
                        style={{ backgroundImage: "url('./Icons/Accept.png')" }}
                        onClick={this.equipPreset.bind(this)}
                        disabled={true}
                    />
                    <div class="mbs-tooltip" id={ID.acceptTooltip}>Equip the current preset:\nMust first save the wheel preset</div>
                </div>
                <div id={ID.save} class="mbs-dropdown-button">
                    <button
                        class="mbs-button"
                        id={ID.saveButton}
                        style={{ backgroundImage: "url('./Icons/Save.png')" }}
                        onClick={this.savePreset.bind(this)}
                    />
                    <div class="mbs-tooltip" id={ID.saveTooltip}>Save the current preset</div>
                </div>
                <div id={ID.exit} class="mbs-dropdown-button">
                    <button
                        class="mbs-button"
                        id={ID.exitButton}
                        style={{ backgroundImage: "url('./Icons/Exit.png')" }}
                        onClick={() => this.exit(false)}
                    />
                    <div class="mbs-tooltip" id={ID.exitTooltip}>Exit</div>
                </div>

                <div id={ID.midDiv}>
                    <div id={ID.nameHeader}>Preset Name</div>
                    <div id={ID.builtinBCHeader}>Builtin BC Options</div>
                    <div id={ID.builtinMBSHeader}>Builtin MBS Options</div>
                    <div id={ID.customMBSHeader}>Custom MBS Options</div>

                    <div id={ID.nameDiv}>
                        <input
                            type="text"
                            id={ID.nameInput}
                            placeholder="Preset 0"
                            maxLength={20}
                            onFocus={(e) => (e.target as HTMLInputElement).select()}
                        >Preset 0</input>
                    </div>

                    <div id={ID.builtinBCDiv} class="mbs-fwpreset-grid">{this.#getBuiltinBCElements()}</div>
                    <div id={ID.builtinMBSDiv} class="mbs-fwpreset-grid">{this.#getMBSElements(true)}</div>
                    <div id={ID.customMBSDiv} class="mbs-fwpreset-grid">{this.#getMBSElements(false)}</div>
                </div>
            </div>,
        );
    }

    #updateDrownDownNames() {
        const element = document.getElementById(`${WheelPresetScreen.name}_DropDown`);
        if (!element) {
            return;
        }

        for (let i = 0; i < element.children[0].children.length; i++) {
            const e = element.children[0].children[i];
            e.innerHTML = this.presets[i]?.name ?? `Preset ${i}`;
        }

        element.children[1].innerHTML = this.presets[this.index]?.name ?? `Preset ${this.index}`;

        for (let i = 0; i < element.children[2].children.length; i++) {
            const e = element.children[2].children[i];
            e.innerHTML = this.presets[i]?.name ?? `Preset ${i}`;
        }
    }

    #getBuiltinBCElements(): HTMLDivElement[] {
        return BUILTIN_BC_OPTIONS_HEADERS.map((header, i) => {
            return (
                <div id={ID.builtinBC + i.toString()} class="mbs-fwpreset">
                    <div
                        id={ID.builtinBCColor + i.toString()}
                        class="mbs-fwpreset-color"
                        data-color="red"
                    />
                    <div
                        id={ID.builtinBCTooltip + i.toString()}
                        class="mbs-tooltip"
                        data-header={header}
                    >{header}</div>
                </div>
            ) as HTMLDivElement;
        });
    }

    #getMBSElements(builtin: boolean): HTMLDivElement[] {
        let fwObjects: readonly (FWItemSet | FWCommand | null)[];
        let id: string;
        let idColor: string;
        let idTooltip: string;
        let idTooltipHeader: string;
        let idTooltipList: string;
        if (builtin) {
            fwObjects = FORTUNE_WHEEL_ITEM_SETS;
            id = ID.builtinMBS;
            idColor = ID.builtinMBSColor;
            idTooltip = ID.builtinMBSTooltip;
            idTooltipHeader = ID.builtinMBSTooltipHeader;
            idTooltipList = ID.builtinMBSTooltipList;
        } else {
            fwObjects = [
                ...Player.MBSSettings.FortuneWheelItemSets,
                ...Player.MBSSettings.FortuneWheelCommands,
            ];
            id = ID.customMBS;
            idColor = ID.customMBSColor;
            idTooltip = ID.customMBSTooltip;
            idTooltipHeader = ID.customMBSTooltipHeader;
            idTooltipList = ID.customMBSTooltipList;
        }

        return fwObjects.map((_, i) => {
            return (
                <div id={id + i.toString()} class="mbs-fwpreset">
                    <div
                        id={idColor + i.toString()}
                        class="mbs-fwpreset-color"
                        data-color="red"
                    />
                    <div id={idTooltip + i.toString()} class="mbs-tooltip">
                        <h6
                            id={idTooltipHeader + i.toString()}
                            data-prefix={i >= MBS_MAX_SETS ? `Command Set ${i}: ` : `Item Set ${i}: `}
                        />
                        <ul id={idTooltipList + i.toString()} style={{ textAlign: "left" }}></ul>
                    </div>
                </div>
            ) as HTMLDivElement;
        });
    }

    #loadPreset(index: number) {
        this.index = index;

        const lists = [
            ...Player.MBSSettings.FortuneWheelItemSets,
            ...Player.MBSSettings.FortuneWheelCommands,
        ];
        for (const [i, fwOption] of lists.entries()) {
            const children = fwOption?.children ?? [];
            const color = document.getElementById(`${ID.customMBSColor}${i}`) as HTMLDivElement;
            const tooltipHeader = document.getElementById(`${ID.customMBSTooltipHeader}${i}`) as HTMLHeadingElement;
            const tooltipList = document.getElementById(`${ID.customMBSTooltipList}${i}`) as HTMLUListElement;

            color.dataset.color = children.length ? "green" : "red";
            tooltipHeader.innerText = (tooltipHeader.dataset.prefix ?? "") + (fwOption?.name ?? "<Empty>");
            tooltipList.innerHTML = "";
            for (const { Flag } of children) {
                if (Flag) {
                    tooltipList.appendChild(<li>{getFlagDescription(Flag)}</li>);
                }
            }
        }
    }

    savePreset() {
        const prevState = this.presets[this.index];
        const newState = {
            name: this.activePreset.name,
            ids: sanitizeWheelFortuneIDs(Array.from(this.activePreset.ids).sort().join("")),
        };

        if (newState.name !== prevState?.name || newState.ids !== prevState?.ids) {
            this.presets[this.index] = newState;
            this.queueServer.add(SettingsType.SETTINGS);
            this.#updateDrownDownNames();
        }
    }

    equipPreset() {
        const options = sanitizeWheelFortuneIDs(Array.from(this.activePreset.ids).sort().join(""));
        if (Player.OnlineSharedSettings && Player.OnlineSharedSettings.WheelFortune !== options) {
            Player.OnlineSharedSettings.WheelFortune = options;
            this.queueServer.add(SettingsType.SHARED);
        }
    }

    deletePreset() {
        if (this.presets[this.index] === null) {
            return;
        }

        this.presets[this.index] = null;
        this.activePreset = {
            name: `Preset ${this.index}`,
            ids: new Set(Player.OnlineSharedSettings?.WheelFortune ?? WheelFortuneDefault),
        };
        this.queueServer.add(SettingsType.SETTINGS);

        this.#updateDrownDownNames();
        const element = document.getElementById(`${WheelPresetScreen.name}_Name`) as null | HTMLInputElement;
        if (element) {
            element.value = this.activePreset.name;
        }
    }

    load() {
        super.load();
        this.#loadPreset(0);
    }

    resize() {
        const elem = document.getElementById(ID.root) as HTMLElement;
        const fontSize = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
        ElementPositionFix(ID.root, fontSize, 80, 60, 1840, 880);
        elem.style.display = "grid";
    }

    run() {}

    click() {}

    unload() {
        const elem = document.getElementById(ID.root) as HTMLElement;
        if (elem) {
            elem.style.display = "none";
        }
    }

    exit(fullExit=true) {
        if (this.queueServer.size) {
            pushMBSSettings(Array.from(this.queueServer), true);
        }

        ElementRemove(ID.root);
        this.exitScreens(fullExit);
    }
}

const root = "mbs-fwpreset";
const ID = Object.freeze({
    root: root,
    styles: `${root}-style`,

    delete: `${root}-delete`,
    deleteButton: `${root}-delete-button`,
    deleteTooltip: `${root}-delete-tooltip`,
    accept: `${root}-accept`,
    acceptButton: `${root}-accept-button`,
    acceptTooltip: `${root}-accept-tooltip`,
    save: `${root}-save`,
    saveButton: `${root}-save-button`,
    saveTooltip: `${root}-save-tooltip`,
    exit: `${root}-exit`,
    exitButton: `${root}-exit-button`,
    exitTooltip: `${root}-exit-tooltip`,
    header: `${root}-header`,

    midDiv: `${root}-mid-div`,

    nameDiv: `${root}-name-div`,
    nameHeader: `${root}-name-header`,
    nameInput: `${root}-name-input`,
    nameDropdown: `${root}-name-dropdown`,

    builtinBC: `${root}-builtin-bc`,
    builtinBCColor: `${root}-builtin-bc-color`,
    builtinBCTooltip: `${root}-builtin-bc-tooltip`,
    builtinBCDiv: `${root}-builtin-bc-div`,
    builtinBCHeader: `${root}-builtin-bc-header`,

    builtinMBS: `${root}-builtin-mbs`,
    builtinMBSColor: `${root}-builtin-mbs-color`,
    builtinMBSTooltip: `${root}-builtin-mbs-tooltip`,
    builtinMBSTooltipHeader: `${root}-builtin-mbs-tooltip-header`,
    builtinMBSTooltipList: `${root}-builtin-mbs-tooltip-list`,
    builtinMBSDiv: `${root}-builtin-mbs-div`,
    builtinMBSHeader: `${root}-builtin-mbs-header`,

    customMBS: `${root}-custom-mbs`,
    customMBSColor: `${root}-custom-mbs-color`,
    customMBSTooltip: `${root}-custom-mbs-tooltip`,
    customMBSTooltipHeader: `${root}-custom-mbs-tooltip-header`,
    customMBSTooltipList: `${root}-custom-mbs-tooltip-list`,
    customMBSDiv: `${root}-custom-mbs-div`,
    customMBSHeader: `${root}-custom-mbs-header`,
});
