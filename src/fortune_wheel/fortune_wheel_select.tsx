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
    asideLeft: `${root}-aside-left`,
    asideRight: `${root}-aside-right`,

    main: `${root}-main`,
    mainHeader1: `${root}-main-header1`,
    mainHeader2: `${root}-main-header2`,

    button: `${root}-button`,
    storageTooltip: `${root}-storage-tooltip`,
    storageTooltipHeading: `${root}-storage-tooltip-heading`,
    storageMeter: `${root}-storage-meter`,
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

        const isPlayer = this.character.IsPlayer();
        this.dataSize = Object.seal({
            _value: 0,
            get value() {
                return this._value;
            },
            set value(value) {
                this._value = value;
                if (!isPlayer) {
                    return;
                }

                const output: null | HTMLOutputElement = document.querySelector(`#${ID.asideLeft} > output`);
                if (output) {
                    output.value = `${clamp(byteToKB(value), 0, 9999)} / ${this.max / 1000} KB`;
                }

                const meter: null | HTMLElement = document.querySelector(`#${ID.asideLeft} > [role='meter']`);
                const meterInner: null | undefined | HTMLElement = meter?.querySelector("[aria-hidden='true']");
                if (meter && meterInner) {
                    const percentage = 100 * (value / this.max);
                    meter.ariaValueNow = value.toString();
                    meterInner.style.height = `${100 - percentage}%`;
                    if (percentage >= 90) {
                        meterInner.style.boxShadow = "0 0 min(2dvh, 1dvw) red";
                    }
                }
            },

            _valueRecord: {} as Readonly<Record<string, number>>,
            get valueRecord() {
                return this._valueRecord;
            },
            set valueRecord(value) {
                this._valueRecord = value;

                const tooltip: null | HTMLElement = document.querySelector(`#${ID.asideLeft} > [role='tooltip']`);
                const tooltipList = tooltip?.querySelector("ul");
                if (!tooltip || !tooltipList) {
                    return;
                }

                const sanitizePattern = /\W/g;
                let entries = Object.entries(value).map(([k, v]) => {
                    const kSanitized = k.replaceAll(sanitizePattern, "");
                    const nKB = Number.isNaN(v) ? "Unknown" : `${byteToKB(v)} KB`;
                    return [kSanitized, nKB] as const;
                });
                if (entries.length >= 11) {
                    entries = entries.slice(0, 10);
                    entries.push(["...", ""]);
                }

                tooltipList.replaceChildren(...entries.map(([field, nKB]) => {
                    return <li>
                        <span style={{ float: "left" }}>{field}</span>
                        <span style={{ float: "right", paddingLeft: "min(7dvh, 3.5dvw)" }}>{nKB}</span>
                    </li>;
                }));
                tooltip.toggleAttribute("hidden", false);
            },
            max: MAX_DATA,
            marigin: 0.9,
        });

        document.body.appendChild(
            <div id={ID.root} class="mbs-screen">
                <style id={ID.styles}>{styles.toString()}</style>

                <aside id={ID.asideLeft}>
                    <div
                        id={ID.storageMeter}
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={MAX_DATA}
                        aria-describedby={ID.storageTooltip}
                        aria-labelledby={ID.storageTooltipHeading}
                    >
                        <div aria-hidden="true" />
                    </div>
                    <div id={ID.storageTooltip} class="mbs-button-tooltip" role="tooltip" hidden>
                        <h2 id={ID.storageTooltipHeading}>OnlineSharedSettings Data Usage</h2>
                        <ul />
                    </div>
                    <output for={ID.storageMeter} value={`- / ${MAX_DATA / 1000} KB`} />
                </aside>

                <main id={ID.main} class="scroll-box">
                    <section aria-labelledby={ID.mainHeader1}>
                        <h1 id={ID.mainHeader1}>{isPlayer ? "Fortune wheel item sets" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel item sets`}</h1>
                        <menu>{range(0, MBS_MAX_SETS).map(i => <li>{createButton(this, i)}</li>)}</menu>
                    </section>
                    <section aria-labelledby={ID.mainHeader2}>
                        <h1 id={ID.mainHeader2}>{isPlayer ? "Fortune wheel commands" : `${this.character.Nickname ?? this.character.Name}'s fortune wheel commands`}</h1>
                        <menu>{range(MBS_MAX_SETS, 2 * MBS_MAX_SETS).map(i => <li>{createButton(this, i)}</li>)}</menu>
                    </section>
                </main>

                <aside id={ID.asideRight}>
                    {ElementMenu.Create(
                        null,
                        [ElementButton.Create(null, () => this.exit(), { tooltip: "Exit", tooltipPosition: "left", image: "./Icons/Exit.png" })],
                        { direction: "rtl" },
                    )}
                </aside>
            </div>,
        );
    }

    #updateElements() {
        const isPlayer = this.character.IsPlayer();
        for (const [i, wheelSet] of this.wheelList.entries()) {
            const button = document.getElementById(`${ID.button}${i}`) as HTMLButtonElement;
            button.querySelector(".button-label")?.replaceChildren(`${(i % MBS_MAX_SETS).toString().padStart(2)}: ${wheelSet?.name ?? "<Empty>"}`);
            button.disabled = wheelSet === null && !isPlayer;
        }
    }

    load() {
        const nByte = measureDataSize(this.character.OnlineSharedSettings);
        this.dataSize.valueRecord = nByte;
        this.dataSize.value = sumBy(Object.values(nByte), (i) => Number.isNaN(i) ? 0 : i);
        this.#updateElements();
        super.load();
    }

    exit() {
        super.exit();
        this.exitScreens(false);
    }
}
