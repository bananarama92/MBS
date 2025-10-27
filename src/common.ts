/** Miscellaneous common functions and classes */

import { range, sample } from "lodash-es";
import bcModSdk from "bondage-club-mod-sdk";

import { isArray, includes, keys, entries, fromEntries, logger, isInteger, Version, validateInt, toStringTemplate, has } from "./lpgl/common";

export { isArray, includes, keys, entries, fromEntries, logger, isInteger, Version, validateInt, toStringTemplate, has };

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
 * Generate a password consisting of `n` random latin characters.
 * @param n The length of the password; must be in the [0, 8] interval
 * @returns the newly generated password
 */
export function getRandomPassword(n: number): string {
    validateInt(n, "n", 0, 8);
    return range(0, n).map(_ => sample(ALPHABET)).join("");
}

export const MBS_MOD_INFO = Object.freeze({
    name: "MBS",
    fullName: "Maid's Bondage Scripts",
    repository: "https://github.com/bananarama92/MBS",
    version: MBS_VERSION,
}) satisfies import("bondage-club-mod-sdk").ModSDKModInfo;

/** The MBS {@link ModSDKGlobalAPI} instance. */
export const MBS_MOD_API = bcModSdk.registerMod(MBS_MOD_INFO);

/** A proxy for lazily accessing the BCX mod API. */
class ModAPIProxy implements Omit<BCX_ModAPI, "sendQuery"> {
    /** The lazily loaded BCX mod API */
    #api: null | BCX_ModAPI = null;
    #isLogged = false;

    get api() {
        if (this.#api !== null) {
            return this.#api;
        } else if (typeof bcx === "undefined" || !CommonIsObject(bcx)) {
            if (!this.#isLogged) {
                this.#isLogged = true;
                logger.debug("Failed to detect BCX");
            }
            return this.#api;
        }

        const version = bcx.versionParsed ?? {};
        if (
            version.major === 1
            && version.minor >= 1
            && (version.minor > 1 || version.patch >= 7)
        ) {
            if (!this.#isLogged) {
                this.#isLogged = true;
                logger.debug(`Detecting supported BCX version ${bcx.version}`);
            }
            return this.#api = bcx.getModApi("MBS");
        } else {
            if (!this.#isLogged) {
                this.#isLogged = true;
                logger.debug(`Detecting unsupported BCX version ${bcx.version}; requires [1.1.7, 2.0)`);
            }
            return this.#api;
        }
    }

    get modName(): string { return "MBS"; }

    getRuleState<T extends BCX_Rule>(rule: T): BCX_RuleStateAPI<T> | null {
        return this.api?.getRuleState(rule) ?? null;
    }

    getCurseInfo(group: AssetGroupName): BCX_CurseInfo | null {
        return this.api?.getCurseInfo(group) ?? null;
    }

    sendQuery<T extends keyof BCX_queries>(
        type: T,
        data: BCX_queries[T][0],
        target: number | "Player",
        timeout?: number,
    ): Promise<null | BCX_queries[T][1]> {
        return this.api?.sendQuery(type, data, target, timeout) ?? Promise.resolve(null);
    }

    on<K extends keyof BCX_Events>(s: K, listener: (v: BCX_Events[K]) => void): () => void {
        return this.api?.on(s, listener) ?? (() => undefined);
    }

    onAny(listener: (value: BCXAnyEvent<BCX_Events>) => void): () => void {
        return this.api?.onAny(listener) ?? (() => undefined);
    }
}

/** A lazily-loaded version of the BCX mod API */
export const BCX_MOD_API = new ModAPIProxy();

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
