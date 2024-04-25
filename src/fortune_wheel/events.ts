import { logger } from "../common";

import { RegistrationData } from "./registration";

export namespace Events {
    interface Base {
        /** The name of the wheel of fortune outfit */
        readonly name: string;
        /** The target character */
        readonly character: Character;
    }

    interface ItemBase extends Base {
        /** The to-be equipped asset */
        readonly newAsset: null | Asset;
        readonly oldItem: null | Item;
    }

    export interface ValidateItemUnequip extends ItemBase {
        readonly targetGroup: AssetGroup;
    }

    export interface ValidateItemEquip extends ItemBase {
        readonly newAsset: Asset;
    }

    export interface Color extends ValidateItemEquip {
        readonly color: readonly string[];
    }

    export interface TypeRecord extends ValidateItemEquip {
        readonly typeRecord: null | Readonly<globalThis.TypeRecord>;
    }

    export interface Difficulty extends ValidateItemEquip {
        readonly difficultyModifier: number;
    }

    export interface Craft extends ValidateItemEquip {
        readonly craft: null | Readonly<Pick<CraftingItem, "Name" | "Description" | "Property">>;
    }

    export interface Property extends ValidateItemEquip {
        readonly properties: Readonly<ItemProperties>;
    }

    export interface BeforeOutfitEquip extends Base {}

    export interface BeforeItemEquip extends ValidateItemEquip {
        readonly lock: null | AssetLockType;
        color: readonly string[];
        properties: ItemProperties;
        difficultyModifier: number;
        typeRecord: null | globalThis.TypeRecord;
        craft: null | Pick<CraftingItem, "Name" | "Description" | "Property">;
    }

    export interface AfterItemEquip extends ValidateItemEquip {
        readonly newItem: Item;
    }

    export interface AfterOutfitEquip extends Base {
    }
}

export interface PublicWheelEvents {
    beforeOutfitEquip: Events.BeforeOutfitEquip;
    validateItemEquip: Events.ValidateItemEquip;
    beforeItemEquip: Events.BeforeItemEquip;
    afterItemEquip: Events.AfterItemEquip;
    afterOutfitEquip: Events.AfterOutfitEquip;
}

export interface WheelEvents extends PublicWheelEvents {
    validateItemUnequip: Events.ValidateItemUnequip;
    color: Events.Color;
    difficulty: Events.Difficulty;
    craft: Events.Craft;
    typeRecord: Events.TypeRecord;
    property: Events.Property;
}

export interface WheelEventsKwargs {
    /** Run the listener for specific asset groups */
    readonly groupNames?: ReadonlySet<AssetGroupName>;
}

interface WheelEventsReturnType extends Record<keyof WheelEvents, unknown> {
    validateItemUnequip: null | string;
    color: (undefined | string)[];
    difficulty: number;
    craft: Partial<Pick<CraftingItem, "Name" | "Description" | "Property">>;
    typeRecord: Partial<TypeRecord>;
    property: Partial<ItemProperties>;
    preProcess: void;

    beforeOutfitEquip: void;
    validateItemEquip: null | string;
    beforeItemEquip: void;
    afterItemEquip: void;
    afterOutfitEquip: void;
}

type EventCallback<T extends keyof WheelEvents> = (event: WheelEvents[T], cache: Record<string, any>) => undefined | null | WheelEventsReturnType[T];

interface EventStruct<T extends keyof WheelEvents> {
    readonly registrationData: RegistrationData;
    readonly next: EventCallback<T>;
    readonly id: string,
    readonly description: string,
    readonly conditional: boolean,
    readonly defaultKwargs: WheelEventsKwargs,
    readonly allowedKwargs: ReadonlySet<keyof WheelEventsKwargs>,
}

type _WheelCallbacks = { readonly [k in keyof WheelEvents]: readonly EventStruct<k>[] };

interface RegistrationOptions<T extends keyof WheelEvents> {
    callback: EventCallback<T>,
    id: string,
    description: string,
    conditional: boolean,
    defaultKwargs?: WheelEventsKwargs,
}

class WheelCallbacks implements _WheelCallbacks {
    readonly validKeys: ReadonlySet<keyof WheelEvents> = Object.freeze(new Set([
        "validateItemUnequip",
        "color",
        "difficulty",
        "craft",
        "typeRecord",
        "property",

        "beforeOutfitEquip",
        "validateItemEquip",
        "beforeItemEquip",
        "afterItemEquip",
        "afterOutfitEquip",
    ] as const));

    readonly validateItemUnequip: EventStruct<"validateItemUnequip">[] = [];
    readonly color: EventStruct<"color">[] = [];
    readonly difficulty: EventStruct<"difficulty">[] = [];
    readonly craft: EventStruct<"craft">[] = [];
    readonly typeRecord: EventStruct<"typeRecord">[] = [];
    readonly property: EventStruct<"property">[] = [];

    readonly beforeOutfitEquip: EventStruct<"beforeOutfitEquip">[] = [];
    readonly validateItemEquip: EventStruct<"validateItemEquip">[] = [];
    readonly beforeItemEquip: EventStruct<"beforeItemEquip">[] = [];
    readonly afterItemEquip: EventStruct<"afterItemEquip">[] = [];
    readonly afterOutfitEquip: EventStruct<"afterOutfitEquip">[] = [];

    keys() {
        return Array.from(this.validKeys).flatMap(k => this[k].map(e => e.id));
    }

    values() {
        return Array.from(this.validKeys).flatMap(k => this[k].map((e): EventStruct<any> => e));
    }

    entries() {
        return Array.from(this.validKeys).flatMap(k => this[k].map((e): [string, EventStruct<any>] => [e.id, e]));
    }

    addEventListener<T extends keyof WheelEvents>(
        key: T,
        registrationData: RegistrationData,
        options: RegistrationOptions<T>,
    ) {
        if (!this.validKeys.has(key)) {
            throw new Error(`Invalid key "${key}"`);
        } else if (this[key].some(i => i.registrationData.fullName === registrationData.fullName && i.next === options.callback as any)) {
            logger.error(`${registrationData.name} has already registered the ${options.id} event listener`);
            return;
        }

        const allowedKwargs: Set<keyof WheelEventsKwargs> = new Set;
        const defaultKwargs: Mutable<WheelEventsKwargs> = {};
        switch (key) {
            case "validateItemUnequip":
            case "color":
            case "difficulty":
            case "craft":
            case "typeRecord":
            case "property":
            case "validateItemEquip":
            case "beforeItemEquip":
            case "afterItemEquip":
                allowedKwargs.add("groupNames");
                defaultKwargs.groupNames = options.defaultKwargs?.groupNames;
                break;
            case "beforeOutfitEquip":
            case "afterOutfitEquip":
                break;
            default:
                throw new Error;
        }

        this[key].push({
            registrationData,
            next: options.callback as any,
            id: options.id,
            description: options.description,
            conditional: options.conditional,
            defaultKwargs,
            allowedKwargs,
        });
    }

    removeEventListener<T extends keyof WheelEvents>(
        key: T,
        registrationData: RegistrationData,
        callback: EventCallback<T>,
    ) {
        const idx = this[key].findIndex(i => i.registrationData.fullName === registrationData.fullName && i.next === callback as any);
        if (idx !== -1) {
            this[key].splice(idx, 1);
        } else {
            logger.error(`${registrationData.name} has no such registered event listener`);
        }
    }

    run<T extends keyof WheelEvents> (
        key: T,
        event: WheelEvents[T],
        kwargs: Record<string, undefined | WheelEventsKwargs>,
        cache: Record<string, any>,
    ): NonNullable<WheelEventsReturnType[T]>[] {
        return this[key].map(({ next, id, conditional }) => {
            const kwarg = kwargs[id] ?? {};
            if (conditional && !("id" in kwargs)) {
                return null;
            }

            if ("newAsset" in event && event.newAsset) {
                if (kwarg.groupNames && !kwarg.groupNames.has(event.newAsset.Group.Name)) {
                    return null;
                }
            }

            // @ts-ignore
            return next(event, cache);
        }).filter(Boolean) as NonNullable<WheelEventsReturnType[T]>[];
    }
}

export const wheelCallbacks = new WheelCallbacks();
