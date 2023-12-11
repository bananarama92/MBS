/** Backports of R91 bug fixes */

import { waitFor, MBS_MOD_API, logger } from "common";
import { settingsMBSLoaded } from "common_bc";
import { sortBy } from "lodash-es";
import { BC_MIN_VERSION } from "sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

// R99
declare const InventoryItemMouthFuturisticPanelGagSetOptionHook: undefined | ExtendedItemScriptHookCallbacks.SetOption<ModularItemData, ModularItemOption>;

waitFor(settingsMBSLoaded).then(() => {
    switch (GameVersion) {
        case "R98": {
            if (MBS_MOD_API.getOriginalHash("VibratorModeInit") === "AE006E2B") {
                backportIDs.add(4605);
                const option = VibratorModeOptions.Advanced.find(o => o.Name === VibratorMode.RANDOM);
                if (option) {
                    option.Property.Effect = option.Property.Effect.filter(e => e !== "Vibrating");
                }

                MBS_MOD_API.patchFunction("VibratorModeInit", {
                    "delete newProps.Effect;":
                        "if (VibratorModesAdvanced.includes(option.Name)) { delete newProps.Intensity; }",
                });
            }

            if (MBS_MOD_API.getOriginalHash("ModularItemInit") === "EF5C06E1" && typeof InventoryItemMouthFuturisticPanelGagSetOptionHook === "undefined") {
                backportIDs.add(4604);
                MBS_MOD_API.patchFunction("ModularItemInit", {
                    "delete newProps.OverridePriority;":
                        "delete newProps.OverridePriority; delete newProps.OriginalSetting;",
                });
            }

            if (MBS_MOD_API.getOriginalHash("DialogMenuButtonBuild") === "A2421841") {
                backportIDs.add(4610);
                MBS_MOD_API.patchFunction("DialogMenuButtonBuild", {
                    "InventoryAllow(":
                        "(() => true)(",
                });
            }

            const mageSkirt = Asset.find(a => a.Name === "MageSkirt");
            const tutu = Asset.find(a => a.Name === "Tutu");
            if (
                mageSkirt !== undefined
                && tutu !== undefined
                && typeof mageSkirt.DrawingLeft === "undefined"
                && typeof tutu.DrawingLeft === "number"
            ) {
                backportIDs.add(4602);
                tutu.Layer.forEach(l => (l.PoseMapping as Mutable<typeof l.PoseMapping>).KneelingSpread = PoseType.HIDE);
                mageSkirt.Layer.forEach(l => (l.PoseMapping as Mutable<typeof l.PoseMapping>).KneelingSpread = "KneelingSpread");
            }

            const bunPlush = Asset.find(a => a.Name === "BunPlush" && a.Group.Name === "ItemHandheld");
            if (
                bunPlush !== undefined
                && CommonArraysEqual(bunPlush.DefaultColor, ["Default", "Default"])
            ) {
                backportIDs.add(4664);
                (bunPlush as Mutable<Asset>).DefaultColor = ["#848484", "#C26969"];
            }
            break;
        }
        case "R99Beta1": {
            const bunPlush = Asset.find(a => a.Name === "BunPlush" && a.Group.Name === "ItemHandheld");
            if (
                bunPlush !== undefined
                && CommonArraysEqual(bunPlush.DefaultColor, ["Default", "Default"])
            ) {
                backportIDs.add(4664);
                (bunPlush as Mutable<Asset>).DefaultColor = ["#848484", "#C26969"];
            }

            backportIDs.add(4662);
            MBS_MOD_API.patchFunction("CraftingConvertSelectedToItem", {
                "Private: CraftingSelectedItem.Private,":
                    "Private: CraftingSelectedItem.Private, Type: CraftingSelectedItem.Type || null,",
            });
            MBS_MOD_API.patchFunction("CraftingConvertItemToSelected", {
                "Private: Craft.Private,":
                    "Private: Craft.Private, Type: Craft.Type || null,",
            });
            MBS_MOD_API.patchFunction("ActivityGenerateItemActivitiesFromNeed", {
                "const typeList = CommonIsObject(item.Property.TypeRecord) ? PropertyTypeRecordToStrings(item.Property.TypeRecord) : [null];":
                    "const typeList = CommonIsObject(item.Property?.TypeRecord) ? PropertyTypeRecordToStrings(item.Property.TypeRecord) : [null];",
            });
            MBS_MOD_API.patchFunction("ExtendedItemSetOptionByRecord", {
                "const module = newOption.ParentData.modules[newOption.Index];":
                    "const module = newOption.ParentData.modules.find(m => m.Name === newOption.ModuleName);",
            });
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} bug fix backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} bug fix backports`);
    }
});
