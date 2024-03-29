import { sumBy } from "lodash-es";

import { validateInt } from "./common";
import { MAX_DATA, measureDataSize } from "./settings";

export abstract class MBSScreen {
    /** The name of the screen's background. */
    static readonly background: string = "Sheet";
    /** The name of the screen. */
    static readonly screen: string = "";
    /** The name of the screen. */
    readonly screen: string = "";
    /** The parent screen if any. Only relevant when multiple screens are opened in succession. */
    readonly parent: null | MBSScreen;
    /** A map of all child screens */
    readonly children: Map<string, MBSScreen>;
    /** The dimensions of the screen */
    readonly shape: RectTuple;

    constructor(parent: null | MBSScreen, shape: RectTuple) {
        this.parent = parent;
        this.children = new Map();
        this.shape = shape;
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
        CurrentScreenFunctions?.Unload?.();
        if (ControllerIsActive()) {
            ControllerClearAreas();
        }

        CurrentScreen = this.screen;
        CurrentScreenFunctions = this.getFunctions();
        CurrentDarkFactor = 1.0;
        CommonGetFont.clearCache();
        CommonGetFontName.clearCache();
        CurrentScreenFunctions?.Resize?.(true);
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
     * @returns Whether a key was pressed
     */
    keyDown?(event: KeyboardEvent): boolean;

    /**
     * Helper function for exiting all parents.
     * @param fullExit Whether to exit all (nested) {@link MBSScreen.parent} instance or,
     * otherwise, just load the parnt if it exists
     */
    protected exitScreens(fullExit: boolean): void {
        if (!fullExit) {
            // Switch back to the parent
            this.parent?.load();
            return;
        }

        let parent = this.parent;
        while (parent !== null && !(parent instanceof ScreenProxy)) {
            parent.exit();
            parent = parent.parent;
        }
        parent?.load();
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
    readonly screenFunctions: Readonly<ScreenFunctions>;

    constructor(
        parent: null | MBSScreen,
        module: string,
        background: string,
        screenFunctions: Readonly<ScreenFunctions>,
    ) {
        super(parent, [0, 0, 0, 0]);
        this.module = module;
        this.background = background;
        this.screenFunctions = Object.freeze({ ...screenFunctions });
    }

    run(time: number) { return this.screenFunctions.Run(time); }
    click(event: MouseEvent | TouchEvent) { return this.screenFunctions.Click(event); }
    load() { return this.screenFunctions.Load?.(); }
    unload() { return this.screenFunctions.Unload?.(); }
    resize(load: boolean) { return this.screenFunctions.Resize?.(load); }
    keyDown(event: KeyboardEvent) { return this.screenFunctions.KeyDown?.(event) ?? false; }
    exit() { return this.screenFunctions.Exit?.(); }
}

export type ExitAction = 0 | 1 | 2;

/** Various exit-related actions for {@link MBSObjectScreen.exit}. */
export const ExitAction = Object.freeze({
    /** Exit without any special actions. */
    NONE: 0,
    /** Save and exit. */
    SAVE: 1,
    /** Delete and exit. */
    DELETE: 2,
});

export abstract class MBSObjectScreen<
    T extends import("./common_bc").MBSObject<FWObjectOption>,
> extends MBSScreen {
    /** The selected settings for the screen's {@link MBSObjectScreen.mbsList} */
    abstract readonly settings: import("./common_bc").MBSSelectedObject<T>;
    /** The selected character */
    readonly character: Character;
    /** The screen's (fixed-size) list of fortune wheel objects */
    readonly mbsList: (null | T)[];
    /** The maximum and actually used size of {@link Character.OnlineSharedSettings} in KB */
    readonly dataSize: DataSize;
    /** The current index within {@link MBSObjectScreen.mbsList} */
    #index: number = 0;

    /** Get or set the current index within {@link MBSObjectScreen.mbsList} */
    get index(): number { return this.#index; }
    set index(value: number) {
        validateInt(value, "index", 0, this.mbsList.length - 1);
        this.#index = value;
    }
    /** Get current wheel object within {@link MBSObjectScreen.mbsList} */
    get mbsObject() { return this.mbsList[this.#index]; }

    hasStorageSpace(): boolean {
        if (this.mbsList[this.index] === null) {
            return this.dataSize.value <= (this.dataSize.max * this.dataSize.marigin);
        } else {
            return true;
        }
    }

    constructor(parent: null | MBSScreen, wheelList: (null | T)[], index: number, character: Character, shape: RectTuple) {
        super(parent, shape);
        this.character = character;
        this.mbsList = wheelList;
        this.index = index;
        this.dataSize = Object.seal({
            value: 0,
            valueRecord: {},
            max: MAX_DATA,
            marigin: 0.9,
        });
    }

    load() {
        const nByte = measureDataSize(this.character.OnlineSharedSettings);
        this.dataSize.value = sumBy(Object.values(nByte), (i) => Number.isNaN(i) ? 0 : i);
        this.dataSize.valueRecord = nByte;
        super.load();
    }

    /**
     * Exit the customization screen.
     * @param fullExit Whether to return to the initial wheel of fortune screen.
     * @param action Whether to do nothing, save the custom item settings or delete to them.
     */
    exit(fullExit: boolean = true, action: ExitAction = ExitAction.NONE): void {
        if (!this.character.IsPlayer()) {
            return this.exitScreens(fullExit);
        }

        switch (action) {
            case ExitAction.NONE:
                break;
            case ExitAction.SAVE: {
                if (this.settings.isValid(this.index) && this.hasStorageSpace()) {
                    this.mbsList[this.index] = this.settings.writeSettings();
                    this.mbsList[this.index]?.register();
                }
                break;
            }
            case ExitAction.DELETE: {
                const option = this.mbsList[this.index];
                this.mbsList[this.index] = null;
                option?.unregister();
                break;
            }
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
        this.exitScreens(fullExit);
    }
}
