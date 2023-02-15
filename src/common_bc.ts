/** Miscellaneous common BC-related functions and classes */

"use strict";

import { sortBy } from "lodash-es";

import {
    toStringTemplate,
    getRandomPassword,
    LoopIterator,
    isIterable,
    generateIDs,
    randomElement,
    BCX_MOD_API,
    validateInt,
} from "common";
import { pushMBSSettings } from "settings";
import { fromItemBundles } from "item_bundle";
import { fortuneWheelEquip, StripLevel, getStripCondition, fortuneItemsSort } from "equipper";
import { MBSSelect } from "glob_vars";

/** The maximum number of IDs within an item set category (builtin, MBS default, MBS custom) */
const ITEM_SET_CATEGORY_ID_RANGE = 256; // 2**8

/** The maximum number of IDs for ab item set. */
const ITEM_SET_ID_RANGE = 16; // 2**4

/** The maximum number of custom user-specified wheel of fortune item sets. */
export const FORTUNE_WHEEL_MAX_SETS = ITEM_SET_ID_RANGE;

/** A list of all valid wheel of fortune colors. */
export const FORTUNE_WHEEL_COLORS: readonly FortuneWheelColor[] = Object.freeze([
    "Blue",
    "Gold",
    "Gray",
    "Green",
    "Orange",
    "Purple",
    "Red",
    "Yellow",
]);

/**
 * Check whether cosplay items can be changed on the given character, including support for the BCX `alt_allow_changing_appearance` rule.
 * @param character The character in question
 * @returns whether cosplay items can be changed or not
 */
export function canChangeCosplay(character: Character): boolean {
    const cosplayBlocked = character.OnlineSharedSettings?.BlockBodyCosplay ?? true;
    if (!cosplayBlocked) {
        return true;
    }

    const ruleState = BCX_MOD_API.getRuleState("alt_allow_changing_appearance");
    if (ruleState === null || !character.IsPlayer()) {
        return false;
    }

    // Allow cosplay changes as long as the minimum role isn't set to lover or above
    return (
        ruleState.inEffect
        && ruleState.isEnforced
        && <number>ruleState.customData.minimumRole > 3
    );
}

/**
 * Filter the passed ID string, ensuring that only IDs defined in {@link WheelFortuneOption} are present.
 * Note that the relative order of substrings is not guaranteed to be preserved.
 * @param IDs A string of wheel of fortune IDs
 */
export function sanitizeWheelFortuneIDs(IDs: string): string {
    if (typeof IDs !== "string") {
        throw new TypeError(`Invalid "IDs" type: ${typeof IDs}`);
    }
    let ret = "";
    for (const option of WheelFortuneOption) {
        if (IDs.includes(option.ID)) {
            ret += option.ID;
        }
    }
    return ret;
}

/**
 * Attach and set a timer lock to the passed item for the specified duration.
 * @param item The item in question
 * @param minutes The duration of the timer lock; its value must fall in the [0, 240] interval
 */
export function equipTimerLock(item: Item, minutes: number, character: Character): void {
    validateInt(minutes, "minutes", 0, 240);

    // Equip the timer lock if desired and possible
    if (!equipLock(item, "TimerPasswordPadlock", character)) {
        return;
    }

    if (item.Property == null) item.Property = {};
    item.Property.RemoveTimer = CurrentTime + minutes * 60000;
    item.Property.RemoveItem = true;
    item.Property.LockSet = true;
    item.Property.Password = getRandomPassword(8);
}

/**
 * Attach a high security padlock to the passed item.
 * @param item The item in question
 */
export function equipHighSecLock(item: Item, character: Character): void {
    // Equip the timer lock if desired and possible
    equipLock(item, "HighSecurityPadlock", character);
    if (item.Property == null) item.Property = {};
    item.Property.MemberNumberListKeys = "";
}

/**
 * Attach a the specified padlock to the passed item.
 * Note that no lock-specific {@link Item.Property} values are set on the item.
 * @param item The item in question
 * @param lockName The to-be attached lock
 * @returns whether the lock was equipped or not
 */
export function equipLock(item: Item, lockName: AssetLockType, character: Character): boolean {
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    } else if (typeof lockName !== "string") {
        throw new TypeError(`Invalid "lockName" type: ${typeof lockName}`);
    } else if (!character?.IsPlayer() && !character?.IsSimple()) {
        throw new Error("Expected a simple or player character");
    }

    const lock = AssetGet(character.AssetFamily, "ItemMisc", lockName);
    if (lock == null) {
        throw new Error(`Invalid "lockName" value: ${lockName}`);
    }

    // Equip the lock if possible
    if (
        InventoryGetLock(item) != null
        || !InventoryDoesItemAllowLock(item)
        || InventoryBlockedOrLimited(character, { Asset: lock })
    ) {
        return false;
    }
    InventoryLock(character, item, { Asset: lock }, null, false);
    return true;
}

/** Return whether all vanilla BC online settings are loaded. */
export function settingsLoaded(): boolean {
    return (
        Player?.OnlineSettings !== undefined
        && Player?.OnlineSharedSettings !== undefined
    );
}

/** Return whether all online settings (including MBS ones) are loaded. */
export function settingsMBSLoaded(): boolean {
    return settingsLoaded() && Player.MBSSettings !== undefined;
}

/**
 * A list ordered of with the various {@link FortuneWheelOption} flavors that should be generated
 * for a single {@link FortuneWheelOption}.
 *
 * Used by {@link WheelFortuneItemSet.toOptions} for assigning itemOption-IDs, relying on the following two properties:
 * * The order of list elements is *never* changed; new entries can be appended though
 * * The list consists of <= 16 elements
 */
export const FORTUNE_WHEEL_FLAGS: readonly FortuneWheelFlags[] = Object.freeze([
    "Exclusive", "5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "High Security",
]);

/** A record mapping {@link FORTUNE_WHEEL_FLAGS} values to {@link fortuneWheelEquip} global callbacks. */
const FLAGS_CALLBACKS: Record<FortuneWheelFlags, FortuneWheelCallback> = {
    "5 Minutes": (item: Item, character: Character) => equipTimerLock(item, 5, character),
    "15 Minutes": (item: Item, character: Character) => equipTimerLock(item, 15, character),
    "1 Hour": (item: Item, character: Character) => equipTimerLock(item, 60, character),
    "4 Hours": (item: Item, character: Character) => equipTimerLock(item, 240, character),
    "Exclusive": (item: Item, character: Character) => equipLock(item, "ExclusivePadlock", character),
    "High Security": (item: Item, character: Character) => {
        if (InventoryDoesItemAllowLock(item) && item.Craft) {
            item.Craft.Property = "Puzzling";
        }
        equipHighSecLock(item, character);
    },
};

/** Indices of the default MBS wheel of fortune item sets */
const DEFAULT_ITEM_SET_INDEX: Record<string, number> = Object.freeze({
    "PSO Bondage": 0,
    "Mummification": 1,
    "Bondage Maid": 2,
    "Petrification": 3,
});

export class WheelFortuneSelectedItemSet {
    /** The name of custom option */
    name: null | string = null;
    /** The to-be equipped items */
    itemList: null | readonly FortuneWheelItem[] = null;
    /** Which flavors of {@link FortuneWheelOption} should be created */
    flags: Set<FortuneWheelFlags> = new Set();
    /** The cached base64 outfit code */
    outfitCache: null | string = null;

    /** An (infinite) iterator with all available {@link this.stripLevel} values */
    readonly stripIter: LoopIterator<StripLevel>;
    /** Get or set which items should be removed from the user */
    get stripLevel(): StripLevel { return this.stripIter.value; }
    set stripLevel(level: StripLevel) {
        const index = this.stripIter.list.indexOf(level);
        this.stripIter.setPosition(index);
    }

    /** An (infinite) iterator with all available {@link this.equipLevel} values */
    readonly equipIter: LoopIterator<StripLevel>;
    /** Which from the to-be equipped outfit should be actually equipped */
    get equipLevel(): StripLevel { return this.equipIter.value; }
    set equipLevel(level: StripLevel) {
        const index = this.equipIter.list.indexOf(level);
        this.equipIter.setPosition(index);
    }

    constructor() {
        this.stripIter = new LoopIterator([StripLevel.NONE, StripLevel.CLOTHES, StripLevel.UNDERWEAR, StripLevel.COSPLAY]);
        this.equipIter = new LoopIterator([StripLevel.NONE, StripLevel.CLOTHES, StripLevel.UNDERWEAR, StripLevel.COSPLAY]);
        this.reset();
    }

    /** Reset all currently select options to their default. */
    reset(): void {
        this.name = null;
        this.itemList = null;
        this.outfitCache = null;
        this.flags = new Set(["5 Minutes", "15 Minutes", "1 Hour", "Exclusive"]);
        this.stripLevel = StripLevel.UNDERWEAR;
        this.equipLevel = StripLevel.UNDERWEAR;
    }

    /**
     * Update this instance with settings from the provided item set.
     * @param itemSet The to-be read wheel of fortune item set
     */
    readItemSet(itemSet: WheelFortuneItemSet): void {
        if (!(itemSet instanceof WheelFortuneItemSet)) {
            throw new TypeError(`Invalid "ItemSet" type: ${typeof itemSet}`);
        }
        this.name = itemSet.name;
        this.itemList = itemSet.itemList;
        this.stripLevel = itemSet.stripLevel;
        this.equipLevel = itemSet.equipLevel;
        this.flags = new Set(itemSet.flags);
        this.outfitCache = null;
    }

    /**
     * Update this instance with settings from the provided item set.
     * @param preRunCallback /** An optional callback for {@link fortuneWheelEquip} that will executed before equipping any items from itemList
     */
    writeItemSet(
        hidden: boolean = false,
        preRunCallback: null | FortuneWheelPreRunCallback = null,
    ): WheelFortuneItemSet {
        if (this.name === null || this.itemList === null) {
            throw new Error("Cannot create an ItemSet while \"name\" or \"itemList\" is null");
        }
        return new WheelFortuneItemSet(
            this.name,
            this.itemList,
            this.stripLevel,
            this.equipLevel,
            this.flags,
            true,
            hidden,
            preRunCallback,
        );
    }

    /**
     * Convert a base64-serialized {@link Item} array into a wheel of fortune item list.
     * @returns Whether the loading was successful
     */
    loadFromBase64(): boolean {
        if (this.outfitCache === null) {
            return false;
        }

        let items: ItemBundle[];
        try {
            items = JSON.parse(<string>LZString.decompressFromBase64(this.outfitCache));
        } catch (ex) {
            console.warn("MBS: Failed to parse outfit code:", ex);
            return false;
        }
        if (!Array.isArray(items)) {
            return false;
        }

        const itemList = fromItemBundles(items);
        if (itemList.length === 0) {
            return false;
        }
        this.itemList = Object.freeze(fortuneItemsSort(itemList));
        return true;
    }

    /**
     * Return whether the {@link WheelFortuneSelectedItemSet.name} attribute is valid.
     * @param selectedIndex The index of the currently opened {@link WheelFortuneItemSet} (if any)
     */
    isValidName(selectedIndex: null | number = null): boolean {
        if (this.name === null) {
            return false;
        }
        const itemSets = MBSSelect.currentFortuneWheelSets ?? Player.MBSSettings.FortuneWheelSets;
        return itemSets.every((itemSet, i) => {
            if (i === selectedIndex) {
                return true;
            } else {
                return itemSet?.name !== this.name;
            }
        });
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.valueOf());
    }

    /** Return an object representation of this instance. */
    valueOf() {
        return {
            name: this.name,
            itemList: this.itemList,
            stripLevel: this.stripLevel,
            equipLevel: this.equipLevel,
            flags: this.flags,
            outfitCache: this.outfitCache,
        };
    }
}

/** {@link WheelFortuneItemSet} constructor argument types in tuple form */
type WheelFortuneItemSetArgTypes = [
    name: string,
    itemList: readonly FortuneWheelItem[],
    stripLevel?: StripLevel,
    equipLevel?: StripLevel,
    flags?: Iterable<FortuneWheelFlags>,
    custom?: boolean,
    hidden?: boolean,
    preRunCallback?: null | FortuneWheelPreRunCallback,
];

/** {@link WheelFortuneItemSet} constructor argument types in object form */
type WheelFortuneItemSetKwargTypes = {
    name: string,
    itemList: readonly FortuneWheelItem[],
    stripLevel?: StripLevel,
    equipLevel?: StripLevel,
    flags?: Iterable<FortuneWheelFlags>,
    custom?: boolean,
    hidden?: boolean,
    preRunCallback?: null | FortuneWheelPreRunCallback,
};

/** {@link WheelFortuneItemSet} parsed constructor argument types in object form */
type WheelFortuneItemSetKwargTypesParsed = Required<WheelFortuneItemSetKwargTypes> & { flags: Readonly<Set<FortuneWheelFlags>> };

/** A class for storing custom user-specified wheel of fortune item sets. */
export class WheelFortuneItemSet {
    /** The name of custom option */
    readonly name: string;
    /** The to-be equipped items */
    readonly itemList: readonly FortuneWheelItem[];
    /** Which items should be removed from the user */
    readonly stripLevel: StripLevel;
    /** Which from the to-be equipped outfit should be actually equipped */
    readonly equipLevel: StripLevel;
    /** Which flavors of {@link FortuneWheelOption} should be created */
    readonly flags: Readonly<Set<FortuneWheelFlags>>;
    /** Whether this concerns a custom user-created item set */
    readonly custom: boolean;
    /** An optional callback for {@link fortuneWheelEquip} that will executed before equipping any items from itemList */
    readonly preRunCallback: null | FortuneWheelPreRunCallback;
    /** The character ID of the item option's owner when or `null` for non-custom items */
    readonly ownerID: null | number;
    /** The registered options corresponding to this item set (if any) */
    #children: null | readonly FortuneWheelOption[] = null;
    /** Whether the item set is meant to be hidden */
    #hidden: boolean = true;

    /** Get the registered options corresponding to this item set (if any) */
    get children(): null | readonly FortuneWheelOption[] {  return this.#children; }

    /** Get or set whether the item set is meant to be hidden */
    get hidden(): boolean {  return this.#hidden; }
    set hidden(value: boolean) {
        if (value === true) {
            this.unregisterOptions();
        } else if (value === false) {
            this.registerOptions();
        } else {
            throw new TypeError(`Invalid "${this.name}.hidden" type: ${typeof value}`);
        }
    }

    /** Get the index of this instance within the player's fortune wheel sets and -1 if it's absent. */
    get index(): number {
        const itemSets = MBSSelect.currentFortuneWheelSets ?? Player.MBSSettings.FortuneWheelSets;
        return itemSets.findIndex(i => i === this);
    }

    /** Initialize the instance */
    constructor(
        name: string,
        itemList: readonly FortuneWheelItem[],
        stripLevel?: StripLevel,
        equipLevel?: StripLevel,
        flags?: Iterable<FortuneWheelFlags>,
        custom?: boolean,
        hidden?: boolean,
        preRunCallback?: null | FortuneWheelPreRunCallback,
    ) {
        const kwargs = WheelFortuneItemSet.validate({
            name: name,
            itemList: itemList,
            stripLevel: stripLevel,
            equipLevel: equipLevel,
            flags: flags,
            custom: custom,
            hidden: hidden,
            preRunCallback: preRunCallback,
        });
        this.name = kwargs.name;
        this.itemList = kwargs.itemList;
        this.stripLevel = kwargs.stripLevel;
        this.equipLevel = kwargs.equipLevel;
        this.flags = kwargs.flags;
        this.custom = kwargs.custom;
        this.#hidden = kwargs.hidden;
        this.preRunCallback = kwargs.preRunCallback;
        this.ownerID = (kwargs.custom) ? WheelFortuneCharacter?.MemberNumber ?? <number>Player.MemberNumber : null;
    }

    /** Validation function for the classes' constructor */
    static validate(kwargs: Partial<WheelFortuneItemSetKwargTypes>): WheelFortuneItemSetKwargTypesParsed {
        if (typeof kwargs.name !== "string") {
            throw new TypeError(`Invalid "name" type: ${typeof kwargs.name}`);
        }

        if (Array.isArray(kwargs.itemList)) {
            kwargs.itemList = Object.freeze([...kwargs.itemList]);
        } else {
            throw new TypeError(`Invalid "itemList" type: ${typeof kwargs.itemList}`);
        }

        if (!Object.values(StripLevel).includes(<StripLevel>kwargs.stripLevel)) {
            kwargs.stripLevel = StripLevel.UNDERWEAR;
        }

        if (!Object.values(StripLevel).includes(<StripLevel>kwargs.equipLevel)) {
            kwargs.stripLevel = StripLevel.UNDERWEAR;
        }

        if (isIterable(kwargs.flags)) {
            const flags: Set<FortuneWheelFlags> = new Set();
            for (const flag of kwargs.flags) {
                if (FORTUNE_WHEEL_FLAGS.includes(flag)) {
                    flags.add(flag);
                }
            }
            kwargs.flags = Object.freeze(flags);
        } else {
            kwargs.flags = Object.freeze(new Set(<FortuneWheelFlags[]>["5 Minutes", "15 Minutes", "1 Hour", "Exclusive"]));
        }

        if (typeof kwargs.custom !== "boolean") {
            kwargs.custom = true;
        }

        if (typeof kwargs.hidden !== "boolean") {
            kwargs.hidden = true;
        }

        if (kwargs.preRunCallback !== null && typeof kwargs.preRunCallback !== "function") {
            kwargs.preRunCallback = null;
        }
        return <WheelFortuneItemSetKwargTypesParsed>kwargs;
    }

    /**
     * Construct a new {@link WheelFortuneItemSet} instance from the passed object
     * @param kwargs The to-be parsed object
     */
    static fromObject(kwargs: WheelFortuneItemSetKwargTypes): WheelFortuneItemSet {
        const argNames: (keyof typeof kwargs)[] = ["name", "itemList", "stripLevel", "equipLevel", "flags", "custom", "hidden", "preRunCallback"];
        const args = <WheelFortuneItemSetArgTypes>argNames.map(name => kwargs[name]);
        return new WheelFortuneItemSet(...args);
    }

    /**
     * Factory method for generating {@link FortuneWheelOption.Script} callbacks.
     * @param globalCallbacks A callback (or `null`) that will be applied to all items after they're equipped
     * @returns A valid {@link FortuneWheelOption.Script} callback
     */
    scriptFactory(globalCallback: null | FortuneWheelCallback = null): (character?: null | Character) => void {
        const assets = this.itemList.map(({Name, Group}) => AssetGet(Player.AssetFamily, Group, Name));

        return (character) => {
            character = character ?? Player;
            const condition = getStripCondition(this.equipLevel, character);
            const items = this.itemList.filter((_, i) => {
                const asset = assets[i];
                if (asset == null) {
                    return false;
                } else if (asset.Group.Category !== "Appearance") {
                    return true;
                } else {
                    return condition(asset);
                }
            });

            fortuneWheelEquip(
                this.name, items, this.stripLevel, globalCallback,
                this.preRunCallback, character ?? Player,
            );
        };
    }

    /**
     * Convert this instance into a list of {@link FortuneWheelOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FortuneWheelOption.ID} values
     * @returns A list of wheel of fortune options
     */
    toOptions(colors: readonly FortuneWheelColor[] = FORTUNE_WHEEL_COLORS): FortuneWheelOption[] {
        const flags = sortBy(
            Array.from(this.flags),
            (flag) => FORTUNE_WHEEL_FLAGS.indexOf(flag),
        );
        const flagsNumeric = flags.map(i => FORTUNE_WHEEL_FLAGS.indexOf(i));

        /**
         * * Reserve the `[0, 2**8)` range (extened ASCII) for BC's default
         * * Reserve the `[2**8, 2**9)` range for MBS's builtin options
         * * "Reserve" the `[2**9, 2**16)` range for MBS's custom options
         */
        let start: number;
        if (!this.custom) {
            start = ITEM_SET_CATEGORY_ID_RANGE + DEFAULT_ITEM_SET_INDEX[this.name] * ITEM_SET_ID_RANGE;
            if (Number.isNaN(start)) {
                throw new Error(`Unknown default item set "${this.name}"`);
            }
        } else {
            start = 2 * ITEM_SET_CATEGORY_ID_RANGE + this.index * ITEM_SET_ID_RANGE;
            if (start < 0) {
                throw new Error(`Item set "${this.name}" absent from currently selected fortune wheel sets`);
            }
        }

        const IDs = generateIDs(start, flagsNumeric);
        return flags.map((flag, i) => {
            return {
                ID: IDs[i],
                Color: randomElement(colors),
                Script: this.scriptFactory(FLAGS_CALLBACKS[flag]),
                Description: this.name + (flag === "Exclusive" ? "" : `: ${flag}`),
                Default: !["4 Hours", "High Security"].includes(flag),
                Custom: this.custom,
                Parent: this,
                OwnerID: this.ownerID,
                Flag: flag,
            };
        });
    }

    /** Find the insertion position within `WheelFortuneOption`. */
    #registerFindStart(): number {
        if (!this.#children?.length) {
            return WheelFortuneOption.length;
        } else {
            const initialID = this.#children[0].ID;
            const start = WheelFortuneOption.findIndex(i => i.ID >= initialID);
            return start === -1 ? WheelFortuneOption.length : start;
        }
    }

    /**
     * Convert this instance into a list of {@link FortuneWheelOption} and
     * register {@link WheelFortuneOption} and (optionally) {@link WheelFortuneDefault}.
     * @param push Wether the new MBS settings should be pushed to the server
     */
    registerOptions(push: boolean = true): void {
        this.#hidden = false;
        this.#children = this.toOptions();
        let start = this.#registerFindStart();
        for (const o of this.#children) {
            // Check whether the option is already registered
            const i = WheelFortuneOption.findIndex(prevOption => prevOption.ID === o.ID);

            // Either replace or add a new option
            if (i !== -1) {
                WheelFortuneOption[i] = o;
                if (o.Default && !WheelFortuneDefault.includes(o.ID)) {
                    WheelFortuneDefault += o.ID;
                }
            } else {
                WheelFortuneOption.splice(start, 0, o);
                if (o.Default) {
                    WheelFortuneDefault += o.ID;
                }
            }
            start += 1;
        }
        if (push) {
            pushMBSSettings();
        }
    }

    /**
     * Unregister this instance from {@link WheelFortuneOption} and {@link WheelFortuneDefault}.
     * @param push Wether the new MBS settings should be pushed to the server
     */
    unregisterOptions(push: boolean = true): void {
        this.#hidden = true;
        const IDs = this.children?.map(c => c.ID) ?? [];
        this.#children = null;
        WheelFortuneOption = WheelFortuneOption.filter(i => !IDs.includes(i.ID));
        WheelFortuneDefault = Array.from(WheelFortuneDefault).filter(i => !IDs.includes(i)).join("");

        if (push) {
            pushMBSSettings();
        }
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.valueOf());
    }

    /** Return a (JSON safe-ish) object representation of this instance. */
    valueOf() {
        return {
            name: this.name,
            itemList: this.itemList,
            stripLevel: this.stripLevel,
            equipLevel: this.equipLevel,
            flags: Array.from(this.flags),
            custom: this.custom,
            hidden: this.hidden,
            preRunCallback: this.preRunCallback,
        };
    }
}

/**
 * Construct and return text-based HTML input element
 * @param name The name of the input element (which will be prefixed with `"MBS"`)
 * @param record The record for storing the event listener output
 * @param placeholder The placeholder of the input element
 * @param coords The X and Y coordinates, width and height of the input element
 * @param value The initial value to be assigned to the input element
 * @param maxLength The maximum string length
 */
export function getTextInputElement<T extends string>(
    name: T,
    record: Record<T, string | null>,
    placeholder: string,
    coords: readonly [X: number, Y: number, W: number, H?: number],
    value: string = "",
    maxLength?: number,
): HTMLInputElement {
    let element = ElementCreateInput(`MBS${name}`, "text", value, maxLength);
    if (element) {
        element.setAttribute("placeholder", placeholder);
        element.addEventListener("input", CommonLimitFunction((e) => {
            // @ts-ignore
            const text: null | string = e.target?.value || null;
            if (maxLength == null) {
                maxLength = Infinity;
            }
            if (text === null || text.length <= maxLength) {
                record[name] = text;
            }
        }));
    } else {
        element = <HTMLInputElement>document.getElementById(`MBS${name}`);
    }
    ElementPosition(`MBS${name}`, ...coords);
    return element;
}


/**
 * Sets the current screen and calls the loading script if needed.
 * Version of {@link CommonSetScreen} without text cache loading or {@link CurrentModule} setting.
 * @param NewScreen Screen to display
 */
export function setScreenNoText(NewScreen: string): void {
    const prevScreen = CurrentScreen;

    if (CurrentScreenFunctions && CurrentScreenFunctions.Unload) {
        CurrentScreenFunctions.Unload();
    }
    if (ControllerActive == true) {
        ClearButtons();
    }

    const w = <typeof window & Record<string, any>>window;
    // Check for required functions
    if (typeof w[`${NewScreen}Run`] !== "function") {
        throw new Error(`Screen "${NewScreen}": Missing required Run function`);
    }
    if (typeof w[`${NewScreen}Click`] !== "function") {
        throw new Error(`Screen "${NewScreen}": Missing required Click function`);
    }

    CurrentScreen = NewScreen;
    CurrentScreenFunctions = {
        Run: w[`${NewScreen}Run`],
        Click: w[`${NewScreen}Click`],
        Load: typeof w[`${NewScreen}Load`] === "function" ? w[`${NewScreen}Load`] : undefined,
        Unload: typeof w[`${NewScreen}Unload`] === "function" ? w[`${NewScreen}Unload`] : undefined,
        Resize: typeof w[`${NewScreen}Resize`] === "function" ? w[`${NewScreen}Resize`] : undefined,
        KeyDown: typeof w[`${NewScreen}KeyDown`] === "function" ? w[`${NewScreen}KeyDown`] : undefined,
        Exit: typeof w[`${NewScreen}Exit`] === "function" ? w[`${NewScreen}Exit`] : undefined,
    };

    CurrentDarkFactor = 1.0;
    CommonGetFont.clearCache();
    CommonGetFontName.clearCache();

    if (CurrentScreenFunctions.Load) {
        CurrentScreenFunctions.Load();
    }
    if (CurrentScreenFunctions.Resize) {
        CurrentScreenFunctions.Resize(true);
    }

    if (prevScreen == "ChatSearch" || prevScreen == "ChatCreate") {
        ChatRoomStimulationMessage("Walk");
    }
}
