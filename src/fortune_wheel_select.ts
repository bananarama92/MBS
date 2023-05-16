/** Selection screen for custom wheel of fortune options */

"use strict";

import { LoopIterator } from "common";
import { MBS_MAX_SETS, FWItemSet, FWCommand } from "common_bc";
import { FWCommandScreen } from "fortune_wheel_command";
import { FWItemSetScreen } from "fortune_wheel_item_set";
import { MBSScreen } from "screen_abc";

type PageStruct = {
    readonly index: 0 | 1,
    readonly screenType: typeof FWItemSetScreen | typeof FWCommandScreen,
    readonly name: string,
    readonly field: "FortuneWheelItemSets" | "FortuneWheelCommands",
}

interface WheelStruct {
    readonly FortuneWheelItemSets: (null | FWItemSet)[],
    readonly FortuneWheelCommands: (null | FWCommand)[],
}

export class FWSelectScreen extends MBSScreen {
    static readonly screen = "MBS_FWSelectScreen";
    readonly screen = FWSelectScreen.screen;
    static readonly background = "Sheet";
    readonly pageSelector: LoopIterator<PageStruct>;
    readonly wheelStruct: WheelStruct;
    readonly character: Character;
    readonly start = Object.freeze({
        X: 250,
        Y: 200,
    });
    readonly spacing = Object.freeze({
        X: 800,
        Y: 90,
    });
    get wheelList() { return this.wheelStruct[this.pageSelector.value.field]; }

    constructor(parent: MBSScreen | null, wheelStruct: WheelStruct, character: Character) {
        super(parent);
        this.pageSelector = new LoopIterator([
            Object.freeze({
                index: 0,
                screenType: FWItemSetScreen,
                name: "item sets: page 0",
                field: "FortuneWheelItemSets",
            }),
            Object.freeze({
                index: 1,
                screenType: FWCommandScreen,
                name: "commands: page 0",
                field: "FortuneWheelCommands",
            }),
        ]);
        this.wheelStruct = wheelStruct;
        this.character = character;
    }

    run(): void {
        const isPlayer = this.character.IsPlayer();
        let header = `Select custom wheel of fortune ${this.pageSelector.value.name}`;
        if (!isPlayer) {
            const name = this.character.Nickname ?? this.character.Name;
            header = `Select ${name}'s custom wheel of fortune ${this.pageSelector.value.name}`;
        }
        DrawText(header, 1000, 105, "Black");
        DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");
        DrawButton(1720, 60, 90, 90, "", "White", "Icons/Next.png", this.pageSelector.next(false).name);
        DrawButton(1610, 60, 90, 90, "", "White", "Icons/Prev.png", this.pageSelector.previous(false).name);

        const i_per_row = MBS_MAX_SETS / 2;
        for (const [i, wheelSet] of this.wheelList.entries()) {
            const y = this.start.Y + (i % i_per_row) * this.spacing.Y;
            const dx = (i_per_row > i) ? 0 : this.spacing.X;
            const checkboxDisabled = !isPlayer ? true : wheelSet === null;
            const buttonDisabled = !isPlayer && wheelSet === null;
            let name = wheelSet?.name ?? "Empty";
            if (name.length > 50) {
                name = `${name.slice(0, 50)}...`;
            }
            DrawCheckbox(this.start.X + dx, y, 64, 64, "", !(wheelSet?.hidden ?? true), checkboxDisabled);
            DrawButton(
                this.start.X + 100 + dx, y, 600, 64, `${i}: ${name}`,
                buttonDisabled ? "Gray" : "White", "", "", buttonDisabled,
            );
        }
    }

    click(): null | FWCommandScreen | FWItemSetScreen {
        if (MouseIn(1830, 60, 90, 90)) {
            this.exit();
            return null;
        } else if (MouseIn(1720, 60, 90, 90)) {
            this.pageSelector.next();
            return null;
        } else if (MouseIn(1610, 60, 90, 90)) {
            this.pageSelector.previous();
            return null;
        }

        const isPlayer = this.character.IsPlayer();
        const i_per_row = MBS_MAX_SETS / 2;
        for (const [i, wheelSet] of this.wheelList.entries()) {
            const y = this.start.Y + (i % i_per_row) * this.spacing.Y;
            const dx = (i_per_row > i) ? 0 : this.spacing.X;
            const buttonDisabled = !isPlayer && wheelSet === null;
            if (MouseIn(this.start.X + dx, y, 64, 64) && wheelSet !== null && isPlayer) {
                wheelSet.hidden = !wheelSet.hidden;
                return null;
            } else if (MouseIn(this.start.X + 100 + dx, y, 600, 64) && !buttonDisabled) {
                const subScreen = new this.pageSelector.value.screenType(this, <any>this.wheelList, i, this.character);
                this.children.set(subScreen.screen, subScreen);
                subScreen.load();
                return subScreen;
            }
        }
        return null;
    }

    exit(): void {
        this.exitScreens(false);
    }
}
