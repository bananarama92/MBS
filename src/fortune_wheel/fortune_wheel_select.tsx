/** Selection screen for custom wheel of fortune options */

import { sumBy, clamp, range } from "lodash-es";

import { logger } from "../common";
import { MBS_MAX_SETS, FWItemSet, FWCommand } from "../common_bc";
import { MBSScreen } from "../screen_abc";
import {
    parseFWObjects,
    unpackSettings,
    MAX_DATA,
    measureDataSize,
    byteToKB,
} from "../settings";

import { FWCommandScreen } from "./fortune_wheel_command";
import { FWItemSetScreen } from "./fortune_wheel_item_set";
import styles from "./fortune_wheel_select.scss";

export interface WheelStruct {
    readonly FortuneWheelItemSets: (null | FWItemSet)[],
    readonly FortuneWheelCommands: (null | FWCommand)[],
}

/**
 * A {@link loadFortuneWheel} helper function for loading item- or command sets.
 * @param character
 * @param fieldName The name of the sets-field
 * @param name The name of the sets
 */
export function loadFortuneWheelObjects<T extends "FortuneWheelItemSets" | "FortuneWheelCommands">(
    character: Character,
    fieldName: T,
    name: string,
): MBSSettings[T] {
    const mbs = unpackSettings(character.OnlineSharedSettings?.MBS, "OnlineSharedSettings", false);
    let protoWheelList = (mbs === undefined) ? undefined : mbs[fieldName];
    if (!Array.isArray(protoWheelList)) {
        if (protoWheelList !== undefined) {
            logger.warn(`Failed to load "${character.AccountName}" wheel of fortune ${name}`);
        }
        protoWheelList = Array(MBS_MAX_SETS).fill(null);
    }

    let wheelList: MBSSettings[T];
    if (character.IsPlayer()) {
        wheelList = Player.MBSSettings[fieldName];
    } else {
        const constructor = fieldName === "FortuneWheelItemSets" ? FWItemSet.fromObject : FWCommand.fromObject;
        const errList: [msg: string, ...rest: unknown[]][] = [];
        wheelList = parseFWObjects(constructor as any, protoWheelList, errList) as typeof wheelList;
        errList.forEach(err => console.warn(err));
    }
    wheelList.forEach(i =>  i?.register(false));
    return wheelList;
}

function createButton(screen: FWSelectScreen, i: number) {
    return (
        <button
            class="mbs-button"
            id={ID.button + i.toString()}
            style={{ height: "min(7vh, 3.5vw)" }}
            onClick={() => {
                let subScreen: FWItemSetScreen | FWCommandScreen;
                if (i < MBS_MAX_SETS) {
                    subScreen = new FWItemSetScreen(screen, screen.wheelStruct.FortuneWheelItemSets, i, screen.character);
                } else {
                    subScreen = new FWCommandScreen(screen, screen.wheelStruct.FortuneWheelCommands, i - MBS_MAX_SETS, screen.character);
                }
                screen.children.set(subScreen.screen, subScreen);
                subScreen.load();
            }}
        >
            Lorem Ipsum
        </button>
    );
}

export class FWSelectScreen extends MBSScreen {
    static readonly screen = "MBS_FWSelectScreen";
    readonly screen = FWSelectScreen.screen;
    static readonly background = "Sheet";
    readonly wheelStruct: WheelStruct;
    readonly character: Character;
    readonly dataSize: DataSize;
    get wheelList(): readonly (null | FWItemSet | FWCommand)[] {
        return [
            ...this.wheelStruct.FortuneWheelItemSets,
            ...this.wheelStruct.FortuneWheelCommands,
        ];
    }

    constructor(parent: MBSScreen | null, wheelStruct: WheelStruct, character: Character) {
        super(parent);
        this.wheelStruct = wheelStruct;
        this.character = character;
        this.dataSize = Object.seal({ value: 0, valueRecord: {}, max: MAX_DATA, marigin: 0.9 });
        const isPlayer = this.character.IsPlayer();

        document.body.appendChild(
            <div id={ID.root} class="HideOnPopup">
                <style id={ID.styles}>{styles.toString()}</style>

                <div id={ID.buttonOuterGrid}>
                    <div id={ID.itemSets}>
                        {isPlayer ? "Fortune wheel item sets" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel item sets`}
                    </div>
                    <div id={ID.buttonInnerGrid0}>
                        {range(0, MBS_MAX_SETS).map(i => createButton(this, i))}
                    </div>
                    <div id={ID.commandSets}>
                        {isPlayer ? "Fortune wheel commands" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel commands`}
                    </div>
                    <div id={ID.buttonInnerGrid1}>
                        {range(MBS_MAX_SETS, 2 * MBS_MAX_SETS).map(i => createButton(this, i))}
                    </div>
                </div>

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

                <div id={ID.storage}>
                    <div id={ID.storageInner}></div>
                    <span id={ID.storageTooltip}>Lorem Ipsum</span>
                </div>
                <div id={ID.storageFooter}>Lorem Ipsum</div>
            </div>,
        );
    }

    resize() {
        const elem = document.getElementById(ID.root);
        if (elem) {
            const fontSize = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
            ElementPositionFix(ID.root, fontSize, 80, 60, 1840, 880);
            elem.style.display = "grid";
        }
    }

    #updateElements() {
        const isPlayer = this.character.IsPlayer();
        for (const [i, wheelSet] of this.wheelList.entries()) {
            const button = document.getElementById(`${ID.button}${i}`) as HTMLButtonElement;
            button.innerText = `${(i % MBS_MAX_SETS).toString().padStart(2)}: ${wheelSet?.name ?? "<Empty>"}`;
            button.disabled = wheelSet === null && !isPlayer;
        }

        const storageOuter = document.getElementById(ID.storage) as HTMLElement;
        const storageInner = document.getElementById(ID.storageInner) as HTMLElement;
        const storageTooltip = document.getElementById(ID.storageTooltip) as HTMLElement;
        const storageFooter = document.getElementById(ID.storageFooter) as HTMLElement;
        if (isPlayer) {
            const nKBTotal = clamp(byteToKB(this.dataSize.value), 0, 9999);
            const percentage = 100 * nKBTotal / (MAX_DATA / 1000);
            storageFooter.innerText = `${nKBTotal} / ${MAX_DATA / 1000} KB`;
            storageInner.style.height = `${100 - percentage}%`;
            storageInner.style.backgroundColor = "white";
            storageInner.style.borderBottom = "min(0.3vh, 0.15vw) solid black";
            if (percentage >= 90) {
                storageOuter.style.boxShadow = "0 0 min(2vh, 1vw) red";
            }

            const sanitizePattern = /\W/g;
            let entries = Object.entries(this.dataSize.valueRecord).map(([k, v]) => {
                const kSanitized = k.replaceAll(sanitizePattern, "");
                const nKB = Number.isNaN(v) ? "Unknown" : `${byteToKB(v)} KB`;
                return `${kSanitized} ${nKB}`;
            });
            if (entries.length >= 11) {
                entries = entries.slice(0, 10);
                entries.push("...");
            }
            storageTooltip.innerHTML = `<strong>OnlineSharedSettings Data Usage</strong><br />${entries.join("<br />")}`;
        } else {
            storageFooter.innerText = `- / ${MAX_DATA / 1000} KB`;
            storageInner.style.height = "100%";
            storageInner.style.backgroundColor = "gray";
            storageTooltip.style.display = "none";
        }
    }

    load() {
        const nByte = measureDataSize(this.character.OnlineSharedSettings);
        this.dataSize.value = sumBy(Object.values(nByte), (i) => Number.isNaN(i) ? 0 : i);
        this.dataSize.valueRecord = nByte;
        this.#updateElements();
        super.load();
    }

    run() {}

    click() {}

    unload() {
        const elem = document.getElementById(ID.root);
        if (elem) {
            elem.style.display = "none";
        }
    }

    exit(): void {
        ElementRemove(ID.root);
        this.exitScreens(false);
    }
}

const root = "mbs-fwselect";
const ID = Object.freeze({
    root,
    styles: `${root}-style`,

    exit: `${root}-exit`,
    exitButton: `${root}-exit-button`,
    exitTooltip: `${root}-exit-tooltip`,
    storage: `${root}-storage`,
    storageInner: `${root}-storage-cover`,
    storageTooltip: `${root}-storage-tooltip`,
    storageFooter: `${root}-storage-footer`,

    buttonOuterGrid: `${root}-button-grid-outer`,
    buttonInnerGrid0: `${root}-button-grid-inner0`,
    buttonInnerGrid1: `${root}-button-grid-inner1`,
    button: `${root}-button`,
    itemSets: `${root}-header0`,
    commandSets: `${root}-header1`,
});
