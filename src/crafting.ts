/** Main module for managing all crafting-related additions */

"use strict";

import { MBS_MOD_API, waitFor, padArray } from "common";
import { settingsMBSLoaded } from "common_bc";
import { pushMBSSettings, SettingsType } from "settings";

const BC_SLOT_MAX_ORIGINAL = 80;
const MBS_SLOT_MAX_ORIGINAL = 160;

/** Serialize the passed crafting items. */
function craftingSerialize(items: null | readonly (null | CraftingItem)[]): string {
    if (items == null) {
        return "";
    }
    return items.map(C => {
        let P = "";
        if (C?.Item) {
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
        }
        return P;
    }).join("§");
}

/**
 * Load crafting items from the MBS cache.
 * @param character The character in question
 * @param craftingCache The crafting cache
 */
function loadCraftingCache(character: Character, craftingCache: string = ""): void {
    character.Crafting ??= [];
    padArray(character.Crafting, BC_SLOT_MAX_ORIGINAL, null);
    if (!craftingCache) {
        return;
    }

    const packet = LZString.compressToUTF16(craftingCache);
    const data: (null | CraftingItem)[] = CraftingDecompressServerData(packet);
    const oldCrafts = new Set(character.Crafting.map(i => JSON.stringify(i)));
    let refresh = false;
    let i = -1;
    for (const item of data) {
        i += 1;

        // Make sure that the item is a valid craft
        switch (CraftingValidate(<CraftingItem>item)) {
            case CraftingStatusType.OK: {
                const key = JSON.stringify(item);
                if (oldCrafts.has(key)) {
                    data[i] = null;
                }
                break;
            }
            case CraftingStatusType.ERROR: {
                const key = JSON.stringify(item);
                if (oldCrafts.has(key)) {
                    data[i] = null;
                } else {
                    refresh = true;
                }
                break;
            }
            case CraftingStatusType.CRITICAL_ERROR:
                data[i] = null;
                break;
        }
    }
    for (const item of data) {
        // Too many items, try to remove `null` entries or skip the rest if not possible
        if (character.Crafting.length >= MBS_SLOT_MAX_ORIGINAL) {
            if (item == null) {
                continue;
            } else if (character.Crafting.includes(null, BC_SLOT_MAX_ORIGINAL)) {
                character.Crafting = character.Crafting.filter((item, i) => i < BC_SLOT_MAX_ORIGINAL || item != null);
            } else if (character.Crafting.includes(null)) {
                character.Crafting = character.Crafting.filter(item => item != null);
            } else {
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
    console.log("MBS: Initializing crafting hooks");

    // Mirror the extra MBS-specific crafted items to the MBS settings
    MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
        next(args);

        const cache = craftingSerialize(
            Player.Crafting ? Player.Crafting.slice(BC_SLOT_MAX_ORIGINAL) : null,
        );
        if (cache != Player.MBSSettings.CraftingCache) {
            Player.MBSSettings.CraftingCache = cache;
            pushMBSSettings([SettingsType.SETTINGS], true);
        }
    });

    if (MBS_MOD_API.getOriginalHash("CraftingSaveServer") !== "B5299AB2") {
        MBS_MOD_API.patchFunction("CraftingSaveServer", {
            "C.Description.substring(0, 100)":
                "C.Description.substring(0, 200)",
        });
    }

    if (MBS_MOD_API.getOriginalHash("CraftingConvertSelectedToItem") !== "B3F4D559") {
        MBS_MOD_API.patchFunction("CraftingConvertSelectedToItem", {
            'ElementValue("InputDescription").trim().substring(0, 100)':
                'ElementValue("InputDescription").trim().substring(0, 200)',
        });
    }

    const dialogDrawCraftingR97: Record<string, string> = (MBS_MOD_API.getOriginalHash("DialogDrawCrafting") !== "871E7AF7") ? {
        "Item.Craft.Description.substring(0, 100)":
            "Item.Craft.Description.substring(0, 200)",
    } : {};

    MBS_MOD_API.patchFunction("DialogDrawCrafting", {
        '1000, 0, 975 - DialogMenuButton.length * 110, 125, "White", null, 3':
            '1000, 0, 975 - DialogMenuButton.length * 110, 125, "White", null, 2',

        '1050, 200, 900, 125, "White", null, 3':
            '1050, 150, 900, 125, "White", null, 2',

        '1050, 400, 900, 125, "White", null, 3':
            '1050, 300, 900, 125, "White", null, 2',

        '1050, 600, 900, 125, "White", null, 3':
            '1050, 450, 900, 125, "White", null, 2',

        '1050, 800, 900, 125, "White", null, 3':
            '1050, 600, 900, 215, "White", null, 7',

        ...dialogDrawCraftingR97,
    });

    MBS_MOD_API.patchFunction("CraftingModeSet", {
        'ElementCreateInput("InputDescription", "text", "", "100");':
            'ElementCreateInput("InputDescription", "text", "", "200");',
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
