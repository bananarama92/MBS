"use strict";

import { MBS_MOD_API, BC_VERSION, range, randomElement, getRandomPassword } from "common";
import { itemSetType } from "type_setting";

/**
 * Generate a list of unique length-1 UTF16 characters.
 * @param n - The number of characters that should be returned
 * @param exclude - Characters that should not be contained in the to-be returned list
 * @returns A list of unique UTF16 characters
 */
function generateIDs(n: number, exclude: null | readonly string[] = null): string[] {
    if (!Number.isInteger(n) || n < 0) {
        throw `Invalid "n" value: ${n}`;
    }
    if (exclude == null) {
        exclude = [];
    } else if (!Array.isArray(exclude)) {
        throw `Invalid "exclude" type: ${typeof exclude}`;
    }

    const ret: string[] = [];
    for (const i of range(0, 2**16)) {
        const utf16 = String.fromCharCode(i);
        if (n === 0) {
            break;
        } else if (!exclude.includes(utf16)) {
            ret.push(utf16);
        }
        n -= 1;
    }

    if (n > 0) {
        throw "Insufficient available UTF16 characters";
    }
    return ret;
}

/**
 * Attach and set a timer lock to the passed item for the specified duration.
 * @param item The item in question
 * @param minutes The duration of the timer lock; its value must fall in the [0, 240] interval
 */
function equipTimerLock(item: Item, minutes: number): void {
    if (typeof minutes !== "number") {
        throw `Invalid "minutes" type: ${typeof minutes}`;
    } else if (minutes < 0 || minutes > 240) {
        throw '"minutes" must fall in the [0, 240] interval';
    }

    // Equip the timer lock if desired and possible
    if (!equipLock(item, "TimerPasswordPadlock")) {
        return;
    }

    if (item.Property == null) item.Property = {};
    item.Property.RemoveTimer = CurrentTime + minutes * 60000;
    item.Property.RemoveItem = true;
    item.Property.LockSet = true;
    item.Property.Password = getRandomPassword(8);
}

/**
 * Attach a high security padlock to the passed item.
 * @param item The item in question
 */
function equipHighSecLock(item: Item): void {
    // Equip the timer lock if desired and possible
    equipLock(item, "HighSecurityPadlock");
    if (item.Property == null) item.Property = {};
    item.Property.MemberNumberListKeys = "";
}

/**
 * Attach a the specified padlock to the passed item.
 * Note that no lock-specific {@link Item.Property} values are set on the item.
 * @param item The item in question
 * @param lockName The to-be attached lock
 * @returns whether the lock was equiped or not
 */
function equipLock(item: Item, lockName: AssetLockType): boolean {
    if (typeof item !== "object") {
        throw `Invalid "item" type: ${typeof item}`;
    } else if (typeof lockName !== "string") {
        throw `Invalid "lockName" type: ${typeof lockName}`;
    }

    // Equip the timer lock if desired and possible
    const lock = AssetGet(Player.AssetFamily, "ItemMisc", lockName);
    if (
        lock == null
        || InventoryGetLock(item) != null
        || !InventoryDoesItemAllowLock(item)
        || InventoryBlockedOrLimited(Player, { Asset: lock })
    ) {
        return false;
    }
    InventoryLock(Player, item, { Asset: lock }, Player.ID, false);
    return true;
}

/** Strip the character of all clothes while always ignoring any and all cosplay items. */
function playerNakedNoCosplay(): void {
    const appearance = Player.Appearance;
    for (let i = appearance.length - 1; i >= 0; i--) {
        const asset = appearance[i].Asset;
        if (
            asset.Group.AllowNone
            && asset.Group.Category === "Appearance"
            && !asset.Group.BodyCosplay
            && !asset.BodyCosplay
        ) {
            appearance.splice(i, 1);
        }
    }
    CharacterLoadCanvas(Player);
}

/**
 * Equip the player with all items from the passed fortune wheel item list.
 * @param name The name of the wheel of fortune item list
 * @param itemList The items in question
 * @param globalCallbacks A list of callbacks (or `null`) that will be applied to all items after they're equiped
 * @param stripNaked Whether all appearance items should be removed from the player
 */
function fortuneWheelEquip(
    name: string,
    itemList: readonly FortuneWheelItem[],
    globalCallback: null | FortuneWheelCallback = null,
    stripNaked: boolean = true,
): void {
    if (!Array.isArray(itemList)) {
        throw `Invalid "itemList" type: ${typeof itemList}`;
    }

    if (stripNaked) {
        playerNakedNoCosplay();
    }

    const equipFailureRecord: Record<string, string[]> = {};
    for (const {Name, Group, Equip, Craft, ItemCallback} of <readonly FortuneWheelItem[]>itemList) {
        const asset = AssetGet(Player.AssetFamily, Group, Name);
        const oldItem = InventoryGet(Player, Group);
        const equip = (typeof Equip === "function") ? Equip : true;

        // Check whether the item can actually be equiped
        if (asset != null) {
            const equipChecks = {
                "Equip callback": !equip,
                "Locked item equiped": !(oldItem == null || InventoryGetLock(oldItem) == null),
                "InventoryBlockedOrLimited": InventoryBlockedOrLimited(Player, { Asset: asset }),
                "InventoryAllow": !InventoryAllow(Player, asset, asset.Prerequisite, false),
                "InventoryGroupIsBlocked": InventoryGroupIsBlocked(Player, Group, false),
            };

            const equipFailure = Object.entries(equipChecks).filter((tup) => tup[1]);
            if (equipFailure.length !== 0) {
                equipFailureRecord[asset.Description] = equipFailure.map((tup) => tup[0]);
                continue;
            }
        } else {
            equipFailureRecord[Name] = ["Unknown asset"];
            continue;
        }

        // Equip the item while avoiding refreshes as much as possible until all items are
        CharacterAppearanceSetItem(Player, Group, asset, asset.DefaultColor, SkillGetWithRatio("Bondage"), Player.ID, false);
        const newItem = InventoryGet(Player, Group);
        if (newItem == null) {
            continue;
        }
        newItem.Craft = Object.assign({}, Craft);
        itemSetType(newItem, (Craft == null) ? null : Craft.Type);
        InventoryCraft(Player, Player, Group, Craft, false);

        // Fire up any of the provided item-specific dynamic callbacks
        if (typeof ItemCallback === "function") {
            ItemCallback(newItem);
        }
        if (typeof globalCallback === "function") {
            globalCallback(newItem);
        }
    }
    CharacterRefresh(Player, true, false);
    ChatRoomCharacterUpdate(Player);

    if (Object.values(equipFailureRecord).length) {
        console.log(`MBS: Failed to equip one or more "${name}" wheel of fortune items`, equipFailureRecord);
    }
}

/** A list of all valid wheel of fortune colors. */
const FORTUNE_WHEEL_COLORS = Object.freeze([
    "Blue",
    "Gold",
    "Gray",
    "Green",
    "Orange",
    "Purple",
    "Red",
    "Yellow",
]);

/**
 * Copy the player's hair color the to passed item.
 * @param item The item in question
 * @param indices The indices of the {@link item.Color} array whose color will be updated
 */
function copyHairColor(item: Item, indices: number[]): void {
    if (typeof item !== "object") {
        throw `Invalid "item" type: ${typeof item}`;
    }
    if (!Array.isArray(indices)) {
        throw `Invalid "indices" type: ${typeof indices}`;
    }

    const hair = Player.Appearance.find(i => i.Asset.Group.Name === "HairFront");
    if (hair === undefined) {
        return;
    }

    // Ensure that the item's color is stored as an array
    let color: string[];
    if (typeof item.Color === "string") {
        item.Color = color = [item.Color];
        for (const _ of range(1, 1 + Math.max(...indices))) {
            item.Color.push("Default");
        }
    } else if (!Array.isArray(item.Color) || item.Color.length === 0) {
        item.Color = color = [];
        for (const _ of range(0, 1 + Math.max(...indices))) {
            item.Color.push("Default");
        }
    } else {
        color = item.Color;
    }

    // Update the item's color with the hair color
    if (typeof hair.Color === "string") {
        indices.forEach(i => color[i] = <string>hair.Color);
    } else if (Array.isArray(hair.Color) && hair.Color.length >= 1) {
        indices.forEach(i => color[i] = (<string[]>hair.Color)[0]);
    } else {
        return;
    }
}

/** Return a record with all new MBS fortune wheel item sets. */
function generateItemSets(): FortuneWheelItemSets {
    const ret: Record<FortuneWheelNames, FortuneWheelItemBase[]> = {
        leash_candy: [
            {
                Name: "ReverseBunnySuit",
                Group: "Suit",
                ItemCallback: (item) => copyHairColor(item, [0, 1]),
            },
            {
                Name: "Catsuit",
                Group: "SuitLower",
                ItemCallback: (item) => copyHairColor(item, [0, 1]),
            },
            {
                Name: "FaceVeil",
                Group: "Mask",
                ItemCallback: (item) => {
                    item.Color = "#000";
                    copyHairColor(item, [1]);
                },
            },
            {
                Name: "FuturisticMittens",
                Group: "ItemHands",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Mittens",
                    Type: null,
                },
                ItemCallback: (item) => copyHairColor(item, [0, 1]),
            },
            {
                Name: "InteractiveVRHeadset",
                Group: "ItemHead",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Headset",
                    Type: "b3f3g1",
                },
                ItemCallback: (item) => copyHairColor(item, [0]),
            },
            {
                Name: "LargeDildo",
                Group: "ItemMouth",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Dildo",
                    Description: "Specially made to fill a PSOs mouth and throat",
                },
            },
            {
                Name: "LatexBallMuzzleGag",
                Group: "ItemMouth2",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Muzzle",
                    Description: "Forcing the dildo in and keeping it secure",
                },
            },
            {
                Name: "FuturisticMuzzle",
                Group: "ItemMouth3",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Muzzle",
                    Description: "Keeping your cries muffled",
                    Type: "n1h0s3",
                },
                ItemCallback: (item) => copyHairColor(item, [3]),
            },
            {
                Name: "FuturisticVibrator",
                Group: "ItemVulva",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Vibe",
                    Description: "Specially made to fill a PSO",
                    Type: "Edge",
                },
            },
            {
                Name: "SciFiPleasurePanties",
                Group: "ItemPelvis",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Panties",
                    Description: "No escape and no Orgasms",
                    Type: "c3i4o1s2",
                },
                ItemCallback: (item) => copyHairColor(item, [0, 2, 4, 5]),
            },
            {
                Name: "BonedNeckCorset",
                Group: "ItemNeck",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Collar",
                    Type: "Ring",
                },
                ItemCallback: (item) => {
                    item.Color = ["#222222", "#888888", "#AA2121", "#AA2121", "#888888"];
                    copyHairColor(item, [2, 3]);
                },
            },
            {
                Name: "CollarChainShort",
                Group: "ItemNeckRestraints",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Chain",
                    Description: "To keep a PSO on their knees",
                    OverridePriority: 7,
                },
                ItemCallback: (item) => copyHairColor(item, [0]),
            },
            {
                Name: "StrictLeatherPetCrawler",
                Group: "ItemArms",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Suit",
                    Description: "Extra tight and unremovable",
                },
            },
            {
                Name: "HeavyLatexCorset",
                Group: "ItemTorso",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Corset",
                    Description: "Extra tight and specially molded",
                    Type: null,
                },
            },
            {
                Name: "FuturisticHarness",
                Group: "ItemTorso2",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Harness",
                    Description: "Special harness that constantly shrinks....",
                    Type: null,
                    OverridePriority: 45,
                },
                ItemCallback: (item) => copyHairColor(item, [0, 1, 2]),
            },
            {
                Name: "FuturisticEarphones",
                Group: "ItemEars",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Earphones",
                    Type: null,
                },
                ItemCallback: (item) => {
                    item.Color = ["#0F0F0F", "Default", "Default"];
                    copyHairColor(item, [1]);
                },
            },
            {
                Name: "CeilingChain",
                Group: "ItemAddon",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Chain",
                    Description: "Never to escape",
                    Type: null,
                },
                ItemCallback: (item) => copyHairColor(item, [0]),
            },
            {
                Name: "RoundPiercing",
                Group: "ItemNipplesPiercings",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Piercings",
                    Type: "Chain",
                },
                ItemCallback: (item) => {
                    item.Color = ["#000000", "Default", "Default"];
                    copyHairColor(item, [1, 2]);
                },
            },
            {
                Name: "CollarAutoShockUnit",
                Group: "ItemNeckAccessories",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Shock Unit",
                    Type: "s2y0",
                },
            },
            {
                Name: "FrogtieStraps",
                Group: "ItemLegs",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Straps",
                    Description: "To keep a PSO on their knees",
                },
                ItemCallback: (item) => copyHairColor(item, [2]),
            },
            {
                Name: "DroneMask",
                Group: "ItemHood",
                Craft: {
                    Property: "Thin",
                    Name: "Permanent PSO Mask",
                    Type: "m0e0p1g0s1h2j0",
                },
                ItemCallback: (item) => copyHairColor(item, [2]),
            },
        ],
    };

    for (const [setName, itemSet] of <[FortuneWheelNames, FortuneWheelItemBase[]][]>Object.entries(ret)) {
        for (const [i, item] of itemSet.entries()) {
            if (item.Craft != null) {
                item.Craft.Item = item.Name;
                const asset = AssetGet(Player.AssetFamily, item.Group, item.Name);
                if (!CraftingValidate(<CraftingItem>item.Craft, asset, false)) {
                    throw `Failed to validate the ${setName}-${item.Group}${item.Name} crafting settings`;
                }
            }
            itemSet[i] = Object.freeze(item);
        }
        ret[setName] = <FortuneWheelItemBase[]>Object.freeze(itemSet);
    }
    return <FortuneWheelItemSets>ret;
}

/** A read-only record with all new MBS fortune wheel item sets. */
const FORTUNATE_WHEEL_ITEM_SETS = Object.freeze(generateItemSets());

/**
 * Return a record with all new MBS fortune wheel options.
 * @param idExclude A list of {@link FortuneWheelOption.ID} values already present in {@link WheelFortuneOption}
 * @param colors A list of colors whose entries will be used at random
 */
function generateNewOptions(
    idExclude: null | readonly string[] = null,
    colors: readonly string[] = FORTUNE_WHEEL_COLORS,
): FortuneWheelOptions {
    if (!Array.isArray(colors)) {
        throw `Invalid "colors" type: ${typeof colors}`;
    }

    const ret: Record<string, Partial<FortuneWheelOptionBase>> = {
        leash_candy_5_min: {
            Description: "PSO bondage for 5 minutes",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 5 minutes",
                FORTUNATE_WHEEL_ITEM_SETS.leash_candy,
                (item) => equipTimerLock(item, 5),
            ),
            Default: true,
        },
        leash_candy_15_min: {
            Description: "PSO bondage for 15 minutes",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 15 minutes",
                FORTUNATE_WHEEL_ITEM_SETS.leash_candy,
                (item) => equipTimerLock(item, 15),
            ),
            Default: true,
        },
        leash_candy_60_min: {
            Description: "PSO bondage for 60 minutes",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 60 minutes",
                FORTUNATE_WHEEL_ITEM_SETS.leash_candy,
                (item) => equipTimerLock(item, 60),
            ),
            Default: true,
        },
        leash_candy_240_min: {
            Description: "PSO bondage for 4 hours",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 4 hours",
                FORTUNATE_WHEEL_ITEM_SETS.leash_candy,
                (item) => equipTimerLock(item, 240),
            ),
            Default: false,
        },
        leash_candy_exclusive: {
            Description: "PSO bondage",
            Script: () => fortuneWheelEquip(
                "PSO bondage",
                FORTUNATE_WHEEL_ITEM_SETS.leash_candy,
                (item) => equipLock(item, "ExclusivePadlock"),
            ),
            Default: true,
        },
        leash_candy_hisec: {
            Description: "High security PSO bondage",
            Script: () => fortuneWheelEquip(
                "High security PSO bondage",
                FORTUNATE_WHEEL_ITEM_SETS.leash_candy,
                (item) => {
                    if (InventoryDoesItemAllowLock(item) && item.Craft) {
                        item.Craft.Property = "Puzzling";
                    }
                    equipHighSecLock(item);
                },
            ),
            Default: false,
        },
    };

    const entries = Object.entries(ret);
    const IDs = generateIDs(entries.length, idExclude);
    entries.forEach(([name, struct], i) => {
        struct.ID = IDs[i];
        struct.Color = randomElement(colors);
        ret[name] = Object.freeze(struct);
    });
    return <FortuneWheelOptions>ret;
}

// Requires BC R88Beta1 or higher
if (BC_VERSION >= <[number, number]>[88, 1]) {
    console.log(`MBS: Initializing wheel of fortune additions (BC ${GameVersion})`);

    /** A read-only record with all new MBS fortune wheel options. */
    const WHEEL_ITEMS_NEW = Object.freeze(generateNewOptions(WheelFortuneOption.map(i => i.ID)));

    Object.values(WHEEL_ITEMS_NEW).forEach((item) => {
        WheelFortuneOption.push(item);
        if (item.Default) {
            WheelFortuneDefault += item.ID;
        }
    });

    MBS_MOD_API.hookFunction("WheelFortuneLoad", 0, (args, next) => {
        if (TextScreenCache != null) {
            for (const item of Object.values(WHEEL_ITEMS_NEW)) {
                TextScreenCache.cache[`Option${item.ID}`] = item.Description;
            }
        }
        return next(args);
    });

    MBS_MOD_API.hookFunction("WheelFortuneCustomizeLoad", 0, (args, next) => {
        if (TextScreenCache != null) {
            for (const item of Object.values(WHEEL_ITEMS_NEW)) {
                TextScreenCache.cache[`Option${item.ID}`] = item.Description;
            }
        }
        return next(args);
    });
} else {
    console.log(`MBS: Aborting initializion of wheel of fortune additions (BC ${GameVersion})`);
}
