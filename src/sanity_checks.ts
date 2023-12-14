/** Various sanity checks for BC */

"use strict";

import { Version, MBS_MOD_API, logger } from "common";

/**
 * Check whether all builtin wheel of fortune IDs are (extended) ASCII characters.
 * @returns Whether the validation succeeded
 */
export function validateBuiltinWheelIDs(): boolean {
    const non_ascii = String.fromCharCode(2**8);
    const option = WheelFortuneOption.find(i => i.Custom === undefined && i.ID >= non_ascii);
    if (option !== undefined) {
        logger.warn(
            "Aborting wheel of fortune module initialization: "
            + "Found a builtin wheel of fortune option-ID outside of the extended ASCII range",
            option,
        );
        return false;
    } else {
        return true;
    }
}

/** The minimum supported BC version. */
export const BC_MIN_VERSION = 99 satisfies number;

/**
 * Check whether the passed BC version is supported and raise otherwise.
 * @param version The to-be checked BC version
 */
export function validateBCVersion(version: string): void {
    const BC_VERSION = Version.fromBCVersion(version);
    const bc_min_version = Version.fromBCVersion(`R${BC_MIN_VERSION}`);
    if (BC_VERSION.lesser(bc_min_version)) {
        throw new Error(`BC ${GameVersion} detected; MBS requires version R${BC_MIN_VERSION} or later`);
    } else {
        logger.log(`Detected BC ${GameVersion}`);
    }
}

/** A list-type with hashes for the current release stable and, optionally, the next (beta) version(s). */
type HashList = readonly [
    Rxx: string,
    RyyBeta1?: null | string,
    RyyBeta2?: null | string,
    RyyBeta3?: null | string,
    RyyBeta4?: null | string,
    Ryy?: null | string,
];

/** A Map with supported function hashes for each MBS-hooked function */
const HOOK_FUNC_HASHES = (() => {
    const hashes: [string, HashList][] = [
        ["CraftingSaveServer", ["025B434F"]],
        ["CraftingClick", ["571D9763", "FF1A7B21"]],
        ["CraftingRun", ["5BE6E125"]],
        ["WheelFortuneLoad", ["204D57D4"]],
        ["WheelFortuneClick", ["16991349"]],
        ["WheelFortuneRun", ["E9E5F3D6"]],
        ["WheelFortuneMouseUp", ["1465BDFA"]],
        ["WheelFortuneMouseDown", ["306C80B6"]],
        ["WheelFortuneCustomizeLoad", ["97F0A81E"]],
    ];
    return Object.freeze(new Map(hashes.map(item => {
        const [key, value] = item;
        const valueSet = new Set(<string[]>value.filter(i => i != null));
        return [key, Object.freeze(valueSet)];
    })));
})();

/** Helper function for generating a new set of {@link HOOK_FUNC_HASHES} values after a release. */
export function generateNewHookFuncHashes(): void {
    let ret = "";
    for (const [funcName, _] of HOOK_FUNC_HASHES) {
        const funcHash = MBS_MOD_API.getOriginalHash(funcName);
        ret += `["${funcName}", ["${funcHash}"]],\n`;
    }
    logger.log(ret);
}

/** Check whether all MBS-hooked functions have a supported hash. */
export function validateHookHashes(): void {
    const unkownHashes: Record<string, string> = {};
    for (const [funcName, refHashes] of HOOK_FUNC_HASHES) {
        const funcHash = MBS_MOD_API.getOriginalHash(funcName);
        if (!refHashes.has(funcHash)) {
            unkownHashes[funcName] = funcHash;
        }
    }

    const unknownCount = Object.values(unkownHashes).length;
    if (unknownCount !== 0) {
        logger.warn(`Found ${unknownCount} patched functions with an unknown hash`, unkownHashes);
    }
}
