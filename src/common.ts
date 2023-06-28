/** Miscellaneous common functions and classes */

"use strict";

import { range, zip, isEqual, random } from "lodash-es";

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
const MBS_VERSION_PATTERN = /^(v?)([0-9]+)\.([0-9]+)\.([0-9]+)(\.dev0)?$/;

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
 */
export async function waitFor(predicate: () => boolean, timeout: number = 10): Promise<boolean> {
    while (!predicate()) {
        await new Promise((resolve) => setTimeout(resolve, timeout));
    }
    return true;
}

/** The MBS version. */
export const MBS_VERSION = "0.6.7";

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
        if (this.#api === null && typeof bcx !== "undefined") {
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
 * @param start - The starting value of the to-be explored unicode character codes
 * @param indices - An array with UTF16 character codes, excluding an offset as defined by `start`
 * @returns A list of unique UTF16 characters with the same length as `indices`
 */
export function generateIDs(
    start: number,
    indices: readonly number[],
): string[] {
    validateInt(start, "start", 0, 2**16);
    if (!isArray(indices)) {
        throw new TypeError(`Invalid "indices" type: ${typeof indices}`);
    }

    const stop = start + Math.max(0, ...indices) + 1;
    validateInt(stop, "stop", start + 1, 2**16);

    const charcodeRange = range(start, stop);
    return indices.map(i => String.fromCharCode(charcodeRange[i]));
}

/** Check whether the passed object as an iterable. */
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

    /** Return an array with all version values. */
    values(): [major: number, minor: number, micro: number, beta: boolean] {
        return [this.major, this.minor, this.micro, this.beta];
    }

    /** Check whether two versions are equal */
    equal(other: Version): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        return isEqual(this.values(), other.values());
    }

    /** Check whether this version is greater than the other */
    greater(other: Version): boolean {
        if (!(other instanceof Version)) {
            return false;
        }
        const attrList = <[number | boolean, number | boolean][]>zip(this.values(), other.values());
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

    /** Construct a new instance from the passed BC version string */
    static fromBCVersion(version: string): Version {
        const match = GameVersionFormat.exec(version);
        if (match === null) {
            throw new Error(`Invalid BC "version": ${version}`);
        }
        return new Version(Number(match[1]), 0, 0, match[2] !== undefined);
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

/** A more readonly-friendly version of {@link Array.isArray}. */
export function isArray(arg: unknown): arg is readonly unknown[] {
    return Array.isArray(arg);
}

/** A version of {@link Object.keys} more aimed at records with literal string keys. */
export function keys<KT extends string>(arg: Partial<Record<KT, unknown>>): KT[] {
    return <KT[]>Object.keys(arg);
}

/** A version of {@link Object.entries} more aimed at records with literal string keys. */
export function entries<KT extends string, VT>(arg: Partial<Record<KT, VT>>): [KT, VT][] {
    return <[KT, VT][]>Object.entries(arg);
}

/** A version of {@link Object.fromEntries} more aimed at records with literal string keys. */
export function fromEntries<KT extends string, VT>(arg: Iterable<readonly [KT, VT]>): Record<KT, VT> {
    return <Record<KT, VT>>Object.fromEntries(arg);
}

/** A version of {@link Array.includes} that serves as a type guard. */
export function includes<T>(arg: readonly T[], value: unknown): value is T {
    return arg.includes(<T>value);
}

/** A version of {@link Number.isInteger} that serves as a type guard. */
export function isInteger(arg: unknown): arg is number {
    return Number.isInteger(arg);
}

/**
 * Return the (stringified and padded) base-16 CRC32 hash of the passed function.
 * @param func - The function in question
 * @returns The computed hash
 */
export function getFunctionHash(func: (...args: unknown[]) => unknown): string {
    if (typeof func !== "function") {
        throw new TypeError(`"func" expected a function; observed type: ${typeof func}`);
    }

    let crc = 0 ^ -1;
    const encoder = new TextEncoder();
    for (const b of encoder.encode(func.toString())) {
        let c = (crc ^ b) & 0xff;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
        }
        crc = (crc >>> 8) ^ c;
    }
    return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0").toUpperCase();
}
