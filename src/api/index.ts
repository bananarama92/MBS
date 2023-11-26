import { logger, waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";
import * as wheelOutfits from "./wheel_outfits";

export { wheelOutfits };

/**
 * The version of the MBS API.
 *
 * * Changes or removals are accompanied by a `major` increment (and resetting `minor` back to 0)
 * * Additions are only accompanied by a `minor` increment
 */
export const API_VERSION = Object.freeze({
    /** The major API versions; increments are reserved for changes and removals */
    major: 1,
    /** The major API versions; increments are reserved for additions */
    minor: 1,
}) satisfies typeof mbs.API_VERSION;

/**
 * Return MBS debug output in human-readable, stringified form.
 * @note The API provides no guarantees regarding the outputs machine readability, and MBS is free to change its structure at any point without prior warning
 * @returns The MBS debug output in stringified form
 */
export const getDebug: typeof mbs.getDebug = function getDebug() {
    return JSON.stringify({
        log: logger,
        settings: Player.MBSSettings,
    }, undefined, 4);
};

// Register the debugger to FUSAM
waitFor(settingsMBSLoaded).then(() => {
    if (typeof FUSAM !== "undefined" && typeof FUSAM.registerDebugMethod === "function") {
        FUSAM.registerDebugMethod("mbs", getDebug);
    }
});
