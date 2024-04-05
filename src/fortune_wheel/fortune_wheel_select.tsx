/** Selection screen for custom wheel of fortune options */

import { sumBy, clamp, range } from "lodash-es";

import { logger } from "../common";
import { MBS_MAX_SETS, FWItemSet, FWCommand } from "../common_bc";
import { MBSScreen, ScreenParams } from "../screen_abc";
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
                if (i < MBS_MAX_SETS) {
                    const params = { [FWItemSetScreen.ids.root]: { shape: screen.rootParams.shape } };
                    return screen.loadChild(FWItemSetScreen, screen.wheelStruct.FortuneWheelItemSets, i, screen.character, params);
                } else {
                    return screen.loadChild(FWCommandScreen, screen.wheelStruct.FortuneWheelCommands, i - MBS_MAX_SETS, screen.character);
                }
            }}
        />
    );
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

export class FWSelectScreen extends MBSScreen {
    static readonly ids = ID;
    static readonly screen = "MBS_FWSelectScreen";
    static readonly background = "Sheet";
    readonly wheelStruct: WheelStruct;
    readonly character: Character;
    readonly dataSize: DataSize;
    static readonly screenParamsDefault = {
        [root]: Object.freeze({
            shape: [80, 60, 1840, 880] as RectTuple,
            visibility: "visible",
        }),
    };

    get wheelList(): readonly (null | FWItemSet | FWCommand)[] {
        return [
            ...this.wheelStruct.FortuneWheelItemSets,
            ...this.wheelStruct.FortuneWheelCommands,
        ];
    }

    constructor(
        parent: MBSScreen | null,
        wheelStruct: WheelStruct,
        character: Character,
        screenParams: null | ScreenParams.Partial = null,
    ) {
        super(parent, FWSelectScreen.screenParamsDefault, screenParams);
        this.wheelStruct = wheelStruct;
        this.character = character;
        this.dataSize = Object.seal({ value: 0, valueRecord: {}, max: MAX_DATA, marigin: 0.9 });
        const isPlayer = this.character.IsPlayer();

        document.body.appendChild(
            <div id={ID.root} class="HideOnPopup mbs-screen" screen-generated={this.screen}>
                <style id={ID.styles}>{styles.toString()}</style>

                <div id={ID.buttonOuterGrid}>
                    <h1 id={ID.itemSets} z-index={1}>
                        {isPlayer ? "Fortune wheel item sets" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel item sets`}
                    </h1>
                    <div id={ID.buttonInnerGrid0}>
                        {range(0, MBS_MAX_SETS).map(i => createButton(this, i))}
                    </div>
                    <h1 id={ID.commandSets} z-index={1}>
                        {isPlayer ? "Fortune wheel commands" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel commands`}
                    </h1>
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
                    <div id={ID.storageInner}/>
                    <div id={ID.storageTooltip} class="mbs-button-tooltip">
                        <h2 id={ID.storageTooltip + "-header"}>OnlineSharedSettings Data Usage</h2>
                        <ul id={ID.storageTooltip + "-list"} />
                    </div>
                </div>
                <div id={ID.storageFooter}/>
            </div>,
        );
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

        const storageFooter = document.getElementById(ID.storageFooter) as HTMLElement;
        if (isPlayer) {
            const nKBTotal = clamp(byteToKB(this.dataSize.value), 0, 9999);
            const percentage = 100 * nKBTotal / (MAX_DATA / 1000);
            storageFooter.innerText = `${nKBTotal} / ${MAX_DATA / 1000} KB`;
            storageInner.style.height = `${100 - percentage}%`;
            storageInner.style.backgroundColor = "var(--mbs-background-color)";
            storageInner.style.borderBottom = "min(0.3vh, 0.15vw) solid var(--mbs-border-color)";
            if (percentage >= 90) {
                storageOuter.style.boxShadow = "0 0 min(2vh, 1vw) red";
            }

            const sanitizePattern = /\W/g;
            let entries = Object.entries(this.dataSize.valueRecord).map(([k, v]) => {
                const kSanitized = k.replaceAll(sanitizePattern, "");
                const nKB = Number.isNaN(v) ? "Unknown" : `${byteToKB(v)} KB`;
                return [kSanitized, nKB] as const;
            });
            if (entries.length >= 11) {
                entries = entries.slice(0, 10);
                entries.push(["...", ""]);
            }

            const storageTooltip = document.getElementById(ID.storageTooltip + "-list") as HTMLElement;
            storageTooltip.innerHTML = "";
            for (const [field, nKB] of entries) {
                storageTooltip.appendChild(
                    <li>
                        <span style={{ float: "left" }}>{field}</span>
                        <span style={{ float: "right", paddingLeft: "min(7vh, 3.5vw)" }}>{nKB}</span>
                    </li>,
                );
            }
        } else {
            const storageTooltip = document.getElementById(ID.storageTooltip) as HTMLElement;
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

    exit() {
        super.exit();
        this.exitScreens(false);
    }
}
