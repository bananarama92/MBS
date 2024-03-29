/** Configuration screen for custom wheel of fortune options */

import { clamp } from "lodash-es";

import { FWSelectedItemSet, FWItemSet } from "../common_bc";
import { MBSScreen, MBSObjectScreen, ExitAction } from "../screen_abc";
import { byteToKB } from "../settings";

import { toItemBundles } from "./item_bundle";
import { fortuneWheelEquip, StripLevel, getStripCondition } from "./equipper";
import styles from "./fortune_wheel_item_set.scss";

/** A mapping that maps {@link StripLevel} values to a description. */
const STRIP_MAPPING = Object.freeze({
    [StripLevel.NONE]: "None",
    [StripLevel.CLOTHES]: "Clothes",
    [StripLevel.UNDERWEAR]: "Clothes and underwear",
    [StripLevel.COSPLAY]: "Clothes, underwear and cosplay items",
    [StripLevel.ALL]: "Clothes, underwear, cosplay items and body",
}) satisfies Record<StripLevel, string>;

/**
 * Convert number-based time into a string compatible with the {@link createTimerElement} input element
 * @param time The time in seconds
 * @returns The stringified time
 */
function toInputTime(time: number): string {
    time = clamp(time, 60, 60 * 240);
    const unitsTime = { h: 0, m: 0, s: 0 };

    unitsTime.h = Math.floor(time / (60 * 60));
    time -= unitsTime.h * 60**2;

    unitsTime.m = Math.floor(time / 60);
    time -= unitsTime.m * 60;

    unitsTime.s = time;

    return `${unitsTime.h.toString().padStart(2, "0")}:${unitsTime.m.toString().padStart(2, "0")}:${unitsTime.s.toString().padStart(2, "0")}`;
}

type FieldsType = Readonly<{
    inputID: string,
    buttonID: string,
    optionID: string,
    dropdownID: string,
    level: "stripLevel" | "equipLevel";
}>;

function createDropdown(fields: FieldsType, settings: FWSelectedItemSet, disabled: boolean) {
    return (
        <div
            id={fields.inputID}
            class="mbs-dropdown"
            onWheel={(e) => {
                const elem = document.getElementById(fields.buttonID) as HTMLButtonElement;
                if (elem.disabled) {
                    return;
                }

                let level: StripLevel;
                if (e.deltaY < 0) {
                    level = clamp(settings[fields.level] - 1, StripLevel.NONE, StripLevel.COSPLAY) as StripLevel;
                } else if (e.deltaY > 0) {
                    level = clamp(settings[fields.level] + 1, StripLevel.NONE, StripLevel.COSPLAY) as StripLevel;
                } else {
                    return;
                }
                settings[fields.level] = level;
                elem.innerText = STRIP_MAPPING[settings[fields.level]];
            }}
        >
            <button class="mbs-button" disabled={disabled} id={fields.buttonID}>{STRIP_MAPPING[StripLevel.UNDERWEAR]}</button>
            <div class="mbs-dropdown-content" id={fields.dropdownID}> {
                Object.values(STRIP_MAPPING).slice(0, 4).map((value, i) => {
                    return <button
                        class="mbs-button mbs-dropdown-button"
                        disabled={disabled}
                        data-level={i}
                        id={fields.optionID + i.toString()}
                        style={{ border: "unset", paddingTop: "min(1vh, 0.5vw)", paddingBottom: "min(1vh, 0.5vw)" }}
                        onClick={(e) => {
                            const target = e.target as HTMLButtonElement;
                            settings[fields.level] = clamp(
                                Number.parseInt(target.dataset.level as string),
                                StripLevel.NONE,
                                StripLevel.COSPLAY,
                            ) as StripLevel;
                            const elem = document.getElementById(fields.buttonID) as HTMLButtonElement;
                            elem.innerText = STRIP_MAPPING[settings[fields.level]];
                        }}
                    >{value}</button>;
                })
            } </div>
        </div>
    );
}

function createTimerInput(flag: FWFlagTimerPasswordPadlock , index: number, disabled: boolean) {
    return (
        <input
            type="time"
            class="mbs-timer"
            id={ID.lockTimer + index.toString()}
            disabled={disabled}
            min="00:01:00"
            max="04:00:00"
            step={1}
            value={toInputTime(flag.time)}
            onInput={(e) => {
                const target = e.target as HTMLInputElement;
                const [h, m, s] = target.value.split(":").map(i => Number.parseInt(i, 10));
                flag.time = clamp(h * 60**2 + m * 60 + s, 60, 240 * 60);
            }}
            onWheel={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.disabled) {
                    return;
                }

                if (e.deltaY < 0) {
                    target.stepUp(120);
                } else if (e.deltaY > 0) {
                    target.stepDown(120);
                } else {
                    return;
                }
                const [h, m, s] = target.value.split(":").map(i => Number.parseInt(i, 10));
                flag.time = clamp(h * 60**2 + m * 60 + s, 60, 240 * 60);
            }}
        /> as HTMLInputElement
    );
}

export class FWItemSetScreen extends MBSObjectScreen<FWItemSet> {
    static readonly screen = "MBS_FWItemSetScreen";
    readonly screen = FWItemSetScreen.screen;
    static readonly background = "Sheet";
    readonly settings: FWSelectedItemSet;
    readonly preview: Character;

    constructor(parent: null | MBSScreen, wheelList: (null | FWItemSet)[], index: number, character: Character) {
        const disabled = !character.IsPlayer();
        super(parent, wheelList, index, character);
        this.settings = new FWSelectedItemSet(wheelList);
        this.preview = CharacterLoadSimple("MBSFortuneWheelPreview");

        document.body.appendChild(
            <div id={ID.root} class="HideOnPopup" screen-generated={this.screen}>
                <style id={ID.styles}>{styles.toString()}</style>

                <div id={ID.header}>Customize wheel of fortune item set</div>
                <div id={ID.delete} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.deleteButton}
                        style={{ backgroundImage: "url('./Icons/Trash.png')" }}
                        onClick={() => this.exit(false, ExitAction.DELETE)}
                        disabled={disabled}
                    />
                    <div class="mbs-button-tooltip" id={ID.deleteTooltip} style={{ justifySelf: "left" }}>
                        Delete item set
                    </div>
                </div>
                <div id={ID.accept} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.acceptButton}
                        style={{ backgroundImage: "url('./Icons/Accept.png')" }}
                        onClick={() => this.exit(false, ExitAction.SAVE)}
                        disabled={true}
                    />
                    <div class="mbs-button-tooltip" id={ID.acceptTooltip} style={{ justifySelf: "right" }}>
                        Save item set:\nMissing outfit
                    </div>
                </div>
                <div id={ID.cancel} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.cancelButton}
                        style={{ backgroundImage: "url('./Icons/Cancel.png')" }}
                        onClick={() => this.exit(false, ExitAction.NONE)}
                    />
                    <div class="mbs-button-tooltip" id={ID.cancelTooltip} style={{ justifySelf: "right" }}>
                        Cancel
                    </div>
                </div>
                <div id={ID.exit} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.exitButton}
                        style={{ backgroundImage: "url('./Icons/Exit.png')" }}
                        onClick={() => this.exit(true, ExitAction.NONE)}
                    />
                    <div class="mbs-button-tooltip" id={ID.exitTooltip} style={{ justifySelf: "right" }}>
                        Exit
                    </div>
                </div>

                <div id={ID.midDiv}>
                    <input
                        type="text"
                        id={ID.outfitName}
                        placeholder="Name"
                        disabled={disabled}
                        maxLength={70}
                        onInput={(e) => {
                            this.settings.name = (e.target as HTMLInputElement).value;
                            this.#updateButton(ID.acceptButton);
                        }}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <input
                        type="text"
                        id={ID.outfitInput}
                        placeholder="Outfit code"
                        disabled={disabled}
                        onInput={(e) => {
                            this.settings.outfitCache = (e.target as HTMLInputElement).value;
                            this.#updateButton(ID.outfitButton);
                        }}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <div id={ID.outfitDiv} class="mbs-button-div">
                        <button
                            class="mbs-button"
                            disabled={true}
                            id={ID.outfitButton}
                            onClick={() => this.#updateButton(ID.acceptButton, true)}
                        >Parse</button>
                        <div class="mbs-button-tooltip" id={ID.outfitTooltip}>Parse the outfit code</div>
                    </div>
                </div>

                <div id={ID.botDiv}>
                    <div id={ID.stripHeader}>Clothing strip level:</div>
                    <div id={ID.equipHeader}>Clothing equip level:</div>
                    <div id={ID.weightHeader}>Wheel option weight:</div>
                    <div id={ID.lockHeader}>Enabled lock types:</div>
                    <input
                        type="number"
                        id={ID.weightInput}
                        min={1}
                        max={9}
                        value={1}
                        disabled={disabled}
                        onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            this.settings.weight = clamp(Number.parseInt(target.value, 10), 1, 9);
                        }}
                        onWheel={(e) => {
                            const target = e.target as HTMLInputElement;
                            if (e.deltaY < 0) {
                                target.stepUp(1);
                            } else if (e.deltaY > 0) {
                                target.stepDown(1);
                            } else {
                                return;
                            }
                            this.settings.weight = clamp(Number.parseInt(target.value, 10), 1, 9);
                        }}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                    />

                    {createDropdown(
                        { inputID: ID.stripInput, buttonID: ID.stripButton, optionID: ID.stripOption, dropdownID: ID.stripDropdown, level: "stripLevel" },
                        this.settings,
                        disabled,
                    )}
                    {createDropdown(
                        { inputID: ID.equipInput, buttonID: ID.equipButton, optionID: ID.equipOption, dropdownID: ID.equipDropdown, level: "equipLevel" },
                        this.settings,
                        disabled,
                    )}

                    <div id={ID.lockGrid}> {
                        this.settings.flags.map((flag, i) => {
                            let companion: string | HTMLInputElement;
                            switch (flag.type) {
                                case "TimerPasswordPadlock":
                                    companion = createTimerInput(flag, i, disabled);
                                    break;
                                default:
                                    companion = flag.description;
                            }
                            return (
                                <div class={ID.lockContainer} id={ID.lockContainer + i.toString()}>
                                    <input
                                        type="checkbox"
                                        class={ID.lockCheckbox}
                                        id={ID.lockCheckbox + i.toString()}
                                        disabled={disabled}
                                        checked={flag.enabled}
                                        onClick={() => {
                                            flag.enabled = !flag.enabled;
                                            this.#updateButton(ID.acceptButton);
                                        }}
                                    />
                                    {companion}
                                </div>
                            );
                        })
                    } </div>
                </div>
            </div>,
        );
    }

    #canSave() {
        return (
            this.settings.isValid(this.index)
            && this.hasStorageSpace()
        );
    }

    #updateButton(type: typeof ID.acceptButton | typeof ID.outfitButton, loadOutfit=false) {
        const button = document.getElementById(type) as HTMLButtonElement;
        const disabled = !this.character.IsPlayer();
        switch (type) {
            case ID.acceptButton: {
                if (loadOutfit) {
                    const validOutfit = this.settings.loadFromBase64();
                    button.disabled = disabled || !(validOutfit && this.#canSave());
                    if (!disabled && validOutfit) {
                        this.#reloadPreviewAppearance();
                    }
                } else {
                    button.disabled = disabled || !(this.settings.itemList !== null && this.#canSave());
                }

                this.#updateTooltip(ID.acceptTooltip);
                break;
            }

            case ID.outfitButton: {
                button.disabled = disabled || !this.settings.outfitCache;
                this.#updateTooltip(ID.outfitTooltip);
                break;
            }

            default:
                throw new Error(`Unsupported tooltip type: ${type}`);
        }
    }

    #updateTooltip(type: typeof ID.acceptTooltip | typeof ID.outfitTooltip) {
        const tooltip = document.getElementById(type) as HTMLDivElement;
        switch (type) {
            case ID.acceptTooltip: {
                const prefix = "Save item set";
                if (!this.settings.loadFromBase64()) {
                    tooltip.innerText = `${prefix}:\nMissing outfit`;
                } else if (!this.#canSave()) {
                    if (!this.settings.name) {
                        tooltip.innerText = `${prefix}:\nMissing name`;
                    } else if (this.settings.flags.every(i => !i.enabled)) {
                        tooltip.innerText = `${prefix}:\nMust enable at least one lock type`;
                    } else if (!this.hasStorageSpace()) {
                        tooltip.innerText = `${prefix}:\nDuplicate name`;
                    } else {
                        tooltip.innerText = `${prefix}:\nMax allowed OnlineSharedSettings storage size exceeded (${byteToKB(this.dataSize.value)} / ${byteToKB(this.dataSize.max)}`;
                    }
                } else {
                    tooltip.innerText = prefix;
                }
                break;
            }

            case ID.outfitTooltip: {
                const prefix = "Parse outfit code";
                if (this.settings.outfitCache) {
                    tooltip.innerText = prefix;
                } else {
                    tooltip.innerText = `${prefix}:\nMissing code`;
                }
                break;
            }

            default:
                throw new Error(`Unsupported tooltip type: ${type}`);
        }
    }

    /** Reload the appearance of thepreview character based on the current settings. */
    #reloadPreviewAppearance(): void {
        this.preview.Appearance = [...this.character.Appearance];
        this.preview.OnlineSharedSettings = this.character.OnlineSharedSettings;
        CharacterReleaseTotal(this.preview);
        if (this.settings.itemList === null) {
            return;
        }

        const condition = getStripCondition(this.settings.equipLevel, this.preview);
        const family = this.preview.AssetFamily;
        const items = this.settings.itemList.filter(({ Name, Group }) => {
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

    /** Loads the club crafting room in slot selection mode, creates a dummy character for previews. */
    load() {
        super.load();

        // Load the settings
        const itemSet = this.mbsObject;
        if (itemSet !== null) {
            this.settings.readSettings(itemSet);
            this.settings.outfitCache = LZString.compressToBase64(
                JSON.stringify(toItemBundles(itemSet.itemList, this.preview)),
            );

            ElementValue(ID.outfitName, itemSet.name);
            ElementValue(ID.weightInput, itemSet.weight.toString());
            ElementValue(ID.outfitInput, this.settings.outfitCache);

            for (const [i, flag] of this.settings.flags.entries()) {
                const checkboxElem = document.getElementById(`${ID.lockCheckbox}${i}`) as HTMLInputElement;
                checkboxElem.checked = flag.enabled;
                switch (flag.type) {
                    case "TimerPasswordPadlock":
                        ElementValue(`${ID.lockTimer}${i}`, toInputTime(flag.time));
                        break;
                }
            }

            const equipElement = document.getElementById(ID.equipButton) as HTMLButtonElement;
            const stripElement = document.getElementById(ID.stripButton) as HTMLButtonElement;
            equipElement.innerText = STRIP_MAPPING[this.settings.equipLevel];
            stripElement.innerText = STRIP_MAPPING[this.settings.stripLevel];
            this.#updateButton(ID.acceptButton, true);
            this.#updateButton(ID.outfitButton);
        } else {
            this.settings.reset();
        }

        // Load and dress the character character
        this.#reloadPreviewAppearance();
    }

    resize() {
        const elem = document.getElementById(ID.root) as HTMLElement;
        const fontSize = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
        ElementPositionFix(ID.root, fontSize, 80, 60, 1840, 880);
        elem.style.display = "grid";
    }

    run() {
        DrawCharacter(this.preview, 300, 175, 0.78, false);
    }

    click() {}

    unload() {
        const elem = document.getElementById(ID.root) as HTMLElement;
        if (elem) {
            elem.style.display = "none";
        }
    }

    exit(fullExit?: boolean, action?: ExitAction): void {
        CharacterDelete(this.preview);
        ElementRemove(ID.root);
        super.exit(fullExit, action);
    }
}

const root = "mbs-fwitemset";
const ID = Object.freeze({
    root: root,
    styles: `${root}-style`,

    delete: `${root}-delete`,
    deleteButton: `${root}-delete-button`,
    deleteTooltip: `${root}-delete-tooltip`,
    accept: `${root}-accept`,
    acceptButton: `${root}-accept-button`,
    acceptTooltip: `${root}-accept-tooltip`,
    cancel: `${root}-cancel`,
    cancelButton: `${root}-cancel-button`,
    cancelTooltip: `${root}-cancel-tooltip`,
    exit: `${root}-exit`,
    exitButton: `${root}-exit-button`,
    exitTooltip: `${root}-exit-tooltip`,
    header: `${root}-header`,
    midDiv: `${root}-mid-grid`,
    botDiv: `${root}-bot-grid`,

    outfitName: `${root}-outfit-name`,
    outfitInput: `${root}-outfit-input`,
    outfitDiv: `${root}-outfit-div`,
    outfitButton: `${root}-outfit-button`,
    outfitTooltip: `${root}-outfit-tooltip`,

    stripHeader: `${root}-strip-header`,
    stripInput: `${root}-strip-dropdown`,
    stripButton: `${root}-strip-dropdown-button`,
    stripDropdown: `${root}-strip-dropdown-content`,
    stripOption: `${root}-strip-dropdown-option`,

    equipHeader: `${root}-equip-header`,
    equipInput: `${root}-equip-dropdown`,
    equipButton: `${root}-equip-dropdown-button`,
    equipDropdown: `${root}-equip-dropdown-content`,
    equipOption: `${root}-equip-dropdown-option`,

    weightHeader: `${root}-weight-header`,
    weightInput: `${root}-weight-input`,

    lockHeader: `${root}-lock-header`,
    lockGrid: `${root}-lock-grid`,
    lockContainer: `${root}-lock-container`,
    lockCheckbox: `${root}-lock-checkbox`,
    lockTimer: `${root}-lock-timer`,
});
