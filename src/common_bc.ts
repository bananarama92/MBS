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
 * Test whether the passed object is a player- or simple character and raise otherwise.
 * @param character The character in question
 */
export function validateCharacter(character: Character): void {
    if (character === null || typeof character !== "object") {
        throw new TypeError(`Invalid "character" type: ${typeof character}`);
    } else if (!character.IsSimple() && !character.IsPlayer()) {
        throw new Error("Expected a simple or player character");
    }
}

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
    }
    validateCharacter(character);

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
 * A list ordered of with the various {@link FWItemSetOption} flavors that should be generated
 * for a single {@link FWItemSetOption}.
 *
 * Used by {@link FWItemSet.toOptions} for assigning itemOption-IDs, relying on the following two properties:
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

export abstract class FWSelectedObject<T extends FWObject<WheelFortuneOptionType>> {
    /** The name of custom option */
    name: null | string = null;
    /** A read-only view of the underlying list of wheel objects */
    readonly wheelList: readonly (null | T)[];

    constructor(wheelList: readonly (null | T)[]) {
        this.wheelList = wheelList;
    }

    /** Reset all currently select options to their default. */
    reset(): void {
        this.name = null;
    }

    /**
     * Return whether the {@link FWSelectedItemSet.name} and any other attributes are valid.
     * @param selectedIndex The index of the currently opened {@link FWItemSet} (if any)
     */
    isValid(selectedIndex: null | number = null): boolean {
        if (this.name === null) {
            return false;
        }
        return this.wheelList.every((value, i) => {
            if (i === selectedIndex) {
                return true;
            } else {
                return value?.name !== this.name;
            }
        });
    }

    /**
     * Update this instance with settings from the provided wheel of fortune object.
     * @param value The to-be read wheel of fortune object
     */
    abstract readSettings(value: T): void;

    /** Construct a new wheel of fortune object. */
    abstract writeSettings(hidden?: boolean): T;

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.valueOf());
    }

    /** Return an object representation of this instance. */
    abstract valueOf(): object;
}

export class FWSelectedItemSet extends FWSelectedObject<FWItemSet> {
    /** The to-be equipped items */
    itemList: null | readonly FWItem[] = null;
    /** Which flavors of {@link FWItemSetOption} should be created */
    flags: Set<FortuneWheelFlags> = new Set(["5 Minutes", "15 Minutes", "1 Hour", "Exclusive"]);
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

    constructor(wheelList: readonly (null | FWItemSet)[]) {
        super(wheelList);
        this.stripIter = new LoopIterator([StripLevel.NONE, StripLevel.CLOTHES, StripLevel.UNDERWEAR, StripLevel.COSPLAY], StripLevel.UNDERWEAR);
        this.equipIter = new LoopIterator([StripLevel.NONE, StripLevel.CLOTHES, StripLevel.UNDERWEAR, StripLevel.COSPLAY], StripLevel.UNDERWEAR);
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
    readSettings(itemSet: FWItemSet): void {
        if (!(itemSet instanceof FWItemSet)) {
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
    writeSettings(
        hidden: boolean = false,
        preRunCallback: null | FortuneWheelPreRunCallback = null,
    ): FWItemSet {
        if (this.name === null || this.itemList === null) {
            throw new Error("Cannot create an ItemSet while \"name\" or \"itemList\" is null");
        }
        return new FWItemSet(
            this.name,
            this.itemList,
            this.wheelList,
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
     * Return whether the {@link FWSelectedItemSet.name} and any other attributes are valid.
     * @param selectedIndex The index of the currently opened {@link FWItemSet} (if any)
     */
    isValid(selectedIndex: null | number = null): this is typeof this & { itemList: readonly FWItem[] } {
        return super.isValid(selectedIndex) && this.itemList !== null;
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

export class FWSelectedCommand extends FWSelectedObject<FWCommand> {
    /** Reset all currently select options to their default. */
    reset(): void {
        this.name = null;
    }

    /**
     * Update this instance with settings from the provided command.
     * @param command The to-be read wheel of fortune command
     */
    readSettings(command: FWCommand): void {
        if (!(command instanceof FWCommand)) {
            throw new TypeError(`Invalid "command" type: ${typeof command}`);
        }
        this.name = command.name;
    }

    /** Construct a new wheel of fortune command. */
    writeSettings(hidden: boolean = false): FWCommand {
        if (this.name === null) {
            throw new Error("Cannot create a Command while \"name\" is null");
        }
        return new FWCommand(this.name, this.wheelList, hidden);
    }

    /** Return an object representation of this instance. */
    valueOf() {
        return {
            name: this.name,
        };
    }
}

/** A base class for fortune wheel sets. */
export abstract class FWObject<OptionType extends FWObjectOption> {
    /** The name of custom option */
    readonly name: string;
    /** Whether this concerns a custom user-created item set */
    readonly custom: boolean;
    /** The registered options corresponding to this item set (if any) */
    #children: null | readonly OptionType[] = null;
    /** Whether the item set is meant to be hidden */
    #hidden: boolean = true;
    /** A readonly view of the character's list of wheel objects */
    readonly wheelList: readonly (null | FWObject<OptionType>)[];

    /** Get the registered options corresponding to this item set (if any) */
    get children(): null | readonly OptionType[] { return this.#children; }

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
        return this.wheelList.findIndex(i => i === this);
    }

    constructor(name: string, custom: boolean, wheelList: readonly (null | FWObject<OptionType>)[], hidden: boolean) {
        this.name = name;
        this.custom = custom;
        this.wheelList = wheelList;
        this.#hidden = hidden;
    }

    /**
     * Validation function for the classes' constructor
     * @param kwargs The to-be validated arguments
     */
    static validate(_: object): object {
        throw new Error("Trying to call an abstract method");
    }

    /**
     * Construct a new {@link FWObject} instance from the passed object
     * @param kwargs The to-be parsed object
     */
    static fromObject(..._: any): FWObject<FWObjectOption> {
        throw new Error("Trying to call an abstract method");
    }

    /**
     * Convert this instance into a list of {@link FWItemSetOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FWItemSetOption.ID} values
     * @returns A list of wheel of fortune options
     */
    abstract toOptions(colors?: readonly FortuneWheelColor[]): OptionType[];

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
     * Convert this instance into a list of {@link FWItemSetOption} and
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
    abstract valueOf(): object;
}

/** {@link FWItemSet} constructor argument types in tuple form */
type FWItemSetArgTypes = [
    name: string,
    itemList: readonly FWItem[],
    wheelList: readonly (null | FWItemSet)[],
    stripLevel?: StripLevel,
    equipLevel?: StripLevel,
    flags?: Iterable<FortuneWheelFlags>,
    custom?: boolean,
    hidden?: boolean,
    preRunCallback?: null | FortuneWheelPreRunCallback,
];

/** {@link FWItemSet} constructor argument types in object form */
type FWItemSetKwargTypes = {
    name: string,
    itemList: readonly FWItem[],
    wheelList: readonly (null | FWItemSet)[],
    stripLevel?: StripLevel,
    equipLevel?: StripLevel,
    flags?: Iterable<FortuneWheelFlags>,
    custom?: boolean,
    hidden?: boolean,
    preRunCallback?: null | FortuneWheelPreRunCallback,
};

/** {@link FWItemSet} parsed constructor argument types in object form */
type WheelFortuneItemSetKwargTypesParsed = Required<FWItemSetKwargTypes> & { flags: Readonly<Set<FortuneWheelFlags>> };

/** A class for storing custom user-specified wheel of fortune item sets. */
export class FWItemSet extends FWObject<FWItemSetOption> {
    /** The to-be equipped items */
    readonly itemList: readonly FWItem[];
    /** Which items should be removed from the user */
    readonly stripLevel: StripLevel;
    /** Which from the to-be equipped outfit should be actually equipped */
    readonly equipLevel: StripLevel;
    /** Which flavors of {@link FWItemSetOption} should be created */
    readonly flags: Readonly<Set<FortuneWheelFlags>>;
    /** An optional callback for {@link fortuneWheelEquip} that will executed before equipping any items from itemList */
    readonly preRunCallback: null | FortuneWheelPreRunCallback;
    // @ts-ignore: false positive; narrowing of superclass attribute type
    readonly wheelList: readonly (null | FWItemSet)[];

    /** Initialize the instance */
    constructor(
        name: string,
        itemList: readonly FWItem[],
        wheelList: readonly (null | FWItemSet)[],
        stripLevel?: StripLevel,
        equipLevel?: StripLevel,
        flags?: Iterable<FortuneWheelFlags>,
        custom?: boolean,
        hidden?: boolean,
        preRunCallback?: null | FortuneWheelPreRunCallback,
    ) {
        const kwargs = FWItemSet.validate({
            name: name,
            itemList: itemList,
            wheelList: wheelList,
            stripLevel: stripLevel,
            equipLevel: equipLevel,
            flags: flags,
            custom: custom,
            hidden: hidden,
            preRunCallback: preRunCallback,
        });
        super(kwargs.name, kwargs.custom, kwargs.wheelList, kwargs.hidden);
        this.itemList = kwargs.itemList;
        this.stripLevel = kwargs.stripLevel;
        this.equipLevel = kwargs.equipLevel;
        this.flags = kwargs.flags;
        this.preRunCallback = kwargs.preRunCallback;
    }

    /** Validation function for the classes' constructor */
    static validate(kwargs: FWItemSetKwargTypes): WheelFortuneItemSetKwargTypesParsed {
        if (typeof kwargs.name !== "string") {
            throw new TypeError(`Invalid "name" type: ${typeof kwargs.name}`);
        }

        if (Array.isArray(kwargs.itemList)) {
            kwargs.itemList = Object.freeze([...kwargs.itemList]);
        } else {
            throw new TypeError(`Invalid "itemList" type: ${typeof kwargs.itemList}`);
        }

        if (!Array.isArray(kwargs.wheelList)) {
            throw new TypeError(`Invalid "wheelList" type: ${typeof kwargs.wheelList}`);
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
     * Construct a new {@link FWItemSet} instance from the passed object
     * @param kwargs The to-be parsed object
     */
    static fromObject(wheelList: readonly (null | FWItemSet)[], kwargs: FWSimplePartialItemSet): FWItemSet {
        const args: FWItemSetArgTypes = [
            kwargs.name,
            kwargs.itemList,
            wheelList,
            kwargs.stripLevel,
            kwargs.equipLevel,
            kwargs.flags,
            kwargs.custom,
            kwargs.hidden,
            kwargs.preRunCallback,
        ];
        return new FWItemSet(...args);
    }

    /**
     * Factory method for generating {@link FWItemSetOption.Script} callbacks.
     * @param globalCallbacks A callback (or `null`) that will be applied to all items after they're equipped
     * @returns A valid {@link FWItemSetOption.Script} callback
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
     * Convert this instance into a list of {@link FWItemSetOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FWItemSetOption.ID} values
     * @returns A list of wheel of fortune options
     */
    toOptions(colors: readonly FortuneWheelColor[] = FORTUNE_WHEEL_COLORS): FWItemSetOption[] {
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
                Flag: flag,
            };
        });
    }

    /** Return a (JSON safe-ish) object representation of this instance. */
    valueOf(): FWSimpleItemSet {
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

/** {@link FWCommand} constructor argument types in tuple form */
type FWCommandArgTypes = [
    name: string,
    wheelList: readonly (null | FWCommand)[],
    hidden?: boolean,
];

/** {@link FWCommand} constructor argument types in tuple form */
type FWCommandKwargTypes = {
    name: string,
    wheelList: readonly (null | FWCommand)[],
    hidden?: boolean,
};

/** A class for storing custom user-specified wheel of fortune item sets. */
export class FWCommand extends FWObject<FWCommandOption> {
    // @ts-ignore: false positive; narrowing of superclass attribute type
    readonly custom: true;
    // @ts-ignore: false positive; narrowing of superclass attribute type
    readonly wheelList: readonly (null | FWCommand)[];

    /** Initialize the instance */
    constructor(name: string, wheelList: readonly (null | FWCommand)[], hidden?: boolean) {
        const kwargs = FWCommand.validate({ name: name, wheelList: wheelList, hidden: hidden });
        super(kwargs.name, true, kwargs.wheelList, kwargs.hidden);
    }

    /** Validation function for the classes' constructor */
    static validate(kwargs: FWCommandKwargTypes): Required<FWCommandKwargTypes> {
        if (typeof kwargs.name !== "string") {
            throw new TypeError(`Invalid "name" type: ${typeof kwargs.name}`);
        }

        if (!Array.isArray(kwargs.wheelList)) {
            throw new TypeError(`Invalid "wheelList" type: ${typeof kwargs.wheelList}`);
        }

        if (typeof kwargs.hidden !== "boolean") {
            kwargs.hidden = true;
        }
        return <Required<FWCommandKwargTypes>>kwargs;
    }

    /**
     * Construct a new {@link FWItemSet} instance from the passed object
     * @param kwargs The to-be parsed object
     */
    static fromObject(wheelList: readonly (null | FWCommand)[], kwargs: FWSimplePartialCommand): FWCommand {
        const args: FWCommandArgTypes = [
            kwargs.name,
            wheelList,
            kwargs.hidden,
        ];
        return new FWCommand(...args);
    }

    /**
     * Convert this instance into a list of {@link FWItemSetOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FWItemSetOption.ID} values
     * @returns A list of wheel of fortune options
     */
    toOptions(colors: readonly FortuneWheelColor[] = FORTUNE_WHEEL_COLORS): FWCommandOption[] {
        const ID = 3 * ITEM_SET_CATEGORY_ID_RANGE + this.index;
        return [{
            ID: String.fromCharCode(ID),
            Color: randomElement(colors),
            Description: this.name,
            Default: true,
            Custom: this.custom,
            Parent: this,
            Script: undefined,
            Flag: undefined,
        }];
    }

    /** Return a (JSON safe-ish) object representation of this instance. */
    valueOf(): FWSimpleCommand {
        return { name: this.name, hidden: this.hidden };
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
