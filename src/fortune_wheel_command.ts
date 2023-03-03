/** Configuration screen for custom wheel of fortune options */

"use strict";

import {
    getTextInputElement,
    FWSelectedCommand,
    FWCommand,
} from "common_bc";
import {
    MBSScreen,
    FWObjectScreen,
    ExitAction,
} from "screen_abc";

export class FWCommandScreen extends FWObjectScreen<FWCommand> {
    static readonly screen = "MBS_FWCommandScreen";
    readonly screen = FWCommandScreen.screen;
    static readonly background = "Sheet";
    readonly settings: FWSelectedCommand;
    readonly clickList: readonly ClickAction[];

    constructor(parent: null | MBSScreen, wheelList: (null | FWCommand)[], index: number, character: Character) {
        super(parent, wheelList, index, character);
        this.settings = new FWSelectedCommand(wheelList);
        this.clickList = Object.freeze([
            {
                coords: [75, 60, 90, 90],
                next: () => this.exit(false, ExitAction.DELETE),
                requiresPlayer: true,
            },
            {
                coords: [1830, 60, 90, 90],
                next: () => this.exit(true, ExitAction.NONE),
                requiresPlayer: false,
            },
            {
                coords: [1720, 60, 90, 90],
                next: () => this.exit(false, ExitAction.NONE),
                requiresPlayer: false,
            },
            {
                coords: [1610, 60, 90, 90],
                next: () => {
                    if (this.settings.isValid(this.index)) {
                        this.exit(false, ExitAction.SAVE);
                    }
                },
                requiresPlayer: true,
            },
        ]);
    }

    load(): void {
        super.load();

        const nameElement = getTextInputElement("name", this.settings, "Role play command", [900, 500, 900, 64], "", 210);
        if (!this.character.IsPlayer()) {
            nameElement.setAttribute("disabled", true);
        }

        // Load the settings
        if (this.wheelObject !== null) {
            this.settings.readSettings(this.wheelObject);
            nameElement.value = this.wheelObject.name;
        } else {
            this.settings.reset();
        }
    }

    run(): void {
        const isPlayer = this.character.IsPlayer();
        let header = "Customize wheel of fortune command";
        if (!isPlayer) {
            const name = this.character.Nickname ?? this.character.Name;
            header = `View ${name}'s wheel of fortune command customization`;
        }
        DrawText(header, 1000, 105, "Black");
        DrawButton(75, 60, 90, 90, "", isPlayer ? "White" : "Gray", "Icons/Trash.png", "Delete", !isPlayer);
        DrawButton(1830, 60, 90, 90, "", "White", "Icons/Exit.png", "Exit");
        DrawButton(1720, 60, 90, 90, "", "White", "Icons/Cancel.png", "Cancel");

        let acceptDisabled = false;
        let acceptColor = "White";
        let acceptDescription = "Accept";
        if (!isPlayer) {
            acceptDisabled = true;
            acceptColor = "Gray";
        } else if (!this.settings.isValid(this.index)) {
            acceptDisabled = true;
            acceptColor = "Gray";
            acceptDescription += (this.settings.name === null) ? ": Missing name" : ": Duplicate name";
        }
        DrawButton(1610, 60, 90, 90, "", acceptColor, "Icons/Accept.png", acceptDescription, acceptDisabled);
        ElementPosition("MBSname", 900, 500, 900, 64);
    }

    unload(): void {
        ElementRemove("MBSname");
    }
}
