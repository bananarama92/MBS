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

waitFor(() => typeof GameVersion !== "undefined" && GameVersion !== "R0").then(() => {
    if (GameVersion === "R90Beta1") {
        console.info("MBS: BC R90Beta1 detected; applying R90Beta2 port-forward patch");
        MBS_MOD_API.hookFunction("CharacterAppearanceSortLayers", 11, (args, next) => {
            return CharacterAppearanceSortLayers(...args);
        });
    }
});
