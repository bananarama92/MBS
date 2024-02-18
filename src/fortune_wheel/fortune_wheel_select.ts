/** Selection screen for custom wheel of fortune options */

import { range, sumBy } from "lodash-es";

import { LoopIterator, logger } from "../common";
import { MBS_MAX_SETS, FWItemSet, FWCommand } from "../common_bc";
import { MBSScreen } from "../screen_abc";
import {
    parseFWObjects,
    unpackSettings,
    getStorageElement,
    MAX_DATA,
    measureDataSize,
} from "../settings";

import { FWCommandScreen } from "./fortune_wheel_command";
import { FWItemSetScreen } from "./fortune_wheel_item_set";


type PageStruct = {
    readonly index: 0 | 1 | 2 | 3,
    readonly screenType: typeof FWItemSetScreen | typeof FWCommandScreen,
    readonly name: string,
    readonly field: "FortuneWheelItemSets" | "FortuneWheelCommands",
    readonly slice: readonly [start: number, stop: number],
}

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
    wheelList.forEach(i => {if (!i?.hidden) { i?.register(false); }});
    return wheelList;
}

export class FWSelectScreen extends MBSScreen {
    static readonly screen = "MBS_FWSelectScreen";
    readonly screen = FWSelectScreen.screen;
    static readonly background = "Sheet";
    readonly pageSelector: LoopIterator<PageStruct>;
    readonly wheelStruct: WheelStruct;
    readonly character: Character;
    readonly dataSize: DataSize;

    /** A record containing element names mapped to a set of UI functions */
    readonly elements: Readonly<Record<string, UIElement>>;

    get page() {
        return this.pageSelector.value.index;
    }

    constructor(parent: MBSScreen | null, wheelStruct: WheelStruct, character: Character) {
        super(parent);
        this.pageSelector = new LoopIterator([
            Object.freeze({
                index: 0,
                screenType: FWItemSetScreen,
                name: "item sets: page 0",
                field: "FortuneWheelItemSets",
                slice: [0, 16] as const,
            }),
            Object.freeze({
                index: 1,
                screenType: FWItemSetScreen,
                name: "item sets: page 1",
                field: "FortuneWheelItemSets",
                slice: [16, 32] as const,
            }),
            Object.freeze({
                index: 2,
                screenType: FWCommandScreen,
                name: "commands: page 0",
                field: "FortuneWheelCommands",
                slice: [0, 16] as const,
            }),
            Object.freeze({
                index: 3,
                screenType: FWCommandScreen,
                name: "commands: page 1",
                field: "FortuneWheelCommands",
                slice: [16, 32] as const,
            }),
        ]);
        this.wheelStruct = wheelStruct;
        this.character = character;
        this.dataSize = Object.seal({ value: 0, valueRecord: {}, max: MAX_DATA, marigin: 0.9 });

        const isPlayer = this.character.IsPlayer();
        this.elements = Object.freeze({
            Header: {
                coords: [1000, 105, 0, 0],
                run: (x, y) => {
                    let header = `Select custom wheel of fortune ${this.pageSelector.value.name}`;
                    if (!isPlayer) {
                        const name = this.character.Nickname ?? this.character.Name;
                        header = `Select ${name}'s custom wheel of fortune ${this.pageSelector.value.name}`;
                    }
                    DrawText(header, x, y, "Black");
                },
            },
            Exit: {
                coords: [1830, 60, 90, 90],
                run: (...coords) => {
                    DrawButton(...coords, "", "White", "Icons/Exit.png", "Exit");
                },
                click: () => {
                    this.exit();
                },
            },
            Next: {
                coords: [1720, 60, 90, 90],
                run: (...coords) => {
                    DrawButton(...coords, "", "White", "Icons/Next.png", this.pageSelector.next(false).name);
                },
                click: () => {
                    this.pageSelector.next();
                },
            },
            Prev: {
                coords: [1610, 60, 90, 90],
                run: (...coords) => {
                    DrawButton(...coords, "", "White", "Icons/Prev.png", this.pageSelector.previous(false).name);
                },
                click: () => {
                    this.pageSelector.previous();
                },
            },
            ...this.#generateUIElements(),
            OnlineSharedSettings: getStorageElement.bind(this)([200, 200, 128, 7 * 90 - 26]),
        });
    }

    #generateUIElements(): Record<string, UIElement> {
        const isPlayer = this.character.IsPlayer();
        const i_per_row = 8;
        const i_per_page = i_per_row * 2;
        const wheelIndices = this.pageSelector.list.flatMap(({ field, slice }, page) => {
            const list: (null | FWItemSet | FWCommand)[] = this.wheelStruct[field].slice(...slice);
            return range(list.length).map(i => [page, field, slice[0] + i] as const);
        });

        return Object.fromEntries(wheelIndices.flatMap(([page, fieldName, i]) => {
            const x = 450 + ((i_per_row > (i % i_per_page)) ? 0 : 750);
            const y = 200 + (i % i_per_row) * 90;
            return [
                [
                    `Checkbox${fieldName}${i}}`,
                    {
                        page,
                        coords: [x, y, 64, 64],
                        run: (...coords) => {
                            const wheelSet = this.wheelStruct[fieldName][i];
                            const checkboxDisabled = !isPlayer ? true : wheelSet === null;
                            DrawCheckbox(...coords, "", !(wheelSet?.hidden ?? true), checkboxDisabled);
                        },
                        click: () => {
                            const wheelSet = this.wheelStruct[fieldName][i];
                            if (wheelSet !== null && isPlayer) {
                                wheelSet.hidden = !wheelSet.hidden;
                            }
                        },
                    },
                ],
                [
                    `Button${fieldName}${i}`,
                    {
                        page,
                        coords: [x + 100, y, 550, 64],
                        run: (...coords) => {
                            const wheelSet = this.wheelStruct[fieldName][i];
                            const buttonDisabled = !isPlayer && wheelSet === null;
                            let name = wheelSet?.name ?? "Empty";
                            if (name.length > 50) {
                                name = `${name.slice(0, 50)}...`;
                            }
                            DrawButton(
                                ...coords, `${i}: ${name}`,
                                buttonDisabled ? "Gray" : "White", "", "", buttonDisabled,
                            );
                        },
                        click: () => {
                            const wheelSet = this.wheelStruct[fieldName][i];
                            const buttonDisabled = !isPlayer && wheelSet === null;
                            if (!buttonDisabled) {
                                const subScreen: FWItemSetScreen | FWCommandScreen = new this.pageSelector.value.screenType(
                                    this,
                                    <any>this.wheelStruct[this.pageSelector.value.field],
                                    i,
                                    this.character,
                                );
                                this.children.set(subScreen.screen, subScreen);
                                subScreen.load();
                            }
                        },
                    },
                ],
            ];
        }));
    }

    load() {
        const nByte = measureDataSize(this.character.OnlineSharedSettings);
        this.dataSize.value = sumBy(Object.values(nByte), (i) => Number.isNaN(i) ? 0 : i);
        this.dataSize.valueRecord = nByte;
        super.load();
    }

    run(): void {
        Object.values(this.elements).forEach((e) => {
            if ((e.page ?? this.page) === this.page) {
                e.run(...e.coords);
            }
        });
    }

    click(event: MouseEvent | TouchEvent) {
        return Object.values(this.elements).some((e) => {
            if (e.click && (e.page ?? this.page) === this.page && MouseIn(...e.coords)) {
                e.click(event);
                return true;
            } else {
                return false;
            }
        });
    }

    exit(): void {
        this.exitScreens(false);
    }
}
