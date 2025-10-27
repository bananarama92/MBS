import { logger } from "../common";
import { waitForBC } from "../common_bc";
import { mbsSettings } from "../settings";

import * as wheelOutfits from "./wheel_outfits";
import * as css from "./css";
import * as wheelEvents from "./wheel_events";

export { wheelOutfits, css, wheelEvents };

/**
 * The version of the MBS API.
 *
 * - Changes or removals are accompanied by a `major` increment (and resetting `minor` back to 0)
 * - Additions are only accompanied by a `minor` increment
 */
export const API_VERSION = Object.freeze({
    /** The major API versions; increments are reserved for changes and removals */
    major: 1,
    /** The minor API versions; increments are reserved for additions */
    minor: 5,
}) satisfies typeof mbs.API_VERSION;

function jsonStringifier(key: string, value: any) {
    if (value instanceof Set) {
        return Array.from(value);
    } else if (value instanceof Map) {
        return Object.fromEntries(value);
    } else if (value instanceof Error) {
        return { ...value };
    } else if (value instanceof Date) {
        return value.toString();
    } else {
        return value;
    }
}

/**
 * Return MBS debug output in human-readable, JSON-safe, stringified form.
 *
 * Note that the API provides no guarantees regarding the outputs machine readability (beyond being JSON-safe), and MBS is free to change its structure at any point without prior warning
 * @returns The MBS debug output in stringified form
 */
export const getDebug: typeof mbs.getDebug = function getDebug() {
    return JSON.stringify({
        log: logger,
        settings: mbsSettings,
    }, jsonStringifier, 4);
};

// Register the debugger to FUSAM
waitForBC("api", {
    async afterLogin() {
        if (typeof FUSAM !== "undefined" && typeof FUSAM.registerDebugMethod === "function") {
            try {
                FUSAM.registerDebugMethod("mbs", getDebug);
            } catch (error) {
                logger.error("Failed to register FUSAM debug method", error);
            }
        }
    },
});
