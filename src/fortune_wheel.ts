/** Main module for managing all fortune wheel-related additions */

"use strict";

import {
    MBS_MOD_API,
    randomElement,
    waitFor,
    padArray,
    isArray,
    entries,
    fromEntries,
} from "common";
import {
    FWItemSet,
    FWCommand,
    settingsMBSLoaded,
    canChangeCosplay,
    FORTUNE_WHEEL_MAX_SETS,
} from "common_bc";
import { validateBuiltinWheelIDs } from "sanity_checks";
import { pushMBSSettings, parseFWObjects } from "settings";
import { itemSetType } from "type_setting";
import { StripLevel } from "equipper";
import { FWSelectScreen } from "fortune_wheel_select";
import { ScreenProxy } from "screen_abc";

/**
 * Copy the character's hair color the to passed item.
 * @param item The item in question
 * @param character The respective player- or simple character
 * @param indices The indices of the {@link item.Color} array whose color will be updated
 */
function copyHairColor(item: Item, character: Character, indices: readonly number[]): void {
    if (item === null || typeof item !== "object") {
        throw new TypeError(`Invalid "item" type: ${typeof item}`);
    } else if (!isArray(indices)) {
        throw new TypeError(`Invalid "indices" type: ${typeof indices}`);
    } else if (character === null || typeof character !== "object") {
        throw new TypeError(`Invalid "character" type: ${typeof character}`);
    } else if (!character.IsSimple() && !character.IsPlayer()) {
        throw new Error("Expected a simple or player character");
    }

    const hair = character.Appearance.find(i => i.Asset.Group.Name === "HairFront");
    if (hair === undefined) {
        return;
    }

    // Ensure that the item's color is stored as an array
    const colorLength = Math.max(0, ...indices);
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
 * @param character The respective player- or simple character
 * @param color The color
 */
function colorItems(groupNames: readonly AssetGroupName[], character: Character, color: string): void {
    if (!isArray(groupNames)) {
        throw new TypeError(`Invalid "groupNames" type: ${typeof groupNames}`);
    } else if (typeof color !== "string") {
        throw new TypeError(`Invalid "color" type: ${typeof groupNames}`);
    }

    for (const name of groupNames) {
        const item = InventoryGet(character, name);
        if (item == null) {
            continue;
        }
        item.Color = Array(item.Asset.ColorableLayerCount).fill(color);
    }
}

function statueCopyColors<T>(itemList: T, character: Character): T {
    if (character === null || typeof character !== "object") {
        throw new TypeError(`Invalid "character" type: ${typeof character}`);
    } else if (!character.IsSimple() && !character.IsPlayer()) {
        throw new Error("Expected a simple or player character");
    }

    if (canChangeCosplay(character)) {
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
        colorItems(groupNames, character, "#484747");
    }
    return itemList;
}

/** Return a record with all new MBS fortune wheel item sets. */
function generateItems(): Readonly<Record<FortuneWheelNames, readonly FWItem[]>> {
    const protoRecord: Record<FortuneWheelNames, FWItemBase[]> = {
        leash_candy: [
            {
                Name: "ReverseBunnySuit",
                Group: "Suit",
                ItemCallback: (item, character) => copyHairColor(item, character, [0, 1]),
            },
            {
                Name: "Catsuit",
                Group: "SuitLower",
                ItemCallback: (item, character) => copyHairColor(item, character, [0, 1]),
            },
            {
                Name: "FaceVeil",
                Group: "Mask",
                Color: ["#000", "Default"],
                ItemCallback: (item, character) => copyHairColor(item, character, [1]),
            },
            {
                Name: "FuturisticMittens",
                Group: "ItemHands",
                Type: null,
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Mittens",
                },
                ItemCallback: (item, character) => copyHairColor(item, character, [0, 1]),
            },
            {
                Name: "InteractiveVRHeadset",
                Group: "ItemHead",
                Type: "b3f3g1",
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Headset",
                },
                ItemCallback: (item, character) => copyHairColor(item, character, [0]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [3]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [0, 2, 4, 5]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [2, 3]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [0]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [0, 1, 2]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [1]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [0]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [1, 2]),
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
                ItemCallback: (item, character) => copyHairColor(item, character, [2]),
            },
            {
                Name: "DroneMask",
                Group: "ItemHood",
                Type: "m0e0p1g0s1h2j0",
                Craft: {
                    Property: "Thin",
                    Name: "Permanent PSO Mask",
                },
                ItemCallback: (item, character) => copyHairColor(item, character, [2]),
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
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, character, type);
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
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const allowType = item.Asset.AllowType ? [null, ...item.Asset.AllowType] : [null];
                    const type = randomElement(allowType);
                    itemSetType(item, character, type);
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
                ItemCallback: (item, character) => copyHairColor(item, character, [0]),
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
                    copyHairColor(item, character, [0]);
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
                    copyHairColor(item, character, [0]);
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
                    copyHairColor(item, character, [0]);
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
                Equip: (character) => canChangeCosplay(character),
            },
            {
                Name: "SeamlessCatsuit",
                Group: "SuitLower",
                Color: ["#484747"],
                Equip: (character) => !canChangeCosplay(character),
            },
            {
                Name: "SeamlessCatsuit",
                Group: "Suit",
                Color: ["#484747"],
                Equip: (character) => !canChangeCosplay(character),
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

    const ret = fromEntries(entries(protoRecord).map(([setName, itemList]) => {
        const itemListNew: readonly FWItem[] = Object.freeze(itemList.map(protoItem => {
            let craft: undefined | CraftingItem = undefined;
            if (protoItem.Craft !== null && typeof protoItem.Craft === "object") {
                const asset = AssetGet(Player.AssetFamily, protoItem.Group, protoItem.Name);
                if (asset == null) {
                    throw new Error(`Invalid ${setName} item: ${protoItem.Group}${protoItem.Name}`);
                }

                craft = <CraftingItem>{
                    ...protoItem.Craft,
                    Item: protoItem.Name,
                    Private: true,
                    Lock: "",
                    Type: null,
                    Name: protoItem.Craft.Name || asset.Description,
                    OverridePriority: protoItem.Craft.OverridePriority ?? null,
                    MemberNumber: undefined,
                    MemberName: "",
                };
                CraftingValidate(craft, asset, false);
            }

            return Object.freeze({
                ...protoItem,
                Custom: false,
                Property: Object.freeze(protoItem.Property ?? {}),
                Type: protoItem.Type ?? null,
                Craft: Object.freeze(craft),
                Color: protoItem.Color ?? undefined,
                ItemCallback: protoItem.ItemCallback ?? undefined,
                Equip: protoItem.Equip ?? undefined,
            });
        }));
        return [setName, itemListNew];
    }));
    return Object.freeze(ret);
}

/** A read-only record with the raw MBS fortune wheel items. */
export let FORTUNE_WHEEL_ITEMS: Readonly<Record<FortuneWheelNames, readonly FWItem[]>>;

/** A read-only list with the fully fledged MBS fortune wheel item sets. */
export let FORTUNE_WHEEL_ITEM_SETS: readonly FWItemSet[];

/** A read-only list with all player-independent {@link WheelFortuneOption} values. */
export let FORTUNE_WHEEL_OPTIONS_BASE: readonly FWObjectOption[];

/** A string with all player-independent {@link WheelFortuneDefault} values. */
export let FORTUNE_WHEEL_DEFAULT_BASE: string;

/**
 * A {@link loadFortuneWheel} helper function for loading item- or command sets.
 * @param fieldName The name of the sets-field
 * @param name The name of the sets
 */
function loadFortuneWheelObjects<T extends "FortuneWheelItemSets" | "FortuneWheelCommands">(
    character: Character,
    fieldName: T,
    name: string,
): MBSSettings[T] {
    const mbs = character.OnlineSharedSettings?.MBS;
    let protoWheelList = (mbs === undefined) ? undefined : mbs[fieldName];
    if (!Array.isArray(protoWheelList)) {
        if (protoWheelList !== undefined) {
            console.warn(`MBS: Failed to load "${character.AccountName}" wheel of fortune ${name}`);
        }
        protoWheelList = Array(FORTUNE_WHEEL_MAX_SETS).fill(null);
    }

    let wheelList: MBSSettings[T];
    if (character.IsPlayer()) {
        wheelList = Player.MBSSettings[fieldName];
    } else {
        const constructor = fieldName === "FortuneWheelItemSets" ? FWItemSet.fromObject : FWCommand.fromObject;
        // @ts-ignore
        wheelList = parseFWObjects(constructor, protoWheelList);
    }
    wheelList.forEach(i => {if (!i?.hidden) { i?.registerOptions(false); }});
    return wheelList;
}

class FWScreenProxy extends ScreenProxy {
    static readonly screen = "WheelFortune";
    readonly screen = FWScreenProxy.screen;
    character: Character;
    FortuneWheelItemSets: (null | import("common_bc").FWItemSet)[];
    FortuneWheelCommands: (null | import("common_bc").FWCommand)[];

    constructor() {
        super(
            null,
            "WheelFortune",
            "MiniGame",
            {
                Run: WheelFortuneRun,
                Click: WheelFortuneClick,
                Exit: WheelFortuneExit,
                Load: WheelFortuneLoad,
                Unload: CommonNoop,
                Resize: CommonNoop,
                KeyDown: CommonNoop,
            },
        );
        this.character = Player;
        this.FortuneWheelItemSets = Array(FORTUNE_WHEEL_MAX_SETS).fill(null);
        this.FortuneWheelCommands = Array(FORTUNE_WHEEL_MAX_SETS).fill(null);
    }

    initialize() {
        if (WheelFortuneCharacter == null) {
            throw new Error("Cannot load the fortune wheel UI while `WheelFortuneCharacter == null`");
        }
        WheelFortuneOption = [...FORTUNE_WHEEL_OPTIONS_BASE];
        WheelFortuneDefault = FORTUNE_WHEEL_DEFAULT_BASE;
        this.character = WheelFortuneCharacter;
        this.FortuneWheelItemSets = loadFortuneWheelObjects(WheelFortuneCharacter, "FortuneWheelItemSets", "item sets");
        this.FortuneWheelCommands = loadFortuneWheelObjects(WheelFortuneCharacter, "FortuneWheelCommands", "commands");
    }
}

export let fortuneWheelState: FWScreenProxy;

// Requires BC R88Beta1 or higher
waitFor(settingsMBSLoaded).then(() => {
    console.log("MBS: Initializing wheel of fortune module");
    if (!validateBuiltinWheelIDs()) {
        return;
    }

    // Load and register the default MBS item sets
    FORTUNE_WHEEL_ITEMS = generateItems();
    FORTUNE_WHEEL_ITEM_SETS = Object.freeze([
        new FWItemSet(
            "PSO Bondage",
            FORTUNE_WHEEL_ITEMS.leash_candy,
            Player.MBSSettings.FortuneWheelItemSets,
            StripLevel.UNDERWEAR,
            StripLevel.UNDERWEAR,
            ["5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "Exclusive", "High Security"],
            false,
            false,
        ),
        new FWItemSet(
            "Mummification",
            FORTUNE_WHEEL_ITEMS.mummy,
            Player.MBSSettings.FortuneWheelItemSets,
            StripLevel.CLOTHES,
            StripLevel.UNDERWEAR,
            ["Exclusive"],
            false,
            false,
        ),
        new FWItemSet(
            "Bondage Maid",
            FORTUNE_WHEEL_ITEMS.maid,
            Player.MBSSettings.FortuneWheelItemSets,
            StripLevel.UNDERWEAR,
            StripLevel.UNDERWEAR,
            ["5 Minutes", "15 Minutes", "1 Hour", "4 Hours", "Exclusive"],
            false,
            false,
        ),
        new FWItemSet(
            "Petrification",
            FORTUNE_WHEEL_ITEMS.statue,
            Player.MBSSettings.FortuneWheelItemSets,
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
    pushMBSSettings();

    MBS_MOD_API.hookFunction("WheelFortuneLoad", 11, (args, next) => {
        fortuneWheelState.initialize();
        if (TextScreenCache != null) {
            for (const { Description, Custom, ID } of WheelFortuneOption) {
                if (Description !== undefined) {
                    TextScreenCache.cache[`Option${ID}`] = (Custom) ? `*${Description}` : Description;
                }
            }
        }
        return next(args);
    });

    MBS_MOD_API.hookFunction("WheelFortuneCustomizeLoad", 0, (args, next) => {
        if (TextScreenCache != null) {
            for (const { Description, Custom, ID } of WheelFortuneOption) {
                if (Description !== undefined) {
                    TextScreenCache.cache[`Option${ID}`] = (Custom) ? `*${Description}` : Description;
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
            const struct = {
                FortuneWheelItemSets: fortuneWheelState.FortuneWheelItemSets,
                FortuneWheelCommands: fortuneWheelState.FortuneWheelCommands,
            };
            const subScreen = new FWSelectScreen(fortuneWheelState, struct, fortuneWheelState.character);
            fortuneWheelState.children.set(subScreen.screen, subScreen);
            return subScreen.load();
        } else {
            return next(args);
        }
    });

    fortuneWheelState = new FWScreenProxy();
});
