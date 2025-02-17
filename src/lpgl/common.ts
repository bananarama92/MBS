import { MBS_MOD_API } from "../common";

/**
 * A more readonly-friendly version of {@link Array.isArray}.
 * @param arg The to-be checked object
 * @returns Whether the passed object is an array
 */
export const isArray = Array.isArray as (arg: unknown) => arg is readonly unknown[];

/**
 * A version of {@link Object.keys} more aimed at records with literal string keys.
 * @param arg A record
 * @returns A list with all keys in the passed record
 */
export const keys = Object.keys as <KT extends string>(arg: Partial<Record<KT, unknown>>) => KT[];

/**
 * A version of {@link Object.entries} more aimed at records with literal string keys.
 * @param arg A record
 * @returns A list of 2-tuples with all key/value pairs in the passed record
 */
export const entries = Object.entries as <KT extends string, VT>(arg: Partial<Record<KT, VT>>) => [KT, VT][];

/**
 * A version of {@link Object.fromEntries} more aimed at records with literal string keys.
 * @param arg A list of 2-tuples
 * @returns A record constructed from the passed list
 */
export const fromEntries = Object.fromEntries as <KT extends string, VT>(arg: Iterable<readonly [KT, VT]>) => Record<KT, VT>;

/**
 * A version of {@link Array.includes} that serves as a type guard.
 * @param arg An array
 * @param value The element to search for
 * @returns Whether the passed array includes the passed value
 */
export function includes<T>(arg: readonly T[], value: unknown): value is T {
    return arg.includes(value as T);
}

/**
 * A version of {@link Number.isInteger} that serves as a type guard.
 * @param arg A numeric value
 * @returns Whether the passed numeric value is an integer
 */
export const isInteger = Number.isInteger as (arg: unknown) => arg is number;

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
 * Wait for the passed predicate to evaluate to `true`.
 * @param predicate A predicate
 * @param timeout The timeout in milliseconds for when the predicate fails
 */
async function waitFor(predicate: () => boolean, timeout: number = 100) {
    while (!predicate()) {
        await new Promise(resolve => setTimeout(resolve, timeout));
    }
}

/**
 * Check whether an integer falls within the specified range and raise otherwise.
 * @param int The to-be validate integer
 * @param varName The name of the variable
 * @param min The minimum allowed value of the integer, defaults to {@link Number.MIN_SAFE_INTEGER}
 * @param max The maximum allowed value of the integer, defaults to {@link Number.MAX_SAFE_INTEGER}
 */
export function validateInt(
    int: number,
    varName: string,
    min: number = Number.MIN_SAFE_INTEGER,
    max: number = Number.MAX_SAFE_INTEGER,
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

/** Regular expression for the MBS version */
const MBS_VERSION_PATTERN = /^(v?)([0-9]+)\.([0-9]+)\.([0-9]+)(\.\S+)?$/;

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

/** The minimum supported BC version. */
export const BC_MIN_VERSION = 113 satisfies number;

const bcListenerNames = [
    "api",
    "backgrounds",
    "backport",
    "changelog",
    "crafting",
    "equipper",
    "fortune_wheel",
    "garbling",
    "mbs",
    "new_items_screen",
    "preset_screen",
    "settings",
    "settings_screen",
] as const;

type BCListenerNames = typeof bcListenerNames[number];

class BCListeners {
    /** A set with all BC listener names */
    readonly allNames = Object.freeze(new Set(bcListenerNames));
    /** The names of all yet to-be registered BC listeners */
    readonly expectedNames: Set<BCListenerNames>;
    /** The names of all registered BC listeners */
    readonly names: Set<BCListenerNames>;
    /** Listeners to be executed after the documents `DOMContentLoaded` event. */
    readonly afterLoad: Partial<Record<BCListenerNames, () => Promise<void>>>;
    /** Listeners to be executed after logging in and executing {@link afterLoad}. */
    readonly afterLogin: Partial<Record<BCListenerNames, () => Promise<void>>>;
    /** Listeners to be executed after setting up the MBS settings and executing {@link afterLogin}. */
    readonly afterMBS: Partial<Record<BCListenerNames, () => Promise<void>>>;

    constructor() {
        this.expectedNames = new Set(this.allNames);
        this.names = new Set;
        this.afterLoad = {};
        this.afterLogin = {};
        this.afterMBS = {};
    }

    toJSON() {
        return {
            allNames: Array.from(this.allNames).sort(),
            afterLoad: Object.keys(this.afterLoad).sort(),
            afterLogin: Object.keys(this.afterLogin).sort(),
            afterMBS: Object.keys(this.afterMBS).sort(),
        };
    }
}

const bcListeners = new BCListeners;

let mbsLoadingStarted = false;

async function contentLoadedListener() {
    if (mbsLoadingStarted) {
        return;
    } else {
        mbsLoadingStarted = true;
    }

    if (!GameVersionFormat.test(GameVersion)) {
        logger.error(`Detected an invalid BC version: "${GameVersion}"`);
        logger.log("Unloading MBS from Mod SDK");
        MBS_MOD_API.unload();
        window.alert(`Aborting MBS initialization\nMBS ${MBS_VERSION} detected an invalid BC version: "${GameVersion}"`);
        return;
    }

    const bc_version = Version.fromBCVersion(GameVersion);
    const bc_min_version = Version.fromBCVersion(`R${BC_MIN_VERSION}`);
    if (bc_version.lesser(bc_min_version)) {
        logger.error(`BC version "R${BC_MIN_VERSION}" or later required; detected "${GameVersion}"`);
        logger.log("Unloading MBS from Mod SDK");
        MBS_MOD_API.unload();
        window.alert(`Aborting MBS initialization\nMBS ${MBS_VERSION} requires BC version "R${BC_MIN_VERSION}" or later\nDetected BC version: "${GameVersion}"`);
        return;
    } else {
        logger.log(`Detected BC ${GameVersion}`);
    }

    logger.debug("Executing afterLoad hooks", Object.keys(bcListeners.afterLoad).sort());
    await Promise.all(Object.values(bcListeners.afterLoad).map(func => func()));

    await waitFor(() => Player.OnlineSharedSettings !== undefined && Player.ExtensionSettings !== undefined);
    logger.debug("Executing afterLogin hooks", Object.keys(bcListeners.afterLogin).sort());
    await Promise.all(Object.values(bcListeners.afterLogin).map(func => func()));

    await waitFor(() => Player.MBSSettings !== undefined);
    logger.debug("Executing afterMBS hooks", Object.keys(bcListeners.afterMBS).sort());
    await Promise.all(Object.values(bcListeners.afterMBS).map(func => func()));
};

/**
 * Register a BC event listener to-be executed once all listeners are registered and BC is loaded.
 *
 * Comes in three distinct flavors:
 * * `afterLoad`: to be executed after the documents `DOMContentLoaded` event.
 * * `afterLogin`: to be executed after logging in and running `afterLoad`.
 * * `afterMBS`: to be executed after setting up the MBS settings and running `afterLogin`.
 * @param name - The name of the to-be registered listener(s)
 * @param listeners - The to-be registered listener(s)
 * @returns Whether all listeners have been registered or not, starting their execution
 */
export function waitForBC(
    name: BCListenerNames,
    listeners: {
        afterLoad?: () => Promise<void>,
        afterLogin?: () => Promise<void>,
        afterMBS?: () => Promise<void>,
    },
) {
    if (bcListeners.names.has(name)) {
        throw new Error(`BC listener "${name}" has already been registered`);
    } else if (!bcListeners.expectedNames.has(name)) {
        throw new Error(`Unknown BC listener: "${name}"`);
    }

    bcListeners.names.add(name);
    bcListeners.expectedNames.delete(name);
    if (listeners.afterLoad) {
        bcListeners.afterLoad[name] = listeners.afterLoad;
    }
    if (listeners.afterLogin) {
        bcListeners.afterLogin[name] = listeners.afterLogin;
    }
    if (listeners.afterMBS) {
        bcListeners.afterMBS[name] = listeners.afterMBS;
    }

    if (bcListeners.expectedNames.size !== 0) {
        return false;
    }

    document.addEventListener("DOMContentLoaded", contentLoadedListener);
    if (document.readyState === "complete") {
        contentLoadedListener();
    }
    return true;
}
