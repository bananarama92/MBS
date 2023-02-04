/** Miscellaneous common functions and classes */

"use strict";

import bcModSdk from "bondage-club-mod-sdk";
import { pushMBSSettings } from "settings";
import { fromItemBundle } from "item_bundle";
import { fortuneWheelEquip, StripLevel, getStripCondition, fortuneItemsSort } from "equipper";
import { MBSSelect } from "glob_vars";

/** The maximum number of custom user-specified wheel of fortune item sets. */
export const FORTUNE_WHEEL_MAX_SETS = 14;

/** An array with all alpha-numerical characters. */
const ALPHABET = Object.freeze([
    "A", "B", "C", "D",
    "E", "F", "G", "H",
    "I", "J", "K", "L",
    "M", "N", "O", "P",
    "Q", "R", "S", "T",
    "U", "V", "W", "X",
    "Y", "Z",
]);

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

/** Regular expression for the MBS version */
const MBS_VERSION_PATTERN = /^(v?)([0-9]+)\.([0-9]+)\.([0-9]+)(\.dev0)?$/;

/**
 * Check whether an integer falls within the specified range and raise otherwise.
 * @param int The to-be validate integer
 * @param varName The name of the variable
 * @param min The minimum allowed value of the integer
 * @param max The maximum allowed value of the integer
 */
function validateInt(int: number, varName: string, min: number = -Infinity, max: number = Infinity): void {
    if (!(Number.isInteger(int) && int >= min && int <= max)) {
        if (typeof int !== "number") {
            throw new TypeError(`Invalid "${varName}" type: ${typeof int}`);
        } else if (!Number.isInteger(int)) {
            throw new Error(`"${varName}" must be an integer: ${int}`);
        } else {
            throw new RangeError(`"${varName}" must fall in the [${min}, ${max}] interval: ${int}`);
        }
    }
}

/**
 * Attach and set a timer lock to the passed item for the specified duration.
 * @param item The item in question
 * @param minutes The duration of the timer lock; its value must fall in the [0, 240] interval
 */
export function equipTimerLock(item: Item, minutes: number, character: Character): void {
    if (typeof minutes !== "number") {
        throw new TypeError(`Invalid "minutes" type: ${typeof minutes}`);
    } else if (minutes < 0 || minutes > 240) {
        throw new RangeError(`"minutes" must fall in the [0, 240] interval: ${minutes}`);
    }

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
    } else if (!character.IsPlayer() || character.IsSimple()) {
        throw new Error("Expected a simple or player character");
    }

    // Equip the timer lock if desired and possible
    const lock = AssetGet(character.AssetFamily, "ItemMisc", lockName);
    if (
        lock == null
        || InventoryGetLock(item) != null
        || !InventoryDoesItemAllowLock(item)
        || InventoryBlockedOrLimited(character, { Asset: lock })
    ) {
        return false;
    }
    InventoryLock(character, item, { Asset: lock }, null, false);
    return true;
}

/**
 * Return an object that produces a generator of integers from start (inclusive) to stop (exclusive) by step.
 * @param start - The starting value
 * @param stop - The maximum value
 * @param step - The step size
 */
export function* range(start: number, stop: number, step: number = 1): Generator<number, void, unknown> {
    if (typeof start !== "number") {
        throw new TypeError(`Invalid "start" type: ${typeof start}`);
    } else if (typeof stop !== "number") {
        throw new TypeError(`Invalid "stop" type: ${typeof stop}`);
    } else if (typeof step !== "number") {
        throw new TypeError(`Invalid "step" type: ${typeof step}`);
    }

    let i = start;
    while (i < stop) {
        yield i;
        i += step;
    }
}

/**
 * Return a random element from the passed list.
 * @param list The list in question
 * @returns The random element from the passed list
 */
export function randomElement<T>(list: readonly T[]): T {
    if (!Array.isArray(list)) {
        throw new TypeError(`Invalid "list" type: ${typeof list}`);
    } else if (list.length === 0) {
        throw new Error('Passed "list" must contain at least 1 item');
    }
    return list[Math.round(Math.random() * (list.length - 1))];
}

/**
 * Generate a password consisting of `n` random latin characters.
 * @param n The length of the password; must be in the [0, 8] interval
 * @returns the newly generated password
 */
export function getRandomPassword(n: number): string {
    if (n < 0 || n > 8) {
        throw new RangeError(`"n" must fall in the [0, 8] interval: ${n}`);
    }

    let ret = "";
    for (const _ of range(0, n)) {
        ret += randomElement(ALPHABET);
    }
    return ret;
}

/**
 * Convert the passed BC version into a 2-tuple with the major- and beta-version
 * @param version The to-be parsed version
 * @returns A 2-tuple with the major- and beta version
 */
export function parseVersion(version: string): [number, number] {
    const match = GameVersionFormat.exec(version);
    if (match === null) {
        throw new Error(`Failed to match the passed version: ${version}`);
    }
    return [
        Number(match[2]),
        Number((match[3] === undefined) ? Infinity : match[4]),
    ];
}

/**
 * Wait for the passed predicate to evaluate to `true`.
 * @param predicate A predicate
 * @param timeout The timeout in miliseconds for when the predicate fails
 */
export async function waitFor(predicate: () => boolean, timeout: number = 10): Promise<boolean> {
    while (!predicate()) {
        await new Promise((resolve) => setTimeout(resolve, timeout));
    }
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

/** The MBS version. */
export const MBS_VERSION = "0.3.2";

/** The MBS {@link ModSDKGlobalAPI} instance. */
export const MBS_MOD_API = bcModSdk.registerMod({
    name: "MBS",
    fullName: "Maid's Bondage Scripts",
    repository: "https://github.com/bananarama92/MBS",
    version: MBS_VERSION,
});

/** A proxy for lazily accessing the BCX mod API. */
class ModAPIProxy implements BCX_ModAPI {
    /** The lazily loaded BCX mod API */
    #api: null | BCX_ModAPI = null;

    /** Name of the mod this API was requested for */
    get modName(): string { return "MBS"; }

    /** Returns state handler for a rule or `null` for unknown rule */
    getRuleState<T extends BCX_Rule>(rule: T): BCX_RuleStateAPI<T> | null {
        if (this.#api === null && bcx !== undefined) {
            this.#api = bcx.getModApi("MBS");
        }
        return this.#api?.getRuleState(rule) ?? null;
    }
}

/** A lazily-loaded version of the BCX mod API */
export const BCX_MOD_API = new ModAPIProxy();

/** Helper function for creating {@link Object.prototype.toString} methods. */
export function toStringTemplate(typeName: string, obj: object): string {
    let ret = `${typeName}(`;
    ret += Object.values(obj).join(", ");
    ret += ")";
    return ret;
}

export class LoopIterator<T> {
    readonly #list: readonly T[];
    #index: number;

    get index() { return this.#index; }
    get value() { return this.#list[this.#index]; }
    get list() { return this.#list; }

    /**
     * Initialize the instance
     * @param list The to-be iterated array
     * @param start The starting position within the array
     */
    constructor(list: readonly T[], index: number = 0) {
        if (!Array.isArray(list)) {
            throw new TypeError(`Invalid "list" type: ${typeof list}`);
        } else if (list.length === 0) {
            throw new Error('Passed "list" must contain at least one element');
        } else {
            validateInt(index, "index", 0, list.length - 1);
        }
        this.#list = list;
        this.#index = index;
    }

    *[Symbol.iterator]() {
        while (true) {
            yield this.next();
        }
    }

    /** Return the next element from the iterator and increment. */
    next(incrementPosition: boolean = true): T {
        const index = (this.#index + this.#list.length - 1) % this.#list.length;
        if (incrementPosition) {
            this.#index = index;
        }
        return this.#list[index];
    }

    /** Return the previous element from the iterator and decrement. */
    previous(decrementPosition: boolean = true): T {
        const index = (this.#index + 1) % this.#list.length;
        if (decrementPosition) {
            this.#index = index;
        }
        return this.#list[index];
    }

    /** Set the position of the iterator. */
    setPosition(index: number) {
        validateInt(index, "index", 0, this.#list.length - 1);
        this.#index = index;
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.valueOf());
    }

    /** Return an object representation of this instance. */
    valueOf() {
        return {
            list: this.list,
            index: this.index,
        };
    }
}

/**
 * Generate a list of unique length-1 UTF16 characters.
 * @param n - The number of characters that should be returned
 * @param start - The starting value of the to-be explored unicode character codes
 * @param exclude - Characters that should not be contained in the to-be returned list
 * @returns A list of unique UTF16 characters
 */
export function generateIDs(n: number, start: number = 0, exclude: null | readonly string[] = null): string[] {
    validateInt(n, "n", 0);
    if (exclude == null) {
        exclude = [];
    } else if (!Array.isArray(exclude)) {
        throw new TypeError(`Invalid "exclude" type: ${typeof exclude}`);
    }

    const ret: string[] = [];
    for (const i of range(start, 2**16)) {
        const utf16 = String.fromCharCode(i);
        if (n <= 0) {
            break;
        } else if (!exclude.includes(utf16)) {
            ret.push(utf16);
            n -= 1;
        }
    }

    if (n > 0) {
        throw new Error("Insufficient available UTF16 characters");
    }
    return ret;
}

/**
 * A list of with the various {@link FortuneWheelOption} flavors that should be generated
 * for a single {@link FortuneWheelOption}.
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

        const [itemList] = fromItemBundle(items);
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

/** Check whether the passed object as an iterable. */
function isIterable(obj: unknown): obj is Iterable<any> {
    return (Symbol.iterator in Object(obj));
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
    scriptFactory(globalCallback: null | FortuneWheelCallback = null): () => void {
        const condition = getStripCondition(this.equipLevel, Player);
        const items = this.itemList.filter(({Name, Group}) => {
            const asset = AssetGet(Player.AssetFamily, Group, Name);
            if (asset == null) {
                return false;
            } else if (asset.Group.Category !== "Appearance") {
                return true;
            } else {
                return condition(asset);
            }
        });
        return () => fortuneWheelEquip(this.name, items, this.stripLevel, globalCallback, this.preRunCallback, Player);
    }

    /**
     * Convert this instance into a list of {@link FortuneWheelOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FortuneWheelOption.ID} values
     * @returns A list of wheel of fortune options
     */
    toOptions(
        idExclude: null | readonly string[] = null,
        colors: readonly FortuneWheelColor[] = FORTUNE_WHEEL_COLORS,
    ): FortuneWheelOption[] {
        // Reserve the [0, 2**8] ID range for native MBS item sets
        const flags = Array.from(this.flags).sort((i) => FORTUNE_WHEEL_FLAGS.indexOf(i));
        const IDs = generateIDs(flags.length, this.custom ? 2**8 : 0, idExclude);
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
            };
        });
    }

    /**
     * Convert this instance into a list of {@link FortuneWheelOption} and
     * register {@link WheelFortuneOption} and (optionally) {@link WheelFortuneDefault}.
     * @param push Wether the new MBS settings should be pushed to the server
     */
    registerOptions(push: boolean = true): void {
        this.#hidden = false;
        const options = this.#children = this.toOptions(WheelFortuneOption.map(i => i.ID));
        for (const o of options) {
            // Check whether the option is already registered
            let i: number = -1;
            const prevOption = WheelFortuneOption.find((prevOption, index) => {
                if (prevOption.Description === o.Description) {
                    i = index;
                    return true;
                } else {
                    return false;
                }
            });

            // Either replace or add a new option
            if (prevOption !== undefined) {
                WheelFortuneOption[i] = o;
                if (o.ID !== prevOption.ID) {
                    o.ID = prevOption.ID;
                }
                if (o.Default && !WheelFortuneDefault.includes(o.ID)) {
                    WheelFortuneDefault += o.ID;
                }
            } else {
                WheelFortuneOption.push(o);
                if (o.Default) {
                    WheelFortuneDefault += o.ID;
                }
            }
        }
        if (push) {
            WheelFortuneOption.sort(option => option.Custom ? 2 + (option.Parent?.index ?? 0) : 0);
            pushMBSSettings();
        }
    }

    /**
     * Unregister this instance from {@link WheelFortuneOption} and {@link WheelFortuneDefault}.
     * @param push Wether the new MBS settings should be pushed to the server
     */
    unregisterOptions(push: boolean = true): void {
        this.#hidden = true;
        this.#children = null;
        const descriptions: Set<string> = new Set();
        const IDs: Set<string> = new Set();
        for (const flag of this.flags) {
            descriptions.add(this.name + (flag === "Exclusive" ? "" : `: ${flag}`));
        }

        for (let i = WheelFortuneOption.length - 1; i >= 0; i--) {
            const option = WheelFortuneOption[i];
            if (descriptions.has(<string>option.Description)) {
                IDs.add(option.ID);
                WheelFortuneOption.splice(i, 1);
            }
        }

        if (push && IDs.size !== 0) {
            WheelFortuneDefault = Array.from(WheelFortuneDefault).filter(i => !IDs.has(i)).join("");
            if (typeof Player.OnlineSharedSettings.WheelFortune === "string") {
                Player.OnlineSharedSettings.WheelFortune = Array.from(Player.OnlineSharedSettings.WheelFortune).filter(i => !IDs.has(i)).join("");
            }
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
    maxLength: null | number = null,
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

/** Return a deep copy of the passed object. */
export function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/** A class for representing semantic versions */
export class Version {
    /** The major semantic version */
    readonly major: number;
    /** The minor semantic version */
    readonly minor: number;
    /** The micro semantic version */
    readonly micro: number;
    /** Whether this concerns a beta version or not */
    readonly beta: boolean;

    constructor(major: number = 0, minor: number = 0, micro: number = 0, beta: boolean = false) {
        validateInt(major, "major", 0);
        validateInt(minor, "minor", 0);
        validateInt(micro, "micro", 0);
        if (typeof beta !== "boolean") {
            throw new TypeError(`Invalid "beta" type: ${typeof beta}`);
        }

        this.major = major;
        this.minor = minor;
        this.micro = micro;
        this.beta = beta;
        Object.freeze(this);
    }

    /** Check whether two versions are equal */
    equal(other: Version): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        return (
            this.major === other.major
            && this.minor === other.micro
            && this.micro === other.micro
            && this.beta === other.beta
        );
    }

    /** Check whether this version is greater than the other */
    greater(other: Version): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        const attrList = [
            [this.major, other.major],
            [this.minor, other.minor],
            [this.micro, other.micro],
            [this.beta, other.beta],
        ];
        for (const [thisAttr, otherAttr] of attrList) {
            if (thisAttr > otherAttr) {
                return true;
            } else if (thisAttr < otherAttr) {
                return false;
            }
        }
        return false;
    }

    /** Check whether this version is lesser than the other */
    lesser(other: Version): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        return other.greater(this);
    }

    /** Check whether this version is greater than or equal to the other */
    greaterOrEqual(other: Version): boolean {
        return this.equal(other) || this.greater(other);
    }

    /** Check whether this version is lesser than or equal to the other */
    lesserOrEqual(other: Version): boolean {
        return this.equal(other) || this.lesser(other);
    }

    /** Construct a new instance from the passed version string */
    static fromVersion(version: string): Version {
        const match = MBS_VERSION_PATTERN.exec(version);
        if (match === null) {
            throw new Error(`Invalid "version": ${version}`);
        }
        return new Version(
            Number(match[2]),
            Number(match[3]),
            Number(match[4]),
            (match[5] !== undefined),
        );
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.valueOf());
    }

    /** Return an object representation of this instance. */
    valueOf() {
        return {
            major: this.major,
            minor: this.minor,
            micro: this.micro,
            beta: this.beta,
        };
    }
}
