/** Configuration screen for custom wheel of fortune options */

import { clamp } from "lodash-es";

import { FWSelectedItemSet, FWItemSet } from "../common_bc";
import { MBSScreen, MBSObjectScreen, ExitAction } from "../screen_abc";
// import { byteToKB } from "../settings";

import { toItemBundles } from "./item_bundle";
import { fortuneWheelEquip, StripLevel, getStripCondition } from "./equipper";
import styles from "./fortune_wheel_item_set.css";

/** A mapping that maps {@link StripLevel} values to a description. */
export const STRIP_MAPPING = Object.freeze({
    [StripLevel.NONE]: "None",
    [StripLevel.CLOTHES]: "Clothes",
    [StripLevel.UNDERWEAR]: "Clothes and underwear",
    [StripLevel.COSPLAY]: "Clothes, underwear and cosplay items",
    [StripLevel.ALL]: "Clothes, underwear, cosplay items and body",
});

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
            <div id={ID.root} class="HideOnPopup">
                <style id={ID.styles}>{styles.toString()}</style>

                <div id={ID.header}>Customize wheel of fortune item set</div>
                <button
                    class="MBS_Button"
                    id={ID.delete}
                    title="Delete"
                    style={{ backgroundImage: "url('./Icons/Trash.png')" }}
                    onClick={() => this.exit(false, ExitAction.DELETE)}
                    disabled={disabled}
                ></button>
                <button
                    class="MBS_Button"
                    id={ID.accept}
                    title="Accept"
                    style={{ backgroundImage: "url('./Icons/Accept.png')" }}
                    onClick={() => this.exit(false, ExitAction.SAVE)}
                    disabled={true}
                ></button>
                <button
                    class="MBS_Button"
                    id={ID.cancel}
                    title="Cancel"
                    style={{ backgroundImage: "url('./Icons/Cancel.png')" }}
                    onClick={() => this.exit(false, ExitAction.NONE)}
                ></button>
                <button
                    class="MBS_Button"
                    id={ID.exit}
                    title="Exit"
                    style={{ backgroundImage: "url('./Icons/Exit.png')" }}
                    onClick={() => this.exit(true, ExitAction.NONE)}
                ></button>

                <div id={ID.midDiv}>
                    <input
                        type="text"
                        id={ID.name}
                        placeholder="Name"
                        disabled={disabled}
                        maxLength={70}
                        onInput={(e) => {
                            this.settings.name = (e.target as HTMLInputElement).value;
                            const elem = document.getElementById(ID.accept) as HTMLButtonElement;
                            elem.disabled = !this.#canSave();
                        }}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <input
                        type="text"
                        id={ID.outfitCode}
                        placeholder="Outfit code"
                        disabled={disabled}
                        onInput={(e) => {
                            this.settings.outfitCache = (e.target as HTMLInputElement).value;
                            const elem = document.getElementById(ID.outfitCodeButton) as HTMLButtonElement;
                            elem.disabled = disabled || !this.settings.outfitCache;
                        }}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                        class="MBS_Button"
                        title="Parse the outfit code"
                        disabled={true}
                        id={ID.outfitCodeButton}
                        onClick={() => {
                            const elem = document.getElementById(ID.accept) as HTMLButtonElement;
                            if (this.settings.loadFromBase64() && this.#canSave()) {
                                this.#reloadPreviewAppearance();
                                elem.disabled = disabled;
                            } else {
                                elem.disabled = true;
                            }
                        }}
                    >Parse</button>
                </div>

                <div id={ID.botDiv}>
                    <div id={ID.headerStrip}>Clothing strip level:</div>
                    <div id={ID.headerEquip}>Clothing equip level:</div>
                    <div id={ID.headerWeight}>Wheel option weight:</div>
                    <div id={ID.headerLock}>Supported lock types:</div>
                    <div id={ID.configStrip}></div>
                    <div id={ID.configEquip}></div>
                    <input
                        type="number"
                        id={ID.configWeight}
                        min={1}
                        max={9}
                        value={1}
                        disabled={disabled}
                        onInput={(e) => {
                            this.settings.weight = clamp(Number.parseInt((e.target as HTMLInputElement).value, 10), 1, 9);
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
                    <div id={ID.gridLock}> {
                        this.settings.flags.map((flag, i) => {
                            let companion: string | HTMLInputElement;
                            switch (flag.type) {
                                case "TimerPasswordPadlock":
                                    companion = <input
                                        type="time"
                                        class="MBS_Timer"
                                        id={ID.timerElement + i.toString()}
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
                                    /> as HTMLInputElement;
                                    break;
                                default:
                                    companion = flag.description;
                            }
                            return (
                                <div class={ID.containerLock} id={ID.containerLock + i.toString()}>
                                    <input
                                        type="checkbox"
                                        id={ID.checkboxLock + i.toString()}
                                        disabled={disabled}
                                        onClick={() => flag.enabled = !flag.enabled}
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
            this.character.IsPlayer()
            && this.settings.isValid(this.index)
            && this.hasStorageSpace()
        );
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
        const acceptElem = document.getElementById(ID.accept) as HTMLButtonElement;
        if (itemSet !== null) {
            this.settings.readSettings(itemSet);
            this.settings.outfitCache = LZString.compressToBase64(
                JSON.stringify(toItemBundles(itemSet.itemList, this.preview)),
            );

            ElementValue(ID.name, itemSet.name);
            ElementValue(ID.configWeight, itemSet.weight.toString());
            ElementValue(ID.outfitCode, this.settings.outfitCache);

            for (const [i, flag] of this.settings.flags.entries()) {
                const checkboxElem = document.getElementById(`${ID.checkboxLock}${i}`) as HTMLInputElement;
                checkboxElem.checked = flag.enabled;
                switch (flag.type) {
                    case "TimerPasswordPadlock":
                        ElementValue(`${ID.timerElement}${i}`, toInputTime(flag.time));
                        break;
                }
            }

            const parseElement = document.getElementById(ID.outfitCodeButton) as HTMLButtonElement;
            acceptElem.disabled = !this.#canSave();
            parseElement.disabled = this.character.IsPlayer() && !this.settings.outfitCache;
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

const ID = Object.freeze({
    root: FWItemSetScreen.screen,
    styles: `${FWItemSetScreen.screen}_Styles`,

    delete: `${FWItemSetScreen.screen}_Delete`,
    header: `${FWItemSetScreen.screen}_Header`,
    accept: `${FWItemSetScreen.screen}_Accept`,
    cancel: `${FWItemSetScreen.screen}_Cancel`,
    exit: `${FWItemSetScreen.screen}_Exit`,
    midDiv: `${FWItemSetScreen.screen}_MidDiv`,
    botDiv: `${FWItemSetScreen.screen}_BotDiv`,

    name: `${FWItemSetScreen.screen}_Description`,
    outfitCode: `${FWItemSetScreen.screen}_OutfitCode`,
    outfitCodeButton: `${FWItemSetScreen.screen}_OutfitCodeButton`,

    headerStrip: `${FWItemSetScreen.screen}_HeaderStrip`,
    headerEquip: `${FWItemSetScreen.screen}_HeaderEquip`,
    headerWeight: `${FWItemSetScreen.screen}_HeaderWeight`,
    headerLock: `${FWItemSetScreen.screen}_HeaderLock`,
    configStrip: `${FWItemSetScreen.screen}_ConfigStrip`,
    configEquip: `${FWItemSetScreen.screen}_ConfigEquip`,
    configWeight: `${FWItemSetScreen.screen}_ConfigWeight`,
    gridLock: `${FWItemSetScreen.screen}_GridLock`,
    containerLock: `${FWItemSetScreen.screen}_ContainerLock`,
    checkboxLock: `${FWItemSetScreen.screen}_CheckboxLock`,
    timerElement: `${FWItemSetScreen.screen}_timerElement`,
});
