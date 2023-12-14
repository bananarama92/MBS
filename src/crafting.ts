/** Main module for managing all crafting-related additions */

"use strict";

import { MBS_MOD_API, waitFor, padArray, logger } from "common";
import { settingsMBSLoaded } from "common_bc";
import { pushMBSSettings, SettingsType } from "settings";

export const BC_SLOT_MAX_ORIGINAL = 80;
const MBS_SLOT_MAX_ORIGINAL = 160;

/** Serialize the passed crafting items. */
function craftingSerialize(items: null | readonly (null | CraftingItem)[]): string {
    if (items == null) {
        return "";
    }
    return items.map(C => {
        let P = "";
        if (C?.Item) {
            if (GameVersion === "R98") {
                P += C.Item + "¶";
                P += (C.Property == null ? "" : C.Property) + "¶";
                P += (C.Lock == null ? "" : C.Lock) + "¶";
                P += (C.Name == null ? "" : C.Name.replace("¶", " ").replace("§", " ")) + "¶";
                P += (C.Description == null ? "" : C.Description.replace("¶", " ").replace("§", " ")) + "¶";
                P += (C.Color == null ? "" : C.Color.replace("¶", " ").replace("§", " ")) + "¶";
                P += ((C.Private != null && C.Private) ? "T" : "") + "¶";
                P += (C.Type == null ? "" : C.Type.replace("¶", " ").replace("§", " ")) + "¶";
                P += "¶";
                P += (C.ItemProperty == null ? "" : JSON.stringify(C.ItemProperty));
            } else {
                P += CraftingSerialize(C);
            }
        }
        return P;
    }).join("§");
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
    for (const [i, item] of CommonEnumerate(data)) {
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

waitFor(settingsMBSLoaded).then(() => {
    logger.log("Initializing crafting hooks");

    // Mirror the extra MBS-specific crafted items to the MBS settings
    MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
        next(args);

        const cache = craftingSerialize(
            Player.Crafting ? Player.Crafting.slice(BC_SLOT_MAX_ORIGINAL) : null,
        );
        if (cache != Player.MBSSettings.CraftingCache) {
            Player.MBSSettings.CraftingCache = cache;
            pushMBSSettings([SettingsType.SETTINGS]);
        }
    });

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

    loadCraftingCache(Player, Player.MBSSettings.CraftingCache);
});
