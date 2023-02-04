/** Module related to the equipping and removing of wheel of fortune items. */

"use strict";

import { itemSetType } from "type_setting";
import { getBaselineProperty } from "type_setting";
import { deepCopy, BCX_MOD_API } from "common";

/**
 * An enum with various strip levels for {@link characterStrip}.
 * All items up to and including the specified levels will be removed.
 */
export const StripLevel = Object.freeze({
    /** Do not strip any items */
    NONE: 0,
    /** All clothes */
    CLOTHES: 1,
    /** All clothes and underwear */
    UNDERWEAR: 2,
    /** All clothes, underwear and cosplay items (if not blocked) */
    COSPLAY: 3,
    /** All clothes, underwear, cosplay items and body (if not blocked) */
    ALL: 4,
});

/** A dummy character without any blocked or limited items. */
const MBSDummy = CharacterLoadSimple("MBSDummy");

/**
 * Return that a callable that returns whether the passed asset satisfies the specified strip {@link StripLevel}
 * @param stripLevel The desired strip level
 * @param character The affected character
 */
export function getStripCondition(stripLevel: StripLevel, character: Character): ((asset: Asset) => boolean) {
    switch (stripLevel) {
        case StripLevel.NONE: {
            return () => false;
        }
        case StripLevel.CLOTHES: {
            return (asset) => (asset.Group.AllowNone && !asset.BodyCosplay && !asset.Group.Underwear);
        }
        case StripLevel.UNDERWEAR: {
            return (asset) => (asset.Group.AllowNone && !asset.BodyCosplay);
        }
        case StripLevel.COSPLAY: {
            return (asset) => {
                const blockBodyCosplay = character.OnlineSharedSettings?.BlockBodyCosplay ?? true;
                return blockBodyCosplay ? (asset.Group.AllowNone && !asset.BodyCosplay) : asset.Group.AllowNone;
            };
        }
        case StripLevel.ALL: {
            return (asset) => {
                const blockBodyCosplay = character.OnlineSharedSettings?.BlockBodyCosplay ?? true;
                return blockBodyCosplay ? (asset.Group.AllowNone && !asset.BodyCosplay) : true;
            };
        }
        default: {
            throw new Error(`Invalid "stripLevel" value: ${stripLevel}`);
        }
    }
}

/**
 * Strip the character of all clothes while always ignoring any and all cosplay items.
 * Performs an inplace update of the character's appearance.
 * @param stripLevel An integer denoting which clothes should be removed; see {@link StripLevel}
 * @param character The to-be stripped character, defaults to the {@link Player}
 */
export function characterStrip(stripLevel: StripLevel, character: Character): void {
    if (!character || !(character.IsSimple() || character.IsPlayer())) {
        throw new Error("Expected a simple or player character");
    }

    const stripCondition = getStripCondition(stripLevel, character);
    const appearance = character.Appearance;
    for (let i = appearance.length - 1; i >= 0; i--) {
        const asset = appearance[i].Asset;
        if (
            asset.Group.AllowNone
            && asset.Group.Category === "Appearance"
            && stripCondition(asset)
        ) {
            appearance.splice(i, 1);
        }
    }
}

/** Sorting graph node as used in {@link itemsArgSort}. */
type Node = {
    readonly block: Readonly<Set<AssetGroupItemName>>,
    readonly superSet: boolean,
    priority?: number,
    blocksSubSet?: boolean,
};

/** A minimalistic (extended) item representation as used in {@link itemsArgSort}. */
type SimpleItem = Readonly<{ Name: string, Group: AssetGroupName, Type?: string | null }>;

/**
 * Depth-first-search helper function for {@link itemsArgSort}.
 * Note that the node (and graph by extension) are modified inplace.
 * @param graph A graph mapping group names to the asset's blocked groups and its (to-be assigned) sorting priority
 * @param node A node within `graph`
 * @returns A 2-tuple with the priority of the current `node` and whether a superset item blocks one or more subset items
 */
function itemsArgSortDFS(
    graph: Readonly<Map<AssetGroupName, Node>>,
    node?: Node,
): [priority: number, blocksSubSet: boolean] {
    if (node === undefined) {
        return [-1, false];
    } else if (node.priority !== undefined && node.blocksSubSet !== undefined) {
        return [node.priority, node.blocksSubSet];
    } else if (node.block.size === 0) {
        node.priority = 0;
        node.blocksSubSet = false;
        return [node.priority, node.blocksSubSet];
    } else {
        const data: [priority: number, blocksSubSet: boolean][] = [];
        for (const group of node.block) {
            data.push(itemsArgSortDFS(graph, graph.get(group)));
        }
        node.priority = 1 + Math.max(...data.map(i => i[0]));
        node.blocksSubSet = node.superSet && data.some(i => i[1]);
        return [node.priority, node.blocksSubSet];
    }
}

/**
 * Construct a graph that maps group names to, among others, sorting priorities in a manner to minimize group slot-blocking.
 * Only groups belonging to the `Item` category will be included.
 * @param itemList The list of items for whom a sorting priority will be created.
 * @param character The intended to-be equipped character.
 * @param itemSuperList
 */
export function itemsArgSort(
    itemList: readonly SimpleItem[],
    character: Character,
    itemSuperList: readonly SimpleItem[] = [],
): Map<AssetGroupName, Node> {
    if (!Array.isArray(<readonly SimpleItem[]>itemList)) {
        throw new TypeError(`Invalid "itemList" type: ${typeof itemList}`);
    }

    // Map all equipped item groups to the groups that they block
    const graph: Map<AssetGroupName, Node> = new Map();
    [itemList, itemSuperList].forEach((list, i) => {
        for (const { Group, Name, Type } of list) {
            if (graph.has(Group)) {
                continue;
            }
            const asset = AssetGet(character.AssetFamily, Group, Name);
            if (asset == null) {
                throw new Error(`Unknown asset: ${Group}${Name}`);
            } else if (asset.Group.Category !== "Item") {
                continue;
            }
            const property = getBaselineProperty(asset, character, Type ?? null);
            const node = <Node>{
                superSet: i === 1,
                block: new Set(...(asset.Block ?? []), ...(property.Block ?? [])),
            };
            graph.set(Group, node);
        }
    });


    // Traverse the graph, assign priorities and use them for sorting
    for (const [_, node] of graph) {
        itemsArgSortDFS(graph, node);
    }
    return graph;
}

/** For a given character, find all (mutually exclusive) items in `currentItems` that block `newItems` */
export function getBlockSuperset<T extends SimpleItem>(
    newItems: readonly SimpleItem[],
    currentItems: readonly T[],
    character: Character,
): T[] {
    const graph = itemsArgSort(newItems, character, currentItems);
    return currentItems.filter(item => graph.get(item.Group)?.blocksSubSet);
}

/**
 * Sort and return the passed itemlist in a manner to minimize group slot blocking.
 * @param itemList The to-be sorted item list. Note that the list is modified inplace.
 * @param character The intended to=be equipped character.
 * Defaults to a simple character without any blacklisted or limited items/options.
 */
export function fortuneItemsSort(
    itemList: FortuneWheelItem[],
    character: Character = MBSDummy,
): FortuneWheelItem[] {
    const sortRecord = itemsArgSort(itemList, character);
    return itemList.sort(item => sortRecord.get(item.Group)?.priority ?? Infinity);
}

/** A {@link canUnlock} cache for keeping track of whether a character has keys for specific lock types. */
const keyCache: Map<AssetLockType, boolean> = new Map();

/**
 * Return whether the character can unlock the item in question.
 * @param item The item in question
 * @param character The character
 */
function canUnlock(item: Item, character: Character): boolean {
    const lock = InventoryGetLock(item);
    if (!InventoryItemHasEffect(item, "Lock")) {
        return true;
    } else if (item.Craft?.Property === "Decoy") {
        // Always disallow the removal of owner-/lovers exclusive items, even when decoy restraints are used
        if (lock == null) {
            return false;
        }
        return !(lock.Asset.OwnerOnly || lock.Asset.LoverOnly || item.Asset.OwnerOnly || item.Asset.LoverOnly);
    }

    const ruleState = BCX_MOD_API.getRuleState("block_keyuse_self");
    const blockKeyUse = (character.IsPlayer() && ruleState?.inEffect && ruleState?.isEnforced);
    switch (lock?.Asset?.Name) {
        case "SafewordPadlock":
            return true;
        case "MetalPadlock":
        case "MistressPadlock":
        case "MistressTimerPadlock":
        case "PandoraPadlock":{
            if (blockKeyUse || LogQuery("KeyDeposit", "Cell")) {
                return false;
            }
            let hasKey = keyCache.get("MetalPadlock");
            if (hasKey === undefined) {
                hasKey = character.Inventory.some(item => item.Asset.Name === `${lock.Asset.Name}Key`);
                keyCache.set("MetalPadlock", hasKey);
            }
            return hasKey;
        }
        case "TimerPasswordPadlock":
        case "PasswordPadlock":
        case "CombinationPadlock": {
            const memberID = Number(item.Property?.LockMemberNumber);
            return memberID === character.MemberNumber;
        }
        case "HighSecurityPadlock": {
            const memberIDs = item?.Property?.MemberNumberListKeys ?? "";
            const memberIDList = memberIDs.split(",").map(Number);
            return blockKeyUse ? false : memberIDList.includes(<number>character.MemberNumber);
        }
        default:
            return false;
    }
}

/**
 * Equip the character with all items from the passed fortune wheel item list.
 * @param name The name of the wheel of fortune item list
 * @param itemList The items in question
 * @param stripLevel An integer denoting which clothes should be removed; see {@link StripLevel}
 * @param globalCallbacks A callback (or `null`) that will be applied to all items after they're equipped
 * @param preRunCallback A callback (or `null`) executed before equipping any items from `itemList`
 * @param character The relevant player- or NPC-character
 */
export function fortuneWheelEquip(
    name: string,
    itemList: readonly FortuneWheelItem[],
    stripLevel: StripLevel,
    globalCallback: null | FortuneWheelCallback = null,
    preRunCallback: null | FortuneWheelPreRunCallback = null,
    character: Character = Player,
): void {
    if (!Array.isArray(<readonly FortuneWheelItem[]>itemList)) {
        throw new TypeError(`Invalid "itemList" type: ${typeof itemList}`);
    }
    characterStrip(stripLevel, character);

    if (typeof preRunCallback === "function") {
        itemList = preRunCallback(itemList, character);
    }

    const blockingItems = getBlockSuperset(
        itemList,
        character.Appearance.map(i => {
            return { Group: i.Asset.Group.Name, Name: i.Asset.Name, Type: i.Property?.Type };
        }),
        character,
    );

    // First pass: remove any old restraints occupying or otherwise blocking the to-be equipped slots
    keyCache.clear();
    const equipFailureRecord: Record<string, string[]> = {};
    const equipCallbackOutputs: Set<AssetGroupName> = new Set();
    for (const {Name, Group, Equip} of <FortuneWheelItem[]>[...blockingItems, ...itemList]) {
        const asset = AssetGet(character.AssetFamily, Group, Name);
        const oldItem = InventoryGet(character, Group);
        const equip = typeof Equip === "function" ? Equip() : true;

        // Check whether the item can actually be equipped
        if (asset == null) {
            equipFailureRecord[Name] = ["Unknown asset"];
            continue;
        } else if (!equip) {
            equipCallbackOutputs.add(Group);
            continue;
        } else if (oldItem == null) {
            continue;
        } else {
            const equipChecks = {
                "Locked item equipped": !canUnlock(oldItem, character),
                "InventoryBlockedOrLimited": InventoryBlockedOrLimited(character, { Asset: asset }),
                "InventoryAllow": !InventoryAllow(character, asset, asset.Prerequisite, false),
                "InventoryGroupIsBlocked": InventoryGroupIsBlocked(character, Group, false),
            };

            const equipFailure = Object.entries(equipChecks).filter(tup => tup[1]);
            if (equipFailure.length !== 0) {
                equipFailureRecord[asset.Description] = equipFailure.map(tup => tup[0]);
            } else {
                InventoryRemove(character, Group, false);
            }
        }
    }

    // Second pass: equip the new items
    for (const {Name, Group, Craft, ItemCallback, Color, Type, Property} of itemList) {
        const asset = AssetGet(character.AssetFamily, Group, Name);
        const errList = equipFailureRecord[asset?.Description ?? Name];
        if (asset == null || errList !== undefined || equipCallbackOutputs.has(Group)) {
            continue;
        }

        // Equip the item while avoiding refreshes as much as possible until all items are
        CharacterAppearanceSetItem(
            character, Group, asset, Color || asset.DefaultColor,
            SkillGetWithRatio("Bondage"), character.MemberNumber, false,
        );
        const newItem = InventoryGet(character, Group);
        if (newItem == null) {
            continue;
        }
        if (Craft !== undefined) {
            newItem.Craft = { ...Craft };
        }
        itemSetType(newItem, character, Type);
        InventoryCraft(character, character, Group, Craft, false, false);
        if (newItem.Property == null) {
            newItem.Property = deepCopy(Property);
        } else {
            Object.assign(newItem.Property, deepCopy(Property));
        }

        // Fire up any of the provided item-specific dynamic callbacks
        if (typeof ItemCallback === "function") {
            ItemCallback(newItem, character);
        }
        if (typeof globalCallback === "function") {
            globalCallback(newItem, character);
        }
    }

    if (character.IsPlayer()) {
        CharacterRefresh(character, true, false);
        ChatRoomCharacterUpdate(character);
        const nFailures = Object.values(equipFailureRecord).length;
        if (nFailures !== 0) {
            console.log(`MBS: Failed to equip ${nFailures} "${name}" wheel of fortune items`, equipFailureRecord);
        }
    } else {
        CharacterRefresh(character, false, false);
    }
}
