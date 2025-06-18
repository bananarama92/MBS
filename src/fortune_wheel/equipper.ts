/** Module related to the equipping and removing of wheel of fortune items. */

import { cloneDeep, sortBy, sum, pick } from "lodash-es";

import { BCX_MOD_API, MBS_MOD_INFO, isArray, includes, logger, entries } from "../common";
import { canChangeCosplay, validateCharacter, waitForBC } from "../common_bc";

import { getBaselineProperty } from "./type_setting";
import { wheelHookRegister, ExtendedWheelEvents } from "./events";
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
waitForBC("equipper", {
    async afterLoad() {
        MBSDummy = CharacterLoadSimple("MBSDummy");
    },
});

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
function canUnlock(item: Item, character: Character): boolean {
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
            return character.Inventory.some(item => item.Asset.Name === `${lock.Asset.Name}Key`);
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
function blockedByEnclose(character: Character): boolean {
    const item = character.Appearance.find(i => InventoryItemHasEffect(i, "Enclose"));
    return (item == null) ? false : !canUnlock(item, character);
}

wheelHookRegister.addEventListener(
    "validateItemUnequip",
    MBS_MOD_INFO,
    {
        listener: ({ character, targetGroup }) => {
            const group = targetGroup as AssetItemGroup;
            return InventoryGroupIsBlockedForCharacter(character, group.Name, false) ? "InventoryGroupIsBlockedForCharacter" : null;
        },
        hookName: "InventoryGroupIsBlockedForCharacter",
        label: "Check whether the body area (Asset Group) for a character is blocked and cannot be used.",
        conditional: false,
    },
);

wheelHookRegister.addEventListener(
    "validateItemUnequip",
    MBS_MOD_INFO,
    {
        listener: ({ character, targetGroup }) => {
            const group = targetGroup as AssetItemGroup;
            return InventoryGroupIsBlockedByOwnerRule(character, group.Name) ? "InventoryGroupIsBlockedByOwnerRule" : null;
        },
        hookName: "InventoryGroupIsBlockedByOwnerRule",
        label: "Check whether the body area is blocked by an owner rule.",
        conditional: false,
    },
);

wheelHookRegister.addEventListener(
    "validateItemUnequip",
    MBS_MOD_INFO,
    {
        listener: ({ character, oldItem }) => {
            return (oldItem && !canUnlock(oldItem, character)) ? "Locked item equipped" : null;
        },
        hookName: "LockedItem",
        label: "Check whether character can unlock the currently equipped item.",
        conditional: false,
    },
);

wheelHookRegister.addEventListener(
    "validateItemUnequip",
    MBS_MOD_INFO,
    {
        listener: ({ character, newAsset }) => {
            return (newAsset && InventoryBlockedOrLimited(character, { Asset: newAsset })) ? "InventoryBlockedOrLimited" : null;
        },
        hookName: "InventoryBlockedOrLimited",
        label: "Check whether the new item is blocked or limited.",
        conditional: false,
    },
);

wheelHookRegister.addEventListener(
    "validateItemUnequip",
    MBS_MOD_INFO,
    {
        listener: ({ newAsset }) => {
            return (newAsset && !InventoryChatRoomAllow(newAsset.Category ?? [])) ? "InventoryChatRoomAllow" : null;
        },
        hookName: "InventoryChatRoomAllow",
        label: "Check whether the room has the new item's category blocked or not.",
        conditional: false,
    },
);

wheelHookRegister.addEventListener(
    "validateItemUnequip",
    MBS_MOD_INFO,
    {
        listener: ({ character, newAsset }) => {
            if (!newAsset) {
                return null;
            }
            const isClubSlave = character.IsPlayer() && LogQuery("ClubSlave", "Management");
            return (isClubSlave && newAsset.Group.IsAppearance()) ? "Blocked via Club Slave Collar" : null;
        },
        hookName: "IsClubSlave",
        label: "Check whether the new item is blocked bye virtue of being a club slave.",
        conditional: false,
    },
);

wheelHookRegister.addEventListener(
    "validateItemEquip",
    MBS_MOD_INFO,
    {
        listener: ({ character, newAsset }) => {
            const status = InventoryDisallow(character, newAsset);
            return status ? `InventoryDisallow: ${status}` : null;
        },
        hookName: "InventoryDisallow",
        label: "Check whether the new items prerequisites can be satisfied.",
        conditional: false,
    },
);

function eventToJSON(this: ExtendedWheelEvents.Events.Mapping[ExtendedWheelEvents.Events.Names]) {
    return {
        ...this,
        targetGroup: "targetGroup" in this && this.targetGroup ? this.targetGroup.Name : undefined,
        newAsset: "newAsset" in this && this.newAsset ? this.newAsset.Name : undefined,
        oldItem: "oldItem" in this && this.oldItem ? { ...this.oldItem, Asset: this.oldItem.Asset.Name, Group: this.oldItem.Asset.Group.Name } : undefined,
        newItem: "newItem" in this && this.newItem ? { ...this.newItem, Asset: this.newItem.Asset.Name, Group: this.newItem.Asset.Group.Name } : undefined,
        character: "character" in this && this.character ? pick(this.character, "Name", "MemberNumber", "NickName") : undefined,
    };
}

function getEventProxy<T extends object>(arg: T, readonlyKeys?: null | readonly (keyof T)[]): T {
    const readonlySet = new Set(readonlyKeys ?? []);
    return new Proxy(
        Object.seal(Object.defineProperty(arg, "toJSON", { value: eventToJSON, enumerable: false })),
        {
            set(target, property, ...args) {
                if (readonlySet.has(property as keyof T)) {
                    throw new TypeError(`"${String(property)}" is read-only`);
                } else if (!(property in target)) {
                    throw new TypeError(`can't define property "${String(property)}": Object is not extensible`);
                } else {
                    return Reflect.set(target, property, ...args);
                }
            },
            defineProperty(target, property, ...args) {
                if (readonlySet.has(property as keyof T)) {
                    throw new TypeError(`can't redefine non-configurable property "${String(property)}"`);
                } else if (!(property in target)) {
                    throw new TypeError(`can't define property "${String(property)}": Object is not extensible`);
                } else {
                    return Reflect.defineProperty(target, property, ...args);
                }
            },
            deleteProperty(target, property) {
                if (property in target) {
                    throw new TypeError(`property "${String(property)}" is non-configurable and can't be deleted`);
                }
                return Reflect.deleteProperty(target, property);

            },
            isExtensible() {
                return false;
            },
            setPrototypeOf() {
                throw new TypeError("can't set prototype of this object");
            },
        },
    );
}

/**
 * Equip the character with all items from the passed fortune wheel item list.
 * @param name The name of the wheel of fortune item list
 * @param itemList The items in question
 * @param stripLevel An integer denoting which clothes should be removed; see {@link StripLevel}
 * @param charTarget The relevant player- or NPC-character
 */
export function fortuneWheelEquip(
    name: string,
    itemList: readonly FWItem[],
    stripLevel: StripLevel,
    charTarget: Character,
    activeHooks: Readonly<Record<string, FWHook>>,
    lockFlag: null | FWFlag = null,
    charSource: null | Character = null,
): void {
    const hookKwargs = Object.fromEntries(Object.entries(activeHooks).filter(([_, hook]) => {
        // Drop a hook of it has a required kwarg that is absent
        return Object.entries(hook.kwargsConfig).every(([name, config]) => !("required" in config) || !config.required || hook.kwargs[name]);
    }).map(([key, hook]) => {
        return [key, hook.kwargs];
    }));

    if (!isArray(itemList)) {
        throw new TypeError(`Invalid "itemList" type: ${typeof itemList}`);
    }

    // Abort if the character is enclosed and the lock of the enclosing item cannot be removed
    if (blockedByEnclose(charTarget)) {
        logger.log(`Failed to equip all "${name}" wheel of fortune items: cannot unlock enclosing item`);
        return;
    }
    characterStrip(stripLevel, charTarget);

    const blockingItems = getBlockSuperset(
        itemList,
        charTarget.Appearance.map(i => {
            return {
                Group: i.Asset.Group.Name,
                Name: i.Asset.Name,
                TypeRecord: i.Property?.TypeRecord,
                NoEquip: true,
            };
        }),
        charTarget,
    );

    const eventLog: Partial<Record<ExtendedWheelEvents.Events.Names, Record<string, Record<string, Record<"success" | "error" | "skip", {
        readonly event: WheelEvents.Events.Base;
        readonly kwargs: Record<string, WheelEvents.Kwargs.All>;
        readonly reason?: unknown;
    }[]>>>>> & { readonly activeHooks: Readonly<Record<string, FWHook>> } = {
        activeHooks,
    };

    const beforeOutfitEvent: ExtendedWheelEvents.Events.BeforeOutfitEquip = getEventProxy(
        {
            character: charTarget,
            name,
        },
        ["character", "name"],
    );
    wheelHookRegister.run("beforeOutfitEquip", beforeOutfitEvent, hookKwargs, eventLog);

    // First pass: remove any old restraints occupying or otherwise blocking the to-be equipped slots
    const equipFailureRecord: Record<string, string[]> = {};
    const equipCallbackOutputs: Set<AssetGroupName> = new Set();
    const oldItems: Partial<Record<AssetGroupName, Item>> = {};
    for (const { Name, Group, Equip, NoEquip } of <(FWItem & { NoEquip?: boolean })[]>[...blockingItems, ...itemList]) {
        const asset = AssetGet(charTarget.AssetFamily, Group, Name);
        const group = asset?.Group;
        const oldItem = InventoryGet(charTarget, Group);
        const equip = typeof Equip === "function" ? Equip(charTarget) : true;

        // Check whether the item can actually be equipped
        if (asset == null || group == null) {
            equipFailureRecord[`${Group}/${Name}`] = ["Unknown asset"];
            continue;
        } else if (!equip) {
            equipCallbackOutputs.add(Group);
            continue;
        } else {
            // Run the unequip validation
            const validateEvent: ExtendedWheelEvents.Events.ValidateItemUnequip = getEventProxy(
                {
                    character: charTarget,
                    name,
                    oldItem: oldItem,
                    newAsset: NoEquip ? null : asset,
                    targetGroup: group,
                },
                ["character", "name", "oldItem", "newAsset", "targetGroup"],
            );
            const equipChecks = wheelHookRegister.run("validateItemUnequip", validateEvent, hookKwargs, eventLog);
            if (equipChecks.length !== 0) {
                equipFailureRecord[`${Group}/${Name}`] = equipChecks;
                continue;
            }

            if (oldItem != null) {
                oldItems[Group] = oldItem;
                InventoryRemove(charTarget, Group, false);
            }
        }
    }

    // Second pass: equip the new items
    for (const { Name, Group, Craft, Color, TypeRecord, Property } of itemList) {
        const asset = AssetGet(charTarget.AssetFamily, Group, Name);
        const group = asset?.Group;
        const errList = equipFailureRecord[`${Group}/${Name}`];
        const oldItem = oldItems[Group] ?? null;
        if (asset == null || group == null || errList !== undefined || equipCallbackOutputs.has(Group)) {
            continue;
        }

        // Run the equip validation
        const validateEvent: ExtendedWheelEvents.Events.ValidateItemEquip = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newAsset: asset,
            },
            ["character", "name", "oldItem", "newAsset"],
        );
        const equipChecks = wheelHookRegister.run("validateItemEquip", validateEvent, hookKwargs, eventLog);
        if (equipChecks.length) {
            equipFailureRecord[`${Group}/${Name}`] = equipChecks;
            continue;
        }

        const beforeEquipEvent: ExtendedWheelEvents.Events.BeforeItemEquip = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newAsset: asset,
                lock: lockFlag?.type ?? null,
                color: cloneDeep(Color ?? asset.DefaultColor) as string[],
                properties: cloneDeep(Property),
                difficultyModifier: 0,
                typeRecord: TypeRecord ? cloneDeep(TypeRecord) : null,
                craft: Craft ? Object.seal(pick(Craft, "Name", "Description", "Property")) : null,
            },
            ["lock", "newAsset", "oldItem", "name", "character"],
        );
        wheelHookRegister.run("beforeItemEquip", beforeEquipEvent, hookKwargs, eventLog);

        // Handle color events
        const colorEvent: ExtendedWheelEvents.Events.Color = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newAsset: asset,
                color: beforeEquipEvent.color ?? [...asset.DefaultColor],
            },
            ["character", "name", "oldItem", "newAsset", "color"],
        );
        const colorOutput = wheelHookRegister.run("color", colorEvent, hookKwargs, eventLog);
        const color = [...colorEvent.color];
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
            charTarget, Group, asset, color, SkillGetWithRatio(charTarget, "Bondage"),
            charSource?.MemberNumber,
        ) as Item & { Difficulty: number };

        // Handle TypeRecord events
        let typeRecord = beforeEquipEvent.typeRecord;
        const typeEvent: ExtendedWheelEvents.Events.TypeRecord = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newAsset: asset,
                typeRecord: TypeRecord ?? null,
            },
            ["character", "name", "oldItem", "newAsset", "typeRecord"],
        );
        wheelHookRegister.run("typeRecord", typeEvent, hookKwargs, eventLog).forEach(t => {
            typeRecord ??= {};
            for (const [k, v] of entries(t)) {
                if (v !== undefined) {
                    typeRecord[k] = v;
                }
            }
        });

        // Handle Property events
        const properties: ItemProperties = cloneDeep(Property);
        const propertyEvent: ExtendedWheelEvents.Events.Property = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newAsset: asset,
                properties: beforeEquipEvent.properties ?? {},
            },
            ["character", "name", "oldItem", "newAsset", "properties"],
        );
        wheelHookRegister.run("property", propertyEvent, hookKwargs, eventLog).forEach(p => {
            for (const [k, v] of entries(p)) {
                if (v !== undefined) {
                    properties[k] = v as any;
                }
            }
        });

        ExtendedItemSetOptionByRecord(charTarget, newItem, typeRecord, { refresh: false, push: false, properties });

        // Handle crafting events
        if (asset.Group.IsItem() && !asset.IsLock && asset.Wear && asset.Enable) {
            let craft: CraftingItem | undefined = cloneDeep(Craft);
            const craftingEvent: ExtendedWheelEvents.Events.Craft = getEventProxy(
                {
                    character: charTarget,
                    name,
                    oldItem,
                    newAsset: asset,
                    craft: beforeEquipEvent.craft,
                },
                ["character", "name", "oldItem", "newAsset", "craft"],
            );
            const craftingOutput = wheelHookRegister.run("craft", craftingEvent, hookKwargs, eventLog);
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
                InventoryCraft(charSource, charTarget, Group as AssetGroupItemName, newItem.Craft, false, false);
            }
        }

        // Handle difficulty events
        const difficultyEvent: ExtendedWheelEvents.Events.Difficulty = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newAsset: asset,
                difficultyModifier: beforeEquipEvent.difficultyModifier ?? 0,
            },
            ["character", "name", "oldItem", "newAsset", "difficultyModifier"],
        );
        newItem.Difficulty += sum(wheelHookRegister.run("difficulty", difficultyEvent, hookKwargs, eventLog));

        if (lockFlag) {
            applyFlag(lockFlag, newItem, charTarget);
        }

        const afterEquipEvent: ExtendedWheelEvents.Events.AfterItemEquip = getEventProxy(
            {
                character: charTarget,
                name,
                oldItem,
                newItem,
                newAsset: asset,
            },
            ["character", "name", "oldItem", "newAsset", "newItem"],
        );
        wheelHookRegister.run("afterItemEquip", afterEquipEvent, hookKwargs, eventLog);
    }

    const afterOutfitEvent: ExtendedWheelEvents.Events.AfterOutfitEquip = getEventProxy(
        {
            character: charTarget,
            name,
        },
        ["character", "name"],
    );
    wheelHookRegister.run("afterOutfitEquip", afterOutfitEvent, hookKwargs, eventLog);

    CharacterRefresh(charTarget, charTarget.IsPlayer(), false);
    if (charTarget.IsPlayer()) {
        ChatRoomCharacterUpdate(charTarget);
        const nFailures = Object.values(equipFailureRecord).length;
        if (nFailures !== 0) {
            logger.log(`Failed to equip ${nFailures} "${name}" wheel of fortune items`, equipFailureRecord);
        }
        logger.debug(`Fortune wheel '${name}' status`, eventLog);
    }
}
