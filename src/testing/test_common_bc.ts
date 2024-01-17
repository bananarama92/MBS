import { range } from "lodash-es";

import {
    MBS_MAX_SETS,
    FORTUNE_WHEEL_COLORS,
    canChangeCosplay,
    sanitizeWheelFortuneIDs,
    settingsLoaded,
    settingsMBSLoaded,
} from "../common_bc";

import {
    equipTimerLock,
    equipHighSecLock,
    equipLock,
} from "../fortune_wheel/lock_flags";

import {
    RAISES,
    PASSES,
    RaiseStruct,
    PassStruct,
    assert,
    assertEqual,
    assertRaises,
    assertPasses,
    assertTypeof,
} from "./testing_tools";

export function test_FORTUNE_WHEEL_COLORS(): void {
    const name = "test_FORTUNE_WHEEL_COLORS";
    assert(`${name}:${PASSES}:0`, Array.isArray(FORTUNE_WHEEL_COLORS));
    assert(`${name}:${PASSES}:0`, FORTUNE_WHEEL_COLORS.every(i => typeof i === "string"));
}

export function test_FORTUNE_WHEEL_MAX_SETS(): void {
    const name = "test_FORTUNE_WHEEL_MAX_SETS";
    assertTypeof(`${name}:${PASSES}:0`, MBS_MAX_SETS, "number");
    assert(`${name}:${PASSES}:0`, Number.isInteger(MBS_MAX_SETS));
    assert(`${name}:${PASSES}:0`, MBS_MAX_SETS >= 0);
}

export function test_canChangeCosplay(): void {
    const name = "test_canChangeCosplay";
    const characterNames = range(0, 3).map(i => `${name}${i}`);

    try {
        const characters = characterNames.map(i => {
            const c = CharacterLoadSimple(i);
            c.OnlineSharedSettings = <CharacterOnlineSharedSettings>c.OnlineSharedSettings ?? {};
            return c;

        });
        characters[1].OnlineSharedSettings = <CharacterOnlineSharedSettings>{ ...(characters[1].OnlineSharedSettings ?? {}), BlockBodyCosplay: false };
        characters[2].OnlineSharedSettings = <CharacterOnlineSharedSettings>{ ...(characters[1].OnlineSharedSettings ?? {}), BlockBodyCosplay: true };

        const passesList: PassStruct<[character: Character], boolean>[] = [
            {
                args: [characters[0]],
                output: false,
            },
            {
                args: [characters[1]],
                output: true,
            },
            {
                args: [characters[2]],
                output: false,
            },
        ];
        passesList.forEach(({ args, output }, i) => {
            const outputObsered = assertPasses(`${name}:${PASSES}:${i}`, () => canChangeCosplay(...args));
            assertEqual(`${name}:${PASSES}:${i}`, outputObsered, output);
        });
    } finally {
        characterNames.forEach(CharacterDelete);
    }
}

export function test_sanitizeWheelFortuneIDs(): void {
    const name = "test_sanitizeWheelFortuneIDs";

    assertRaises(
        `${name}:${RAISES}:0`,
        () => sanitizeWheelFortuneIDs(<any>undefined),
        "Invalid \"IDs\" type: undefined",
    );

    const passesList: PassStruct<[IDs: string], string>[] = [
        {
            args: ["ABC"],
            output: "ABC",
        },
        {
            args: ["A䀁"],
            output: "A",
        },
    ];
    passesList.forEach(({ args, output }, i) => {
        const outputObsered = assertPasses(`${name}:${PASSES}:${i}`, () => sanitizeWheelFortuneIDs(...args));
        assertEqual(`${name}:${PASSES}:${i}`, outputObsered, output);
    });
}

export function test_equipTimerLock(): void {
    const name = "test_equipTimerLock";

    try {
        const character = CharacterLoadSimple(name);
        const asset = AssetGet(character.AssetFamily, "ItemArms", "LatexArmbinder");
        if (asset == null) {
            throw new Error();
        }
        const item: Item = { Asset: asset };

        assertRaises(
            `${name}:${RAISES}:0`,
            () => equipTimerLock(item, <any>undefined, character),
            "Invalid \"seconds\" type: undefined",
        );

        assertPasses(`${name}:${PASSES}:0`, () => equipTimerLock(item, 99, character));
        assert(`${name}:${PASSES}:0`, (item.Property?.RemoveTimer ?? Infinity) <= CurrentTime + 33 * 60000);
        assertEqual(`${name}:${PASSES}:0`, item.Property?.RemoveItem, true);
        assertEqual(`${name}:${PASSES}:0`, item.Property?.LockSet, true);
        assertTypeof(`${name}:${PASSES}:0`, item.Property?.Password, "string");
    } finally {
        CharacterDelete(name);
    }
}

export function test_equipHighSecLock(): void {
    const name = "test_equipHighSecLock";

    try {
        const character = CharacterLoadSimple(name);
        const asset = AssetGet(character.AssetFamily, "ItemArms", "LatexArmbinder");
        if (asset == null) {
            throw new Error();
        }
        const item: Item = { Asset: asset };

        assertPasses(`${name}:${PASSES}:0`, () => equipHighSecLock(item, character));
        assertEqual(`${name}:${PASSES}:0`, item.Property?.MemberNumberListKeys, "");
    } finally {
        CharacterDelete(name);
    }
}

export function test_equipLock(): void {
    const name = "test_equipLock";
    const characterNames = range(0, 5).map(i => `${name}-${i}`);

    try {
        const characters = characterNames.map(CharacterLoadSimple);
        characters[4].BlockItems.push({ Name: "ExclusivePadlock", Group: "ItemMisc" });
        InventoryWear(characters[2], "LatexArmbinder", "ItemArms");
        InventoryLock(characters[2], <Item>characters[2].Appearance.at(-1), "ExclusivePadlock");

        const asset = AssetGet(characters[0].AssetFamily, "ItemArms", "LatexArmbinder");
        const assetNoLock = AssetGet(characters[0].AssetFamily, "ItemArms", "NylonRope");
        if (asset == null || assetNoLock == null) {
            throw new Error();
        }
        const item = { Asset: asset };

        const raiseList: RaiseStruct<[item?: any, lockName?: any, character?: any]>[] = [
            {
                args: ["bob", "ExclusivePadlock", characters[0]],
                excMessage: "Invalid \"item\" type: string",
            },
            {
                args: [item, 0, characters[0]],
                excMessage: "Invalid \"lockName\" type: number",
            },
            {
                args: [item, "bob", characters[0]],
                excMessage: "Invalid \"lockName\" value: bob",
            },
            {
                args: [item, "ExclusivePadlock", 1],
                excMessage: "Invalid \"character\" type: number",
            },
        ];
        raiseList.forEach(({ args, excMessage }, i) => {
            assertRaises(`${name}:${RAISES}:${i}`, () => equipLock(...args), excMessage);
        });

        const passList: PassStruct<[item: Item, lockName: AssetLockType, character: Character], boolean>[] = [
            {
                args: [item, "ExclusivePadlock", characters[1]],
                output: true,
            },
            {
                args: [item, "ExclusivePadlock", characters[2]],
                output: false,
            },
            {
                args: [{ Asset: assetNoLock }, "ExclusivePadlock", characters[3]],
                output: false,
            },
            {
                args: [item, "ExclusivePadlock", characters[4]],
                output: false,
            },
        ];
        passList.forEach(({ args, output }, i) => {
            const outputObserved = assertPasses(`${name}:${PASSES}:${i}`, () => equipLock(...args));
            assertEqual(`${name}:${PASSES}:0`, outputObserved, output);
        });
    } finally {
        characterNames.forEach(CharacterDelete);
    }
}

export function test_settingsMBSLoaded(): void {
    const name = "test_settingsMBSLoaded";
    const output = assertPasses(`${name}:${PASSES}:0`, settingsMBSLoaded);
    assertEqual(`${name}:${PASSES}:0`, output, true);
}

export function test_settingsLoaded(): void {
    const name = "test_settingsLoaded";
    const output = assertPasses(`${name}:${PASSES}:0`, settingsLoaded);
    assertEqual(`${name}:${PASSES}:0`, output, true);
}
