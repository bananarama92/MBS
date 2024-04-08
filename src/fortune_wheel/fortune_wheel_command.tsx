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
    deleteButton: `${root}-delete-button`,
    deleteTooltip: `${root}-delete-tooltip`,
    accept: `${root}-accept`,
    acceptButton: `${root}-accept-button`,
    acceptTooltip: `${root}-accept-tooltip`,
    cancel: `${root}-cancel`,
    cancelButton: `${root}-cancel-button`,
    cancelTooltip: `${root}-cancel-tooltip`,
    exit: `${root}-exit`,
    exitButton: `${root}-exit-button`,
    exitTooltip: `${root}-exit-tooltip`,

    header: `${root}-header`,
    commandInput: `${root}-command-input`,
    weightHeader: `${root}-weight-header`,
    weightInput: `${root}-weight-input`,
});

export class FWCommandScreen extends MBSObjectScreen<FWCommand> {
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
            <div id={ID.root} class="HideOnPopup mbs-screen" screen-generated={this.screen}>
                <style id={ID.styles}>{styles.toString()}</style>

                <h1 id={ID.header}>{`Customize wheel of fortune command ${this.index}`}</h1>

                <div id={ID.delete} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.deleteButton}
                        style={{ backgroundImage: "url('./Icons/Trash.png')" }}
                        onClick={() => this.exit(false, ExitAction.DELETE)}
                        disabled={disabled}
                    />
                    <div class="mbs-button-tooltip" id={ID.deleteTooltip} style={{ justifySelf: "left" }}>
                        Delete command
                    </div>
                </div>

                <div id={ID.accept} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.acceptButton}
                        style={{ backgroundImage: "url('./Icons/Accept.png')" }}
                        onClick={() => this.exit(false, ExitAction.SAVE)}
                        disabled={true}
                    />
                    <div class="mbs-button-tooltip" id={ID.acceptTooltip} style={{ justifySelf: "right" }}>
                        Save command
                    </div>
                </div>

                <div id={ID.cancel} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.cancelButton}
                        style={{ backgroundImage: "url('./Icons/Cancel.png')" }}
                        onClick={() => this.exit(false, ExitAction.NONE)}
                    />
                    <div class="mbs-button-tooltip" id={ID.cancelTooltip} style={{ justifySelf: "right" }}>
                        Cancel
                    </div>
                </div>

                <div id={ID.exit} class="mbs-button-div">
                    <button
                        class="mbs-button"
                        id={ID.exitButton}
                        style={{ backgroundImage: "url('./Icons/Exit.png')" }}
                        onClick={() => this.exit(true, ExitAction.NONE)}
                    />
                    <div class="mbs-button-tooltip" id={ID.exitTooltip} style={{ justifySelf: "right" }}>
                        Exit
                    </div>
                </div>

                <input
                    type="text"
                    id={ID.commandInput}
                    placeholder="Role play command"
                    disabled={disabled}
                    maxLength={70}
                    onInput={(e) => {
                        this.settings.name = (e.target as HTMLInputElement).value;
                        const button = document.getElementById(ID.acceptButton) as HTMLButtonElement;
                        button.disabled = this.settings.name.length > 0;
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

    load() {
        super.load();

        // Load the settings
        if (this.mbsObject !== null) {
            this.settings.readSettings(this.mbsObject);
            ElementValue(ID.commandInput, this.mbsObject.name);
            ElementValue(ID.weightInput, this.mbsObject.weight.toString());
            const button = document.getElementById(ID.acceptButton) as HTMLButtonElement;
            button.disabled = this.character.IsPlayer();
        } else {
            this.settings.reset();
        }
    }
}
