/** Miscellaneous common functions and classes */

import { range, random } from "lodash-es";
import bcModSdk from "bondage-club-mod-sdk";

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

/** Regular expression for the MBS version */
const MBS_VERSION_PATTERN = /^(v?)([0-9]+)\.([0-9]+)\.([0-9]+)(\.\S+)?$/;

type LogLevel = "debug" | "log" | "warn" | "error";

interface LogEntry {
    readonly date: Date,
    readonly level: LogLevel,
    readonly args: readonly unknown[],
}

/**
 * The MBS logging class.
 * Combines the {@link console} logging methods with an {@link Array} for storing the output.
 */
class MBSLog extends Array<LogEntry> {
    #log(level: LogLevel, args: readonly unknown[]) {
        const date = new Date(Date.now());
        console[level]("MBS:", ...args);
        this.push({ date, level, args });
    }

    /**
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/debug)
     * @param args Parameters to be passed to {@link console.debug}
     */
    debug(...args: unknown[]) {
        this.#log("debug", args);
    }

    /**
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/log)
     * @param args Parameters to be passed to {@link console.log}
     */
    log(...args: unknown[]) {
        this.#log("log", args);
    }

    /**
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn)
     * @param args Parameters to be passed to {@link console.warn}
     */
    warn(...args: unknown[]) {
        this.#log("warn", args);
    }

    /**
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error)
     * @param args Parameters to be passed to {@link console.error}
     */
    error(...args: unknown[]) {
        this.#log("error", args);
    }

    toJSON() {
        return this.map(arg => {
            return {
                date: arg.date.toUTCString(),
                level: arg.level,
                args: arg.args.map(i => (i instanceof Map || i instanceof Set) ? Array.from(i) : i),
            };
        });
    }
}

/** The MBS logger */
export const logger = new MBSLog();

/**
 * Check whether an integer falls within the specified range and raise otherwise.
 * @param int The to-be validate integer
 * @param varName The name of the variable
 * @param min The minimum allowed value of the integer
 * @param max The maximum allowed value of the integer
 */
export function validateInt(
    int: number,
    varName: string,
    min: number = -Infinity,
    max: number = Infinity,
): void {
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
 * Pad an array with a given value to a given length if necessary.
 * Performs an inplace update of the passed array.
 * @param list The to-be padded array
 * @param n The desired array length. Must be at least as large as `list.length`
 * @param padValue The value used for padding
 * @returns The originally passed `list` modified inplace
 */
export function padArray<T>(list: T[], n: number, padValue: T): T[] {
    validateInt(n, "n", 0);
    if (!Array.isArray(list)) {
        throw new TypeError(`Invalid "list" type: ${typeof list}`);
    }

    const nPad = n - list.length;
    if (nPad > 0) {
        list.push(...Array(nPad).fill(padValue));
    }
    return list;
}

/**
 * Trim an array up to a given length.
 * Performs an inplace update of the passed array.
 * @param list The to-be padded array
 * @param n The desired array length. Must be at most as large as `list.length`
 * @returns The originally passed `list` modified inplace
 */
export function trimArray<T>(list: T[], n: number): T[] {
    validateInt(n, "n", 0);
    if (!Array.isArray(list)) {
        throw new TypeError(`Invalid "list" type: ${typeof list}`);
    }
    const nTrim = list.length - n;
    if (nTrim > 0) {
        list.splice(n, nTrim);
    }
    return list;
}

/**
 * Return a random element from the passed list.
 * @param list The list in question
 * @returns The random element from the passed list
 */
export function randomElement<T>(list: readonly T[]): T {
    if (!isArray(list)) {
        throw new TypeError(`Invalid "list" type: ${typeof list}`);
    } else if (list.length === 0) {
        throw new Error('Passed "list" must contain at least 1 item');
    }
    return list[random(0, list.length - 1, false)];
}

/**
 * Generate a password consisting of `n` random latin characters.
 * @param n The length of the password; must be in the [0, 8] interval
 * @returns the newly generated password
 */
export function getRandomPassword(n: number): string {
    validateInt(n, "n", 0, 8);
    return range(0, n).map(_ => randomElement(ALPHABET)).join("");
}

/**
 * Wait for the passed predicate to evaluate to `true`.
 * @param predicate A predicate
 * @param timeout The timeout in milliseconds for when the predicate fails
 * @returns Whether the predicate has returned `true`
 */
export async function waitFor(predicate: () => boolean, timeout: number = 100): Promise<boolean> {
    while (!predicate()) {
        await new Promise(resolve => setTimeout(resolve, timeout));
    }
    return true;
}

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

    get modName(): string { return "MBS"; }

    getRuleState<T extends BCX_Rule>(rule: T): BCX_RuleStateAPI<T> | null {
        if (this.#api === null && typeof bcx !== "undefined") {
            this.#api = bcx.getModApi("MBS");
        }
        return this.#api?.getRuleState(rule) ?? null;
    }
}

/** A lazily-loaded version of the BCX mod API */
export const BCX_MOD_API = new ModAPIProxy();

/**
 * Helper function for creating {@link Object.prototype.toString} methods.
 * @param typeName The name of the object
 * @param obj The object
 * @returns A stringified version of the passed `obj`
 */
export function toStringTemplate(typeName: string, obj: object): string {
    let ret = `${typeName}(`;
    ret += Object.values(obj).map(i => String(i)).join(", ");
    ret += ")";
    return ret;
}

export class LoopIterator<T> {
    /** The iterator's underlying array. */
    readonly #list: readonly T[];
    /** The current position of the iterator. */
    #index: number;

    /** Get or set the current position of the iterator. */
    get index(): number { return this.#index; }
    set index(value: number) { this.setPosition(value); }
    /** Get the current value of the iterator. */
    get value(): T { return this.#list[this.#index]; }
    /** Get the iterator's underlying array. */
    get list(): readonly T[] { return this.#list; }

    /**
     * Initialize the instance
     * @param list The to-be iterated iterable. Note that the iterable will be converted into an array or copied otherwise.
     * @param index The starting position within the array
     */
    constructor(list: Iterable<T>, index: number = 0) {
        if (!isIterable(list)) {
            throw new TypeError(`Invalid "iterable" type: ${typeof list}`);
        }
        const copiedList = Object.freeze([...list]);

        if (copiedList.length === 0) {
            throw new Error('Passed "iterable" must contain at least one element');
        } else {
            validateInt(index, "index", 0, copiedList.length - 1);
        }
        this.#list = copiedList;
        this.#index = index;
    }

    /** Yield {@link LoopIterator.next} outputs. */
    *[Symbol.iterator]() {
        while (true) {
            yield this.next();
        }
    }

    /**
     * Return the next element from the iterator and increment.
     * @param incrementPosition Whether to increment the iterator in addition to returning the next element
     * @returns the iterators next element
     */
    next(incrementPosition: boolean = true): T {
        const index = (this.#index + 1) % this.#list.length;
        if (incrementPosition) {
            this.#index = index;
        }
        return this.#list[index];
    }

    /**
     * Return the previous element from the iterator and decrement.
     * @param decrementPosition Whether to derecement the iterator in addition to returning the previous element
     * @returns the iterators previous element
     */
    previous(decrementPosition: boolean = true): T {
        const index = (this.#index + this.#list.length - 1) % this.#list.length;
        if (decrementPosition) {
            this.#index = index;
        }
        return this.#list[index];
    }

    /**
     * Set the position of the iterator.
     * @param index The new {@link LoopIterator.index} of the iterator
     */
    setPosition(index: number): void {
        validateInt(index, "index", 0, this.#list.length - 1);
        this.#index = index;
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.toJSON());
    }

    /** Return an object representation of this instance. */
    toJSON() {
        return {
            list: this.list,
            index: this.index,
        };
    }
}

/**
 * Generate a list of unique length-1 UTF16 characters.
 * @param start - The starting value of the to-be explored unicode character codes
 * @param indices - An array with UTF16 character codes, excluding an offset as defined by `start`
 * @returns A list of unique UTF16 characters with the same length as `indices`
 */
export function generateIDs(
    start: number,
    indices: readonly number[],
): string[] {
    validateInt(start, "start", 0, 2**16 - 1);
    if (!isArray(indices)) {
        throw new TypeError(`Invalid "indices" type: ${typeof indices}`);
    }

    const stop = start + Math.max(0, ...indices) + 1;
    validateInt(stop, "stop", start + 1, 2**16 - 1);

    const charcodeRange = range(start, stop);
    return indices.map(i => String.fromCharCode(charcodeRange[i]));
}

/**
 * Check whether the passed object as an iterable.
 * @param obj The to-be checked object
 * @returns Whether the passed object as an iterable.
 */
export function isIterable(obj: unknown): obj is Iterable<unknown> {
    return (Symbol.iterator in Object(obj));
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
    /** Length-4 UTF16 string encoding the major, minor, micro & beta components of the version. */
    readonly #string: string;

    constructor(major: number = 0, minor: number = 0, micro: number = 0, beta: boolean = false) {
        validateInt(major, "major", 0, 2**16 - 1);
        validateInt(minor, "minor", 0, 2**16 - 1);
        validateInt(micro, "micro", 0, 2**16 - 1);
        if (typeof beta !== "boolean") {
            throw new TypeError(`Invalid "beta" type: ${typeof beta}`);
        }

        this.major = major;
        this.minor = minor;
        this.micro = micro;
        this.beta = beta;
        this.#string = [major, minor, micro].map(i => String.fromCharCode(i)) + String.fromCharCode(beta ? 0 : 1);
        Object.freeze(this);
    }

    /**
     * Check whether two versions are equal
     * @param other The to-be compared version
     * @returns Whether `this` and `other` are the same version
     */
    equal(other: Version): boolean {
        return other instanceof Version ? this.valueOf() === other.valueOf() : false;
    }

    /**
     * Check whether this version is greater than the other
     * @param other The to-be compared version
     * @returns Whether the version of `this` is greater than `other`
     */
    greater(other: Version): boolean {
        return other instanceof Version ? this.valueOf() > other.valueOf() : false;
    }

    /**
     * Check whether this version is lesser than the other
     * @param other The to-be compared version
     * @returns Whether the version of `this` is lesser than `other`
     */
    lesser(other: Version): boolean {
        return other instanceof Version ? this.valueOf() < other.valueOf() : false;
    }

    /**
     * Check whether this version is greater than or equal to the other
     * @param other The to-be compared version
     * @returns Whether the version of `this` is greater than or equal to `other`
     */
    greaterOrEqual(other: Version): boolean {
        return other instanceof Version ? this.valueOf() >= other.valueOf() : false;
    }

    /**
     * Check whether this version is lesser than or equal to the other
     * @param other The to-be compared version
     * @returns Whether the version of `this` is lesser than or equal to `other`
     */
    lesserOrEqual(other: Version): boolean {
        return other instanceof Version ? this.valueOf() <= other.valueOf() : false;
    }

    /**
     * Construct a new instance from the passed version string
     * @param version The to-be parsed version
     * @returns A new {@link Version} instance
     */
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

    /**
     * Construct a new instance from the passed BC version string
     * @param version The to-be parsed BC version
     * @returns A new {@link Version} instance
     */
    static fromBCVersion(version: string): Version {
        const match = GameVersionFormat.exec(version);
        if (match === null) {
            throw new Error(`Invalid BC version: "${version}"`);
        }
        return new Version(Number(match[1]), 0, 0, match[2] !== undefined);
    }

    /** Return a string representation of this instance. */
    toString(): string {
        return toStringTemplate(typeof this, this.toJSON());
    }

    /** Return a length-4 UTF16 string encoding the major, minor, micro & beta components of the version */
    valueOf(): string {
        return this.#string;
    }

    /** Return an object representation of this instance. */
    toJSON() {
        return {
            major: this.major,
            minor: this.minor,
            micro: this.micro,
            beta: this.beta,
        };
    }
}

/**
 * A more readonly-friendly version of {@link Array.isArray}.
 * @param arg The to-be checked object
 * @returns Whether the passed object is an array
 */
export function isArray(arg: unknown): arg is readonly unknown[] {
    return Array.isArray(arg);
}

/**
 * A version of {@link Object.keys} more aimed at records with literal string keys.
 * @param arg A record
 * @returns A list with all keys in the passed record
 */
export function keys<KT extends string>(arg: Partial<Record<KT, unknown>>): KT[] {
    return <KT[]>Object.keys(arg);
}

/**
 * A version of {@link Object.entries} more aimed at records with literal string keys.
 * @param arg A record
 * @returns A list of 2-tuples with all key/value pairs in the passed record
 */
export function entries<KT extends string, VT>(arg: Partial<Record<KT, VT>>): [KT, VT][] {
    return <[KT, VT][]>Object.entries(arg);
}

/**
 * A version of {@link Object.fromEntries} more aimed at records with literal string keys.
 * @param arg A list of 2-tuples
 * @returns A record constructed from the passed list
 */
export function fromEntries<KT extends string, VT>(arg: Iterable<readonly [KT, VT]>): Record<KT, VT> {
    return <Record<KT, VT>>Object.fromEntries(arg);
}

/**
 * A version of {@link Array.includes} that serves as a type guard.
 * @param arg An array
 * @param value The element to search for
 * @returns Whether the passed array includes the passed value
 */
export function includes<T>(arg: readonly T[], value: unknown): value is T {
    return arg.includes(<T>value);
}

/**
 * A version of {@link Number.isInteger} that serves as a type guard.
 * @param arg A numeric value
 * @returns Whether the passed numeric value is an integer
 */
export function isInteger(arg: unknown): arg is number {
    return Number.isInteger(arg);
}
