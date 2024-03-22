/** Module with functionality related to applying fortune wheel lock flags. */

import { validateInt, getRandomPassword } from "../common";
import { validateCharacter } from "../common_bc";

/**
 * Legacy fortune wheel flag from prior to MBS v0.6.0.
 * Note that it's order must *never* be changed.
 * @see {@link DEFAULT_FLAGS}
 */
const LEGACY_FLAGS = Object.freeze([
    "Exclusive", "5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "High Security",
] as const);

/**
 * New style fortune wheel flags from MBS v0.6.0.
 *
 * Used by {@link FWItemSet.toOptions} for assigning itemOption-IDs, relying on the following two properties:
 * - The order of list elements is *never* changed; new entries can be appended though
 * - The list consists of <= 16 elements
 */
export const DEFAULT_FLAGS: readonly Readonly<FWFlag>[] = Object.freeze([
    Object.freeze({ type: "ExclusivePadlock", description: "Exclusive", enabled: true }),
    Object.freeze({ type: "TimerPasswordPadlock", description: "Timer", time: 60 * 5, enabled: true }),
    Object.freeze({ type: "TimerPasswordPadlock", description: "Timer", time: 60 * 15, enabled: true }),
    Object.freeze({ type: "TimerPasswordPadlock", description: "Timer", time: 60 * 60, enabled: true }),
    Object.freeze({ type: "TimerPasswordPadlock", description: "Timer", time: 60 * 240, enabled: false }),
    Object.freeze({ type: "HighSecurityPadlock", description: "High security", enabled: false }),
    Object.freeze({ type: null, description: "No lock", enabled: false }),
]);

/**
 * Attach and set a timer lock to the passed item for the specified duration.
 * @param item The item in question
 * @param seconds The duration of the timer lock; its value must fall in the `[60, 240 * 60]` interval
 * @param character the character wearing the item
 */
export function equipTimerLock(item: Item, seconds: number, character: Character): void {
    validateInt(seconds, "seconds", 60, 240 * 60);

    // Equip the timer lock if desired and possible
    if (!equipLock(item, "TimerPasswordPadlock", character)) {
        return;
    }

    if (item.Property == null) item.Property = {};
    item.Property.RemoveTimer = CurrentTime + seconds * 1000;
    item.Property.RemoveItem = true;
    item.Property.LockSet = true;
    item.Property.Password = getRandomPassword(8);
}

/**
 * Attach a high security padlock to the passed item.
 * @param item The item in question
 * @param character
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
 * @param character
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

/**
 * Apply a flag-specific option to an item.
 * @param flag The to-be applied flag
 * @param item The item in question
 * @param character The character wearing the item
 */
export function applyFlag(flag: FWFlag, item: Item, character: Character): void {
    const flagType = flag.type;
    switch (flagType) {
        case "TimerPasswordPadlock":
            equipTimerLock(item, flag.time, character);
            break;
        case "ExclusivePadlock":
            equipLock(item, "ExclusivePadlock", character);
            break;
        case "HighSecurityPadlock":
            if (InventoryDoesItemAllowLock(item) && item.Craft) {
                item.Craft.Property = "Puzzling";
            }
            equipHighSecLock(item, character);
            break;
        case null:
            break;
        default:
            throw new Error(`Unknown flag type: ${flagType}`, flag);
    }
}

/**
 * Enable all passed flags whose index matches the passed index-list
 * @param flags The list of to-be updated flags
 * @param idx A list of indices denoting which flags should be enabled; all others will be disabled
 * @returns The originally passed list of flags, modified inplace
 */
export function enableFlags(flags: readonly FWFlag[], idx: readonly number[]): readonly FWFlag[] {
    flags.forEach((flag, i) => {
        flag.enabled = idx.includes(i);
    });
    return flags;
}

/**
 * Convert old style wheel of fortune flags into their post v0.6.0 counterpart.
 * @param flags Old style wheel of fortune flags from prior to MBS v0.6.0
 * @returns A list of post v0.6.0 wheel of fortune flags
 */
export function parseLegacyFlags(flags: readonly string[]): FWFlag[] {
    return DEFAULT_FLAGS.map((ref_flag, i) => {
        const flag = { ...ref_flag };
        flag.enabled = flags.includes(LEGACY_FLAGS[i]);
        return flag;
    });
}

export function getFlagDescription(flag: FWFlag): string {
    switch (flag.type) {
        case "ExclusivePadlock":
            return "Exclusive";
        case "HighSecurityPadlock":
            return "High Security";
        case "TimerPasswordPadlock":
            return `${Math.floor(flag.time / 60)} Minutes`;
        case null:
            return "No Lock";
        default:
            throw new Error(`Invalid flag type: ${(flag as any).type}`);
    }
}
