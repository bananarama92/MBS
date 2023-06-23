/** Main module for managing all crafting-related additions */

"use strict";

import { MBS_MOD_API, waitFor, padArray } from "common";
import { settingsMBSLoaded } from "common_bc";
import { pushMBSSettings } from "settings";

const CRAFTING_SLOT_MAX_ORIGINAL = 40;

/** Serialize the passed crafting items. */
function craftingSerialize(items?: null | readonly (null | CraftingItem)[]): string {
    if (items == null) {
        return "";
    }
    return items.map(C => {
        let P = "";
        if ((C != null) && (C.Item != null) && (C.Item != "")) {
            P = P + C.Item + "¶";
            P = P + ((C.Property == null) ? "" : C.Property) + "¶";
            P = P + ((C.Lock == null) ? "" : C.Lock) + "¶";
            P = P + ((C.Name == null) ? "" : C.Name.replace("¶", " ").replace("§", " ")) + "¶";
            P = P + ((C.Description == null) ? "" : C.Description.replace("¶", " ").replace("§", " ")) + "¶";
            P = P + ((C.Color == null) ? "" : C.Color.replace("¶", " ").replace("§", " ")) + "¶";
            P = P + (((C.Private != null) && C.Private) ? "T" : "") + "¶";
            P = P + ((C.Type == null) ? "" : C.Type.replace("¶", " ").replace("§", " ")) + "¶";
            P = P + ((C.OverridePriority == null) ? "" : C.OverridePriority.toString());
        }
        return P;
    }).join("§");
}

/** A {@link DialogDrawCrafting} variant with altered line spacing and `MaxLine` values. */
function dialogDrawCrafting(C: Character, Item: Item): void {
    if ((C == null) || (Item == null) || (Item.Craft == null)) return;
    DrawTextWrap(DialogFind(Player, "CraftedItemProperties"), 1000, 0, 975 - DialogMenuButton.length * 110, 125, "White", undefined, 2);
    if (Item.Craft.Name != null) {
        DrawTextWrap(
            DialogFind(Player, "CraftingName").replace("CraftName", Item.Craft.Name),
            1050, 150, 900, 125, "White", undefined, 2,
        );
    }
    if ((Item.Craft.MemberName != null) && (Item.Craft.MemberNumber != null)) {
        DrawTextWrap(
            DialogFind(Player, "CraftingMember").replace("MemberName", Item.Craft.MemberName).replace("MemberNumber", Item.Craft.MemberNumber.toString()),
            1050, 300, 900, 125, "White", undefined, 2,
        );
    }
    if (Item.Craft.Property != null) {
        DrawTextWrap(
            DialogFind(Player, "CraftingProperty").replace("CraftProperty", Item.Craft.Property),
            1050, 450, 900, 125, "White", undefined, 2,
        );
    }
    if (Item.Craft.Description != null) {
        DrawTextWrap(
            DialogFind(Player, "CraftingDescription").replace("CraftDescription", Item.Craft.Description),
            1050, 600, 900, 215, "White", undefined, 5,
        );
    }
}

waitFor(() => typeof CraftingSlotMax !== "undefined").then(() => {
    CraftingSlotMax = 100;
    console.log("MBS: Initializing crafting module");
});

waitFor(settingsMBSLoaded).then(() => {
    console.log("MBS: Initializing crafting hooks");

    // Mirror the extra MBS-specific crafted items to the MBS settings
    MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
        next(args);
        Player.MBSSettings.CraftingCache = craftingSerialize(Player.Crafting ? Player.Crafting.slice(CRAFTING_SLOT_MAX_ORIGINAL) : null);
        pushMBSSettings();
    });

    MBS_MOD_API.hookFunction("DialogDrawCrafting", 11, (args, _next) => {
        dialogDrawCrafting(...<Parameters<typeof DialogDrawCrafting>>args);
    });

    MBS_MOD_API.patchFunction("CraftingModeSet", {
        'ElementCreateInput("InputDescription", "text", "", "100");': 'ElementCreateInput("InputDescription", "text", "", "200");',
    });

    if (Player.Crafting == null) {
        Player.Crafting = [];
    }
    if (
        Player.Crafting.length <= CRAFTING_SLOT_MAX_ORIGINAL
        && Player.MBSSettings.CraftingCache.length !== 0
    ) {
        padArray(Player.Crafting, CRAFTING_SLOT_MAX_ORIGINAL, null);

        let refresh = false;
        const packet = LZString.compressToUTF16(Player.MBSSettings.CraftingCache);
        const data = CraftingDecompressServerData(packet);
        for (const item of data) {
            // Make sure that the item is a valid craft
            switch (CraftingValidate(item)) {
                case CraftingStatusType.OK:
                    Player.Crafting.push(item);
                    break;
                case CraftingStatusType.ERROR:
                    Player.Crafting.push(item);
                    refresh = true;
                    break;
                case CraftingStatusType.CRITICAL_ERROR:
                    Player.Crafting.push(null);
                    refresh = true;
                    break;
            }

            // Too many items, skip the rest
            if (Player.Crafting.length >= CraftingSlotMax) {
                break;
            }
        }
        /**
         * One or more validation errors were encountered that were successfully resolved;
         * push the fixed items back to the server */
        if (refresh) {
            CraftingSaveServer();
        }
    }
});
