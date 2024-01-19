import { clamp } from "lodash-es";

import { fromEntries, validateInt, waitFor } from "../common";
import { sanitizeWheelFortuneIDs, MBS_MAX_SETS, FWItemSet } from "../common_bc";
import { MBSScreen } from "../screen_abc";
import { pushMBSSettings, SettingsType } from "../settings";

import { getFlagDescription } from "./lock_flags";
import { FORTUNE_WHEEL_ITEM_SETS } from "./fortune_wheel";

const OPTIONS_PER_ROW = 8;
const DELTA = 76;

interface GridSpec {
    xOffset: number,
    yOffset: number,
    xDelta: number,
    yDelta: number,
}

/** A {@link TextCache} cache for the `MiniGame/WheelFortune` screen */
let SCREEN_CACHE: TextCache;
waitFor(() => typeof MainCanvas !== "undefined").then(() => {
    const csvPath = "Screens/MiniGame/WheelFortune/Text_WheelFortune.csv";
    SCREEN_CACHE = new TextCache(csvPath, "MISSING VALUE FOR TAG: ");
});

function drawPresetTooltip(x: number, y: number, w: number, tooltip: string[]) {
    const [header, ...rest] = tooltip;
    const h = DELTA + rest.length * 48 + (rest.length > 0 ? 16 : 0);
    x = clamp(x, 0, 2000 - w);
    y = clamp(y, 0, 1000 - h);

    DrawRect(x, y, w, h, "White");
    DrawEmptyRect(x, y, w, h, "Black", 2);
    MainCanvas.beginPath();
    MainCanvas.moveTo(x, y + DELTA);
    MainCanvas.lineTo(x + w, y + DELTA);
    MainCanvas.stroke();

    MainCanvas.textBaseline = "middle";
    DrawTextFit(header, x + (w / 2), y + DELTA / 2, w - 32, "black");
    MainCanvas.textAlign = "left";
    MainCanvas.font = '30px "Arial", sans-serif';
    rest.forEach((str, i) => DrawText(str, x + 16, y + DELTA + 8 + 24 + i * 48, "black"));
    MainCanvas.textAlign = "center";
    MainCanvas.font = '36px "Arial", sans-serif';
    MainCanvas.textBaseline = "top";
}

export class WheelPresetScreen extends MBSScreen {
    static readonly background = "Sheet";
    static readonly screen = `MBS_${WheelPresetScreen.name}`;
    readonly screen = WheelPresetScreen.screen;

    /** A record containing element names mapped to a set of UI functions */
    readonly elements: Readonly<Record<string, UIElement>>;

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

        const element = document.getElementById(`${WheelPresetScreen.name}_Name`) as null | HTMLInputElement;
        if (element) {
            element.value = this.activePreset.name;
        }
    }

    constructor(
        parent: null | MBSScreen,
        presets: (null | WheelPreset)[],
    ) {
        super(parent);
        this.presets = presets;
        this.elements = {
            Header: {
                coords: [1000, 60 + 20, 0, 0],
                run: (x, y) => {
                    let text = "Wheel of Fortune Presets";
                    if (this.presetUnsaved) {
                        text += " (unsaved)";
                    }

                    MainCanvas.font = '48px "Arial", sans-serif';
                    DrawText(text, x, y, "Black");
                    MainCanvas.font = '36px "Arial", sans-serif';
                },
            },
            HeaderName: {
                coords: [DELTA * 3, DELTA * 3, 0, 0],
                run: (x, y) => DrawText("Preset Name", x, y, "Black"),
            },
            HeaderBuiltinBC: {
                coords: [DELTA * 10, DELTA * 3, 0, 0],
                run: (x, y) => DrawText("Builtin BC Options", x, y, "Black"),
            },
            HeaderBuiltinMBS: {
                coords: [DELTA * 15.5, DELTA * 3, 0, 0],
                run: (x, y) => DrawText("Builtin MBS Options", x, y, "Black"),
            },
            HeaderMBS: {
                coords: [DELTA * 21, DELTA * 3, 0, 0],
                run: (x, y) => DrawText("Custom MBS Options", x, y, "Black"),
            },
            Exit: {
                coords: [1830, 60, 90, 90],
                click: () => this.exit(false),
                run: (...coords) => DrawButton(...coords, "", "White", "Icons/Exit.png", "Exit"),
            },
            Save: {
                coords: [1720, 60, 90, 90],
                click: () => this.savePreset(),
                run: (...coords) => DrawButton(...coords, "", "White", "Icons/Save.png", "Save the current preset"),
            },
            Equip: {
                coords: [1610, 60, 90, 90],
                click: () => {
                    if (this.presetUnsaved) {
                        this.equipPreset();
                    }
                },
                run: (...coords) => {
                    if (this.presetUnsaved) {
                        DrawButton(...coords, "", "Gray", "Icons/Accept.png", "Equip the current preset: Must first save the wheel preset", true);
                    } else {
                        DrawButton(...coords, "", "White", "Icons/Accept.png", "Equip the current preset");
                    }
                },
            },
            Delete: {
                coords: [DELTA, 60, 90, 90],
                click: () => this.deletePreset(),
                run: (...coords) => DrawButton(...coords, "", "White", "Icons/Trash.png", "Delete the current preset"),
            },
            Name: {
                coords: [DELTA, 300, DELTA * 4, 64],
                load: () => {
                    const element = ElementCreateInput(`${WheelPresetScreen.name}_Name`, "text", this.activePreset.name, 20);
                    element.placeholder = `Preset ${this.index}`;
                    element.addEventListener("input", CommonLimitFunction((e) => {
                        const text = (e.target as null | EventTarget & { value?: string })?.value || null;
                        if (text !== null && text.length > 0 && text.length <= 20) {
                            this.activePreset.name = text;
                        }
                    }));
                },
                unload: () => ElementRemove(`${WheelPresetScreen.name}_Name`),
                run: (...coords) => ElementPositionFixed(`${WheelPresetScreen.name}_Name`, ...coords),
            },
            DropDown: {
                coords: [DELTA, 400, DELTA * 4, 64],
                load: () => {
                    ElementCreateDropdown(
                        `${WheelPresetScreen.name}_DropDown`,
                        this.presets.map((_, i) => `Preset ${i}`),
                        (ev) => {
                            const index = (ev.target as null | EventTarget & { selectedIndex?: number })?.selectedIndex ?? -1;
                            if (Number.isInteger(index) && index >= 0 && index <= this.presets.length) {
                                this.index = index;
                            }
                        },
                    );
                    this.#updateDrownDownNames();
                },
                run: (...coords) => {
                    DrawEmptyRect(...coords, "Black");
                    ElementPositionFixed(`${WheelPresetScreen.name}_DropDown`, ...coords);
                },
                unload: () => ElementRemove(`${WheelPresetScreen.name}_DropDown`),
            },
            ...this.#getBuiltinBCElements({ xOffset: DELTA * 6, yOffset: 300, xDelta: DELTA, yDelta: DELTA }),
            ...this.#getMBSElements({ xOffset: DELTA * (6 + 9), yOffset: 300, xDelta: DELTA, yDelta: DELTA }, true),
            ...this.#getMBSElements({ xOffset: DELTA * (6 + 11), yOffset: 300, xDelta: DELTA, yDelta: DELTA }, false),
        };

        this.index = 0;
        this.queueServer = new Set();
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

    #getBuiltinBCElements(gridSpec: GridSpec): Record<string, UIElement> {
        return fromEntries(WheelFortuneOption.filter(o => o.Custom === undefined).slice(0, 64).map(({ ID }, i) => {
            const x = gridSpec.xOffset + Math.floor(i / OPTIONS_PER_ROW) * gridSpec.xDelta;
            const y = gridSpec.yOffset + (i % OPTIONS_PER_ROW) * gridSpec.yDelta;
            const tooltip = [SCREEN_CACHE.get(`Option${ID}`)];
            return [
                `BuiltinBCOption${ID}`,
                {
                    coords: [x, y, 64, 64],
                    run: (x, y, w, h) => {
                        DrawEmptyRect(x, y, w, h, "Black");
                        DrawRect(x + 3, y + 3, w - 6, h - 6, this.activePreset.ids.has(ID) ? "Green" : "Red");
                        if (MouseIn(x, y, w, h) && !CommonIsMobile) {
                            DrawRect(x + 3, y + 3, w - 6, h - 6, "rgba(0,0,0,0.5)");
                            drawPresetTooltip(x - (DELTA * 7), y - DELTA, DELTA * 7 - 12, tooltip);
                        }
                    },
                },
            ];
        }));
    }

    #getMBSElements(gridSpec: GridSpec, builtin: boolean): Record<string, UIElement> {
        const fwObjects = builtin ? FORTUNE_WHEEL_ITEM_SETS : [
            ...Player.MBSSettings.FortuneWheelItemSets,
            ...Player.MBSSettings.FortuneWheelCommands,
        ];

        return fromEntries(fwObjects.map((wheelObj, i) => {
            const x = gridSpec.xOffset + Math.floor(i / OPTIONS_PER_ROW) * gridSpec.xDelta;
            const y = gridSpec.yOffset + (i % OPTIONS_PER_ROW) * gridSpec.yDelta;
            return [
                `${builtin ? "Builtin" : ""}MBSOption${i}`,
                {
                    coords: [x, y, 64, 64],
                    run: (x, y, w, h) => {
                        let color: string;
                        if (wheelObj === null) {
                            color = "Gray";
                        } else if (wheelObj.children?.some(i => this.activePreset.ids.has(i.ID))) {
                            color = "Green";
                        } else {
                            color = "Red";
                        }

                        DrawEmptyRect(x, y, w, h, "Black");
                        DrawRect(x + 3, y + 3, w - 6, h - 6, color);
                        if (MouseIn(x, y, w, h) && !CommonIsMobile) {
                            let suffix: string[] = [];
                            if (wheelObj instanceof FWItemSet && wheelObj.children) {
                                suffix = wheelObj.children.filter(o => this.activePreset.ids.has(o.ID)).map(o => `• ${getFlagDescription(o.Flag)}`);
                            }
                            const prefix = i < MBS_MAX_SETS ? "Item Set" : "Command";
                            const middle = wheelObj?.name ?? `<Empty ${i % MBS_MAX_SETS}>`;
                            const tooltip = [`${prefix}: ${middle}`, ...suffix];

                            DrawRect(x + 3, y + 3, w - 6, h - 6, "rgba(0,0,0,0.5)");
                            drawPresetTooltip(x - (DELTA * 7), y - DELTA, DELTA * 7 - 12, tooltip);
                        }
                    },
                },
            ];
        }));
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
        Object.values(this.elements).forEach(e => e.load?.());
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
        MainCanvas.textBaseline = "top";
        Object.values(this.elements).forEach((e) => e.run(...e.coords));
        MainCanvas.textBaseline = "middle";
    }

    unload() {
        Object.values(this.elements).forEach(e => e.unload?.());
    }

    exit(fullExit = true) {
        if (this.queueServer.size) {
            pushMBSSettings(Array.from(this.queueServer), true);
        }

        this.unload();
        Object.values(this.elements).forEach((e) => e.exit?.());
        this.exitScreens(fullExit);
    }
}
