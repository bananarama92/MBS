"use strict";

/**
 * Load and assign the type to the passed item without refreshing.
 * @param item The Item in question
 * @param type The item's type
 */
export function itemSetType(item: Item, type: null | string): void {
    if (typeof item !== "object") {
        throw `Invalid "item" type: ${typeof item}`;
    }

    const asset = item.Asset;
    if (!asset.Extended) {
        return;
    }

    if (asset.Archetype) {
        const setType = itemSetTypeDict[asset.Archetype];
        return setType(item, type);
    } else {
        return setTypeNoArch(item, type);
    }
}

/** A record with template functions for setting the {@link ItemProperties.Type} of various archetypical items. */
const itemSetTypeDict = Object.freeze({
    [ExtendedArchetype.TYPED]: (item: Item, type: string | null): void => {
        // Grab the item data
        const key = `${item.Asset.Group.Name}${item.Asset.Name}`;
        const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
        if (data === undefined) {
            throw `${key}: Item absent from Typed item lookup table`;
        }

        // Find and validate the item option
        let firstOption = data.options.find(i => i.Property && i.Property.Type === null);
        let option = data.options.find(i => i.Property && i.Property.Type === type);
        if (option === undefined || firstOption === undefined) {
            throw `${key}: Invalid Typed item type "${type}"`;
        } else if (
            !CommonCallFunctionByName(`InventoryItem${key}Validate`, Player, item, option, firstOption)
            || InventoryBlockedOrLimited(Player, item, type)
        ) {
            option = firstOption;
        }

        // Apply the item option
        item.Property = firstOption.Property || {};
        if (data.BaselineProperty) {
            item.Property = Object.assign(item.Property, data.BaselineProperty);
        }
    },
    [ExtendedArchetype.VIBRATING]: (item: Item, type: string | null): void => {
         // Find the item option
        let isAdvanced = true;
        let option = VibratorModeOptions.Advanced.find((o) => o.Name === type);
        if (option === undefined) {
            isAdvanced = false;
            option = VibratorModeOptions.Standard.find((o) => o.Name === type);
        }
        if (option === undefined) {
            throw `${item.Asset.Group.Name}${item.Asset.Name}: Invalid Vibrating item type "${type}"`;
        }

         // Validate and apply the item option
        if ((isAdvanced && Player.ArousalSettings && Player.ArousalSettings.DisableAdvancedVibes)) {
            VibratorModeSetProperty(item, VibratorModeOff);
        } else {
            VibratorModeSetProperty(item, option.Property);
        }
    },
    [ExtendedArchetype.MODULAR]: (item: Item, type: string | null): void => {
         // Find the item data
        const key = `${item.Asset.Group.Name}${item.Asset.Name}`;
        const data = ModularItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
        if (data === undefined) {
            throw `${key}: Item absent from Modular item lookup table`;
        }

        if (!(<string[]>item.Asset.AllowType).includes(<string>type)) {
            throw `${key}: Invalid Modular item type "${type}"`;
        }

         // Validate and apply the item option
        const currentModuleValues = ModularItemParseCurrent(data, type);
        data.modules.forEach((module, i) => {
            const option = module.Options[currentModuleValues[i]];
            const firstOption = module.Options[0];
            if (
                option === undefined
                || CommonCallFunctionByName(`InventoryItem${key}Validate`, Player, item, option, firstOption)
                || InventoryBlockedOrLimited(Player, item, `${module.Key}${currentModuleValues[i]}`)
            ) {
                currentModuleValues[i] = 0;
            }
        });
        item.Property = ModularItemMergeModuleValues(data, currentModuleValues, data.BaselineProperty);
    },
})

/** Set the {@link ItemProperties.Type} of a non-archetypical item. */
function setTypeNoArch(item: Item, type: null | string): void {
    if (!Array.isArray(item.Asset.AllowType)) {
        return;
    }
    if (!item.Asset.AllowType.includes(<string>type)) {
        throw `${item.Asset.Group.Name}${item.Asset.Name}: Invalid non-archetypical item type "${type}"`;
    }

    if (item.Asset.Name === "FuturisticVibrator") {
        itemSetTypeDict[ExtendedArchetype.VIBRATING](item, type);
        (<ItemProperties>item.Property).TriggerValues = ItemVulvaFuturisticVibratorTriggers.join("");
    } else {
        console.warn(`${item.Asset.Group.Name}${item.Asset.Name}: Unsuported non-archetypical item, aborting type-setting`);
    }
}
