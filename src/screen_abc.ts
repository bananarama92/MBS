"use strict";

import { validateInt } from "common";

export abstract class MBSScreen {
    /** The name of the screen's background. */
    static readonly background: string = "Sheet";
    /** The name of the screen. */
    static readonly screen: string = "";
    /** The name of the screen. */
    readonly screen: string = "";
    /** The parent screen if any. Only relevant when multiple screens are opened in succesion. */
    readonly parent: null | MBSScreen;
    /** A map of all child screens */
    readonly children: Map<string, MBSScreen>;

    constructor(parent: null | MBSScreen) {
        this.parent = parent;
        this.children = new Map();
    }

    /**
     * Called each frame
     * @param time - The current time for frame
     */
    abstract run(time: number): void;

    /**
     * Called when user clicks on the canvas
     * @param event - The event that triggered this
     */
    abstract click(event: MouseEvent | TouchEvent): void;

    /** Called when user presses Esc */
    abstract exit(): void;

    /** Called when screen is loaded */
    load(): void {
        const prevScreen = CurrentScreen;
        if (ControllerActive == true) {
            ClearButtons();
        }

        CurrentScreen = this.screen;
        CurrentScreenFunctions = this.getFunctions();
        CurrentDarkFactor = 1.0;
        CommonGetFont.clearCache();
        CommonGetFontName.clearCache();

        if (prevScreen == "ChatSearch" || prevScreen == "ChatCreate") {
            ChatRoomStimulationMessage("Walk");
        }
    }

    /** Called when this screen is being replaced */
    unload?(): void;

    /**
     * Called when screen size or position changes or after screen load
     * @param load - If the reason for call was load (`true`) or window resize (`false`)
     */
    resize?(load: boolean): void;

    /**
     * Called when user presses any key
     * @param event - The event that triggered this
     */
    keyDown?(event: KeyboardEvent): void;

    /**
     * Helper function for exiting all parents.
     * @param fullExit Whether to exit all (nested) {@link MBSScreen.parent} instance or,
     * otherwise, just load the parnt if it exists
     */
    protected exitScreens(fullExit: boolean): void {
        const parents: MBSScreen[] = [];
        let parent = this.parent;
        while (parent !== null && !(parent instanceof ScreenProxy)) {
            parents.push(parent);
            parent = parent.parent;
        }

        if (fullExit) {
            // Exit all parents
            parents.forEach(p => p.exit());
        } else {
            // Switch back to the parent
            this.parent?.load();
        }
    }

    /** Get an object with all {@link ScreenFunctions} and the screen background */
    getFunctions(): ScreenFunctions {
        return {
            Run: this.run.bind(this),
            Click: this.click.bind(this),
            Load: this.load.bind(this),
            Unload: this.unload?.bind(this),
            Resize: this.resize?.bind(this),
            KeyDown: this.keyDown?.bind(this),
            Exit: this.exit.bind(this),
        };
    }
}

export class ScreenProxy extends MBSScreen {
    readonly module: string;
    readonly background: string;
    readonly screenFunctions: Readonly<Required<ScreenFunctions>>;

    constructor(
        parent: null | MBSScreen,
        module: string,
        background: string,
        screenFunctions: Readonly<Required<ScreenFunctions>>,
    ) {
        super(parent);
        this.module = module;
        this.background = background;
        this.screenFunctions = Object.freeze({ ...screenFunctions });
    }

    run(time: number) { return this.screenFunctions.Run(time); }
    click(event: MouseEvent | TouchEvent) { return this.screenFunctions.Click(event); }
    load() { return this.screenFunctions.Load(); }
    unload() { return this.screenFunctions.Unload(); }
    resize(load: boolean) { return this.screenFunctions.Resize(load); }
    keyDown(event: KeyboardEvent) { return this.screenFunctions.KeyDown(event); }
    exit() { return this.screenFunctions.Exit(); }
}

export type ExitAction = 0 | 1 | 2;

/** Various exit-related actions for {@link FWObjectScreen.exit}. */
export const ExitAction = Object.freeze({
    /** Exit without any special actions. */
    NONE: 0,
    /** Save and exit. */
    SAVE: 1,
    /** Delete and exit. */
    DELETE: 2,
});

export abstract class FWObjectScreen<
    T extends import("common_bc").FWObject<FWObjectOption>,
> extends MBSScreen {
    /** The selected settings for the screen's {@link FWObjectScreen.wheelList} */
    abstract readonly settings: import("common_bc").FWSelectedObject<T>;
    /** The selected character */
    readonly character: Character;
    /** The screen's (fixed-size) list of fortune wheel objects */
    readonly wheelList: (null | T)[];
    /** A list with interfaces for representing clickable buttons */
    abstract readonly clickList: readonly ClickAction[];
    /** The current index within {@link FWObjectScreen.wheelList} */
    #index: number = 0;

    /** Get or set the current index within {@link FWObjectScreen.wheelList} */
    get index(): number { return this.#index; }
    set index(value: number) {
        validateInt(value, "index", 0, this.wheelList.length - 1);
        this.#index = value;
    }
    /** Get current wheel object within {@link FWObjectScreen.wheelList} */
    get wheelObject() { return this.wheelList[this.#index]; }

    constructor(parent: null | MBSScreen, wheelList: (null | T)[], index: number, character: Character) {
        super(parent);
        this.character = character;
        this.wheelList = wheelList;
        this.index = index;
    }

    /** Handle clicks within the customization screen. */
    click(): void {
        const isPlayer = this.character.IsPlayer();
        for (const { coords, next, requiresPlayer } of this.clickList) {
            const canClick = isPlayer ? true : !requiresPlayer;
            if (MouseIn(...coords) && canClick) {
                next();
            }
        }
    }

    abstract unload(): void;

    /**
     * Exit the customization screen.
     * @param fullExit Whether to return to the initial wheel of fortune screen.
     * @param action Whether to do nothing, save the custom item settings or delete to them.
     */
    exit(fullExit: boolean = true, action: ExitAction = ExitAction.NONE): void {
        this.unload();
        if (!this.character.IsPlayer()) {
            return this.exitScreens(fullExit);
        }

        switch (action) {
            case ExitAction.NONE:
                break;
            case ExitAction.SAVE: {
                if (this.settings.isValid(this.index)) {
                    const hidden = this.wheelList[this.index]?.hidden ?? false;
                    this.wheelList[this.index] = this.settings.writeSettings(hidden);
                    this.wheelList[this.index]?.registerOptions();
                }
                break;
            }
            case ExitAction.DELETE: {
                const option = this.wheelList[this.index];
                this.wheelList[this.index] = null;
                option?.unregisterOptions();
                break;
            }
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
        this.exitScreens(fullExit);
    }
}
