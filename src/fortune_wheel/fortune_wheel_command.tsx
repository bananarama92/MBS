/** Configuration screen for custom wheel of fortune options */

import { clamp } from "lodash-es";

import {
    FWSelectedCommand,
    FWCommand,
} from "../common_bc";
import {
    MBSScreen,
    ScreenParams,
    MBSObjectScreen,
    ExitAction,
} from "../screen_abc";

import styles from "./fortune_wheel_command.scss";

const root = "mbs-fwcommand";
const ID = Object.freeze({
    root: root,
    styles: `${root}-style`,

    delete: `${root}-delete`,
    accept: `${root}-accept`,
    cancel: `${root}-cancel`,
    exit: `${root}-exit`,

    header: `${root}-header`,
    commandInput: `${root}-command-input`,
    weightHeader: `${root}-weight-header`,
    weightInput: `${root}-weight-input`,
});

export class FWCommandScreen extends MBSObjectScreen<FWCommand> {
    static readonly ids = ID;
    static readonly screen = "MBS_FWCommandScreen";
    static readonly background = "Sheet";
    readonly settings: FWSelectedCommand;
    static readonly screenParamsDefault = {
        [root]: Object.freeze({
            shape: [80, 60, 1840, 880] as RectTuple,
            visibility: "visible",
        }),
    };

    constructor(
        parent: null | MBSScreen,
        wheelList: (null | FWCommand)[],
        index: number,
        character: Character,
        screenParams: null | ScreenParams.Partial = null,
    ) {
        super(parent, wheelList, index, character, FWCommandScreen.screenParamsDefault, screenParams);
        this.settings = new FWSelectedCommand(wheelList);

        const disabled = !character.IsPlayer();
        document.body.appendChild(
            <div id={ID.root} class="mbs-screen">
                <style id={ID.styles}>{styles.toString()}</style>

                <h1 id={ID.header}>{`Customize wheel of fortune command ${this.index}`}</h1>

                {ElementButton.Create(ID.delete, () => this.exit(false, ExitAction.DELETE), { image: "./Icons/Trash.png", tooltip: "Delete command", tooltipPosition: "right" })}
                {ElementButton.Create(ID.accept, () => this.exit(false, ExitAction.SAVE), { image: "./Icons/Accept.png", tooltip: "Save command", tooltipPosition: "left" })}
                {ElementButton.Create(ID.cancel, () => this.exit(false, ExitAction.NONE), { image: "./Icons/Cancel.png", tooltip: "Cancel", tooltipPosition: "left" })}
                {ElementButton.Create(ID.exit, () => this.exit(true, ExitAction.NONE), { image: "./Icons/Exit.png", tooltip: "Exit", tooltipPosition: "left" })}

                <input
                    type="text"
                    id={ID.commandInput}
                    placeholder="Role play command"
                    disabled={disabled}
                    maxLength={70}
                    onInput={(e) => {
                        this.settings.name = (e.target as HTMLInputElement).value;
                        const button = document.getElementById(ID.accept) as HTMLButtonElement | null;
                        button?.toggleAttribute("disabled", this.settings.name.length === 0);
                    }}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                />

                <div id={ID.weightHeader}>Wheel option weight:</div>
                <input
                    type="number"
                    id={ID.weightInput}
                    min={1}
                    max={9}
                    value={1}
                    disabled={disabled}
                    onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        this.settings.weight = clamp(Number.parseInt(target.value, 10), 1, 9);
                    }}
                    onWheel={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.disabled) {
                            return;
                        }

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
            </div>,
        );
    }

    async load() {
        await super.load();

        // Load the settings
        if (this.mbsObject !== null) {
            this.settings.readSettings(this.mbsObject);
            ElementValue(ID.commandInput, this.mbsObject.name);
            ElementValue(ID.weightInput, this.mbsObject.weight.toString());
            const button = document.getElementById(ID.accept) as null | HTMLButtonElement;
            button?.toggleAttribute("disabled", this.character.IsPlayer());
        } else {
            this.settings.reset();
        }
    }
}
