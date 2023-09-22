/** Backports of R91 bug fixes */

import { waitFor, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

function fixAssetData(assetName: string) {
    const asset = Asset.find(a => a.Name === assetName);
    if (asset !== undefined) {
        asset.Effect = asset.Effect.filter(e => e !== "Chaste");
    }
}

function fixExtendedItemData(data: undefined | ModularItemData) {
    if (data === undefined) {
        return;
    }

    if (["ForbiddenChastityBra", "ForbiddenChastityBelt"].includes(data.asset.Name)) {
        if (!data.chatTags.includes(CommonChatTags.ASSET_NAME)) {
            data.chatTags.push(CommonChatTags.ASSET_NAME);
        }
    }

    const module = data.modules.find(m => m.Name === "CrotchShield");
    if (data.asset.Name === "ForbiddenChastityBelt") {
        (module?.Options ?? []).forEach(o => delete o.Property?.HideItem);
    }
    if (["ObedienceBelt", "ForbiddenChastityBelt"].includes(data.asset.Name)) {
        const closeBack = (module?.Options ?? [])[2]?.Property;
        const closeBoth = (module?.Options ?? [])[3]?.Property;
        if (closeBack !== undefined) {
            closeBack.Effect = ["ButtChaste"];
        }
        if (closeBoth !== undefined) {
            closeBoth.Effect = ["Chaste", "ButtChaste"];
        }
    }
}

waitFor(settingsMBSLoaded).then(() => {
    if (GameVersion === "R96") {
        backportIDs.add(4475);
        MBS_MOD_API.patchFunction("CraftingValidate", {
            "asset = Asset.find(a => a.Name === Craft.Item);":
                "asset = Asset.find(a => a.Name === Craft.Item && a.DynamicGroupName === a.Group.Name);",
        });

        backportIDs.add(4478);

        // Fix asset data
        fixAssetData("ForbiddenChastityBelt");

        // Fix extended item data
        const extendedItemData = {
            ForbiddenChastityBra: ModularItemDataLookup["ItemBreastForbiddenChastityBra"],
            ForbiddenChastityBelt: ModularItemDataLookup["ItemPelvisForbiddenChastityBelt"],
            ObedienceBelt: ModularItemDataLookup["ItemPelvisObedienceBelt"],
        };
        Object.values(extendedItemData).forEach(fixExtendedItemData);

        // Fix the extended item scripthooks
        if (typeof InventoryItemBreastForbiddenChastityBras1Click == "function") {
            MBS_MOD_API.patchFunction("InventoryItemBreastForbiddenChastityBras1Click", {
                "const C = CurrentCharacter;":
                    "const C = CharacterGetCurrent();",
            });
        }
        if (typeof InventoryItemPelvisForbiddenChastityBelts1Click == "function") {
            MBS_MOD_API.patchFunction("InventoryItemPelvisForbiddenChastityBelts1Click", {
                "const C = CurrentCharacter;":
                    "const C = CharacterGetCurrent();",
            });
        }
        if (typeof AssetsItemBreastForbiddenChastityBraScriptDraw == "function") {
            MBS_MOD_API.patchFunction("AssetsItemBreastForbiddenChastityBraScriptDraw", {
                "AssetsItemBreastForbiddenChastityBraUpdate(data, persistentData.CheckTime);":
                    "if ((ModularItemDeconstructType(property.Type) || []).includes('s1')) { AssetsItemBreastForbiddenChastityBraUpdate(data, persistentData.CheckTime); }",
            });
        }
        if (typeof AssetsItemPelvisForbiddenChastityBeltScriptDraw == "function") {
            MBS_MOD_API.patchFunction("AssetsItemPelvisForbiddenChastityBeltScriptDraw", {
                "AssetsItemPelvisForbiddenChastityBeltUpdate(data, persistentData.CheckTime);":
                    "if ((ModularItemDeconstructType(property.Type) || []).includes('s1')) { AssetsItemPelvisForbiddenChastityBeltUpdate(data, persistentData.CheckTime); }",
            });
        }
    }
    if (backportIDs.size) {
        console.log("MBS: Initializing R97 bug fix backports", backportIDs);
    } else {
        console.log("MBS: No R97 bug fix backports");
    }
});
