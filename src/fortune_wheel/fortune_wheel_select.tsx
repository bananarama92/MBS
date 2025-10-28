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
        errList.forEach(err => logger.warn(err));
    }
    wheelList.forEach(i =>  i?.register(false));
    return wheelList;
}

function createButton(screen: FWSelectScreen, i: number) {
    return ElementButton.Create(
        `${ID.button}${i}`,
        () => {
            if (i < MBS_MAX_SETS) {
                const params = { [FWItemSetScreen.ids.root]: { shape: screen.rootParams.shape } };
                return screen.loadChild(FWItemSetScreen, screen.wheelStruct.FortuneWheelItemSets, i, screen.character, params);
            } else {
                const params = { [FWCommandScreen.ids.root]: { shape: screen.rootParams.shape } };
                return screen.loadChild(FWCommandScreen, screen.wheelStruct.FortuneWheelCommands, i - MBS_MAX_SETS, screen.character, params);
            }
        },
        { label: " " },
    );
}

const root = "mbs-fwselect";
const ID = Object.freeze({
    root,
    styles: `${root}-style`,

    exit: `${root}-exit`,
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
            shape: [60, 40, 1880, 920] as RectTuple,
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

        const screen = ElementDOMScreen.getTemplate(
            ID.root,
            {
                parent: document.body,
                menubarButtons: [
                    ElementButton.Create(ID.exit, () => this.exit(), { image: "./Icons/Exit.png", tooltip: "Exit", tooltipPosition: "left" }),
                ],
                mainContent: [
                    <hgroup class="screen-hgroup">
                        <h1 id={ID.itemSets}>
                            {isPlayer ? "Fortune wheel item sets" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel item sets`}
                        </h1>
                    </hgroup>,
                    <div id={ID.buttonInnerGrid0} role="group">
                        {range(0, MBS_MAX_SETS).map(i => createButton(this, i))}
                    </div>,
                    <hgroup class="screen-hgroup">
                        <h1 id={ID.itemSets}>
                            {isPlayer ? "Fortune wheel commands" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel commands`}
                        </h1>
                    </hgroup>,
                    <div id={ID.buttonInnerGrid1} role="group">
                        {range(MBS_MAX_SETS, 2 * MBS_MAX_SETS).map(i => createButton(this, i))}
                    </div>,
                ],
            },
        );
        screen.append(
            <style id={ID.styles}>{styles.toString()}</style>,
            <aside>
                <div id={ID.storage} role="meter" aria-valuemin="0" aria-valuemax={MAX_DATA} aria-describedby={ID.storageTooltip} aria-labeledby={ID.storageTooltip + "-header"}>
                    <div id={ID.storageInner} role="meter" aria-hidden="true"/>
                    <div id={ID.storageTooltip} class="button-tooltip" role="tooltip">
                        <h2 id={ID.storageTooltip + "-header"}>OnlineSharedSettings Data Usage</h2>
                        <ul id={ID.storageTooltip + "-list"} />
                    </div>
                </div>
                <output id={ID.storageFooter} for={ID.storage} />
            </aside>,
        );
        screen.classList.add("mbs-screen");
    }

    #updateElements() {
        const isPlayer = this.character.IsPlayer();
        for (const [i, wheelSet] of this.wheelList.entries()) {
            const button = document.getElementById(`${ID.button}${i}`) as null | HTMLButtonElement;
            if (button) {
                button.querySelector(".button-label")?.replaceChildren(`${(i % MBS_MAX_SETS).toString().padStart(2)}: ${wheelSet?.name ?? "<Empty>"}`);
                button.disabled = wheelSet === null && !isPlayer;
            }
        }

        const storageOuter = document.getElementById(ID.storage) as HTMLElement;
        const storageInner = document.getElementById(ID.storageInner) as HTMLElement;

        const storageFooter = document.getElementById(ID.storageFooter) as HTMLElement;
        if (isPlayer) {
            storageOuter.ariaValueNow = this.dataSize.value.toString();
            const nKBTotal = clamp(byteToKB(this.dataSize.value), 0, 9999);
            const percentage = 100 * nKBTotal / (MAX_DATA / 1000);
            storageFooter.innerText = `${nKBTotal} / ${MAX_DATA / 1000} KB`;
            storageInner.style.height = `${100 - percentage}%`;
            storageInner.style.backgroundColor = "var(--mbs-background-color)";
            storageInner.style.borderBottom = "min(0.3dvh, 0.15dvw) solid var(--mbs-border-color)";
            if (percentage >= 90) {
                storageOuter.style.boxShadow = "0 0 min(2dvh, 1dvw) red";
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
                        <span style={{ float: "right", paddingLeft: "min(7dvh, 3.5dvw)" }}>{nKB}</span>
                    </li>,
                );
            }
        } else {
            storageOuter.ariaValueNow = "0";
            const storageTooltip = document.getElementById(ID.storageTooltip) as HTMLElement;
            storageFooter.innerText = `- / ${MAX_DATA / 1000} KB`;
            storageInner.style.height = "100%";
            storageInner.style.backgroundColor = "gray";
            storageTooltip.style.display = "none";
        }
    }

    async load() {
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
