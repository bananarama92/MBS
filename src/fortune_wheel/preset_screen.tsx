import { cloneDeep, range, clamp } from "lodash-es";

import { validateInt, waitFor } from "../common";
import { sanitizeWheelFortuneIDs, MBS_MAX_SETS, FWItemSet, bcLoaded, FWCommand } from "../common_bc";
import { MBSScreen, ScreenParams } from "../screen_abc";
import { pushMBSSettings, SettingsType } from "../settings";

import { getFlagDescription } from "./lock_flags";
import { FORTUNE_WHEEL_ITEM_SETS } from "./fortune_wheel";
import styles from "./preset_screen.scss";

/** A {@link TextCache} cache for the `MiniGame/WheelFortune` screen */
let SCREEN_CACHE: TextCache;

type OptionType = 0 | 1 | 2;
const OptionType = Object.freeze({
    builtinBC: 0,
    builtinMBS: 1,
    customMBS: 2,
}) satisfies Record<string, OptionType>;

type IDData = {
    header: string,
    description?: string,
    readonly index: number,
    readonly type: OptionType,
};

let BUILTIN_BC_OPTIONS_HEADERS: readonly string[];
let BUILTIN_BC_OPTIONS: Readonly<Record<string, IDData>>;
let BUILTIN_MBS_OPTIONS: Readonly<Record<string, IDData>>;
let CUSTOM_MBS_OPTIONS: Readonly<Record<string, IDData>>;

waitFor(bcLoaded).then(async () => {
    const csvPath = "Screens/MiniGame/WheelFortune/Text_WheelFortune.csv";
    if (GameVersion === "R103") {
        // @ts-expect-error
        SCREEN_CACHE = new TextCache(csvPath, "MISSING VALUE FOR TAG: ");
    } else {
        SCREEN_CACHE = await TextCache.buildAsync(csvPath);
    }
});

function initOptions() {
    if (typeof BUILTIN_BC_OPTIONS_HEADERS !== "undefined") {
        return;
    }

    const pattern = /^([a-zA-Z0-9_\s]+) for ([0-9]+) (minutes|hours)$/;
    const builtinOptions = WheelFortuneOption.filter(o => o.Custom === undefined);

    // Group builtin wheel options together by duration (if applicable)
    const headers: Set<string> = new Set();
    const optionRecord: Record<string, Omit<IDData, "index">> = {};
    for (const o of builtinOptions) {
        const header = SCREEN_CACHE.get(`Option${o.ID}`);
        const match = pattern.exec(header);
        if (!match) {
            optionRecord[o.ID] = { header, type: OptionType.builtinBC };
            headers.add(header);
            continue;
        }

        const [key, unit] = [match[1], match[3]];
        let duration = Number.parseInt(match[2]);
        if (unit === "hours") {
            duration *= 60;
        }

        headers.add(key);
        optionRecord[o.ID] = { header: key, description: `${duration} Minutes`, type: OptionType.builtinBC };
    }

    BUILTIN_BC_OPTIONS_HEADERS = Array.from(headers);
    BUILTIN_BC_OPTIONS = Object.fromEntries(Object.entries(optionRecord).map(([id, rec]) => {
        return [id, { ...rec, index: BUILTIN_BC_OPTIONS_HEADERS.indexOf(rec.header as string) }];
    }));

    const bit8 = 256; // 2**8
    BUILTIN_MBS_OPTIONS = Object.fromEntries(FORTUNE_WHEEL_ITEM_SETS.flatMap((itemSet, i) => {
        return itemSet.flags.map((flag, j) => {
            const id = String.fromCharCode(bit8 + i * 16 + j);
            const option = {
                header: itemSet.name,
                description: getFlagDescription(flag),
                index: i,
                type: OptionType.builtinMBS,
            };
            return [id, option];
        });
    }));

    CUSTOM_MBS_OPTIONS = Object.fromEntries(range(2 * bit8, 6 * bit8).map((i, j) => {
        const id = String.fromCharCode(i);
        const nBit8 = Math.floor(j / bit8);
        let index: number;

        /**
         * Item set page 1: [2 * 2**8, 3 * 2**8) -> [0, 16)
         * commands set page 1: [3 * 2**8, 4 * 2**8) -> [32, 48)
         * Item set page 2: [4 * 4**8, 5 * 2**8) -> [16, 32)
         * commands set page 2: [5 * 2**8, 6 * 2**8) -> [48, 64)
         */
        switch (nBit8) {
            case 0:
            case 2:
                index = (nBit8 === 0 ? 0 : 16) + Math.floor(j % bit8 / 16);
                break;
            case 1:
            case 3:
                index = (nBit8 === 1 ? 0 : 16) + Math.floor(j % bit8 / 16) + 32;
                break;
            default:
                throw new RangeError(`Index ${j} lies out of the [0, 2**10) range`);
        }
        return [id, { header: "<Empty>", type: OptionType.customMBS, index }];
    }));
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
    nameDropdownDiv: `${root}-name-dropdown-div`,
    nameDropdownContent: `${root}-name-dropdown-content`,

    builtinBC: `${root}-builtin-bc`,
    builtinBCColor: `${root}-builtin-bc-color`,
    builtinBCTooltip: `${root}-builtin-bc-tooltip`,
    builtinBCTooltipHeader: `${root}-builtin-bc-tooltip-header`,
    builtinBCTooltipList: `${root}-builtin-bc-tooltip-list`,
    builtinBCDiv: `${root}-builtin-bc-div`,
    builtinBCHeader: `${root}-builtin-bc-header`,

    builtinMBS: `${root}-builtin-mbs`,
    builtinMBSColor: `${root}-builtin-mbs-color`,
    builtinMBSTooltip: `${root}-builtin-mbs-button-tooltip`,
    builtinMBSTooltipHeader: `${root}-builtin-mbs-button-tooltip-header`,
    builtinMBSTooltipList: `${root}-builtin-mbs-button-tooltip-list`,
    builtinMBSDiv: `${root}-builtin-mbs-div`,
    builtinMBSHeader: `${root}-builtin-mbs-header`,

    customMBS: `${root}-custom-mbs`,
    customMBSColor: `${root}-custom-mbs-color`,
    customMBSTooltip: `${root}-custom-mbs-button-tooltip`,
    customMBSTooltipHeader: `${root}-custom-mbs-button-tooltip-header`,
    customMBSTooltipList: `${root}-custom-mbs-button-tooltip-list`,
    customMBSDiv: `${root}-custom-mbs-div`,
    customMBSHeader: `${root}-custom-mbs-header`,
});

export class WheelPresetScreen extends MBSScreen {
    static readonly background = "Sheet";
    static readonly screen = `MBS_${WheelPresetScreen.name}`;
    static readonly ids = ID;
    static readonly screenParamsDefault = {
        [root]: Object.freeze({
            shape: [80, 60, 1840, 880] as RectTuple,
            visibility: "visible",
        }),
    };

    /** The characters current list of presets. Will be updated inplace. */
    readonly presets: (null | WheelPreset)[];

    /** A set of {@link SettingsType} values that should be pushed upon calling {@link WheelPresetScreen.exit} */
    readonly queueServer: Set<import("../settings").SettingsType>;

    /** A flattened record mapping wheel option IDs to preset-relevant data */
    readonly idMapping: Readonly<Record<string, IDData>>;

    /** The currently to-be configured preset. */
    activePreset: { name: string, ids: Set<string> } = { name: "<PLACEHOLDER>", ids: new Set() };

    /** The index within {@link WheelPresetScreen.presets} */
    #index: number = 0;

    /** Get or set the index within {@link WheelPresetScreen.presets}, updating {@link WheelPresetScreen.activePreset} in order to match */
    get index() { return this.#index; }
    set index(value: number) {
        validateInt(value, "index", 0, this.presets.length - 1);
        if (this.#index !== value) {
            this.#index = value;
            this.#loadPreset();
        }
    }

    constructor(
        parent: null | MBSScreen,
        presets: (null | WheelPreset)[],
        params: null | ScreenParams.Partial = null,
    ) {
        initOptions();
        super(parent, WheelPresetScreen.screenParamsDefault, params);
        this.presets = presets;
        this.queueServer = new Set();
        this.idMapping = {
            ...cloneDeep(BUILTIN_BC_OPTIONS),
            ...cloneDeep(BUILTIN_MBS_OPTIONS),
            ...cloneDeep(CUSTOM_MBS_OPTIONS),
        };

        document.body.appendChild(
            <div id={ID.root} class="mbs-screen">
                <style id={ID.styles}>{styles.toString()}</style>

                <h1 id={ID.header}>Wheel of Fortune preset {this.index}</h1>
                <div id={ID.delete} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.deleteButton}
                        style={{ backgroundImage: "url('./Icons/Trash.png')" }}
                        onClick={this.deletePreset.bind(this)}
                        disabled={true}
                    />
                    <div class="mbs-button-tooltip" id={ID.deleteTooltip} style={{ justifySelf: "left" }}>
                        Delete the current preset
                    </div>
                </div>
                <div id={ID.accept} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.acceptButton}
                        style={{ backgroundImage: "url('./Icons/Accept.png')" }}
                        onClick={this.equipPreset.bind(this)}
                        disabled={true}
                    />
                    <div class="mbs-button-tooltip" id={ID.acceptTooltip} style={{ justifySelf: "right" }}>
                        Equip the current preset
                    </div>
                </div>
                <div id={ID.save} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.saveButton}
                        style={{ backgroundImage: "url('./Icons/Save.png')" }}
                        onClick={this.savePreset.bind(this)}
                    />
                    <div class="mbs-button-tooltip" id={ID.saveTooltip} style={{ justifySelf: "right" }}>
                        Save the current preset
                    </div>
                </div>
                <div id={ID.exit} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.exitButton}
                        style={{ backgroundImage: "url('./Icons/Exit.png')" }}
                        onClick={() => this.exit(false)}
                    />
                    <div class="mbs-button-tooltip" id={ID.exitTooltip} style={{ justifySelf: "right" }}>
                        Exit
                    </div>
                </div>

                <div id={ID.midDiv}>
                    <p id={ID.nameHeader}>Preset Name</p>
                    <p id={ID.builtinBCHeader}>Builtin BC Options</p>
                    <p id={ID.builtinMBSHeader}>Builtin MBS Options</p>
                    <p id={ID.customMBSHeader}>Custom MBS Options</p>

                    <div id={ID.nameDiv}>
                        <input
                            type="text"
                            id={ID.nameInput}
                            maxLength={20}
                            onFocus={(e) => (e.target as HTMLInputElement).select()}
                            onInput={(e) => this.activePreset.name = (e.target as HTMLInputElement).value}
                        />
                        <div
                            id={ID.nameDropdownDiv}
                            class="mbs-dropdown"
                            onWheel={(e) => this.index = clamp(this.index + Math.sign(e.deltaY), 0, this.presets.length - 1)}
                        >
                            <button class="mbs-button" id={ID.nameDropdown}/>
                            <div class="mbs-dropdown-content" id={ID.nameDropdownContent}> {
                                Object.values(this.presets).map((preset, i) => {
                                    return <button
                                        class="mbs-button mbs-dropdown-button"
                                        id={ID.nameDropdown + i.toString()}
                                        onClick={() => this.index = i}
                                    >{`${i}: ${preset?.name ?? "<Empty>"}`}</button>;
                                })
                            } </div>
                        </div>
                    </div>

                    <div id={ID.builtinBCDiv} class="mbs-fwpreset-grid">{this.#loadPresetElements(OptionType.builtinBC)}</div>
                    <div id={ID.builtinMBSDiv} class="mbs-fwpreset-grid">{this.#loadPresetElements(OptionType.builtinMBS)}</div>
                    <div id={ID.customMBSDiv} class="mbs-fwpreset-grid">{this.#loadPresetElements(OptionType.customMBS)}</div>
                </div>
            </div>,
        );
    }

    #loadIDMapping() {
        const lists = [
            ...Player.MBSSettings.FortuneWheelItemSets,
            ...Player.MBSSettings.FortuneWheelCommands,
        ];
        for (const [i, fwOption] of lists.entries()) {
            let idStart = 2 * 2**8;
            if (i < 32) {
                idStart += (i >= 16) ? 16 * (16 + i) : 16 * i;
            } else {
                idStart += (i >= 48) ? 16 * i : 16 * (16 + i);
            }

            if (fwOption instanceof FWItemSet) {
                for (const [j, flag] of fwOption.flags.entries()) {
                    const id = String.fromCharCode(idStart + j);
                    this.idMapping[id].description = getFlagDescription(flag);
                    this.idMapping[id].header = fwOption.name;
                }
            } else if (fwOption instanceof FWCommand) {
                const id = String.fromCharCode(idStart);
                this.idMapping[id].header = fwOption.name;
                delete this.idMapping[id].description;
            } else {
                for (const j of range(16)) {
                    const id = String.fromCharCode(idStart + j);
                    this.idMapping[id].header = "<Empty>";
                    delete this.idMapping[id].description;
                }
            }
        }
    }

    #loadPresetElement(
        index: number,
        prefix: undefined | string,
        justify: "left" | "right" | "center",
        ids: Readonly<{ root: string, color: string, tooltip: string, tooltipHeader: string, tooltipList: string }>,
    ): HTMLDivElement {
        const i = index.toString();
        return (
            <div id={ids.root + i} class="mbs-fwpreset">
                <button
                    id={ids.color + i}
                    class="mbs-fwpreset-color"
                    data-color="red"
                    onClick={(event) => (event.target as HTMLButtonElement).focus()}
                />
                <div id={ids.tooltip + i} class="mbs-button-tooltip" style={{ justifySelf: justify }}>
                    <h2 id={ids.tooltipHeader + i} data-prefix={prefix ?? ""} />
                    <ul id={ids.tooltipList + i} />
                </div>
            </div>
        ) as HTMLDivElement;
    }

    #loadPresetElements(type: OptionType): HTMLDivElement[] {
        let objects: readonly unknown[];
        let justify: "left" | "right" | "center";
        let getPrefix: undefined | ((item: unknown, i: number) => string) = undefined;
        const ids = this.#getPresetIDs(type);
        switch (type) {
            case OptionType.builtinBC:
                objects = BUILTIN_BC_OPTIONS_HEADERS;
                justify = "left";
                break;
            case OptionType.builtinMBS:
                objects = FORTUNE_WHEEL_ITEM_SETS;
                justify = "center";
                break;
            case OptionType.customMBS:
                objects = [
                    ...Player.MBSSettings.FortuneWheelItemSets,
                    ...Player.MBSSettings.FortuneWheelCommands,
                ];
                justify = "right";
                getPrefix = (_, i) => i >= MBS_MAX_SETS ? `Command Set ${i - 32}: ` : `Item Set ${i}: `;
                break;
            default:
                throw new Error(`Unknown type: ${type}`);
        }

        return objects.map((obj, i) => this.#loadPresetElement(i, getPrefix?.(obj, i), justify, ids));
    }

    #getPresetIDs(type: OptionType): { root: string, color: string, tooltip: string, tooltipHeader: string, tooltipList: string } {
        switch (type) {
            case OptionType.builtinBC:
                return {
                    root: ID.builtinBC,
                    color: ID.builtinBCColor,
                    tooltip: ID.builtinBCTooltip,
                    tooltipHeader: ID.builtinBCTooltipHeader,
                    tooltipList: ID.builtinBCTooltipList,
                };
            case OptionType.builtinMBS:
                return {
                    root: ID.builtinMBS,
                    color: ID.builtinMBSColor,
                    tooltip: ID.builtinMBSTooltip,
                    tooltipHeader: ID.builtinMBSTooltipHeader,
                    tooltipList: ID.builtinMBSTooltipList,
                };
            case OptionType.customMBS:
                return {
                    root: ID.customMBS,
                    color: ID.customMBSColor,
                    tooltip: ID.customMBSTooltip,
                    tooltipHeader: ID.customMBSTooltipHeader,
                    tooltipList: ID.customMBSTooltipList,
                };
            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }

    #reloadButtons() {
        const state = this.presets[this.#index];

        const inputField = document.getElementById(ID.nameInput) as HTMLInputElement;
        const inputButton = document.getElementById(ID.nameDropdown) as HTMLButtonElement;
        const dropdownButton = document.getElementById(`${ID.nameDropdown}${this.index}`) as HTMLButtonElement;
        inputField.placeholder = `Preset ${this.index}`;
        dropdownButton.innerText = inputButton.innerText = `${this.#index}: ${this.activePreset.name}`;

        const deleteButton = document.getElementById(ID.deleteButton) as HTMLButtonElement;
        const deleteTooltip = document.getElementById(ID.deleteTooltip) as HTMLDivElement;
        const equipButtonm = document.getElementById(ID.acceptButton) as HTMLButtonElement;
        const equipTooltip = document.getElementById(ID.acceptTooltip) as HTMLDivElement;
        const header = document.getElementById(ID.header) as HTMLDivElement;
        if (state === null) {
            inputField.value = "";
            deleteButton.disabled = true;
            equipButtonm.disabled = true;
            deleteTooltip.innerText = "Delete the current preset:\nunsaved preset";
            equipTooltip.innerText = "Equip the current preset:\nunsaved preset";
            header.innerText = `Wheel of Fortune preset ${this.index} (unsaved)`;
        } else {
            inputField.value = state.name;
            deleteButton.disabled = false;
            equipButtonm.disabled = false;
            deleteTooltip.innerText = "Delete the current preset";
            equipTooltip.innerText = "Equip the current preset";
            header.innerText = `Wheel of Fortune preset ${this.index}`;
        }
    }

    #loadPreset() {
        const state = this.presets[this.#index];
        this.activePreset = state !== null ? { name: state.name, ids: new Set(state.ids) } : {
            name: "<Empty>",
            ids: new Set(Player.OnlineSharedSettings?.WheelFortune ?? WheelFortuneDefault),
        };

        this.#reloadButtons();

        const dataGrouped: Record<OptionType, Record<number, { header: string, description: string[], enabled: boolean }>> = {
            [OptionType.builtinBC]: {},
            [OptionType.builtinMBS]: {},
            [OptionType.customMBS]: {},
        };
        for (const [id, { type, index, description, header }] of Object.entries(this.idMapping)) {
            const enabled = this.activePreset.ids.has(id);
            const data = dataGrouped[type][index] ??= { header, enabled, description: [] };
            data.enabled ||= enabled;
            if (description && enabled) {
                data.description.push(description);
            }
        }

        for (const type of Object.values(OptionType)) {
            const ids = this.#getPresetIDs(type);
            for (const [i, data] of Object.entries(dataGrouped[type])) {
                const color = document.getElementById(`${ids.color}${i}`) as HTMLDivElement;
                color.dataset.color = data.enabled ? "green" : "red";

                const tooltipHeader = document.getElementById(`${ids.tooltipHeader}${i}`) as HTMLHeadingElement;
                tooltipHeader.innerText = (tooltipHeader.dataset.prefix ?? "") + data.header;

                const tooltipList = document.getElementById(`${ids.tooltipList}${i}`) as HTMLUListElement;
                tooltipList.innerHTML = "";
                for (const flagText of data.description) {
                    tooltipList.appendChild(<li>{flagText}</li>);
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
            this.#reloadButtons();
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

        this.queueServer.add(SettingsType.SETTINGS);
        this.presets[this.index] = null;
        this.#loadPreset();
    }

    load() {
        super.load();
        this.#loadIDMapping();
        this.#loadPreset();
    }

    exit(fullExit=true) {
        super.exit();
        if (this.queueServer.size) {
            pushMBSSettings(Array.from(this.queueServer), true);
        }
        this.exitScreens(fullExit);
    }
}
