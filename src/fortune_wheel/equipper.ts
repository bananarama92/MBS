/** Module related to the equipping and removing of wheel of fortune items. */

import { cloneDeep, sortBy, sum } from "lodash-es";

import { BCX_MOD_API, waitFor, isArray, includes, logger, entries } from "../common";
import { bcLoaded, canChangeCosplay, validateCharacter } from "../common_bc";

import { getBaselineProperty } from "./type_setting";
import { MBS_REGISTRATION_DATA } from "./registration";
import { wheelCallbacks, Events } from "./events";
import { applyFlag } from "./lock_flags";

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
}) satisfies Record<string, StripLevel>;

/** A dummy character without any blocked or limited items. */
let MBSDummy: Character;
waitFor(bcLoaded).then(() => MBSDummy = CharacterLoadSimple("MBSDummy"));

/**
 * Return that a callable that returns whether the passed asset satisfies the specified strip {@link StripLevel}
 * @param stripLevel The desired strip level
 * @param character The affected character
 */
export function getStripCondition(stripLevel: StripLevel, character: Character): ((asset: Asset) => boolean) {
    switch (stripLevel) {
        case StripLevel.NONE:
            return () => false;
        case StripLevel.CLOTHES:
            return (asset) => (asset.Group.AllowNone && !asset.BodyCosplay && !asset.Group.Underwear);
        case StripLevel.UNDERWEAR:
            return (asset) => (asset.Group.AllowNone && !asset.BodyCosplay);
        case StripLevel.COSPLAY:
            return (asset) => {
                const blockBodyCosplay = !canChangeCosplay(character);
                return blockBodyCosplay ? (asset.Group.AllowNone && !asset.BodyCosplay) : asset.Group.AllowNone;
            };
        case StripLevel.ALL:
            return (asset) => {
                const blockBodyCosplay = !canChangeCosplay(character);
                return blockBodyCosplay ? (asset.Group.AllowNone && !asset.BodyCosplay) : true;
            };
        default:
            throw new Error(`Invalid "stripLevel" value: ${stripLevel}`);
    }
}

/**
 * Strip the character of all clothes while always ignoring any and all cosplay items.
 * Performs an inplace update of the character's appearance.
 * @param stripLevel An integer denoting which clothes should be removed; see {@link StripLevel}
 * @param character The to-be stripped character, defaults to the {@link Player}
 */
export function characterStrip(stripLevel: StripLevel, character: Character): void {
    validateCharacter(character);
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
type SimpleItem = Readonly<{
    Name: string,
    Group: AssetGroupName,
    TypeRecord?: TypeRecord,
}>;

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
        node.priority = 1 + Math.max(0, ...data.map(i => i[0]));
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
    if (!isArray(itemList)) {
        throw new TypeError(`Invalid "itemList" type: ${typeof itemList}`);
    }

    // Map all equipped item groups to the groups that they block
    const graph: Map<AssetGroupName, Node> = new Map();
    [itemList, itemSuperList].forEach((list, i) => {
        for (const { Group, Name, TypeRecord } of list) {
            if (graph.has(Group)) {
                continue;
            }

            const asset = AssetGet(character.AssetFamily, Group, Name);
            if (asset == null) {
                throw new Error(`Unknown asset: ${Group}${Name}`);
            } else if (asset.Group.Category !== "Item") {
                continue;
            }

            const property = getBaselineProperty(asset, character, TypeRecord);
            const node = <Node>{
                superSet: i === 1,
                block: new Set(...(asset.Block ?? []), ...(property.Block ?? [])),
            };

            // Enclosing items take priority over everything else
            const isEnclose = asset.Effect?.includes("Enclose") || property.Effect?.includes("Enclose");
            if (isEnclose) {
                node.priority = AssetGroup.length;
                node.blocksSubSet = node.superSet;
            }
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
 * @param itemList The to-be sorted item list.
 * @param character The intended to=be equipped character.
 * Defaults to a simple character without any blacklisted or limited items/options.
 */
export function fortuneItemsSort(
    itemList: readonly FWItem[],
    character: Character = MBSDummy,
): FWItem[] {
    const sortRecord = itemsArgSort(itemList, character);
    return sortBy(
        itemList,
        (item) => sortRecord.get(item.Group)?.priority ?? Infinity,
    );
}

/**
 * Return whether the character can unlock the item in question.
 * @param item The item in question
 * @param character The character
 */
function canUnlock(item: Item, character: Character, keyCache: Record<string, boolean>): boolean {
    const lock = InventoryGetLock(item);
    if (!InventoryItemHasEffect(item, "Lock")) {
        return true;
    } else if (item.Craft?.Property === "Decoy") {
        // Always disallow the removal of owner-/lovers exclusive items, even when decoy restraints are used
        if (lock == null) {
            return false;
        }

        const fields = ["OwnerOnly", "LoverOnly", "FamilyOnly"] as const;
        return !fields.some(i => lock.Asset[i] || item.Asset[i]);
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
            return keyCache[`${character.ID}:${lock.Asset.Name}`] ??= character.Inventory.some(item => item.Asset.Name === `${lock.Asset.Name}Key`);
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
            return blockKeyUse ? false : includes(memberIDList, character.MemberNumber);
        }
        default:
            return false;
    }
}

/**
 * Return whether the character is both enclosed and the enclosing item has an unremovable lock
 * (as defined via the {@link canUnlock} output).
 * @param character The character in question
 */
function blockedByEnclose(character: Character, keyCache: Record<string, boolean>): boolean {
    const item = character.Appearance.find(i => InventoryItemHasEffect(i, "Enclose"));
    return (item == null) ? false : !canUnlock(item, character, keyCache);
}

wheelCallbacks.addEventListener(
    "validateUnequip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ character, targetGroup }) => {
            const group = targetGroup as AssetGroupItemName;
            return InventoryGroupIsBlockedForCharacter(character, group, false) ? "InventoryGroupIsBlockedForCharacter" : null;
        },
        id: "InventoryGroupIsBlockedForCharacter",
        conditional: false,
        description: "Check whether the body area (Asset Group) for a character is blocked and cannot be used",
    },
);

wheelCallbacks.addEventListener(
    "validateUnequip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ character, targetGroup }) => {
            const group = targetGroup as AssetGroupItemName;
            return InventoryGroupIsBlockedByOwnerRule(character, group) ? "InventoryGroupIsBlockedByOwnerRule" : null;
        },
        id: "InventoryGroupIsBlockedByOwnerRule",
        conditional: false,
        description: "Check whether the body area is blocked by an owner rule",
    },
);

wheelCallbacks.addEventListener(
    "validateUnequip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ character, oldItem }, cache) => {
            cache.keyCache ??= {};
            return (oldItem && !canUnlock(oldItem, character, cache.keyCache)) ? "Locked item equipped" : null;
        },
        id: "LockedItem",
        conditional: false,
        description: "Check whether character can unlock the currently equiped item",
    },
);

wheelCallbacks.addEventListener(
    "validateUnequip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ character, newAsset }) => {
            return (newAsset && InventoryBlockedOrLimited(character, { Asset: newAsset })) ? "InventoryBlockedOrLimited" : null;
        },
        id: "InventoryBlockedOrLimited",
        conditional: false,
        description: "Check whether the new item is blocked or limited",
    },
);

wheelCallbacks.addEventListener(
    "validateUnequip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ newAsset }) => {
            return (newAsset && !InventoryChatRoomAllow(newAsset.Category ?? [])) ? "InventoryChatRoomAllow" : null;
        },
        id: "InventoryChatRoomAllow",
        conditional: false,
        description: "Check whether the room has the new item's category blocked or not",
    },
);

wheelCallbacks.addEventListener(
    "validateUnequip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ character, newAsset }, cache) => {
            if (!newAsset) {
                return null;
            }
            cache.isClubSlave ??= character.IsPlayer() && LogQuery("ClubSlave", "Management");
            return (cache.isClubSlave && newAsset.Group.IsAppearance()) ? "Blocked via Club Slave Collar" : null;
        },
        id: "IsClubSlave",
        conditional: false,
        description: "Check whether the new item is blocked bye virtue of being a club slave",
    },
);

wheelCallbacks.addEventListener(
    "validateEquip",
    MBS_REGISTRATION_DATA,
    {
        callback: ({ character, newAsset }) => {
            return InventoryAllow(character, newAsset, undefined, false) ? "InventoryAllow" : null;
        },
        id: "InventoryAllow",
        conditional: false,
        description: "Check whether the new items prerequisites can be satisfied",
    },
);

/**
 * Equip the character with all items from the passed fortune wheel item list.
 * @param name The name of the wheel of fortune item list
 * @param itemList The items in question
 * @param stripLevel An integer denoting which clothes should be removed; see {@link StripLevel}
 * @param character The relevant player- or NPC-character
 */
export function fortuneWheelEquip(
    name: string,
    itemList: readonly FWItem[],
    stripLevel: StripLevel,
    character: Character,
    activeHooks: readonly FWHook[],
    lockFlag: null | FWFlag = null,
): void {
    const cache: Record<string, any> & { keyCache: Record<string, boolean> } = { keyCache: {} };
    if (!isArray(itemList)) {
        throw new TypeError(`Invalid "itemList" type: ${typeof itemList}`);
    }

    // Abort if the character is enclosed and the lock of the enclosing item cannot be removed
    if (blockedByEnclose(character, cache.keyCache)) {
        logger.log(`Failed to equip all "${name}" wheel of fortune items: cannot unlock enclosing item`);
        return;
    }
    characterStrip(stripLevel, character);

    const blockingItems = getBlockSuperset(
        itemList,
        character.Appearance.map(i => {
            return {
                Group: i.Asset.Group.Name,
                Name: i.Asset.Name,
                TypeRecord: i.Property?.TypeRecord,
                NoEquip: true,
            };
        }),
        character,
    );

    // First pass: remove any old restraints occupying or otherwise blocking the to-be equipped slots
    const equipFailureRecord: Record<string, string[]> = {};
    const equipCallbackOutputs: Set<AssetGroupName> = new Set();
    for (const { Name, Group, Equip, NoEquip } of <(FWItem & { NoEquip?: boolean })[]>[...blockingItems, ...itemList]) {
        const asset = AssetGet(character.AssetFamily, Group, Name);
        const oldItem = InventoryGet(character, Group);
        const equip = typeof Equip === "function" ? Equip(character) : true;

        // Check whether the item can actually be equipped
        if (asset == null) {
            equipFailureRecord[Name] = ["Unknown asset"];
            continue;
        } else if (!equip) {
            equipCallbackOutputs.add(Group);
            continue;
        } else {
            // Run the unequip validation
            const validateEvent: Events.ValidateUnequip = {
                character,
                name,
                oldItem: oldItem,
                newAsset: NoEquip ? null : asset,
                targetGroup: Group,
            };
            const equipChecks = wheelCallbacks.run("validateUnequip", validateEvent, cache);
            if (equipChecks.length !== 0) {
                equipFailureRecord[asset.Description] = equipChecks;
                continue;
            }

            if (oldItem != null) {
                InventoryRemove(character, Group, false);
            }
        }
    }

    // Second pass: equip the new items
    for (const { Name, Group, Craft, ItemCallback, Color, TypeRecord, Property } of itemList) {
        const asset = AssetGet(character.AssetFamily, Group, Name);
        const errList = equipFailureRecord[asset?.Description ?? Name];
        if (asset == null || errList !== undefined || equipCallbackOutputs.has(Group)) {
            continue;
        }

        // Run the equip validation
        const validateEvent: Events.ValidateEquip = {
            character,
            name,
            newAsset: asset,
            targetGroup: Group,
        };
        const equipChecks = wheelCallbacks.run("validateEquip", validateEvent, cache);
        if (equipChecks.length) {
            equipFailureRecord[asset.Description] = equipChecks;
            continue;
        }

        // Handle color events
        const colorEvent: Events.Color = {
            character,
            name,
            newAsset: asset,
            targetGroup: Group,
            color: Color ?? null,
        };
        const colorOutput = wheelCallbacks.run("color", colorEvent, cache);
        const color = [...(Color ?? asset.DefaultColor)];
        for (const colorArray of colorOutput) {
            for (const [i, c] of colorArray.slice(0, color.length).entries()) {
                if (i >= color.length) {
                    break;
                }
                if (c !== undefined) {
                    color[i] = c;
                }
            }
        }

        // Create the item
        const newItem = CharacterAppearanceSetItem(
            character, Group, asset, color, SkillGetWithRatio(character, "Bondage"),
            character.MemberNumber, false,
        ) as Item & { Difficulty: number };

        // Handle TypeRecord events
        let typeRecord: undefined | TypeRecord = cloneDeep(TypeRecord);
        const typeEvent: Events.TypeRecord = {
            character,
            name,
            newAsset: asset,
            targetGroup: Group,
            typeRecord: TypeRecord ?? null,
        };
        wheelCallbacks.run("typeRecord", typeEvent, cache).forEach(t => {
            typeRecord ??= {};
            for (const [k, v] of entries(t)) {
                if (v !== undefined) {
                    typeRecord[k] = v;
                }
            }
        });

        // Handle Property events
        const properties: ItemProperties = cloneDeep(Property);
        const propertyEvent: Events.Property = {
            character,
            name,
            newAsset: asset,
            targetGroup: Group,
            properties: Property,
        };
        wheelCallbacks.run("property", propertyEvent, cache).forEach(p => {
            for (const [k, v] of entries(p)) {
                if (v !== undefined) {
                    properties[k] = v as any;
                }
            }
        });

        ExtendedItemSetOptionByRecord(character, newItem, typeRecord, { refresh: false, push: false, properties });

        // Handle crafting events
        if (asset.Group.IsItem() && !asset.IsLock && asset.Wear && asset.Enable) {
            let craft: CraftingItem | undefined = cloneDeep(Craft);
            const craftingEvent: Events.Craft = {
                character,
                name,
                newAsset: asset,
                targetGroup: Group,
                craft: Craft ?? null,
            };
            const craftingOutput = wheelCallbacks.run("craft", craftingEvent, cache);
            craftingOutput.forEach((output) => {
                if (!craft) {
                    craft = {
                        Name: asset.Description,
                        Description: "",
                        Property: "Normal",
                        Color: "",
                        Lock: "",
                        Private: true,
                        Item: asset.Name,
                        ItemProperty: null,
                    };
                }
                for (const prop of ["Name", "Description", "Property"] as const) {
                    const value = output[prop];
                    if (value != null) {
                        craft[prop] = value as any;
                    }
                }
            });
            if (craft != undefined) {
                newItem.Craft = craft;
                InventoryCraft(character, character, Group as AssetGroupItemName, newItem.Craft, false, false);
            }
        }

        // Handle difficulty events
        const difficultyEvent: Events.Difficulty = {
            character,
            name,
            newAsset: asset,
            targetGroup: Group,
            difficulty: newItem.Difficulty,
        };
        newItem.Difficulty += sum(wheelCallbacks.run("difficulty", difficultyEvent, cache));

        // Fire up any of the provided item-specific dynamic callbacks
        if (typeof ItemCallback === "function") {
            ItemCallback(newItem, character);
        }

        if (lockFlag) {
            applyFlag(lockFlag, newItem, character);
        }
    }

    CharacterRefresh(character, character.IsPlayer(), false);
    if (character.IsPlayer()) {
        ChatRoomCharacterUpdate(character);
        const nFailures = Object.values(equipFailureRecord).length;
        if (nFailures !== 0) {
            logger.log(`Failed to equip ${nFailures} "${name}" wheel of fortune items`, equipFailureRecord);
        }
    }
}
