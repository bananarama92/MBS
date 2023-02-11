/** Main module for managing all fortune wheel-related additions */

"use strict";

import {
    MBS_MOD_API,
    randomElement,
    waitFor,
    padArray,
} from "common";
import {
    WheelFortuneItemSet,
    setScreenNoText,
    settingsMBSLoaded,
    canChangeCosplay,
    FORTUNE_WHEEL_MAX_SETS,
} from "common_bc";
import { validateBuiltinWheelIDs } from "sanity_checks";
import { pushMBSSettings } from "settings";
import { itemSetType } from "type_setting";
import { StripLevel } from "equipper";
import { MBSSelect } from "glob_vars";

/**
 * Copy the player's hair color the to passed item.
 * @param item The item in question
 * @param indices The indices of the {@link item.Color} array whose color will be updated
 */
function copyHairColor(item: Item, indices: readonly number[]): void {
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    } else if (!Array.isArray(<readonly number[]>indices)) {
        throw new TypeError(`Invalid "indices" type: ${typeof indices}`);
    }

    const hair = Player.Appearance.find(i => i.Asset.Group.Name === "HairFront");
    if (hair === undefined) {
        return;
    }

    // Ensure that the item's color is stored as an array
    const colorLength = Math.max(...indices);
    let color: string[];
    if (typeof item.Color === "string") {
        item.Color = color = padArray([item.Color], colorLength, "Default");
    } else if (!Array.isArray(item.Color) || item.Color.length === 0) {
        item.Color = color = Array(colorLength).fill("Default");
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
 * @param groupNames The to-be colored groups
 * @param color The color
 */
function colorItems(groupNames: readonly AssetGroupName[], color: string): void {
    if (!Array.isArray(<readonly AssetGroupName[]>groupNames)) {
        throw new TypeError(`Invalid "groupNames" type: ${typeof groupNames}`);
    }
    if (typeof color !== "string") {
        throw new TypeError(`Invalid "color" type: ${typeof groupNames}`);
    }

    for (const name of groupNames) {
        const item = InventoryGet(Player, name);
        if (item == null) {
            continue;
        }
        item.Color = Array(item.Asset.ColorableLayerCount).fill(color);
    }
}

function statueCopyColors<T>(itemList: T): T {
    if (canChangeCosplay(Player)) {
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
function generateItems(): FortuneWheelItems {
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
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Mittens",
                },
                ItemCallback: (item) => copyHairColor(item, [0, 1]),
            },
            {
                Name: "InteractiveVRHeadset",
                Group: "ItemHead",
                Type: "b3f3g1",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Headset",
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
                Type: "n1h0s3",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Muzzle",
                    Description: "Keeping your cries muffled",
                },
                ItemCallback: (item) => copyHairColor(item, [3]),
            },
            {
                Name: "FuturisticVibrator",
                Group: "ItemVulva",
                Type: "Edge",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Vibe",
                    Description: "Specially made to fill a PSO",
                },
            },
            {
                Name: "SciFiPleasurePanties",
                Group: "ItemPelvis",
                Type: "c3i4o1s2",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Panties",
                    Description: "No escape and no Orgasms",
                },
                ItemCallback: (item) => copyHairColor(item, [0, 2, 4, 5]),
            },
            {
                Name: "BonedNeckCorset",
                Group: "ItemNeck",
                Color: ["#222222", "#888888", "#AA2121", "#AA2121", "#888888"],
                Type: "Ring",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Collar",
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
                },
                Property: {
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
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Corset",
                    Description: "Extra tight and specially molded",
                },
            },
            {
                Name: "FuturisticHarness",
                Group: "ItemTorso2",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Harness",
                    Description: "Special harness that constantly shrinks....",
                },
                Property: {
                    OverridePriority: 23,
                },
                ItemCallback: (item) => copyHairColor(item, [0, 1, 2]),
            },
            {
                Name: "FuturisticEarphones",
                Group: "ItemEars",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Earphones",
                },
                Color: ["#0F0F0F", "Default", "Default"],
                ItemCallback: (item) => copyHairColor(item, [1]),
            },
            {
                Name: "CeilingChain",
                Group: "ItemAddon",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Chain",
                    Description: "Never to escape",
                },
                ItemCallback: (item) => copyHairColor(item, [0]),
            },
            {
                Name: "RoundPiercing",
                Group: "ItemNipplesPiercings",
                Type: "Chain",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Piercings",
                },
                Color: ["#000000", "Default", "Default"],
                ItemCallback: (item) => copyHairColor(item, [1, 2]),
            },
            {
                Name: "CollarAutoShockUnit",
                Group: "ItemNeckAccessories",
                Type: "s2y0",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Shock Unit",
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
                Type: "m0e0p1g0s1h2j0",
                Craft: {
                    Property: "Thin",
                    Name: "Permanent PSO Mask",
                },
                ItemCallback: (item) => copyHairColor(item, [2]),
            },
        ],
        mummy: [
            {
                Name: "DuctTape",
                Group: "ItemFeet",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, Player, type);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemLegs",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, Player, type);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemHands",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item) => copyHairColor(item, [0]),
            },
            {
                Name: "DuctTape",
                Group: "ItemArms",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item, character) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, character, type);
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
                Type: null,
                Craft: {
                    Property: "Large",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item, character) => {
                    copyHairColor(item, [0]);
                    const type = randomElement(["Full", "Double", "Cover"]);
                    itemSetType(item, character, type);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemMouth3",
                Type: null,
                Craft: {
                    Property: "Large",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                Equip: () => (Math.random() > 0.5),
                ItemCallback: (item, character) => {
                    copyHairColor(item, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, character, type);
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
                Type: "Matte",
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
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Maid Mittens",
                    Description: "For keeping a maid out of trouble",
                },
            },
            {
                Name: "FuturisticHeels2",
                Group: "ItemBoots",
                Color:  ["#101010", "#101010", "Default", "#F1FAFF", "#898989", "#898989", "#898989"],
                Type: "Matte",
                Craft: {
                    Property: "Secure",
                    Name: "Maid Heels",
                    Description: "For keeping a maid on their toes",
                },
            },
            {
                Name: "WiredEgg",
                Group: "ItemVulva",
                Color:  ["Default", "#141414"],
                Type: "Low",
                Craft: {
                    Property: "Arousing",
                    Name: "Maid Teaser",
                    Description: "A little reminder to keep a maid on edge",
                },
                Property: {
                    OverridePriority: 21,
                },
            },
            {
                Name: "StraitLeotard",
                Group: "ItemArms",
                Color:  ["#FFFFFF", "#1A1A1A", "#FFFFFF"],
                Type: "cl1co1np0vp0",
                Craft: {
                    Property: "Secure",
                    Name: "Maid Jacket",
                    Description: "For keeping a maid out of trouble",
                },
            },
            {
                Name: "LeatherAnkleCuffs",
                Group: "ItemFeet",
                Color:  ["#969696", "#191919", "#969696"],
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Maid Cuffs",
                    Description: "For keeping a maid out of trouble",
                },
            },
            {
                Name: "BallGag",
                Group: "ItemMouth",
                Type: "Tight",
                Craft: {
                    Property: "Large",
                    Name: "Maid Silencer",
                    Description: "Silence is golden",
                },
            },
        ],
        // Use the catsuit rather than coloring the body when cosplay items are blocked
        statue: [
            {
                Name: "ReverseBunnySuit",
                Group: "SuitLower",
                Color: ["#1B1B1B"],
                Equip: () => canChangeCosplay(Player),
            },
            {
                Name: "SeamlessCatsuit",
                Group: "SuitLower",
                Color: ["#484747"],
                Equip: () => !canChangeCosplay(Player),
            },
            {
                Name: "SeamlessCatsuit",
                Group: "Suit",
                Color: ["#484747"],
                Equip: () => !canChangeCosplay(Player),
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
                Type: "e0m3b0br0op0ms0",
                Craft: {
                    Property: "Secure",
                    Name: "Statue Neck",
                },
            },
            {
                Name: "LargeDildo",
                Group: "ItemMouth",
                Color: ["#333333"],
                Craft: {
                    Property: "Large",
                    Name: "Mouth Sealant",
                },
                Property: {
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
                },
                Property: {
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
                Type: "e0m3b0br0op0ms0",
                Craft: {
                    Property: "Secure",
                    Name: "Statue's Visage",
                },
            },
            {
                Name: "MonoHeel",
                Group: "ItemBoots",
                Color: ["#737070", "#737070", "#101010"],
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Statue Base",
                },
            },
            {
                Name: "FuturisticMittens",
                Group: "ItemHands",
                Color:  ["#767676", "#5F5F5F", "#3C3C3C", "#4F4F4F"],
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Statue Hands",
                },
            },
            {
                Name: "SmoothLeatherArmbinder1",
                Group: "ItemArms",
                Color: ["#191919", "#3D3D3D", "#191919", "#191919", "#191919"],
                Type: "b1s3",
                Craft: {
                    Property: "Secure",
                    Name: "Statue Arms",
                },
            },
        ],
    };

    for (const [setName, itemList] of <[FortuneWheelNames, FortuneWheelItemBase[]][]>Object.entries(ret)) {
        for (const [i, item] of itemList.entries()) {
            item.Custom = false;
            item.Property = item.Property ?? {};
            item.Type = item.Type ?? null;
            const {Name, Group, Craft} = item;
            if (Craft !== null && typeof Craft === "object") {
                Craft.Item = Name;
                Craft.Private = true;
                Craft.Lock = "";
                const asset = AssetGet(Player.AssetFamily, Group, Name);
                if (asset == null) {
                    throw new Error(`Invalid ${setName} item: ${Group}${Name}`);
                }
                Craft.Name = Craft.Name || asset.Description;
                CraftingValidate(<CraftingItem>Craft, asset, false);
            } else {
                item.Craft = undefined;
            }
            itemList[i] = Object.freeze(item);
        }
        ret[setName] = <FortuneWheelItemBase[]>Object.freeze(itemList);
    }
    return <FortuneWheelItems>ret;
}

/** A read-only record with the raw MBS fortune wheel items. */
export let FORTUNE_WHEEL_ITEMS: Readonly<FortuneWheelItems>;

/** A read-only list with the fully fledged MBS fortune wheel item sets. */
export let FORTUNE_WHEEL_ITEM_SETS: readonly WheelFortuneItemSet[];

/** A read-only list with all player-independent {@link WheelFortuneOption} values. */
export let FORTUNE_WHEEL_OPTIONS_BASE: readonly FortuneWheelOptionBase[];

/** A string with all player-independent {@link WheelFortuneDefault} values. */
export let FORTUNE_WHEEL_DEFAULT_BASE: string;

/** Load the wheel of fortune options and defaults of the appropriate character. */
function loadFortuneWheel(): void {
    const mbs = WheelFortuneCharacter?.OnlineSharedSettings?.MBS;
    let fortuneWheelSets = mbs?.FortuneWheelSets;
    if (!Array.isArray(fortuneWheelSets)) {
        if (fortuneWheelSets !== undefined) {
            console.warn(`MBS: Failed to load "${WheelFortuneCharacter?.AccountName}" wheel of fortune item sets`);
        }
        fortuneWheelSets = Array(FORTUNE_WHEEL_MAX_SETS).fill(null);
    }

    WheelFortuneOption = [...FORTUNE_WHEEL_OPTIONS_BASE];
    WheelFortuneDefault = FORTUNE_WHEEL_DEFAULT_BASE;
    if (WheelFortuneCharacter?.IsPlayer()) {
        MBSSelect.currentFortuneWheelSets = Player.MBSSettings.FortuneWheelSets;
    } else {
        MBSSelect.currentFortuneWheelSets = fortuneWheelSets.map((protoItemSet, i) => {
            if (protoItemSet === null) {
                return null;
            }
            try {
                return WheelFortuneItemSet.fromObject(protoItemSet);
            } catch (error) {
                console.warn(`MBS: Failed to load "${WheelFortuneCharacter?.AccountName}" wheel of fortune item set ${i}`, error);
                return null;
            }
        });
    }
    MBSSelect.currentFortuneWheelSets.forEach(itemSet => {
        if (!itemSet?.hidden) {
            itemSet?.registerOptions(false);
        }
    });
}

// Requires BC R88Beta1 or higher
waitFor(settingsMBSLoaded).then(() => {
    console.log("MBS: Initializing wheel of fortune module");
    if (!validateBuiltinWheelIDs()) {
        return;
    }

    // Load and register the default MBS item sets
    FORTUNE_WHEEL_ITEMS = Object.freeze(generateItems());
    FORTUNE_WHEEL_ITEM_SETS = Object.freeze([
        new WheelFortuneItemSet(
            "PSO Bondage",
            FORTUNE_WHEEL_ITEMS.leash_candy,
            StripLevel.UNDERWEAR,
            StripLevel.CLOTHES,
            ["5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "Exclusive", "High Security"],
            false,
            false,
        ),
        new WheelFortuneItemSet(
            "Mummification",
            FORTUNE_WHEEL_ITEMS.mummy,
            StripLevel.CLOTHES,
            StripLevel.UNDERWEAR,
            ["Exclusive"],
            false,
            false,
        ),
        new WheelFortuneItemSet(
            "Bondage Maid",
            FORTUNE_WHEEL_ITEMS.maid,
            StripLevel.UNDERWEAR,
            StripLevel.UNDERWEAR,
            ["5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "Exclusive"],
            false,
            false,
        ),
        new WheelFortuneItemSet(
            "Petrification",
            FORTUNE_WHEEL_ITEMS.statue,
            StripLevel.UNDERWEAR,
            StripLevel.UNDERWEAR,
            ["5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "Exclusive"],
            false,
            false,
            statueCopyColors,
        ),
    ]);
    FORTUNE_WHEEL_ITEM_SETS.forEach(itemSet => itemSet.registerOptions(false));
    FORTUNE_WHEEL_OPTIONS_BASE = Object.freeze(WheelFortuneOption.filter(i => !i.Custom));
    FORTUNE_WHEEL_DEFAULT_BASE = WheelFortuneDefault;
    pushMBSSettings(false);

    MBS_MOD_API.hookFunction("WheelFortuneLoad", 11, (args, next) => {
        loadFortuneWheel();
        if (TextScreenCache != null) {
            for (const option of WheelFortuneOption) {
                if (option.Description !== undefined) {
                    TextScreenCache.cache[`Option${option.ID}`] = (option.Custom) ? `*${option.Description}` : option.Description;
                }
            }
        }
        return next(args);
    });

    MBS_MOD_API.hookFunction("WheelFortuneCustomizeLoad", 0, (args, next) => {
        if (TextScreenCache != null) {
            for (const option of WheelFortuneOption) {
                if (option.Description !== undefined) {
                    TextScreenCache.cache[`Option${option.ID}`] = (option.Custom) ? `*${option.Description}` : option.Description;
                }
            }
        }
        return next(args);
    });

    MBS_MOD_API.hookFunction("WheelFortuneRun", 0, (args, next) => {
        next(args);
        const enabled = WheelFortuneVelocity === 0;
        const color = enabled ? "White" : "Silver";
        const name = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        const description = WheelFortuneCharacter?.IsPlayer() ? "MBS: Configure custom options" : `MBS: View ${name}'s option config`;
        DrawButton(1655, 25, 90, 90, "", color, "Icons/Crafting.png", description, !enabled);
    });

    MBS_MOD_API.hookFunction("WheelFortuneClick", 0, (args, next) => {
        if (WheelFortuneVelocity === 0 && MouseIn(1655, 25, 90, 90)) {
            return setScreenNoText("MBSFortuneWheelSelect");
        } else {
            return next(args);
        }
    });
});
