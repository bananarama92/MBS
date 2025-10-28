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
            shape: [60, 40, 1880, 920] as RectTuple,
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

        const screen = ElementDOMScreen.getTemplate(
            ID.root,
            {
                parent: document.body,
                header: `Customize wheel of fortune command ${this.index}`,
                menubarButtons: [
                    ElementButton.Create(
                        ID.exit,
                        () => this.exit(true, ExitAction.NONE),
                        { image: "./Icons/Exit.png", tooltip: "Exit", tooltipPosition: "left" },
                    ),
                    ElementButton.Create(
                        ID.cancel,
                        () => this.exit(false, ExitAction.NONE),
                        { image: "./Icons/Cancel.png", tooltip: "Cancel", tooltipPosition: "left" },
                    ),
                    ElementButton.Create(
                        ID.accept,
                        () => this.exit(false, ExitAction.SAVE),
                        { image: "./Icons/Accept.png", tooltip: "Save command", tooltipPosition: "left" },
                    ),
                ],
                mainContent: [
                    <fieldset name="main">
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

                        <label id={ID.weightHeader} for={ID.weightInput}>Wheel option weight:</label>
                        <input
                            type="number"
                            id={ID.weightInput}
                            min={1}
                            max={9}
                            value={1}
                            disabled={disabled}
                            onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                this.settings.weight = clamp(target.valueAsNumber, 1, 9);
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
                                this.settings.weight = clamp(target.valueAsNumber, 1, 9);
                            }}
                            onFocus={(e) => (e.target as HTMLInputElement).select()}
                        />
                    </fieldset>,
                ],
            },
        );
        screen.append(<style id={ID.styles}>{styles.toString()}</style>);
        screen.classList.add("mbs-screen");

        const hgroup = screen.querySelector(".screen-hgroup");
        const header = screen.querySelector(".screen-header");
        if (hgroup && header) {
            screen.querySelector("fieldset[name='main']")?.setAttribute("aria-labelledby", hgroup.querySelector("h1")?.id ?? "");
            header.append(
                hgroup,
                ElementButton.Create(
                    ID.delete,
                    () => this.exit(false, ExitAction.DELETE),
                    { image: "./Icons/Trash.png", tooltip: "Delete command", tooltipPosition: "right" },
                ),
            );
        }
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
