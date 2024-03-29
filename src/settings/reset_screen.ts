import { MBSScreen } from "../screen_abc";
import { clearMBSSettings } from "./settings";

// Partially adapted from LSCG
//
// LSCG, Copyright 2023 Little Sera, GPLv3
// https://github.com/littlesera/LSCG

export class ResetScreen extends MBSScreen {
    static readonly background = "Sheet";
    static readonly screen = "MBS_ResetScreen";
    readonly screen = ResetScreen.screen;
    readonly buttons: readonly ButtonAction[];
    readonly #timerStart: number;

    get time(): number {
        return CurrentTime - this.#timerStart;
    }

    constructor(parent: null | MBSScreen) {
        super(parent, [0, 0, 0, 0]);
        this.#timerStart = CurrentTime;
        this.buttons = [
            {
                name: "Confirm",
                coords: [300, 720, 200, 80],
                draw: (...coords) => {
                    if (this.time < 10_000) {
                        DrawButton(...coords, `Confirm (${10 - Math.floor(this.time / 1000)})`, "#ddd", undefined, undefined, true);
                    } else {
                        DrawButton(...coords, "Confirm", "White");
                    }
                },
                click: () => {
                    if (this.time < 10_000) {
                        return false;
                    } else {
                        clearMBSSettings();
                        this.exit();
                        return true;
                    }
                },
            },
            {
                name: "Exit",
                coords: [1520, 720, 200, 80],
                draw: (...coords) => DrawButton(...coords, "Cancel", "White"),
                click: () => {
                    this.exit();
                    return true;
                },
            },
        ];
    }

    run() {
        DrawText("- Permanent reset of ALL MBS data (settings, wheel outfits, extra crafting items, etc) -", 1000, 125, "Black");
        DrawText("- Warning -", 1000, 225, "Black", "Black");
        DrawText("If you confirm, all MBS data (including settings, overrides, and current states) will be permanently reset!", 1000, 325, "Black");
        DrawText("You will be able to continue using MBS, but all of your configuration will be reset to default!", 1000, 550, "Gray");
        DrawText("This action cannot be undone!", 1000, 625, "Red", "Black");
        this.buttons.forEach(({ coords, draw }) => draw(...coords));
    }

    click(event: MouseEvent | TouchEvent) {
        this.buttons.some(({ coords, click }) => MouseIn(...coords) ? click(event) : false);
    }

    exit() {
        this.exitScreens(false);
    }
}
