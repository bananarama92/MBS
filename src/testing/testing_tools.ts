import { isEqual } from "lodash-es";

export const RAISES = "raises";
export const PASSES = "passes";

export interface RaiseStruct<T extends any[]>{
    args: T,
    excMessage: string,
}

export interface PassStruct<T extends any[], RT>{
    args: T,
    output: RT,
}

export function assert(prefix: string, condition: boolean, message?: object): void {
    if (!condition) {
        throw (message === undefined) ? new Error(`${prefix}`) : new Error(`${prefix}: ${message}`);
    }
}

export function assertRaises(prefix: string, callback: () => void, excMessage: string): void {
    try {
        callback();
    } catch (error) {
        const e = <Error>error;
        if (e?.message !== excMessage) {
            throw new Error(
                `${prefix}: Invalid error message\n`
                + `Expected error: "${excMessage}"\n`
                + `Observed error: "${e?.message}"`,
            );
        }
        return;
    }
    throw new Error(`${prefix}: Failed to raise an error`);
}

export function assertPasses<T>(prefix: string, callback: () => T): T {
    try {
        return callback();
    } catch (error) {
        throw new Error(`${prefix}: Unexpected error message: ${error}`, { cause: error });
    }
}

export function assertEqual(
    prefix: string,
    a: any,
    b: any,
    stringConverter?: null | ((obj: any) => string),
): void {
    stringConverter = stringConverter ?? stringify;
    if (!isEqual(a, b)) {
        throw new Error(
            `${prefix}: Passed objects not equal:\n`
            + `Observed: ${stringConverter(a)}\n`
            + `Expected: ${stringConverter(b)}`,
        );
    }
}

export function assertNotEqual(
    prefix: string,
    a: any,
    b: any,
    stringConverter?: null | ((obj: any) => string),
): void {
    stringConverter = stringConverter ?? stringify;
    if (isEqual(a, b)) {
        throw new Error(
            `${prefix}: Passed objects equal:\n`
            + `Observed: ${stringConverter(a)}\n`
            + `Not expected: ${stringConverter(b)}`,
        );
    }
}

export function assertIncludes<T>(prefix: string, list: readonly T[], element: T): void {
    if (!list.includes(element)) {
        throw new Error(`${prefix}: Passed array ${list} does not contain element ${element?.toString() ?? element}`);
    }
}

export function assertTypeof(prefix: string, obj: any, type: string): void {
    if (typeof obj !== type) {
        throw new Error(`${prefix}: Invalid object type "${typeof obj}", expected "${type}"`);
    }
}

export function assertLength(prefix: string, obj: { length: number }, length: number): void {
    if (obj.length !== length) {
        throw new Error(`${prefix}: Invalid object length ${obj.length}, expected ${length}`);
    }
}

function replacer(_: string, v: any): any {
    switch (typeof v) {
        case "undefined":
            return "__UNDEFINED__";
        case "function":
            return "__FUNCTION__";
        case "symbol":
            return "__SYMBOL__";
        default:
            return v;
    }
}

export function stringify(value: any): string {
    return JSON.stringify(value, replacer, 1);
}
