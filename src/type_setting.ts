/** Function for setting the types of extended items. */

"use strict";

/** Return a deep copy of the passed object. */
function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Load and assign the type to the passed item without refreshing.
 * @param item The Item in question
 * @param character The player or simple character
 * @param type The item's type
 */
export function itemSetType(item: Item, character: Character, type: null | string): void {
    if (
        character === null
        || typeof character !== "object"
        || !(character.IsPlayer() || character.IsSimple())
    ) {
        throw new Error(`Invalid "character": ${character?.AccountName}`);
    }
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    }

    const asset = item.Asset;
    if (!asset.Extended) {
        return;
    }

    if (asset.Archetype) {
        const setType = itemSetTypeDict[asset.Archetype];
        return setType(item, character, type);
    } else {
        return setTypeNoArch(item, character, type);
    }
}

/**
 * Construct a baseline property object for the passed object and given type.
 * @param item The Item in question
 * @param character The player or simple character
 * @param type The item's type
 */
export function getBaselineProperty(asset: Asset, character: Character, type: null | string): ItemProperties {
    const item: Item = { Asset: asset };
    itemSetType(item, character, type);
    return item.Property ?? {};
}

/** A record with template functions for setting the {@link ItemProperties.Type} of various archetypical items. */
const itemSetTypeDict = Object.freeze({
    [ExtendedArchetype.TYPED]: (item: Item, character: Character, type: string | null): void => {
        // Grab the item data
        const key = `${item.Asset.Group.Name}${item.Asset.Name}`;
        const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
        if (data === undefined) {
            throw new Error(`${key}: Item absent from Typed item lookup table`);
        }

        // Find and validate the item option
        const firstOption = <ExtendedItemOption>data.options.find(i => i.Property && i.Property.Type === null);
        let option = data.options.find(i => i.Property && i.Property.Type === type);
        if (option === undefined) {
            console.warn(`MBS: ${item.Asset.Group.Name}${item.Asset.Name}: Invalid Typed item type "${type}"`);
            option = firstOption;
        } else if (
            CommonCallFunctionByName(`InventoryItem${key}Validate`, character, item, option, firstOption)
            || InventoryBlockedOrLimited(character, item, type)
        ) {
            option = firstOption;
        }

        // Apply the item option
        item.Property = option.Property ? deepCopy(option.Property) : {};
        if (data.BaselineProperty) {
            Object.assign(item.Property, deepCopy(data.BaselineProperty));
        }
    },
    [ExtendedArchetype.VIBRATING]: (item: Item, character: Character, type: string | null): void => {
        // Find the item option
        let isAdvanced = true;
        let option = VibratorModeOptions.Advanced.find((o) => o.Name === type);
        if (option === undefined) {
            isAdvanced = false;
            option = VibratorModeOptions.Standard.find((o) => o.Name === type);
        }

        // Validate and apply the item option
        if (type === null || (isAdvanced && character.ArousalSettings?.DisableAdvancedVibes)) {
            VibratorModeSetProperty(item, VibratorModeOff);
        } else if (option === undefined) {
            VibratorModeSetProperty(item, VibratorModeOff);
        } else {
            VibratorModeSetProperty(item, option.Property);
        }
    },
    [ExtendedArchetype.MODULAR]: (item: Item, character: Character, type: string | null): void => {
        // Find the item data
        const key = `${item.Asset.Group.Name}${item.Asset.Name}`;
        const data = ModularItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
        if (data === undefined) {
            throw new Error(`${key}: Item absent from Modular item lookup table`);
        }

        if (type !== null && !(item.Asset.AllowType ?? []).includes(type)) {
            console.warn(`MBS: ${item.Asset.Group.Name}${item.Asset.Name}: Invalid Modular item type "${type}"`);
            type = null;
        }

        // Validate and apply the item option
        const currentModuleValues = ModularItemParseCurrent(data, type);
        data.modules.forEach((module, i) => {
            const option = module.Options[currentModuleValues[i]];
            const firstOption = module.Options[0];
            if (
                option === undefined
                || CommonCallFunctionByName(`InventoryItem${key}Validate`, character, item, option, firstOption)
                || InventoryBlockedOrLimited(character, item, `${module.Key}${currentModuleValues[i]}`)
            ) {
                currentModuleValues[i] = 0;
            }
        });
        item.Property = ModularItemMergeModuleValues(data, currentModuleValues, data.BaselineProperty);
    },
    [ExtendedArchetype.VARIABLEHEIGHT]: () => { return; },
});

/** Set the {@link ItemProperties.Type} of a non-archetypical item. */
function setTypeNoArch(item: Item, character: Character, type: null | string): void {
    if (!Array.isArray(item.Asset.AllowType)) {
        return;
    }
    if (!item.Asset.AllowType.includes(<string>type)) {
        throw new Error(`${item.Asset.Group.Name}${item.Asset.Name}: Invalid non-archetypical item type "${type}"`);
    }

    if (item.Asset.Name === "FuturisticVibrator") {
        itemSetTypeDict[ExtendedArchetype.VIBRATING](item, character, type);
        (<ItemProperties>item.Property).TriggerValues = ItemVulvaFuturisticVibratorTriggers.join("");
    } else {
        console.warn(`${item.Asset.Group.Name}${item.Asset.Name}: Unsupported non-archetypical item, aborting type-setting`);
    }
}
