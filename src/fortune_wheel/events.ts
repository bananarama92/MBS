import { logger } from "../common";

import { RegistrationData } from "./registration";

export namespace Events {
    interface Base {
        readonly name: string;
        readonly character: Character;
        readonly newAsset: null | Asset;
        readonly targetGroup: AssetGroupName;
    }

    export interface PreProcess extends Base {}

    export interface ValidateUnequip extends Base {
        readonly newAsset: null | Asset;
        readonly targetGroup: AssetGroupName;
        readonly oldItem: null | Item;
    }

    export interface ValidateEquip extends Base {
        readonly targetGroup: AssetGroupName;
        readonly newAsset: Asset;
    }

    export interface Color extends ValidateEquip {
        readonly color: null | readonly string[];
    }

    export interface TypeRecord extends ValidateEquip {
        readonly typeRecord: null | Readonly<globalThis.TypeRecord>;
    }

    export interface Difficulty extends ValidateEquip {
        readonly difficulty: null | number;
    }

    export interface Craft extends ValidateEquip {
        readonly craft: null | Readonly<CraftingItem>;
    }

    export interface Property extends ValidateEquip {
        readonly properties: Readonly<ItemProperties>;
    }
}

export interface WheelEvents {
    validateUnequip: Events.ValidateUnequip;
    validateEquip: Events.ValidateEquip;
    color: Events.Color;
    difficulty: Events.Difficulty;
    craft: Events.Craft;
    typeRecord: Events.TypeRecord;
    property: Events.Property;
    preProcess: Events.PreProcess;
}

interface WheelEventsReturnType extends Record<keyof WheelEvents, unknown> {
    validateUnequip: string;
    validateEquip: string;
    color: (undefined | string)[];
    difficulty: number;
    craft: Partial<Pick<CraftingItem, "Name" | "Description" | "Property">>;
    typeRecord: Partial<TypeRecord>;
    property: Partial<ItemProperties>;
    preProcess: void;
}

type EventCallback<T extends keyof WheelEvents> = (event: WheelEvents[T], cache: Record<string, any>) => undefined | null | WheelEventsReturnType[T];

interface EventStruct<T extends keyof WheelEvents> {
    readonly registrationData: RegistrationData;
    readonly conditional: boolean;
    readonly next: EventCallback<T>;
    readonly id: string,
    readonly description?: string,
}

type _WheelCallbacks = { readonly [k in keyof WheelEvents]: readonly EventStruct<k>[] };

interface RegistrationOptions<T extends keyof WheelEvents> {
    callback: EventCallback<T>,
    id: string,
    description?: string,
    conditional?: boolean,
}

class WheelCallbacks implements _WheelCallbacks {
    readonly validKeys: ReadonlySet<keyof WheelEvents> = Object.freeze(new Set([
        "validateUnequip",
        "validateEquip",
        "color",
        "difficulty",
        "craft",
        "typeRecord",
        "property",
        "preProcess",
    ] as const));

    readonly validateUnequip: EventStruct<"validateUnequip">[] = [];
    readonly validateEquip: EventStruct<"validateEquip">[] = [];
    readonly color: EventStruct<"color">[] = [];
    readonly difficulty: EventStruct<"difficulty">[] = [];
    readonly craft: EventStruct<"craft">[] = [];
    readonly typeRecord: EventStruct<"typeRecord">[] = [];
    readonly property: EventStruct<"property">[] = [];
    readonly preProcess: EventStruct<"preProcess">[] = [];

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

        this[key].push({
            registrationData,
            next: options.callback as any,
            id: options.id,
            description: options.description,
            conditional: options?.conditional ?? true,
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
        cache: Record<string, any>,
    ): NonNullable<WheelEventsReturnType[T]>[] {
        // @ts-ignore
        return this[key].map(({ next }) => next(event, cache)).filter(Boolean);
    }
}

export const wheelCallbacks = new WheelCallbacks();
