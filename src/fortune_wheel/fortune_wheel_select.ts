/** Selection screen for custom wheel of fortune options */

import { sumBy, clamp } from "lodash-es";

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
import styles from "./fortune_wheel_select.css";

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
        const buttonTemplate = `
            <button class="MBS_Button" id="${ID.button}{i}" style="height: min(7vh, 3.5vw);">Lorem Ipsum</button>
        `;

        const elem = ElementCreateDiv(ID.root);
        elem.style.display = "none";
        elem.innerHTML = `
            <style id="${ID.styles}">${styles}</style>
            <div id="${ID.buttonOuterGrid}">
                <div id=${ID.itemSets}>Lorem Ipsum</div>
                    <div id="${ID.buttonInnerGrid}0">
                        ${this.wheelStruct.FortuneWheelItemSets.map((_, i) => buttonTemplate.replaceAll("{i}", i.toString())).join("\n")}
                    </div>
                <div id=${ID.commandSets}>Lorem Ipsum</div>
                <div id="${ID.buttonInnerGrid}1">
                    ${this.wheelStruct.FortuneWheelCommands.map((_, i) => buttonTemplate.replaceAll("{i}", (MBS_MAX_SETS + i).toString())).join("\n")}
                </div>
            </div>
            <button class="MBS_Button" id="${ID.exit}" title="Exit" style="background-image:url('../Icons/Exit.png');"></button>
            <div id="${ID.storage}">
                <div id="${ID.storage}Inner"></div>
                <span id="${ID.storage}Tooltip">Lorem Ipsum</span>
            </div>
            <div id="${ID.storageFooter}">Lorem Ipsum</div>
        `.replaceAll("\t", "");
        this.#updateElements(true);
    }

    resize() {
        const elem = document.getElementById(ID.root);
        if (elem) {
            const fontSize = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
            ElementPositionFix(ID.root, fontSize, 80, 60, 1840, 880);
            elem.style.display = "grid";
        }
    }

    #updateElements(load=false) {
        const isPlayer = this.character.IsPlayer();
        for (const [i, wheelSet] of this.wheelList.entries()) {
            const button = document.getElementById(`${ID.button}${i}`) as HTMLInputElement;
            button.innerText = `${i % MBS_MAX_SETS}: ${wheelSet?.name ?? "Empty"}`;
            button.disabled = wheelSet === null && !isPlayer;

            if (load) {
                button.addEventListener("click", () => {
                    let subScreen: FWItemSetScreen | FWCommandScreen;
                    if (i < MBS_MAX_SETS) {
                        subScreen = new FWItemSetScreen(this, this.wheelStruct.FortuneWheelItemSets, i, this.character);
                    } else {
                        subScreen = new FWCommandScreen(this, this.wheelStruct.FortuneWheelCommands, i - MBS_MAX_SETS, this.character);
                    }
                    this.children.set(subScreen.screen, subScreen);
                    subScreen.load();
                });
            }
        }

        const storageOuter = document.getElementById(`${ID.storage}`) as HTMLElement;
        const storageInner = document.getElementById(`${ID.storage}Inner`) as HTMLElement;
        const storageTooltip = document.getElementById(`${ID.storage}Tooltip`) as HTMLElement;
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

        if (load) {
            const itemSetHeader = document.getElementById(ID.itemSets) as HTMLElement;
            itemSetHeader.innerText = isPlayer ? "Fortune wheel item sets" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel item sets`;
            const commandHeader = document.getElementById(ID.commandSets) as HTMLElement;
            commandHeader.innerText = isPlayer ? "Fortune wheel commands" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel commands`;

            const exitButton = document.getElementById(ID.exit) as HTMLElement;
            exitButton.addEventListener("click", () => this.exit());
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

const ID = Object.freeze({
    root: FWSelectScreen.screen,
    styles: `${FWSelectScreen.screen}_Styles`,

    exit: `${FWSelectScreen.screen}_Exit`,
    storage: `${FWSelectScreen.screen}_Storage`,
    storageFooter: `${FWSelectScreen.screen}_StorageFooter`,
    buttonOuterGrid: `${FWSelectScreen.screen}_ButtonOuterGrid`,

    buttonInnerGrid: `${FWSelectScreen.screen}_ButtonInnerGrid`,
    button: `${FWSelectScreen.screen}_Button`,
    itemSets: `${FWSelectScreen.screen}_ItemSets`,
    commandSets: `${FWSelectScreen.screen}_CommandSets`,
});
