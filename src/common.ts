/** Miscellaneous common functions and classes */

"use strict";

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
 * Return an object that produces a generator of integers from start (inclusive) to stop (exclusive) by step.
 * @param start - The starting value
 * @param stop - The maximum value
 * @param step - The step size
 */
export function* range(
    start: number,
    stop: number,
    step: number = 1,
): Generator<number, void, unknown> {
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

/** The MBS version. */
export const MBS_VERSION = "0.3.3";

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
export function generateIDs(
    n: number,
    start: number = 0,
    exclude: null | readonly string[] = null,
): string[] {
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

/** Check whether the passed object as an iterable. */
export function isIterable(obj: unknown): obj is Iterable<any> {
    return (Symbol.iterator in Object(obj));
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
            [!this.beta, !other.beta],
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
