/** Main module for managing all crafting-related additions */

import { MBS_MOD_API, waitFor, padArray, logger } from "../common";
import { settingsMBSLoaded, bcLoaded } from "../common_bc";
import { pushMBSSettings, SettingsType } from "../settings";

export const BC_SLOT_MAX_ORIGINAL = 80;
const MBS_SLOT_MAX_ORIGINAL = 160;

/** Control character used for marking extended crafted item descriptions. */
const EXTENDED_DESCRIPTION_MARKER = "\x00";

/** A set of all illegal non-control (extended) ASCII character codes. */
const CHAR_CODE_ILLEGAL = Object.freeze(new Set([
    "§".charCodeAt(0), // `CraftingSerializeItemSep`
    "¶".charCodeAt(0), // `CraftingSerializeFieldSep`
    127, // Delete
    129, // Unused
    141, // Unused
    143, // Unused
    144, // Unused
    157, // Unused
]));

/** Serialize the passed crafting items. */
function craftingSerialize(items: null | readonly (null | CraftingItem)[]): string {
    if (items == null) {
        return "";
    }
    return items.map(C => C?.Item ? CraftingSerialize(C) : "").join(CraftingSerializeItemSep);
}

/**
 * Load crafting items from the MBS cache.
 * @param character The character in question
 * @param craftingCache The crafting cache
 */
function loadCraftingCache(character: Character, craftingCache: string): void {
    character.Crafting ??= [];
    padArray(character.Crafting, BC_SLOT_MAX_ORIGINAL, null);
    if (!craftingCache) {
        return;
    }

    const packet = LZString.compressToUTF16(craftingCache);
    const data: (null | CraftingItem)[] = CraftingDecompressServerData(packet);
    const oldCrafts = new Set(character.Crafting.map(i => JSON.stringify(i)));

    let refresh = false;
    for (const [i, item] of data.entries()) {
        if (item == null) {
            continue;
        }

        // Make sure that the item is a valid craft
        validate: switch (CraftingValidate(item)) {
            case CraftingStatusType.OK: {
                const key = JSON.stringify(item);
                if (oldCrafts.has(key)) {
                    logger.warn(`Filtering duplicate crafting item ${BC_SLOT_MAX_ORIGINAL + i}: "${item.Name} (${item.Item})"`);
                    data[i] = null;
                }
                break validate;
            }
            case CraftingStatusType.ERROR: {
                const key = JSON.stringify(item);
                if (oldCrafts.has(key)) {
                    logger.warn(`Filtering duplicate crafting item ${BC_SLOT_MAX_ORIGINAL + i}:"${item.Name} (${item.Item})"`);
                    data[i] = null;
                } else {
                    refresh = true;
                }
                break validate;
            }
            case CraftingStatusType.CRITICAL_ERROR:
                logger.error(`Removing corrupt crafting item ${BC_SLOT_MAX_ORIGINAL + i}: "${item?.Name} (${item?.Item})"`);
                data[i] = null;
                break validate;
        }
    }

    for (const item of data) {
        // Too many items, try to remove `null` entries or skip the rest if not possible
        if (character.Crafting.length >= MBS_SLOT_MAX_ORIGINAL) {
            if (item == null) {
                continue;
            } else if (character.Crafting.includes(null, BC_SLOT_MAX_ORIGINAL)) {
                logger.warn(`Found more than ${MBS_SLOT_MAX_ORIGINAL} crafting items, trimming down [80, 160)-interval null entries`);
                character.Crafting = character.Crafting.filter((item, i) => i < BC_SLOT_MAX_ORIGINAL || item != null);
            } else if (character.Crafting.includes(null)) {
                logger.warn(`Found more than ${MBS_SLOT_MAX_ORIGINAL} crafting items, trimming down [0, 80)-interval null entries`);
                character.Crafting = character.Crafting.filter(item => item != null);
            } else {
                const n = character.Crafting.length - MBS_SLOT_MAX_ORIGINAL;
                logger.error(`Found more than ${MBS_SLOT_MAX_ORIGINAL} crafting items, the last ${n} will be deleted`);
                break;
            }
        } else {
            character.Crafting.push(item);
        }
    }

    /**
     * One or more validation errors were encountered that were successfully resolved;
     * push the fixed items back to the server
     */
    if (refresh && character.IsPlayer()) {
        CraftingSaveServer();
    }
}

function descriptionDecode(description: string): string {
    if (!description) {
        return "";
    }

    if (description.startsWith(EXTENDED_DESCRIPTION_MARKER)) {
        return Array.from(description.slice(1, 200)).flatMap(char => {
            const id = char.charCodeAt(0);
            const bit1 = Math.floor(id / 256);
            const bit2 = id - bit1 * 256;
            return [
                bit1 < 32 ? "" : String.fromCharCode(bit1),
                bit2 < 32 ? "" : String.fromCharCode(bit2),
            ];
        }).join("");
    } else {
        return description.slice(0, 200);
    }
}

/** Check whether it the passed character code fall in the (extended) ASCII range and does not contain any control- or otherwise illegal characters. */
function charCodeIsValid(charCode: number): boolean {
    return charCode >= 32 && charCode < 256 && !CHAR_CODE_ILLEGAL.has(charCode);
}

function descriptionEncode(description: string): string {
    if (!description) {
        return "";
    }

    let ret = EXTENDED_DESCRIPTION_MARKER;
    let i = 0;
    const iMax = Math.min(199, Math.ceil(description.length / 2));
    while (i < iMax) {
        const charCodeA = description.charCodeAt(i * 2);
        const charCodeB = description.charCodeAt(1 + i * 2);
        if (charCodeIsValid(charCodeA)) {
            if (Number.isNaN(charCodeB)) {
                ret += String.fromCharCode(charCodeA * 256);
            } else if (charCodeIsValid(charCodeB)) {
                ret += String.fromCharCode(charCodeA * 256 + charCodeB);
            }
        }
        i++;
    }
    return ret;
}

waitFor(bcLoaded).then(() => {
    logger.log("Initializing crafting hooks");

    MBS_MOD_API.patchFunction("CraftingClick", {
        "if (CraftingOffset < 0) CraftingOffset = 80 - 20;":
            `if (CraftingOffset < 0) CraftingOffset = ${MBS_SLOT_MAX_ORIGINAL} - 20;`,
        "if (CraftingOffset >= 80) CraftingOffset = 0;":
            `if (CraftingOffset >= ${MBS_SLOT_MAX_ORIGINAL}) CraftingOffset = 0;`,
    });

    MBS_MOD_API.patchFunction("CraftingRun", {
        "/ ${80 / 20}.":
            `/ ${MBS_SLOT_MAX_ORIGINAL / 20}.`,
    });

    if (GameVersion === "R108") {
        MBS_MOD_API.patchFunction("DialogDrawCrafting", {
            'DrawTextWrap(InterfaceTextGet("CraftingDescription").replace("CraftDescription", Item.Craft.Description.substring(0, 200)), 1050, 600, 900, 125, "White", null, 4, 23, "Top");':
                ";",
        });

        MBS_MOD_API.hookFunction("DialogDrawCrafting", 0, ([C, item, ...args], next) => {
            if (typeof item?.Craft?.Description === "string") {
                const nLines = item.Craft.Description.startsWith(EXTENDED_DESCRIPTION_MARKER) ? 6 : 4;
                DrawTextWrap(
                    InterfaceTextGet("CraftingDescription").replace("CraftDescription", descriptionDecode(item.Craft.Description)),
                    1050, 600, 900, 125, "White", undefined, nLines, 23, "Top",
                );
            }
            return next([C, item, ...args]);
        });

        function loadCallback(mutations: null | readonly MutationRecord[], observer: MutationObserver) {
            const descriptionInput = document.getElementById(CraftingID.descriptionInput);
            if (!(descriptionInput instanceof HTMLTextAreaElement)) {
                observer.disconnect();
                return;
            }

            if (Player.MBSSettings.ExtendedCraftingDescription) {
                descriptionInput.maxLength = 398;
                // descriptionInput.pattern = "^[\x20-\xFF]+$"; FIXME
            }
            descriptionInput.value = descriptionDecode(descriptionInput.value);
            observer.disconnect();
        }

        MBS_MOD_API.hookFunction("CraftingLoad", 0, (args, next) => {
            const ret = next(args);
            const root = document.getElementById(CraftingID.root);
            if (!root) {
                return ret;
            }

            const observer = new MutationObserver(loadCallback);
            if ((root.ariaBusy ?? "false") === "false") {
                loadCallback(null, observer);
            } else {
                observer.observe(root, { attributes: true, attributeFilter: ["aria-busy"] });
            }

            return ret;
        });

        MBS_MOD_API.hookFunction("CraftingEventListeners._ClickAsset", 0, (args, next) => {
            const ret = next(args);
            if (CraftingSelectedItem) {
                ElementValue(CraftingID.descriptionInput, descriptionDecode(CraftingSelectedItem.Description));
            }
            return ret;
        });

        MBS_MOD_API.hookFunction("CraftingEventListeners._ChangeDescription", 0, (args, next) => {
            const ret = next(args);
            if (CraftingSelectedItem && Player.MBSSettings.ExtendedCraftingDescription) {
                CraftingSelectedItem.Description = descriptionEncode(ElementValue(CraftingID.descriptionInput));
            }
            return ret;
        });
    }

    waitFor(settingsMBSLoaded).then(() => {
        logger.log("Initializing crafting cache");

        // Mirror the extra MBS-specific crafted items to the MBS settings
        MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
            const craftingBackup = Player.Crafting;
            Player.Crafting = craftingBackup?.slice(0, BC_SLOT_MAX_ORIGINAL);
            next(args);
            Player.Crafting = craftingBackup;

            const cache = craftingSerialize(
                Player.Crafting ? Player.Crafting.slice(BC_SLOT_MAX_ORIGINAL) : null,
            );
            if (cache != Player.MBSSettings.CraftingCache) {
                Player.MBSSettings.CraftingCache = cache;
                pushMBSSettings([SettingsType.SETTINGS]);
            }
        });

        loadCraftingCache(Player, Player.MBSSettings.CraftingCache);
    });
});
