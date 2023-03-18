// @ts-nocheck

"use strict";

import { MBS_MOD_API, waitFor } from "common";

function CharacterAppearanceSortLayers(C: Character): AssetLayer[] {
    /** @type {Partial<Record<AssetGroupName, AlphaDefinition[]>>} */
    const groupAlphas = {};
    const layers = C.DrawAppearance.reduce((layersAcc, item) => {
        const asset = item.Asset;
        // Only include layers for visible assets
        if (asset.Visible && CharacterAppearanceVisible(C, asset.Name, asset.Group.Name) && InventoryChatRoomAllow(asset.Category)) {
            // Check if we need to draw a different variation (from type property)
            const type = (item.Property && item.Property.Type) || "";
            const layersToDraw = asset.Layer
                .filter(layer => CharacterAppearanceIsLayerVisible(C, layer, asset, type))
                .map(layer => {
                    const drawLayer = Object.assign({}, layer);
                    // Store any group-level alpha mask definitions
                    drawLayer.Alpha.forEach(alphaDef => {
                        if ((alphaDef.Group && alphaDef.Group.length) && (!alphaDef.Type || !Array.isArray(alphaDef.Type) || alphaDef.Type.includes(type))) {
                            alphaDef.Group.forEach(groupName => {
                                groupAlphas[groupName] = groupAlphas[groupName] || [];
                                groupAlphas[groupName].push({Pose: alphaDef.Pose, Masks: alphaDef.Masks});
                            });
                        }
                    });
                    // If the item has an OverridePriority property, it completely overrides the layer priority
                    if (item.Property) {
                        if (typeof item.Property.OverridePriority === "number")
                            drawLayer.Priority = item.Property.OverridePriority;
                        else if (CommonIsObject(item.Property.OverridePriority) && typeof item.Property.OverridePriority[layer.Name] === "number") {
                            drawLayer.Priority = item.Property.OverridePriority[layer.Name];
                        }
                    }
                    return drawLayer;
                });
            Array.prototype.push.apply(layersAcc, layersToDraw);
        }
        return layersAcc;
    }, []);

    // Run back over the layers to apply the group-level alpha mask definitions to the appropriate layers
    layers.forEach(layer => {
        // If the layer has a HideAs proxy group name, apply those alphas rather than the actual group alphas
        const groupName = (layer.HideAs && layer.HideAs.Group) || layer.Asset.Group.Name;
        layer.GroupAlpha = [];
        if (groupAlphas[groupName]) {
            Array.prototype.push.apply(layer.GroupAlpha, groupAlphas[groupName]);
        }
    });

    return AssetLayerSort(layers);
}

function InventoryLock(C, Item, Lock, MemberNumber, Update = true) {
	if (typeof Item === 'string') Item = InventoryGet(C, Item);
	if (typeof Lock === 'string') Lock = { Asset: AssetGet(C.AssetFamily, "ItemMisc", Lock) };
	if (Item && Lock && Lock.Asset && Lock.Asset.IsLock && InventoryDoesItemAllowLock(Item)) {
		if (Item.Property == null) Item.Property = {};
		if (Item.Property.Effect == null) Item.Property.Effect = [];
		if (Item.Property.Effect.indexOf("Lock") < 0) Item.Property.Effect.push("Lock");
		if (!Item.Property.MemberNumberListKeys && Lock.Asset.Name == "HighSecurityPadlock") Item.Property.MemberNumberListKeys = "" + MemberNumber;
		Item.Property.LockedBy = /** @type AssetLockType */(Lock.Asset.Name);
		if (MemberNumber != null) Item.Property.LockMemberNumber = MemberNumber;
		CommonCallFunctionByName(`Inventory${Lock.Asset.Group.Name}${Lock.Asset.Name}Init`, Item, C, false);
		if (Update) {
			if (Lock.Asset.RemoveTimer > 0) TimerInventoryRemoveSet(C, Item.Asset.Group.Name, Lock.Asset.RemoveTimer);
			CharacterRefresh(C, true);
		}
	}
}

function CharacterLoadCanvas(C) {
	// Reset the property that tracks if wearing a hidden item
	C.HasHiddenItems = false;

	// We add a temporary appearance and pose here so that it can be modified by hooks.  We copy the arrays so no hooks can alter the reference accidentally
	C.DrawAppearance = AppearanceItemParse(CharacterAppearanceStringify(C));
	C.DrawPose = C.Pose.slice(); // Deep copy of pose array

	// Run BeforeSortLayers hook
	C.RunHooks("BeforeSortLayers");

	// Generates a layer array from the character's appearance array, sorted by drawing order
	C.AppearanceLayers = CharacterAppearanceSortLayers(C);

	// Run AfterLoadCanvas hooks
	C.RunHooks("AfterLoadCanvas");

	// Sets the total height modifier for that character
	CharacterAppearanceSetHeightModifiers(C);

	// Reload the canvas
	CharacterAppearanceBuildCanvas(C);
}

waitFor(() => typeof GameVersion !== "undefined" && GameVersion !== "R0").then(() => {
    if (GameVersion === "R90Beta1") {
        console.log("MBS: BC R90Beta1 detected; applying R90Beta2 port-forward patches");
        MBS_MOD_API.hookFunction("CharacterAppearanceSortLayers", 11, (args, next) => {
            return CharacterAppearanceSortLayers(...args);
        });
    } else if (GameVersion === "R90Beta2") {
        console.log("MBS: BC R90Beta2 detected; applying R90Beta3 port-forward patch");
        MBS_MOD_API.hookFunction("InventoryLock", 11, (args, next) => {
            return InventoryLock(...args);
        });
        MBS_MOD_API.hookFunction("CharacterLoadCanvas", 11, (args, next) => {
            return CharacterLoadCanvas(...args);
        });
    }
});
