/** Backports of R91 bug fixes */

import { waitFor, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";
import {BC_MIN_VERSION} from "sanity_checks";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    switch (GameVersion) {
        case "R98": {
            if (MBS_MOD_API.getOriginalHash("ValidationSanitizeLock") === "21B423BF") {
                backportIDs.add(4597);
                MBS_MOD_API.patchFunction("ValidationSanitizeLock", {
                    "if (!lock || !InventoryDoesItemAllowLock(item)) {":
                        'if (!lock && item.Asset.Effect.includes("Lock")) { return; } else if (!lock || !InventoryDoesItemAllowLock(item)) {',
                });
            }

            if (MBS_MOD_API.getOriginalHash("VibratorModeInit") === "F8634616") {
                backportIDs.add(4597);
                MBS_MOD_API.patchFunction("VibratorModeInit", {
                    "delete newProps.OverridePriority;":
                        "delete newProps.OverridePriority; delete newProps.Effect;",
                });
            }

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

            if (MBS_MOD_API.getOriginalHash("ModularItemInit") === "EF5C06E1") {
                backportIDs.add(4604);
                MBS_MOD_API.patchFunction("ModularItemInit", {
                    "delete newProps.OverridePriority;":
                        "delete newProps.OverridePriority; delete newProps.OriginalSetting;",
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
                (bunPlush as Mutable<Asset>).DefaultColor = ["#848484", "#C26969"];
            }
            break;
        }
    }

    if (backportIDs.size) {
        console.log(`MBS: Initializing R${BC_NEXT} bug fix backports`, backportIDs);
    } else {
        console.log(`MBS: No R${BC_NEXT} bug fix backports`);
    }
});
