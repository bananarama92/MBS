/** Main module for managing all crafting-related additions */

"use strict";

import { MBS_MOD_API, waitFor, getFunctionHash, Version } from "common";
import { settingsMBSLoaded } from "common_bc";
import { pushMBSSettings } from "settings";

let CRAFTING_SLOT_MAX_ORIGINAL: number;
let R94BETA1_OR_LATER: boolean;
let R94_OR_LATER: boolean;

const MBS_CRAFTING_MAX = Object.freeze({
    "default": 160,
    "pre_v0_6_8": 100,
});
const BC_CRAFTING_MAX = Object.freeze({
    "default": 80,
    "pre_R94": 40,
});

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

            if (R94BETA1_OR_LATER) {
                P += "¶";
                P += (C.ItemProperty == null ? "" : JSON.stringify(C.ItemProperty));
            } else {
                P += ((C.OverridePriority == null) ? "" : C.OverridePriority.toString());
            }
        }
        return P;
    }).join("§");
}

/**
 * Load crafting items from the MBS cache.
 * @param character The characer in question
 * @param craftingCache The crafting cache
 */
function loadCraftingCache(character: Character, craftingCache: string = ""): void {
    character.Crafting ??= [];
    if (!craftingCache) {
        return;
    }

    const packet = LZString.compressToUTF16(craftingCache);
    const data: (null | CraftingItem)[] = CraftingDecompressServerData(packet);
    const oldCrafts = new Set(character.Crafting.map(i => JSON.stringify(i)));
    let refresh = false;
    for (const item of data) {
        // Too many items, try to remove `null` entries or skip the rest if not possible
        if (character.Crafting.length >= MBS_CRAFTING_MAX.default) {
            if (item == null) {
                continue;
            } else if (character.Crafting.includes(null, CRAFTING_SLOT_MAX_ORIGINAL)) {
                character.Crafting = character.Crafting.filter((item, i) => i < CRAFTING_SLOT_MAX_ORIGINAL || item != null);
            } else if (character.Crafting.includes(null)) {
                character.Crafting = character.Crafting.filter(item => item != null);
            } else {
                break;
            }
        }

        // Make sure that the item is a valid craft
        switch (CraftingValidate(<CraftingItem>item)) {
            case CraftingStatusType.OK: {
                const key = JSON.stringify(item);
                if (!oldCrafts.has(key)) {
                    character.Crafting.push(item);
                }
                break;
            }
            case CraftingStatusType.ERROR: {
                const key = JSON.stringify(item);
                if (!oldCrafts.has(key)) {
                    character.Crafting.push(item);
                }
                refresh = true;
                break;
            }
            case CraftingStatusType.CRITICAL_ERROR:
                character.Crafting.push(null);
                refresh = true;
                break;
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

waitFor(() => typeof CraftingSlotMax !== "undefined").then(() => {
    CraftingSlotMax = MBS_CRAFTING_MAX.default;
    console.log("MBS: Initializing crafting module");
});

waitFor(settingsMBSLoaded).then(() => {
    console.log("MBS: Initializing crafting hooks");

    const versionCurrent = Version.fromBCVersion(GameVersion);
    const versionR94 = Version.fromBCVersion("R94");
    const versionR94Beta1 = Version.fromBCVersion("R94Beta1");
    R94_OR_LATER = versionCurrent.greaterOrEqual(versionR94);
    R94BETA1_OR_LATER = versionCurrent.greaterOrEqual(versionR94Beta1) || (
        getFunctionHash(CraftingModeSet) === "0EF1B752"
        && getFunctionHash(CraftingSaveServer) === "B5299AB2"
    );
    CRAFTING_SLOT_MAX_ORIGINAL = R94_OR_LATER ? BC_CRAFTING_MAX.default : BC_CRAFTING_MAX.pre_R94;

    // Mirror the extra MBS-specific crafted items to the MBS settings
    MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
        next(args);
        Player.MBSSettings.CraftingCache = craftingSerialize(
            Player.Crafting ? Player.Crafting.slice(CRAFTING_SLOT_MAX_ORIGINAL) : null,
        );
        pushMBSSettings();
    });

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
    });

    MBS_MOD_API.patchFunction("CraftingModeSet", {
        'ElementCreateInput("InputDescription", "text", "", "100");':
            'ElementCreateInput("InputDescription", "text", "", "200");',
    });

    loadCraftingCache(Player, Player.MBSSettings.CraftingCache);
});
