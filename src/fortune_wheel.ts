"use strict";

import { MBS_MOD_API, parseVersion, range, randomElement, getRandomPassword, waitFor } from "common";
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
    InventoryLock(Player, item, { Asset: lock }, null, false);
    return true;
}

/**
 * An enum with various strip levels for {@link playerStrip}.
 * All items up to and including the specified levels will be removed.
 */
const STRIP_LEVEL = Object.freeze({
    /** Do not strip any items */
    NONE: 0,
    /** Strip all clothes */
    CLOTHES: 1,
    /** Strip all clothes and underwear */
    UNDERWEAR: 2,
    /** Strip all clothes, underwear and cosplay items (if not blocked) */
    ALL: 3,
});

/**
 * Strip the character of all clothes while always ignoring any and all cosplay items.
 * @param stripLevel An integer denoting which clothes should be removed; see {@link STRIP_LEVEL}
 */
function playerStrip(stripLevel: 0 | 1 | 2 | 3): void {
    let levelCondition: (asset: Asset) => boolean;
    switch (stripLevel) {
        case STRIP_LEVEL.NONE: {
            return;
        }
        case STRIP_LEVEL.CLOTHES: {
            levelCondition = (asset) => (asset.BodyCosplay || asset.Group.Underwear);
            break;
        }
        case STRIP_LEVEL.UNDERWEAR: {
            levelCondition = (asset) => (asset.BodyCosplay);
            break;
        }
        case STRIP_LEVEL.ALL: {
            const blockBodyCosplay = Player.OnlineSharedSettings?.BlockBodyCosplay || false;
            levelCondition = (asset) => (blockBodyCosplay ? asset.BodyCosplay : false);
            break;
        }
        default: {
            throw `Invalid "level" value: ${stripLevel}`;
        }
    }

    const appearance = Player.Appearance;
    for (let i = appearance.length - 1; i >= 0; i--) {
        const asset = appearance[i].Asset;
        if (
            asset.Group.AllowNone
            && asset.Group.Category === "Appearance"
            && !levelCondition(asset)
        ) {
            appearance.splice(i, 1);
        }
    }
}

/**
 * Equip the player with all items from the passed fortune wheel item list.
 * @param name The name of the wheel of fortune item list
 * @param itemList The items in question
 * @param stripLevel An integer denoting which clothes should be removed; see {@link STRIP_LEVEL}
 * @param globalCallbacks A callback (or `null`) that will be applied to all items after they're equiped
 * @param preRunCallback A callback (or `null`) executed before equiping any items from `itemList`
 */
function fortuneWheelEquip(
    name: string,
    itemList: readonly FortuneWheelItem[],
    stripLevel: 0 | 1 | 2 | 3,
    globalCallback: null | FortuneWheelCallback = null,
    preRunCallback: null | ((itemList: readonly FortuneWheelItem[]) => readonly FortuneWheelItem[]) = null,
): void {
    if (!Array.isArray(itemList)) {
        throw `Invalid "itemList" type: ${typeof itemList}`;
    }
    playerStrip(stripLevel);

    if (typeof preRunCallback === "function") {
        itemList = preRunCallback(itemList);
    }

    const equipFailureRecord: Record<string, string[]> = {};
    for (const {Name, Group, Equip, Craft, ItemCallback, Color} of <readonly FortuneWheelItem[]>itemList) {
        const asset = AssetGet(Player.AssetFamily, Group, Name);
        const oldItem = InventoryGet(Player, Group);
        const equip = (typeof Equip === "function") ? Equip() : true;

        // Check whether the item can actually be equiped
        if (asset != null) {
            const equipChecks = {
                "Equip callback": !equip,
                "Locked item equiped": !(
                    oldItem == null
                    || !InventoryItemHasEffect(oldItem, "Lock")
                    || oldItem.Craft?.Property === "Decoy"
                ),
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
        CharacterAppearanceSetItem(Player, Group, asset, Color || asset.DefaultColor, SkillGetWithRatio("Bondage"), Player.MemberNumber, false);
        const newItem = InventoryGet(Player, Group);
        if (newItem == null) {
            continue;
        }
        newItem.Craft = Object.assign({}, Craft);
        itemSetType(newItem, Craft?.Type || null);
        InventoryCraft(Player, Player, Group, Craft, false, false);

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
const FORTUNE_WHEEL_COLORS: readonly FortuneWheelColor[] = Object.freeze([
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
    }
}

/**
 * Color all items in the passed groups with the specified color.
 * @param groupNames The to-be collored groups
 * @param color The color
 */
function colorItems(groupNames: readonly AssetGroupName[], color: string): void {
    if (!Array.isArray(<readonly AssetGroupName[]>groupNames)) {
        throw `Invalid "groupNames" type: ${typeof groupNames}`;
    }
    if (typeof color !== "string") {
        throw `Invalid "color" type: ${typeof groupNames}`;
    }

    groupNames.forEach(name => {
        const item = InventoryGet(Player, name);
        if (item == null) {
            return;
        }

        item.Color = [];
        for (const _ of range(0, item.Asset.ColorableLayerCount)) {
            item.Color.push(color);
        }
    });
}

function statueCopyColors<T>(itemList: T): T {
    if (!Player.OnlineSharedSettings?.BlockBodyCosplay) {
        const groupNames: AssetGroupName[] = [
            "HairAccessory1",
            "HairAccessory2",
            "HairAccessory3",
            "HairBack",
            "HairFront",
            "BodyUpper",
            "BodyLower",
            "Wings",
            "TailStraps",
            "Nipples",
            "Blush",
            "Mouth",
        ];
        colorItems(groupNames, "#484747");
    }
    return itemList;
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
                Color: ["#000", "Default"],
                ItemCallback: (item) => copyHairColor(item, [1]),
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
                Color: ["#222222", "#888888", "#AA2121", "#AA2121", "#888888"],
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Collar",
                    Type: "Ring",
                },
                ItemCallback: (item) => copyHairColor(item, [2, 3]),
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
                    OverridePriority: 23,
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
                Color: ["#0F0F0F", "Default", "Default"],
                ItemCallback: (item) => copyHairColor(item, [1]),
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
                Color: ["#000000", "Default", "Default"],
                ItemCallback: (item) => copyHairColor(item, [1, 2]),
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
        mummy: [
            {
                Name: "DuctTape",
                Group: "ItemFeet",
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                    Type: null,
                },
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, type);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemLegs",
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                    Type: null,
                },
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, type);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemHands",
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                    Type: null,
                },
                ItemCallback: (item) => copyHairColor(item, [0]),
            },
            {
                Name: "DuctTape",
                Group: "ItemArms",
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                    Type: null,
                },
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, type);
                },
            },
            {
                Name: "LargeDildo",
                Group: "ItemMouth",
                Craft: {
                    Property: "Large",
                    Name: "Rubber Mouth Sealant",
                    Description: "A rubber mass molded to shape of your mouth",
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemMouth2",
                Craft: {
                    Property: "Large",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                    Type: null,
                },
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const type = randomElement(["Full", "Double", "Cover"]);
                    itemSetType(item, type);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemMouth3",
                Craft: {
                    Property: "Large",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                    Type: null,
                },
                Equip: () => (Math.random() > 0.5),
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, type);
                },
            },
        ],
        maid: [
            {
                Name: "LaceBands",
                Group: "Bracelet",
                Color: ["#aaaaaa", "#151515"],
            },
            {
                Name: "MaidOutfit2",
                Group: "Cloth",
                Color: ["#0C0C0C", "#919194", "#9C9C9F"],
            },
            {
                Name: "CatsuitCollar",
                Group: "ClothAccessory",
                Color: ["#0E0E0E"],
            },
            {
                Name: "MaidHairband1",
                Group: "Hat",
                Color: ["#979797"],
            },
            {
                Name: "Socks6",
                Group: "Socks",
                Color: ["#0D0D0D", "#919194"],
            },
            {
                Name: "HeartTop",
                Group: "Bra",
                Color: ["#0E0E0E"],
            },
            {
                Name: "FuturisticHeels2",
                Group: "Shoes",
                Color:  ["#101010", "Default", "#F1FAFF", "#898989", "#898989"],
                ItemCallback: (item) => itemSetType(item, "Matte"),
            },
            {
                Name: "MaidCollar",
                Group: "ItemNeck",
                Color: ["#DCDCDC", "#1B1B1B", "Default"],
                Craft: {
                    Property: "Secure",
                    Name: "Maid Collar",
                    Description: "A tight fitting yet comfortable collar",
                },
            },
            {
                Name: "FuturisticMittens",
                Group: "ItemHands",
                Color:  ["#FFFFFF", "#FFFFFF", "#2E2E2E", "#050505"],
                Craft: {
                    Property: "Secure",
                    Name: "Maid Mittens",
                    Description: "For keeping a maid out of trouble",
                    Type: null,
                },
            },
            {
                Name: "FuturisticHeels2",
                Group: "ItemBoots",
                Color:  ["#101010", "#101010", "Default", "#F1FAFF", "#898989", "#898989", "#898989"],
                Craft: {
                    Property: "Secure",
                    Name: "Maid Heels",
                    Type: "Matte",
                    Description: "For keeping a maid on their toes",
                },
            },
            {
                Name: "WiredEgg",
                Group: "ItemVulva",
                Color:  ["Default", "#141414"],
                Craft: {
                    Property: "Arousing",
                    Name: "Maid Teaser",
                    Description: "A little reminder to keep a maid on edge",
                    Type: "Low",
                    OverridePriority: 21,
                },
            },
            {
                Name: "StraitLeotard",
                Group: "ItemArms",
                Color:  ["#FFFFFF", "#1A1A1A", "#FFFFFF"],
                Craft: {
                    Property: "Secure",
                    Name: "Maid Jacket",
                    Description: "For keeping a maid out of trouble",
                    Type: "cl1co1np0vp0",
                },
            },
            {
                Name: "LeatherAnkleCuffs",
                Group: "ItemFeet",
                Color:  ["#969696", "#191919", "#969696"],
                Craft: {
                    Property: "Secure",
                    Name: "Maid Cuffs",
                    Description: "For keeping a maid out of trouble",
                    Type: null,
                },
            },
            {
                Name: "BallGag",
                Group: "ItemMouth",
                Craft: {
                    Property: "Large",
                    Name: "Maid Silencer",
                    Description: "Silence is golden",
                    Type: "Tight",
                },
            },
        ],
        // Use the catsuit rather than coloring the body when cosplay items are blocked
        statue: [
            {
                Name: "ReverseBunnySuit",
                Group: "SuitLower",
                Color: ["#1B1B1B"],
                Equip: () => !(Player.OnlineSharedSettings?.BlockBodyCosplay || false),
            },
            {
                Name: "SeamlessCatsuit",
                Group: "SuitLower",
                Color: ["#484747"],
                Equip: () => Player.OnlineSharedSettings?.BlockBodyCosplay || false,
            },
            {
                Name: "SeamlessCatsuit",
                Group: "Suit",
                Color: ["#484747"],
                Equip: () => Player.OnlineSharedSettings?.BlockBodyCosplay || false,
            },
            {
                Name: "ReverseBunnySuit",
                Group: "Cloth",
                Color: ["#1B1B1B", "#1B1B1B"],
            },
            {
                Name: "BondageSkirt",
                Group: "ClothLower",
                Color: ["#484747", "#333333", "#333333"],
            },
            {
                Name: "CatsuitCollar",
                Group: "ClothAccessory",
                Color: ["#484747"],
            },
            {
                Name: "HighCollar",
                Group: "ItemNeck",
                Color: ["#363636", "#717171"],
                Craft: {
                    Property: "Secure",
                    Name: "Statue Neck",
                    Type: "e0m3b0br0op0ms0",
                },
            },
            {
                Name: "LargeDildo",
                Group: "ItemMouth",
                Color: ["#333333"],
                Craft: {
                    Property: "Large",
                    Name: "Mouth Sealant",
                    OverridePriority: 27,
                },
            },
            {
                Name: "LatexPostureCollar",
                Group: "ItemMouth2",
                Color: ["Default"],
                Craft: {
                    Property: "Large",
                    Name: "Mouth Sealant",
                    OverridePriority: 28,
                },
            },
            {
                Name: "LatexBallMuzzleGag",
                Group: "ItemMouth3",
                Color: ["#A1A1A1"],
                Craft: {
                    Property: "Large",
                    Name: "Mouth Sealant",
                },
            },
            {
                Name: "KirugumiMask",
                Group: "ItemHood",
                Color: ["#484747", "#484747", "#484747", "#484747"],
                Craft: {
                    Property: "Secure",
                    Name: "Statue's Visage",
                    Type: "e0m3b0br0op0ms0",
                },
            },
            {
                Name: "MonoHeel",
                Group: "ItemBoots",
                Color: ["#737070", "#737070", "#101010"],
                Craft: {
                    Property: "Secure",
                    Name: "Statue Base",
                    Type: null,
                },
            },
            {
                Name: "FuturisticMittens",
                Group: "ItemHands",
                Color:  ["#767676", "#5F5F5F", "#3C3C3C", "#4F4F4F"],
                Craft: {
                    Property: "Secure",
                    Name: "Statue Hands",
                    Type: null,
                },
            },
            {
                Name: "SmoothLeatherArmbinder1",
                Group: "ItemArms",
                Color: ["#191919", "#3D3D3D", "#191919", "#191919", "#191919"],
                Craft: {
                    Property: "Secure",
                    Name: "Statue Arms",
                    Type: "b1s3",
                },
            },
        ],
    };

    for (const [setName, itemSet] of <[FortuneWheelNames, FortuneWheelItemBase[]][]>Object.entries(ret)) {
        for (const [i, item] of itemSet.entries()) {
            if (item.Craft != null) {
                item.Craft.Item = item.Name;
                item.Craft.Private = true;
                item.Craft.Type = (item.Craft.Type === undefined) ? null : item.Craft.Type;
                item.Craft.Color = Array.isArray(item.Color) ? item.Color.join(",") : item.Craft.Color;
                const asset = AssetGet(Player.AssetFamily, item.Group, item.Name);
                if (asset == null) {
                    throw `Invalid ${setName} item: ${item.Group}${item.Name}`;
                }
                CraftingValidate(<CraftingItem>item.Craft, asset, false);
            }
            itemSet[i] = Object.freeze(item);
        }
        ret[setName] = <FortuneWheelItemBase[]>Object.freeze(itemSet);
    }
    return <FortuneWheelItemSets>ret;
}

/**
 * Return a record with all new MBS fortune wheel options.
 * @param idExclude A list of {@link FortuneWheelOption.ID} values already present in {@link WheelFortuneOption}
 * @param colors A list of colors whose entries will be used at random
 */
function generateNewOptions(
    item_sets: FortuneWheelItemSets,
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
                item_sets.leash_candy,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 5),
            ),
            Default: true,
        },
        leash_candy_15_min: {
            Description: "PSO bondage for 15 minutes",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 15 minutes",
                item_sets.leash_candy,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 15),
            ),
            Default: true,
        },
        leash_candy_60_min: {
            Description: "PSO bondage for 60 minutes",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 60 minutes",
                item_sets.leash_candy,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 60),
            ),
            Default: true,
        },
        leash_candy_240_min: {
            Description: "PSO bondage for 4 hours",
            Script: () => fortuneWheelEquip(
                "PSO bondage for 4 hours",
                item_sets.leash_candy,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 240),
            ),
            Default: false,
        },
        leash_candy_exclusive: {
            Description: "PSO bondage",
            Script: () => fortuneWheelEquip(
                "PSO bondage",
                item_sets.leash_candy,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipLock(item, "ExclusivePadlock"),
            ),
            Default: true,
        },
        leash_candy_hisec: {
            Description: "High security PSO bondage",
            Script: () => fortuneWheelEquip(
                "High security PSO bondage",
                item_sets.leash_candy,
                STRIP_LEVEL.UNDERWEAR,
                (item) => {
                    if (InventoryDoesItemAllowLock(item) && item.Craft) {
                        item.Craft.Property = "Puzzling";
                    }
                    equipHighSecLock(item);
                },
            ),
            Default: false,
        },
        mummy: {
            Description: "Mummification",
            Script: () => fortuneWheelEquip(
                "Mummification",
                item_sets.mummy,
                STRIP_LEVEL.CLOTHES,
            ),
            Default: true,
        },
        maid_5_min: {
            Description: "Bondage maid for 5 minutes",
            Script: () => fortuneWheelEquip(
                "Bondage maid for 5 minutes",
                item_sets.maid,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 5),
            ),
            Default: true,
        },
        maid_15_min: {
            Description: "Bondage maid for 15 minutes",
            Script: () => fortuneWheelEquip(
                "Bondage maid for 15 minutes",
                item_sets.maid,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 15),
            ),
            Default: true,
        },
        maid_60_min: {
            Description: "Bondage maid for 60 minutes",
            Script: () => fortuneWheelEquip(
                "Bondage maid for 60 minutes",
                item_sets.maid,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 60),
            ),
            Default: true,
        },
        maid_240_min: {
            Description: "Bondage maid for 4 hours",
            Script: () => fortuneWheelEquip(
                "Bondage maid for 4 hours",
                item_sets.maid,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 240),
            ),
            Default: false,
        },
        maid_exclusive: {
            Description: "Bondage maid",
            Script: () => fortuneWheelEquip(
                "Bondage maid",
                item_sets.maid,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipLock(item, "ExclusivePadlock"),
            ),
            Default: true,
        },
        statue_5_min: {
            Description: "Petrification for 5 minutes",
            Script: () => fortuneWheelEquip(
                "Petrification for 5 minutes",
                item_sets.statue,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 5),
                statueCopyColors,
            ),
            Default: true,
        },
        statue_15_min: {
            Description: "Petrification for 15 minutes",
            Script: () => fortuneWheelEquip(
                "Petrification for 15 minutes",
                item_sets.statue,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 15),
                statueCopyColors,
            ),
            Default: true,
        },
        statue_60_min: {
            Description: "Petrification for 60 minutes",
            Script: () => fortuneWheelEquip(
                "Petrification for 60 minutes",
                item_sets.statue,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 60),
                statueCopyColors,
            ),
            Default: true,
        },
        statue_240_min: {
            Description: "Petrification for 4 hours",
            Script: () => fortuneWheelEquip(
                "Petrification for 4 hours",
                item_sets.statue,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipTimerLock(item, 240),
                statueCopyColors,
            ),
            Default: false,
        },
        statue_exclusive: {
            Description: "Petrification",
            Script: () => fortuneWheelEquip(
                "Petrification",
                item_sets.statue,
                STRIP_LEVEL.UNDERWEAR,
                (item) => equipLock(item, "ExclusivePadlock"),
                statueCopyColors,
            ),
            Default: true,
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

/** A read-only record with all new MBS fortune wheel item sets. */
let FORTUNATE_WHEEL_ITEM_SETS: Readonly<FortuneWheelItemSets>;

/** A read-only record with all new MBS fortune wheel options. */
let WHEEL_ITEMS_NEW: Readonly<FortuneWheelOptions>;

// Requires BC R88Beta1 or higher
waitFor(() => WheelFortuneDefault != undefined).then(() => {
    const BC_VERSION = parseVersion(GameVersion);
    const BC_88BETA1: [88, 1] = [88, 1];

    if (BC_VERSION >= BC_88BETA1) {
        console.log(`MBS: Initializing wheel of fortune module (BC ${GameVersion})`);

        FORTUNATE_WHEEL_ITEM_SETS = Object.freeze(generateItemSets());
        WHEEL_ITEMS_NEW = Object.freeze(generateNewOptions(
            FORTUNATE_WHEEL_ITEM_SETS,
            WheelFortuneOption.map(i => i.ID),
        ));

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
        console.log(`MBS: Failed to initialize the wheel of fortune module (BC ${GameVersion})`);
    }
});
