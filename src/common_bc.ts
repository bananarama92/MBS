/** Miscellaneous common BC-related functions and classes */

import { sortBy, omit } from "lodash-es";

import {
    toStringTemplate,
    LoopIterator,
    generateIDs,
    randomElement,
    BCX_MOD_API,
    includes,
    isArray,
    logger,
} from "./common";
import { pushMBSSettings, SettingsType } from "./settings";
import {
    DEFAULT_FLAGS,
    parseLegacyFlags,
    applyFlag,
    fromItemBundles,
    fortuneWheelEquip,
    StripLevel,
    getStripCondition,
    fortuneItemsSort,
} from "./fortune_wheel";


/** The maximum number of IDs within an item set category (builtin, MBS default, MBS custom) */
const ITEM_SET_CATEGORY_ID_RANGE = 256; // 2**8

/** The maximum number of IDs for an item set. */
const ITEM_SET_FLAG_COUNT = 16; // 2**4

/** The maximum number of custom user-specified wheel of fortune item sets. */
export const MBS_MAX_SETS = 32;

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

/** Return whether all vanilla BC online shared settings are loaded. */
export function settingsLoaded(): boolean {
    return (
        typeof Player !== "undefined"
        && Player.OnlineSharedSettings !== undefined
    );
}

/** Return whether all online settings (including MBS ones) are loaded. */
export function settingsMBSLoaded(): boolean {
    return settingsLoaded() && Player.MBSSettings !== undefined;
}

/** Indices of the default MBS wheel of fortune item sets */
const DEFAULT_ITEM_SET_INDEX: Record<string, number> = Object.freeze({
    "PSO Bondage": 0,
    "Mummification": 1,
    "Bondage Maid": 2,
    "Petrification": 3,
});

export abstract class MBSSelectedObject<T extends { name?: string }> {
    /** The name of custom option */
    name: null | string = null;
    /** A read-only view of the underlying list of wheel objects */
    readonly mbsList: readonly (null | T)[];
    /** The weight of a particular option within the wheel of fortune */
    weight: number;

    constructor(mbsList: readonly (null | T)[], weight?: number) {
        this.mbsList = mbsList;
        this.weight = Number.isInteger(weight) ? CommonClamp(<number>weight, 1, 9) : 1;
    }

    /** Reset all currently select options to their default. */
    reset(): void {
        this.name = null;
        this.weight = 1;
    }

    /**
     * Return whether the {@link FWSelectedItemSet.name} and any other attributes are valid.
     * @param selectedIndex The index of the currently opened {@link FWItemSet} (if any)
     */
    isValid(selectedIndex: null | number = null): this is ThisType<this> & { name: string } {
        if (this.name === null) {
            return false;
        }
        return this.mbsList.every((value, i) => {
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
        return toStringTemplate(typeof this, this.toJSON());
    }

    /** Return an object representation of this instance. */
    abstract toJSON(): object;
}

export class FWSelectedItemSet extends MBSSelectedObject<FWItemSet> {
    /** The to-be equipped items */
    itemList: null | readonly FWItem[] = null;
    /** Which flavors of {@link FWItemSetOption} should be created */
    readonly flags: readonly FWFlag[] = Object.freeze(DEFAULT_FLAGS.map(i => Object.seal({ ...i })));
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

    constructor(wheelList: readonly (null | FWItemSet)[], weight?: number) {
        super(wheelList, weight);
        this.stripIter = new LoopIterator([StripLevel.NONE, StripLevel.CLOTHES, StripLevel.UNDERWEAR, StripLevel.COSPLAY], StripLevel.UNDERWEAR);
        this.equipIter = new LoopIterator([StripLevel.NONE, StripLevel.CLOTHES, StripLevel.UNDERWEAR, StripLevel.COSPLAY], StripLevel.UNDERWEAR);
    }

    /** Reset all currently select options to their default. */
    reset(): void {
        super.reset();
        this.itemList = null;
        this.outfitCache = null;
        this.stripLevel = StripLevel.UNDERWEAR;
        this.equipLevel = StripLevel.UNDERWEAR;
        DEFAULT_FLAGS.forEach((flag, i) => Object.assign(this.flags[i], flag));
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
        this.outfitCache = null;
        this.weight = itemSet.weight;
        itemSet.flags.forEach((flag, i) => Object.assign(this.flags[i], flag));
    }

    /**
     * Update this instance with settings from the provided item set.
     * @param preRunCallback An optional callback for {@link fortuneWheelEquip} that will executed before equipping any items from itemList
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
            this.mbsList,
            this.stripLevel,
            this.equipLevel,
            this.flags,
            true,
            hidden,
            preRunCallback,
            this.weight,
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

        let items: ItemBundle | ItemBundle[];
        let itemList: FWItem[];
        try {
            items = JSON.parse(<string>LZString.decompressFromBase64(this.outfitCache));
            itemList = fromItemBundles(items);
        } catch (ex) {
            logger.warn("Failed to parse outfit code:", ex);
            return false;
        }

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
    isValid(selectedIndex: null | number = null): this is ThisType<this> & { name: string, itemList: readonly FWItem[] } {
        return (
            super.isValid(selectedIndex)
            && this.itemList !== null
            && this.flags.some(i => i.enabled)
        );
    }

    /** Return an object representation of this instance. */
    toJSON() {
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

export class FWSelectedCommand extends MBSSelectedObject<FWCommand> {
    /**
     * Update this instance with settings from the provided command.
     * @param command The to-be read wheel of fortune command
     */
    readSettings(command: FWCommand): void {
        if (!(command instanceof FWCommand)) {
            throw new TypeError(`Invalid "command" type: ${typeof command}`);
        }
        this.name = command.name;
        this.weight = command.weight;
    }

    /** Construct a new wheel of fortune command. */
    writeSettings(hidden: boolean = false): FWCommand {
        if (this.name === null) {
            throw new Error("Cannot create a Command while \"name\" is null");
        }
        return new FWCommand(this.name, this.mbsList, hidden, this.weight);
    }

    /** Return an object representation of this instance. */
    toJSON() {
        return {
            name: this.name,
        };
    }
}

/** A base class for MBS-related objects. */
export abstract class MBSObject<OptionType extends Record<string, any>> {
    /** The name of custom option */
    readonly name: string;
    /** Whether this concerns a custom user-created item set */
    readonly custom: boolean;
    /** The registered options corresponding to this item set (if any) */
    #children: null | readonly OptionType[] = null;
    /** Whether the item set is meant to be hidden */
    #hidden: boolean = true;
    /** A readonly view of the character's list of wheel objects */
    readonly mbsList: readonly (null | MBSObject<OptionType>)[];
    /** The weight of a particular option within the wheel of fortune */
    readonly weight: number;

    /** Get the registered options corresponding to this item set (if any) */
    get children(): null | readonly OptionType[] { return this.#children; }

    /** Get or set whether the item set is meant to be hidden */
    get hidden(): boolean { return this.#hidden; }
    set hidden(value: boolean) {
        if (value === true) {
            this.unregister();
        } else if (value === false) {
            this.register();
        } else {
            throw new TypeError(`Invalid "${this.name}.hidden" type: ${typeof value}`);
        }
    }

    /** Get the index of this instance within the player's fortune wheel sets and -1 if it's absent. */
    get index(): number {
        return this.mbsList.findIndex(i => i === this);
    }

    constructor(
        name: string,
        custom: boolean,
        wheelList: readonly (null | MBSObject<OptionType>)[],
        hidden: boolean,
        weight: number,
    ) {
        this.name = name;
        this.custom = custom;
        this.mbsList = wheelList;
        this.#hidden = hidden;
        this.weight = weight;
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

    /**
     * Convert this instance into a list of {@link FWItemSetOption} and
     * register {@link WheelFortuneOption} and (optionally) {@link WheelFortuneDefault}.
     */
    register(): void {
        this.#hidden = false;
        this.#children = this.toOptions();
    }

    /**
     * Unregister this instance from {@link WheelFortuneOption} and {@link WheelFortuneDefault}.
     */
    unregister(): void {
        this.#hidden = true;
        this.#children = null;
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.toJSON());
    }

    /** Return a (JSON safe-ish) object representation of this instance. */
    abstract toJSON(): Record<string, any>;
}

/** A base class for fortune wheel sets. */
export abstract class FWObject<OptionType extends FWObjectOption> extends MBSObject<OptionType> {
    /**
     * Convert this instance into a list of {@link FWItemSetOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FWItemSetOption.ID} values
     * @returns A list of wheel of fortune options
     */
    abstract toOptions(colors?: readonly FortuneWheelColor[]): OptionType[];

    /** Find the insertion position within `WheelFortuneOption`. */
    #registerFindStart(): number {
        if (!this.children?.length) {
            return WheelFortuneOption.length;
        } else {
            const initialID = this.children[0].ID;
            const start = WheelFortuneOption.findIndex(i => i.ID >= initialID);
            return start === -1 ? WheelFortuneOption.length : start;
        }
    }

    /**
     * Convert this instance into a list of {@link FWItemSetOption} and
     * register {@link WheelFortuneOption} and (optionally) {@link WheelFortuneDefault}.
     * @param push Whether the new MBS settings should be pushed to the server
     */
    register(push: boolean = true): void {
        super.register();
        let start = this.#registerFindStart();
        for (const o of <readonly OptionType[]>this.children) {
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
            pushMBSSettings([SettingsType.SHARED]);
        }
    }

    /**
     * Unregister this instance from {@link WheelFortuneOption} and {@link WheelFortuneDefault}.
     * @param push Whether the new MBS settings should be pushed to the server
     */
    unregister(push: boolean = true): void {
        const IDs = this.children?.map(c => c.ID) ?? [];
        super.unregister();
        WheelFortuneOption = WheelFortuneOption.filter(i => !IDs.includes(i.ID));
        WheelFortuneDefault = Array.from(WheelFortuneDefault).filter(i => !IDs.includes(i)).join("");

        if (push) {
            pushMBSSettings([SettingsType.SHARED]);
        }
    }

    /** Return a list of wheel of fortune IDs in the form of length-1 strings */
    abstract getIDs(): string[];
}

/** {@link FWItemSet} constructor argument types in tuple form */
type FWItemSetArgTypes = ConstructorParameters<typeof FWItemSet>;

/** {@link FWItemSet} constructor argument types in object form */
type FWItemSetKwargTypes = {
    name: string,
    itemList: readonly FWItem[],
    mbsList: readonly (null | FWItemSet)[],
    stripLevel?: StripLevel,
    equipLevel?: StripLevel,
    flags?: readonly Readonly<FWFlag>[],
    custom?: boolean,
    hidden?: boolean,
    preRunCallback?: null | FortuneWheelPreRunCallback,
    weight?: number,
};

function validateFlags(flags: readonly Readonly<FWFlag>[]): FWFlag[] {
    return DEFAULT_FLAGS.map((ref_flag, i) => {
        const flag = flags[i];
        if (flag === null || typeof flag !== "object" || flag.type !== ref_flag.type) {
            return { ...ref_flag };
        }

        const enabled = typeof flag.enabled === "boolean" ? flag.enabled : ref_flag.enabled;
        switch (flag.type) {
            case "TimerPasswordPadlock":
                if (!(Number.isInteger(flag.time) && flag.time >= 1 && flag.time <= (24 * 60 * 60))) {
                    return { ...ref_flag };
                }
                return { type: flag.type, time: flag.time, enabled };
            case "ExclusivePadlock":
            case "HighSecurityPadlock":
            case null:
                return { type: flag.type, enabled };
            default:
                return { ...ref_flag };
        }
    });
}

/** A class for storing custom user-specified wheel of fortune item sets. */
export class FWItemSet extends FWObject<FWItemSetOption> implements Omit<FWSimpleItemSet, "flags"> {
    /** The to-be equipped items */
    readonly itemList: readonly FWItem[];
    /** Which items should be removed from the user */
    readonly stripLevel: StripLevel;
    /** Which from the to-be equipped outfit should be actually equipped */
    readonly equipLevel: StripLevel;
    /** Which flavors of {@link FWItemSetOption} should be created */
    readonly flags: readonly Readonly<FWFlag>[];
    /** An optional callback for {@link fortuneWheelEquip} that will executed before equipping any items from itemList */
    readonly preRunCallback: null | FortuneWheelPreRunCallback;
    // @ts-ignore: false positive; narrowing of superclass attribute type
    readonly mbsList: readonly (null | FWItemSet)[];

    /** Initialize the instance */
    constructor(
        name: string,
        itemList: readonly FWItem[],
        mbsList: readonly (null | FWItemSet)[],
        stripLevel?: StripLevel,
        equipLevel?: StripLevel,
        flags?: readonly Readonly<FWFlag>[],
        custom?: boolean,
        hidden?: boolean,
        preRunCallback?: null | FortuneWheelPreRunCallback,
        weight?: number,
    ) {
        const kwargs = FWItemSet.validate({
            name,
            itemList,
            mbsList,
            stripLevel,
            equipLevel,
            flags,
            custom,
            hidden,
            preRunCallback,
            weight,
        });
        super(kwargs.name, kwargs.custom, kwargs.mbsList, kwargs.hidden, kwargs.weight);
        this.itemList = kwargs.itemList;
        this.stripLevel = kwargs.stripLevel;
        this.equipLevel = kwargs.equipLevel;
        this.flags = kwargs.flags;
        this.preRunCallback = kwargs.preRunCallback;
    }

    /** Validation function for the classes' constructor */
    static validate(kwargs: FWItemSetKwargTypes): Required<FWItemSetKwargTypes> {
        if (typeof kwargs.name !== "string") {
            throw new TypeError(`Invalid "name" type: ${typeof kwargs.name}`);
        }

        if (isArray(kwargs.itemList)) {
            const itemList: FWItem[] = [];
            const invalid: string[] = [];
            for (let item of kwargs.itemList) {
                const asset = AssetGet("Female3DCG", item.Group, item.Name);
                if (asset == null) {
                    invalid.push(`${item.Group}:${item.Name}`);
                    continue;
                } else if (!(
                    asset.Group.IsItem()
                    || (asset.Group.IsAppearance() && asset.Group.AllowNone)
                )) {
                    continue;
                }

                if (!item.TypeRecord && item.Type !== undefined) {
                    item = Object.freeze({
                        ...omit(item, "Type"),
                        TypeRecord: ExtendedItemTypeToRecord(asset, item.Type),
                    });
                }
                itemList.push(item);
            }
            kwargs.itemList = Object.freeze(itemList);
            if (invalid.length !== 0) {
                logger.warn(`Found ${invalid.length} items in wheel of fortune item set "${this.name}": ${invalid}`);
            }
        } else {
            throw new TypeError(`Invalid "itemList" type: ${typeof kwargs.itemList}`);
        }

        if (!isArray(kwargs.mbsList)) {
            throw new TypeError(`Invalid "mbsList" type: ${typeof kwargs.mbsList}`);
        }

        if (!(includes(Object.values(StripLevel), kwargs.stripLevel))) {
            kwargs.stripLevel = StripLevel.UNDERWEAR;
        }

        if (!(includes(Object.values(StripLevel), kwargs.equipLevel))) {
            kwargs.stripLevel = StripLevel.UNDERWEAR;
        }

        if (isArray(kwargs.flags)) {
            let flags: FWFlag[];
            if (kwargs.flags.every(i => typeof i === "string")) {
                const flagsUnknown = <readonly unknown[]>kwargs.flags;
                flags = parseLegacyFlags(<readonly string[]>flagsUnknown);
            } else {
                flags = validateFlags(kwargs.flags);
            }
            if (flags.every(i => !i.enabled)) {
                flags[0].enabled = true;
            }
            kwargs.flags = Object.freeze(flags.map(i => Object.freeze(i)));
        } else {
            kwargs.flags = DEFAULT_FLAGS;
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

        if (!Number.isInteger(kwargs.weight)) {
            kwargs.weight = 1;
        } else {
            kwargs.weight = CommonClamp(<number>kwargs.weight, 1, 9);
        }
        return <Required<FWItemSetKwargTypes>>kwargs;
    }

    /**
     * Construct a new {@link FWItemSet} instance from the passed object
     * @param kwargs The to-be parsed object
     */
    static fromObject(mbsList: readonly (null | FWItemSet)[], kwargs: FWSimplePartialItemSet): FWItemSet {
        const args: FWItemSetArgTypes = [
            kwargs.name,
            kwargs.itemList,
            mbsList,
            kwargs.stripLevel,
            kwargs.equipLevel,
            kwargs.flags,
            kwargs.custom,
            kwargs.hidden,
            kwargs.preRunCallback,
            kwargs.weight,
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

    getIDs(): string[] {
        const flagsNumeric = [];
        for (const [i, flag] of this.flags.entries()) {
            if (flag.enabled) {
                flagsNumeric.push(i);
            }
        }

        /**
         * * Reserve the `[0, 2**8)` range (extended ASCII) for BC's default
         * * Reserve the `[2**8, 2**9)` range for MBS's builtin options
         * * "Reserve" the `[2**9, 2**16)` range for MBS's custom options
         */
        let start: number;
        if (!this.custom) {
            start = ITEM_SET_CATEGORY_ID_RANGE + DEFAULT_ITEM_SET_INDEX[this.name] * ITEM_SET_FLAG_COUNT;
            if (Number.isNaN(start)) {
                throw new Error(`Unknown default item set "${this.name}"`);
            }
        } else {
            // Stagger the itemset/command IDs:
            // 16 items sets followed by 16 commands, followed by 16 item sets, etc
            const offset = 2 + Math.floor(this.index / 16);
            start = offset * ITEM_SET_CATEGORY_ID_RANGE + this.index * ITEM_SET_FLAG_COUNT;
            if (start < 0) {
                throw new Error(`Item set "${this.name}" absent from currently selected fortune wheel sets`);
            }
        }

        return generateIDs(start, flagsNumeric);
    }

    /**
     * Convert this instance into a list of {@link FWItemSetOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FWItemSetOption.ID} values
     * @returns A list of wheel of fortune options
     */
    toOptions(colors: readonly FortuneWheelColor[] = FORTUNE_WHEEL_COLORS): FWItemSetOption[] {
        const flags = this.flags.filter(flag => flag.enabled);
        const IDs = this.getIDs();
        return flags.map((flag, i) => {
            let Description = this.name;
            let Default = true;
            switch (flag.type) {
                case "HighSecurityPadlock":
                    Description += ": High Security";
                    Default = false;
                    break;
                case "TimerPasswordPadlock":
                    Description += `: ${Math.floor(flag.time / 60)} minutes`;
                    Default = i !== 4;
                    break;
                case "ExclusivePadlock":
                    Description += ": Exclusive";
                    break;
                case null:
                    Default = false;
                    break;
            }
            return {
                ID: IDs[i],
                Color: randomElement(colors),
                Script: this.scriptFactory((...args) => applyFlag(flag, ...args)),
                Description,
                Default,
                Custom: this.custom,
                Parent: this,
                Flag: flag,
                Weight: this.weight,
            };
        });
    }

    /** Return a (JSON safe-ish) object representation of this instance. */
    toJSON(): FWSimpleItemSet {
        return {
            name: this.name,
            itemList: this.itemList,
            stripLevel: this.stripLevel,
            equipLevel: this.equipLevel,
            flags: this.flags,
            custom: this.custom,
            hidden: this.hidden,
            preRunCallback: this.preRunCallback,
            weight: this.weight,
        };
    }
}

/** {@link FWCommand} constructor argument types in tuple form */
type FWCommandArgTypes = ConstructorParameters<typeof FWCommand>;

/** {@link FWCommand} constructor argument types in tuple form */
type FWCommandKwargTypes = {
    name: string,
    mbsList: readonly (null | FWCommand)[],
    hidden?: boolean,
    weight?: number
};

/** A class for storing custom user-specified wheel of fortune item sets. */
export class FWCommand extends FWObject<FWCommandOption> implements FWSimpleCommand {
    // @ts-ignore: false positive; narrowing of superclass attribute type
    readonly custom: true;
    // @ts-ignore: false positive; narrowing of superclass attribute type
    readonly mbsList: readonly (null | FWCommand)[];

    /** Initialize the instance */
    constructor(
        name: string,
        mbsList: readonly (null | FWCommand)[],
        hidden?: boolean,
        weight?: number,
    ) {
        const kwargs = FWCommand.validate({ name, mbsList, hidden, weight });
        super(kwargs.name, true, kwargs.mbsList, kwargs.hidden, kwargs.weight);
    }

    /** Validation function for the classes' constructor */
    static validate(kwargs: FWCommandKwargTypes): Required<FWCommandKwargTypes> {
        if (typeof kwargs.name !== "string") {
            throw new TypeError(`Invalid "name" type: ${typeof kwargs.name}`);
        }

        if (!Array.isArray(kwargs.mbsList)) {
            throw new TypeError(`Invalid "mbsList" type: ${typeof kwargs.mbsList}`);
        }

        if (typeof kwargs.hidden !== "boolean") {
            kwargs.hidden = true;
        }

        if (!Number.isInteger(kwargs.weight)) {
            kwargs.weight = 1;
        } else {
            kwargs.weight = CommonClamp(<number>kwargs.weight, 1, 9);
        }
        return <Required<FWCommandKwargTypes>>kwargs;
    }

    /**
     * Construct a new {@link FWItemSet} instance from the passed object
     * @param kwargs The to-be parsed object
     */
    static fromObject(mbsList: readonly (null | FWCommand)[], kwargs: FWSimplePartialCommand): FWCommand {
        const args: FWCommandArgTypes = [
            kwargs.name,
            mbsList,
            kwargs.hidden,
            kwargs.weight,
        ];
        return new FWCommand(...args);
    }

    /**
     * Convert this instance into a list of {@link FWItemSetOption}.
     * @param idExclude Characters that should not be contained within any of the {@link FWItemSetOption.ID} values
     * @returns A list of wheel of fortune options
     */
    toOptions(colors: readonly FortuneWheelColor[] = FORTUNE_WHEEL_COLORS): FWCommandOption[] {
        const [ID] = this.getIDs();
        return [{
            ID: ID,
            Color: randomElement(colors),
            Description: this.name,
            Default: true,
            Custom: this.custom,
            Parent: this,
            Script: undefined,
            Flag: undefined,
            Weight: this.weight,
        }];
    }

    getIDs(): [string] {
        // Stagger the itemset/command IDs:
        // 16 items sets followed by 16 commands, followed by 16 item sets, etc
        const offset = 3 + Math.floor(this.index / 16);
        const ID = offset * ITEM_SET_CATEGORY_ID_RANGE + this.index;
        return [String.fromCharCode(ID)];
    }

    /** Return a (JSON safe-ish) object representation of this instance. */
    toJSON(): FWSimpleCommand {
        return {
            name: this.name,
            hidden: this.hidden,
            weight: this.weight,
        };
    }
}

/** Gather and return all valid wheel of fortune IDs from the passed lists */
export function getFWIDs(...fwObjectLists: (readonly (null | FWObject<any>)[])[]): Set<string> {
    const idList: string[] = [];
    for (const fwObjectList of fwObjectLists) {
        for (const fwObject of fwObjectList) {
            if (fwObject === null) {
                continue;
            }
            idList.push(...fwObject.getIDs());
        }
    }
    return new Set(idList);
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

export function getNumberInputElement<T extends string>(
    name: T,
    record: Record<T, number>,
    coords: readonly [X: number, Y: number, W: number, H?: number],
    value: number,
    minValue: number = -Infinity,
    maxValue: number = Infinity,
): HTMLInputElement {
    let element = ElementCreateInput(`MBS${name}`, "number", value.toString());
    if (element) {
        element.setAttribute("max", maxValue.toString());
        element.setAttribute("min", minValue.toString());
        element.addEventListener("input", CommonLimitFunction((e) => {
            // @ts-ignore
            const value = Number.parseInt(e.target?.value, 10);
            if (!Number.isNaN(value) && value >= minValue && value <= maxValue) {
                record[name] = value;
            }
        }));
    } else {
        element = <HTMLInputElement>document.getElementById(`MBS${name}`);
    }
    ElementPosition(`MBS${name}`, ...coords);
    return element;
}

export function createWeightedWheelIDs(ids: string): string {
    const idBaseList = Array.from(ids).flatMap(id => {
        const option = WheelFortuneOption.find(o => o.ID === id);
        return option === undefined ? [] : Array(option.Weight ?? 1).fill(id);
    });
    if (idBaseList.length === 0) {
        return Array.from(ids.length > 0 ? ids : WheelFortuneDefault).sort(Math.random).join();
    }

    const idList: string[] = [];
    while (idList.length < 50) {
        idList.push(...sortBy(idBaseList, Math.random));
    }
    return idList.join("");
}
