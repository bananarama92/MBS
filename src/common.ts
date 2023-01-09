"use strict";

import bcModSdk from "bondage-club-mod-sdk";

/** An array with all alpha-numerical characters. */
const ALPHA_NUMERICAL: readonly string[] = [
    "A", "B", "C", "D",
    "E", "F", "G", "H",
    "I", "J", "K", "L",
    "M", "N", "O", "P",
    "Q", "R", "S", "T",
    "U", "V", "W", "X",
    "Y", "Z", "1", "2",
    "3", "4", "5", "6",
    "7", "8", "9", "0",
];

/**
 * Return an object that produces a generator of integers from start (inclusive) to stop (exclusive) by step.
 * @param start - The starting value
 * @param stop - The maximum value
 * @param step - The step size
 */
export function* range(start: number, stop: number, step: number = 1): Generator<number, void, unknown> {
    if (typeof start !== "number") throw `Invalid "start" type: ${typeof start}`;
    if (typeof stop !== "number") throw `Invalid "stop" type: ${typeof stop}`;
    if (typeof step !== "number") throw `Invalid "step" type: ${typeof step}`;

    let i = start;
    while (start < stop) {
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
        throw `Invalid "list" type: ${typeof list}`;
    } else if (list.length === 0) {
        throw 'Passed "list" must contain at least 1 item';
    }
    return list[Math.round(Math.random() * (list.length - 1))];
}

/**
 * Generate a password consisting of `n` random alpha-numerical characters.
 * @param n The length of the password; must be in the [0, 8] interval
 * @returns the newly generated password
 */
export function getRandomPassword(n: number): string {
    if (n < 0) {
        throw `Invalid "n" value: ${typeof n}`;
    }

    let ret = "";
    for (const _ of range(0, n)) {
        ret += randomElement(ALPHA_NUMERICAL);
    }
    return ret;
}

/**
 * Convert the passed BC version into a 2-tuple with the major- and beta-version
 * @param version The to-be parsed version
 * @returns A 2-tuple with the major- and beta version
 */
function parseVersion(version: string): [number, number] {
    const pattern = /^(R)(\d+)(Beta(\d+))?$/;
    const match = pattern.exec(version);
    if (match === null) {
        throw `Failed to match the passed version: ${version}`;
    }
    return [
        Number(match[2]),
        Number((match[3] === undefined) ? Infinity : match[4]),
    ];
}

/**
 * The BC version as a 2-tuple with the major- and beta-version.
 * The beta version is set to `Inifinity` for full releases.
 */
export const BC_VERSION: readonly [number, number] = parseVersion(GameVersion);

/** Return a record with the BC versions of all players. */
export function getVersions(): Record<string, string> {
    const rec: Record<string, string> = {};
    Character.forEach((c) => {
        if (c.OnlineSharedSettings) {
            rec[c.Name] = c.OnlineSharedSettings.GameVersion;
        }
    });
    return rec;
}

/** The MBS version. */
export const MBS_VERSION = "0.1.0.dev0";

/** The MBS {@link ModSDKGlobalAPI} instance. */
export const MBS_MOD_API = bcModSdk.registerMod({
    name: "MBS",
    fullName: "Maid's Bondage Scripts",
    repository: "https://github.com/bananarama92/MBS",
    version: MBS_VERSION,
});
