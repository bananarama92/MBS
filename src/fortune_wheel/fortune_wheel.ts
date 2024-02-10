/** Main module for managing all fortune wheel-related additions */

import { clone } from "lodash-es";

import {
    MBS_MOD_API,
    randomElement,
    waitFor,
    padArray,
    isArray,
    entries,
    fromEntries,
    logger,
} from "../common";
import {
    FWItemSet,
    settingsMBSLoaded,
    canChangeCosplay,
    MBS_MAX_SETS,
    createWeightedWheelIDs,
    bcLoaded,
} from "../common_bc";
import { validateBuiltinWheelIDs } from "../sanity_checks";
import { ScreenProxy } from "../screen_abc";
import { pushMBSSettings, SettingsType } from "../settings";

import { DEFAULT_FLAGS, enableFlags } from "./lock_flags";
import { itemSetType } from "./type_setting";
import { StripLevel } from "./equipper";
import { FWSelectScreen, loadFortuneWheelObjects } from "./fortune_wheel_select";
import { WheelPresetScreen } from "./preset_screen";

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
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Mittens",
                },
                ItemCallback: (item, character) => copyHairColor(item, character, [0, 1]),
            },
            {
                Name: "InteractiveVRHeadset",
                Group: "ItemHead",
                TypeRecord: { b: 3, f: 3, g: 1 },
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
                TypeRecord: { n: 1, h: 0, s: 3 },
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
                TypeRecord: { "vibrating": 9 },
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Vibe",
                    Description: "Specially made to fill a PSO",
                },
            },
            {
                Name: "SciFiPleasurePanties",
                Group: "ItemPelvis",
                TypeRecord: { c: 3, i: 4, o: 1, s: 2 },
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
                TypeRecord: { typed: 1 },
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
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Permanent PSO Corset",
                    Description: "Extra tight and specially molded",
                },
            },
            {
                Name: "FuturisticHarness",
                Group: "ItemTorso2",
                TypeRecord: { typed: 0 },
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
                TypeRecord: { typed: 0 },
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
                TypeRecord: { typed: 0 },
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
                TypeRecord: { typed: 1 },
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
                TypeRecord: { s: 2, y: 0 },
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
                TypeRecord: { m: 0, e: 0, p: 1, g: 0, s: 1, h: 2, j: 0 },
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
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
                    const allowType = (data?.options ?? []).map(o => o.Property.TypeRecord);
                    if (allowType.length === 0) {
                        return;
                    }
                    const typeRecord = randomElement(allowType);
                    itemSetType(item, character, typeRecord);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemLegs",
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
                    const allowType = (data?.options ?? []).map(o => o.Property.TypeRecord);
                    if (allowType.length === 0) {
                        return;
                    }
                    const typeRecord = randomElement(allowType);
                    itemSetType(item, character, typeRecord);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemHands",
                TypeRecord: { typed: 0 },
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
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
                    const allowType = (data?.options ?? []).map(o => o.Property.TypeRecord);
                    if (allowType.length === 0) {
                        return;
                    }
                    const typeRecord = randomElement(allowType);
                    itemSetType(item, character, typeRecord);
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
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Large",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
                    const allowType = (data?.options ?? []).map(o => o.Property.TypeRecord);
                    if (allowType.length < 2) {
                        return;
                    }
                    const typeRecord = randomElement(allowType.slice(1));
                    itemSetType(item, character, typeRecord);
                },
            },
            {
                Name: "DuctTape",
                Group: "ItemMouth3",
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Large",
                    Name: "Mummy Wrappings",
                    Description: "A bundle of resilient cloth wrappings",
                },
                Equip: () => (Math.random() > 0.5),
                ItemCallback: (item, character) => {
                    copyHairColor(item, character, [0]);
                    const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
                    const allowType = (data?.options ?? []).map(o => o.Property.TypeRecord);
                    if (allowType.length === 0) {
                        return;
                    }
                    const typeRecord = randomElement(allowType);
                    itemSetType(item, character, typeRecord);
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
                TypeRecord: { typed: 1 },
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
                TypeRecord: { typed: 0 },
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
                TypeRecord: { typed: 1 },
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
                TypeRecord: { vibrating: 1 },
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
                TypeRecord: { cl: 1, co: 1, np: 0, vp: 0 },
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
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Maid Cuffs",
                    Description: "For keeping a maid out of trouble",
                },
            },
            {
                Name: "BallGag",
                Group: "ItemMouth",
                TypeRecord: { typed: 2 },
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
                TypeRecord: { e: 0, m: 3, b: 0, br: 0, op: 0, ms: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Statue's Visage",
                },
            },
            {
                Name: "MonoHeel",
                Group: "ItemBoots",
                Color: ["#737070", "#737070", "#101010"],
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Statue Base",
                },
            },
            {
                Name: "FuturisticMittens",
                Group: "ItemHands",
                Color:  ["#767676", "#5F5F5F", "#3C3C3C", "#4F4F4F"],
                TypeRecord: { typed: 0 },
                Craft: {
                    Property: "Secure",
                    Name: "Statue Hands",
                },
            },
            {
                Name: "SmoothLeatherArmbinder1",
                Group: "ItemArms",
                Color: ["#191919", "#3D3D3D", "#191919", "#191919", "#191919"],
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
                    TypeRecord: undefined,
                    Name: protoItem.Craft.Name || asset.Description,
                    MemberNumber: undefined,
                    MemberName: "",
                };
                CraftingValidate(craft, asset, false);
            }

            return Object.freeze({
                ...protoItem,
                Custom: false,
                Property: Object.freeze(protoItem.Property ?? {}),
                TypeRecord: protoItem.TypeRecord,
                Craft: Object.freeze(craft),
                Color: protoItem.Color,
                ItemCallback: protoItem.ItemCallback,
                Equip: protoItem.Equip,
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

class FWScreenProxy extends ScreenProxy {
    static readonly screen = "WheelFortune";
    readonly screen = FWScreenProxy.screen;
    character: Character;
    FortuneWheelItemSets: (null | import("../common_bc").FWItemSet)[];
    FortuneWheelCommands: (null | import("../common_bc").FWCommand)[];
    weightedIDs: string;

    constructor() {
        super(
            null,
            "WheelFortune",
            "MiniGame",
            {
                Run: WheelFortuneRun,
                Click: WheelFortuneClick,
                Exit: WheelFortuneExit,
                Load: () => {
                    CommonSetScreen("MiniGame", "WheelFortune");
                    WheelFortuneLoad();
                },
            },
        );
        this.character = Player;
        this.FortuneWheelItemSets = Array(MBS_MAX_SETS).fill(null);
        this.FortuneWheelCommands = Array(MBS_MAX_SETS).fill(null);
        this.weightedIDs = this.character.OnlineSharedSettings?.WheelFortune ?? WheelFortuneDefault;
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
        this.weightedIDs = createWeightedWheelIDs(this.character.OnlineSharedSettings?.WheelFortune ?? WheelFortuneDefault);
    }
}

export let fortuneWheelState: FWScreenProxy;

waitFor(bcLoaded).then(() => {
    logger.log("Initializing wheel of fortune hooks");
    if (!validateBuiltinWheelIDs()) {
        return;
    }

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

    MBS_MOD_API.patchFunction("WheelFortuneRun", {
        'DrawButton(1770, 25, 90, 90, "", BackColor, "Icons/Random.png", TextGet("Random"));':
            ";",
        'DrawTextWrap(TextGet((WheelFortuneVelocity == 0) ? (WheelFortuneForced ? "Forced" : "Title") : "Wait"), 1375, 200, 550, 200, "White");':
            ";",
    });

    MBS_MOD_API.hookFunction("WheelFortuneRun", 0, (args, next) => {
        const canSpin = (Player.MBSSettings.RollWhenRestrained || !Player.IsRestrained());
        if (!canSpin) {
            WheelFortuneForced = false;
        }

        next(args);

        const enabledConfig = WheelFortuneVelocity === 0;
        const colorConfig = enabledConfig ? "White" : "Silver";
        const nameConfig = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        const descriptionConfig = WheelFortuneCharacter?.IsPlayer() ? "MBS: Configure custom options" : `MBS: View ${nameConfig}'s option config`;
        DrawButton(1655, 25, 90, 90, "", colorConfig, "Icons/Crafting.png", descriptionConfig, !enabledConfig);

        const enabledPreset = !!(WheelFortuneVelocity === 0 && WheelFortuneCharacter?.IsPlayer());
        const colorPreset = enabledPreset ? "White" : "Silver";
        const namePreset = WheelFortuneCharacter?.Nickname ?? WheelFortuneCharacter?.Name;
        const descriptionPreset = WheelFortuneCharacter?.IsPlayer() ? "MBS: Configure option presets" : `MBS: View ${namePreset}'s option presets`;
        DrawButton(1545, 25, 90, 90, "", colorPreset, "Icons/Crafting.png", descriptionPreset, !enabledPreset);

        const backColor = (WheelFortuneVelocity == 0 && canSpin) ? "White" : "Silver";
        DrawButton(
            1770, 25, 90, 90, "", backColor, "Icons/Random.png",
            canSpin ? TextGet("Random") : "MBS: Cannot spin while restrained",
            !canSpin,
        );

        let text = "";
        if (WheelFortuneVelocity !== 0) {
            text = TextGet("Wait");
        } else if (!canSpin) {
            text = "Cannot spin the wheel of fortune while restrained";
        } else if (WheelFortuneForced) {
            text = TextGet("Forced");
        } else {
            text = TextGet("Title");
        }
        DrawTextWrap(text, 1375, 200, 550, 200, "White");
    });

    MBS_MOD_API.hookFunction("WheelFortuneClick", 0, (args, next) => {
        if (!Player.MBSSettings.RollWhenRestrained && Player.IsRestrained()) {
            WheelFortuneForced = false;
            if (MouseIn(1770, 25, 90, 90)) {
                return;
            }
        }

        if (WheelFortuneVelocity === 0 && MouseIn(1655, 25, 90, 90)) {
            const struct = {
                FortuneWheelItemSets: fortuneWheelState.FortuneWheelItemSets,
                FortuneWheelCommands: fortuneWheelState.FortuneWheelCommands,
            };
            const subScreen = new FWSelectScreen(fortuneWheelState, struct, fortuneWheelState.character);
            fortuneWheelState.children.set(subScreen.screen, subScreen);
            subScreen.load();
        } else if (WheelFortuneVelocity === 0 && MouseIn(1545, 25, 90, 90) && WheelFortuneCharacter?.IsPlayer()) {
            const subScreen = new WheelPresetScreen(fortuneWheelState, WheelFortuneCharacter.MBSSettings.FortuneWheelPresets);
            fortuneWheelState.children.set(subScreen.screen, subScreen);
            subScreen.load();
        }
        return next(args);
    });

    MBS_MOD_API.hookFunction("WheelFortuneMouseUp", 11, (args, next) => {
        if (Player.MBSSettings.RollWhenRestrained || !Player.IsRestrained()) {
            next(args);
        }
    });

    MBS_MOD_API.hookFunction("WheelFortuneMouseDown", 11, (args, next) => {
        if (Player.MBSSettings.RollWhenRestrained || !Player.IsRestrained()) {
            next(args);
        }
    });

    MBS_MOD_API.hookFunction("WheelFortuneDraw", 11, (args, next) => {
        args[0] = fortuneWheelState.weightedIDs;
        return next(args);
    });

    fortuneWheelState = new FWScreenProxy();

    waitFor(settingsMBSLoaded).then(() => {
        logger.log("Initializing wheel of fortune module");

        // Load and register the default MBS item sets
        FORTUNE_WHEEL_ITEMS = generateItems();
        FORTUNE_WHEEL_ITEM_SETS = Object.freeze([
            new FWItemSet(
                "PSO Bondage",
                FORTUNE_WHEEL_ITEMS.leash_candy,
                Player.MBSSettings.FortuneWheelItemSets,
                StripLevel.UNDERWEAR,
                StripLevel.UNDERWEAR,
                enableFlags(DEFAULT_FLAGS.map(clone), [0, 1, 2, 3, 4, 5]),
                false,
                false,
            ),
            new FWItemSet(
                "Mummification",
                FORTUNE_WHEEL_ITEMS.mummy,
                Player.MBSSettings.FortuneWheelItemSets,
                StripLevel.CLOTHES,
                StripLevel.UNDERWEAR,
                enableFlags(DEFAULT_FLAGS.map(clone), [3]),
                false,
                false,
            ),
            new FWItemSet(
                "Bondage Maid",
                FORTUNE_WHEEL_ITEMS.maid,
                Player.MBSSettings.FortuneWheelItemSets,
                StripLevel.UNDERWEAR,
                StripLevel.UNDERWEAR,
                enableFlags(DEFAULT_FLAGS.map(clone), [0, 1, 2, 3]),
                false,
                false,
            ),
            new FWItemSet(
                "Petrification",
                FORTUNE_WHEEL_ITEMS.statue,
                Player.MBSSettings.FortuneWheelItemSets,
                StripLevel.UNDERWEAR,
                StripLevel.UNDERWEAR,
                enableFlags(DEFAULT_FLAGS.map(clone), [0, 1, 2, 3]),
                false,
                false,
                statueCopyColors,
            ),
        ]);
        FORTUNE_WHEEL_ITEM_SETS.forEach(itemSet => itemSet.register(false));
        FORTUNE_WHEEL_OPTIONS_BASE = Object.freeze(WheelFortuneOption.filter(i => !i.Custom));
        FORTUNE_WHEEL_DEFAULT_BASE = WheelFortuneDefault;
        pushMBSSettings([SettingsType.SHARED]);
    });
});
