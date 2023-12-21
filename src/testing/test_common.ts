"use strict";

import { range } from "lodash-es";

import {
    validateInt,
    padArray,
    trimArray,
    randomElement,
    getRandomPassword,
    LoopIterator,
    generateIDs,
    isIterable,
    Version,
} from "../common";

import {
    RAISES,
    PASSES,
    RaiseStruct,
    PassStruct,
    assert,
    assertEqual,
    assertIncludes,
    assertRaises,
    assertPasses,
    assertTypeof,
    assertLength,
} from "./testing_tools";

export function test_validateInt(): void {
    const name = "test_validateInt";

    const raiseList: RaiseStruct<[int: any, varName: string, min?: any, max?: any]>[] = [
        {
            args: [0.5, "test"],
            excMessage: "\"test\" must be an integer: 0.5",
        },
        {
            args: ["test", "test"],
            excMessage: "Invalid \"test\" type: string",
        },
        {
            args: [5, "test", 10],
            excMessage: "\"test\" must fall in the [10, Infinity] interval: 5",
        },
        {
            args: [5, "test", 0, 3],
            excMessage: "\"test\" must fall in the [0, 3] interval: 5",
        },
    ];

    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:${RAISES}:${i}`, () => validateInt(...args), excMessage);
    });
    assertPasses(`${name}:${PASSES}:0`, () => validateInt(0, "test"));
}

export function test_padArray(): void {
    const name = "test_padArray";

    const raiseList: RaiseStruct<[list: any, n: any, padValue: any]>[] = [
        {
            args: [[], 0.5, null],
            excMessage: "\"n\" must be an integer: 0.5",
        },
        {
            args: [undefined, 5, null],
            excMessage: "Invalid \"list\" type: undefined",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:${RAISES}:${i}`, () => padArray(...args), excMessage);
    });

    const passList: PassStruct<[list: string[], n: number, padValue: string], string[]>[] = [
        {
            args: [["a", "b", "c"], 5, "test"],
            output: ["a", "b", "c", "test", "test"],
        },
        {
            args: [["a", "b", "c"], 2, "test"],
            output: ["a", "b", "c"],
        },
    ];
    passList.forEach(({ args, output }, i) => {
        const outputObserved = assertPasses(`${name}:${PASSES}:${i}`, () => padArray(...args));
        assertEqual(`${name}:${PASSES}:${i}`, outputObserved, output);
    });
}

export function test_trimArray(): void {
    const name = "test_trimArray";

    const raiseList: RaiseStruct<[list: any, n: any]>[] = [
        {
            args: [[], 0.5],
            excMessage: "\"n\" must be an integer: 0.5",
        },
        {
            args: [undefined, 5],
            excMessage: "Invalid \"list\" type: undefined",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:${RAISES}:${i}`, () => trimArray(...args), excMessage);
    });

    const passList: PassStruct<[list: string[], n: number], string[]>[] = [
        {
            args: [["a", "b", "c"], 1],
            output: ["a"],
        },
        {
            args: [["a", "b", "c"], 4],
            output: ["a", "b", "c"],
        },
    ];
    passList.forEach(({ args, output }, i) => {
        const outputObserved = assertPasses(`${name}:${PASSES}:${i}`, () => trimArray(...args));
        assertEqual(`${name}:${PASSES}:${i}`, outputObserved, output);
    });
}

export function test_randomElement(): void {
    const name = "test_randomElement";

    const raiseList: RaiseStruct<[list: any]>[] = [
        {
            args: [undefined],
            excMessage: "Invalid \"list\" type: undefined",
        },
        {
            args: [[]],
            excMessage: "Passed \"list\" must contain at least 1 item",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:${RAISES}:${i}`, () => randomElement(...args), excMessage);
    });

    const { args }: PassStruct<[list: string[]], undefined> = {
        args: [["a", "b", "c"]],
        output: undefined,
    };
    range(0, 100).forEach(i => {
        const outputObserved = assertPasses(`${name}:${PASSES}:${i}`, () => randomElement(...args));
        assertIncludes(`${name}:${PASSES}:${i}`, args[0], outputObserved);
    });
}

export function test_getRandomPassword(): void {
    const name = "test_getRandomPassword";

    const raiseList: RaiseStruct<[n: any]>[] = [
        {
            args: [undefined],
            excMessage: "Invalid \"n\" type: undefined",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:${RAISES}:${i}`, () => getRandomPassword(...args), excMessage);
    });

    range(0, 9).forEach(i => {
        const outputObserved = assertPasses(`${name}:${PASSES}:${i}`, () => getRandomPassword(i));
        assertTypeof(`${name}:${PASSES}:${i}`, outputObserved, "string");
        assertLength(`${name}:${PASSES}:${i}`, outputObserved, i);
    });
}

export function test_MBS_VERSION(): void {
    const name = "test_MBS_VERSION";
    assertTypeof(`${name}:${PASSES}:0`, MBS_VERSION, "string");
}

export function test_LoopIterator(): void {
    const name = "test_LoopIterator";

    const raiseList: RaiseStruct<[list: any, index?: any]>[] = [
        {
            args: [undefined],
            excMessage: "Invalid \"iterable\" type: undefined",
        },
        {
            args: [[]],
            excMessage: "Passed \"iterable\" must contain at least one element",
        },
        {
            args: [[1], 0.5],
            excMessage: "\"index\" must be an integer: 0.5",
        },
        {
            args: [[0, 1], 3],
            excMessage: "\"index\" must fall in the [0, 1] interval: 3",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:constructor:${RAISES}:${i}`, () => new LoopIterator(...args), excMessage);
    });

    const iterator = new LoopIterator([0, 1, 2, 3], 0);
    assertEqual(`${name}:list:${PASSES}:0`, iterator.list, [0, 1, 2, 3]);
    assertEqual(`${name}:index:${PASSES}:0`, iterator.index, 0);
    assertEqual(`${name}:value:${PASSES}:0`, iterator.index, 0);
    assertTypeof(`${name}:[Symbol.iterator]:${PASSES}:0`, iterator[Symbol.iterator], "function");

    let output: any;
    output = assertPasses(`${name}:next:${PASSES}:0`, () => iterator.next(false));
    assertEqual(`${name}:next:${PASSES}:0`, output, 1);
    assertEqual(`${name}:next:${PASSES}:0`, iterator.index, 0);
    output = assertPasses(`${name}:next:${PASSES}:0`, () => iterator.next());
    assertEqual(`${name}:next:${PASSES}:0`, output, 1);
    assertEqual(`${name}:next:${PASSES}:0`, iterator.index, 1);

    assertRaises(
        `${name}:setPosition:${RAISES}:0`,
        () => iterator.setPosition(10),
        "\"index\" must fall in the [0, 3] interval: 10",
    );
    assertPasses(`${name}:setPosition:${PASSES}:0`, () => iterator.setPosition(0));
    assertEqual(`${name}:setPosition:${PASSES}:0`, iterator.index, 0);

    output = assertPasses(`${name}:previous:${PASSES}:0`, () => iterator.previous(false));
    assertEqual(`${name}:previous:${PASSES}:0`, output, 3);
    assertEqual(`${name}:previous:${PASSES}:0`, iterator.index, 0);
    output = assertPasses(`${name}:previous:${PASSES}:0`, () => iterator.previous());
    assertEqual(`${name}:previous:${PASSES}:0`, output, 3);
    assertEqual(`${name}:previous:${PASSES}:0`, iterator.index, 3);

    output = assertPasses(`${name}:toString:${PASSES}:0`, () => iterator.toString());
    assertTypeof(`${name}:toString:${PASSES}:0`, output, "string");

    output = assertPasses(`${name}:toJSON:${PASSES}:0`, () => iterator.toJSON());
    assertEqual(`${name}:toJSON:${PASSES}:0`, iterator.toJSON(), { list: [0, 1, 2, 3], index: 3 });
}

export function test_generateIDs(): void {
    const name = "test_generateIDs";

    const raiseList: RaiseStruct<[start: any, indices: any]>[] = [
        {
            args: [0, undefined],
            excMessage: "Invalid \"indices\" type: undefined",
        },
        {
            args: [2**16 - 1, [5]],
            excMessage: "\"stop\" must fall in the [65536, 65535] interval: 65541",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:${RAISES}:${i}`, () => generateIDs(...args), excMessage);
    });

    const passesList: PassStruct<[start: number, indices: number[]], string[]>[] = [
        {
            args: [80, [0, 4, 6]],
            output: ["P", "T", "V"],
        },
        {
            args: [2**10, [0, 4, 1]],
            output: ["Ѐ", "Є", "Ё"],
        },
        {
            args: [0, []],
            output: [],
        },
    ];
    passesList.forEach(({ args, output }, i) => {
        const outputObsered = assertPasses(`${name}:${PASSES}:${i}`, () => generateIDs(...args));
        assertEqual(`${name}:${PASSES}:${i}`, outputObsered, output);
    });
}

export function test_isIterable(): void {
    const name = "test_isIterable";
    const passesList: PassStruct<[obj: unknown], boolean>[] = [
        {
            args: [null],
            output: false,
        },
        {
            args: [1],
            output: false,
        },
        {
            args: [[1]],
            output: true,
        },
        {
            args: [new Set()],
            output: true,
        },
    ];
    passesList.forEach(({ args, output }, i) => {
        const outputObsered = assertPasses(`${name}:${PASSES}:${i}`, () => isIterable(...args));
        assertEqual(`${name}:${PASSES}:${i}`, outputObsered, output);
    });
}

export function test_Version(): void {
    const name = "test_Version";

    const raiseList: RaiseStruct<[major?: any, minor?: any, micro?: any, beta?: any]>[] = [
        {
            args: ["bob", 0, 0, false],
            excMessage: "Invalid \"major\" type: string",
        },
        {
            args: [0, "bob", 0, false],
            excMessage: "Invalid \"minor\" type: string",
        },
        {
            args: [0, 0, "bob", false],
            excMessage: "Invalid \"micro\" type: string",
        },
        {
            args: [0, 0, 0, "bob"],
            excMessage: "Invalid \"beta\" type: string",
        },
    ];
    raiseList.forEach(({ args, excMessage }, i) => {
        assertRaises(`${name}:constructor:${RAISES}:${i}`, () => new Version(...args), excMessage);
    });

    const version = new Version(1, 0, 5);
    const version2 = new Version(2, 3, 1);
    const version3 = new Version(0, 99, 5, true);
    assertEqual(`${name}:major:${PASSES}:0`, version.major, 1);
    assertEqual(`${name}:minor:${PASSES}:0`, version.minor, 0);
    assertEqual(`${name}:micro:${PASSES}:0`, version.micro, 5);
    assertEqual(`${name}:beta:${PASSES}:0`, version.beta, false);

    assert(`${name}:equal:${PASSES}:0`, !version.equal(<any>null));
    assert(`${name}:equal:${PASSES}:1`, version.equal(version));
    assert(`${name}:equal:${PASSES}:2`, !version.equal(version2));
    assert(`${name}:equal:${PASSES}:3`, !version.equal(version3));

    assert(`${name}:greater:${PASSES}:0`, !version.greater(<any>null));
    assert(`${name}:greater:${PASSES}:1`, !version.greater(version));
    assert(`${name}:greater:${PASSES}:2`, !version.greater(version2));
    assert(`${name}:greater:${PASSES}:3`, version.greater(version3));

    assert(`${name}:lesser:${PASSES}:0`, !version.lesser(<any>null));
    assert(`${name}:lesser:${PASSES}:1`, !version.lesser(version));
    assert(`${name}:lesser:${PASSES}:2`, version.lesser(version2));
    assert(`${name}:lesser:${PASSES}:3`, !version.lesser(version3));

    assert(`${name}:greaterOrEqual:${PASSES}:0`, !version.greaterOrEqual(<any>null));
    assert(`${name}:greaterOrEqual:${PASSES}:1`, version.greaterOrEqual(version));
    assert(`${name}:greaterOrEqual:${PASSES}:2`, !version.greaterOrEqual(version2));
    assert(`${name}:greaterOrEqual:${PASSES}:3`, version.greaterOrEqual(version3));

    assert(`${name}:lesserOrEqual:${PASSES}:0`, !version.lesserOrEqual(<any>null));
    assert(`${name}:lesserOrEqual:${PASSES}:1`, version.lesserOrEqual(version));
    assert(`${name}:lesserOrEqual:${PASSES}:2`, version.lesserOrEqual(version2));
    assert(`${name}:lesserOrEqual:${PASSES}:3`, !version.lesserOrEqual(version3));

    let output: any = assertPasses(`${name}:fromVersion:${PASSES}:0`, () => Version.fromVersion("1.0.5"));
    assertEqual(`${name}:fromVersion:${PASSES}:0`, output, version);
    assertRaises(
        `${name}:fromVersion:${RAISES}:0`,
        () => Version.fromVersion(<any>undefined),
        "Invalid \"version\": undefined",
    );

    output = assertPasses(`${name}:fromVersion:${PASSES}:0`, () => Version.fromBCVersion("R109Beta3"));
    assertEqual(`${name}:fromVersion:${PASSES}:0`, output, new Version(109, 0, 0, true));
    assertRaises(
        `${name}:fromVersion:${RAISES}:0`,
        () => Version.fromVersion(<any>undefined),
        "Invalid \"version\": undefined",
    );

    output = assertPasses(`${name}:toString:${PASSES}:0`, () => version.toString());
    assertTypeof(`${name}:toString:${PASSES}:0`, output, "string");

    output = assertPasses(`${name}:toJSON:${PASSES}:0`, () => version.toJSON());
    assertEqual(`${name}:toJSON:${PASSES}:0`, output, { major: 1, minor: 0, micro: 5, beta: false });
}
