/** Various sanity checks for BC */

import { Version, MBS_MOD_API, logger } from "./common";

/**
 * Check whether all builtin wheel of fortune IDs are (extended) ASCII characters.
 * @returns Whether the validation succeeded
 */
export function validateBuiltinWheelIDs(): boolean {
    const non_ascii = String.fromCharCode(2**8);
    const option = WheelFortuneOption.find(i => i.Custom === undefined && i.ID >= non_ascii);
    if (option !== undefined) {
        logger.warn(
            "Aborting wheel of fortune hook initialization: "
            + "Found one or more builtin wheel of fortune option-IDs outside of the extended ASCII range",
            option,
        );
        return false;
    } else {
        return true;
    }
}

/** The minimum supported BC version. */
export const BC_MIN_VERSION = 111 satisfies number;

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
type HashList = readonly [Rxx: string, ...Ryy: (null | string)[]];

/** A record with supported function hashes for each MBS-hooked function */
const HOOK_FUNC_HASHES = (() => {
    const hashes: [keyof typeof globalThis, HashList][] = [
        ["CraftingSaveServer", ["025B434F"]],
        ["CraftingClick", ["5E7225EA"]],
        ["CraftingRun", ["4CD7AB08"]],
        ["SpeechTransformProcess", ["666DDA2F"]],
        ["SpeechTransformGagGarble", ["691A05BF"]],
        ["WheelFortuneLoad", ["EA252C35"]],
        ["WheelFortuneClick", ["D368BBF2"]],
        ["WheelFortuneRun", ["D4DF7BB8"]],
        ["WheelFortuneMouseUp", ["887E5D09"]],
        ["WheelFortuneMouseDown", ["78354D35"]],
        ["WheelFortuneCustomizeLoad", ["97F0A81E"]],
        ["WheelFortuneDrawWheel", ["B21DAEA9"]],
    ];
    return Object.freeze(Object.fromEntries(hashes.map(item => {
        const [key, value] = item;
        const valueSet = new Set(<string[]>value.filter(i => i != null));
        return [key, Object.freeze(valueSet)];
    })));
})();

/** Helper function for generating a new set of {@link HOOK_FUNC_HASHES} values after a release. */
export function generateNewHookFuncHashes(): void {
    let ret = "";
    for (const [funcName, _] of Object.entries(HOOK_FUNC_HASHES)) {
        const funcHash = MBS_MOD_API.getOriginalHash(funcName);
        ret += `["${funcName}", ["${funcHash}"]],\n`;
    }
    logger.log(ret);
}

/** Check whether all MBS-hooked functions have a supported hash. */
export function validateHookHashes(): void {
    const unkownHashes: Record<string, string> = {};
    for (const [funcName, refHashes] of Object.entries(HOOK_FUNC_HASHES)) {
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
