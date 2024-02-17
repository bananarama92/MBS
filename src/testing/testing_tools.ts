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

/**
 * Assert whether the passed `condition` evaluates to `true`.
 * @param prefix Error message prefix
 * @param condition Condition for evaluating whether an error must be raised
 * @param message An option message suffix
 */
export function assert(prefix: string, condition: boolean, message?: object): void {
    if (!condition) {
        throw (message === undefined) ? new Error(`${prefix}`) : new Error(`${prefix}: ${message}`);
    }
}

/**
 * Assert whether the passed callback raises.
 * @param prefix Error message prefix
 * @param callback The to-be tested callback
 * @param excMessage The expected exception message
 */
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

/**
 * Assert whether the passed callback runs without raising.
 * @param prefix Error message prefix
 * @param callback The to-be tested callback
 * @returns The callbacks output
 */
export function assertPasses<T>(prefix: string, callback: () => T): T {
    try {
        return callback();
    } catch (error) {
        throw new Error(`${prefix}: Unexpected error message: ${error}`, { cause: error });
    }
}

/**
 * Assert whether `a` and `b` are equal.
 * @param prefix Error message prefix
 * @param a The first to-be compared object
 * @param b The second to-be compared object
 * @param stringConverter An optional callback for creating string-representations of `a` and `b`
 */
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

/**
 * Assert whether `a` and `b` are not equal.
 * @param prefix Error message prefix
 * @param a The first to-be compared object
 * @param b The second to-be compared object
 * @param stringConverter An optional callback for creating string-representations of `a` and `b`
 */
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

/**
 * Assert whether the passed array contains `element`
 * @param prefix Error message prefix
 * @param list A list of elements
 * @param element An element
 */
export function assertIncludes<T>(prefix: string, list: readonly T[], element: T): void {
    if (!list.includes(element)) {
        throw new Error(`${prefix}: Passed array ${list} does not contain element ${element?.toString() ?? element}`);
    }
}

/**
 * Assert the type of the passed object
 * @param prefix Error message prefix
 * @param obj The to-be checked object
 * @param type The expected type
 */
export function assertTypeof(prefix: string, obj: any, type: string): void {
    if (typeof obj !== type) {
        throw new Error(`${prefix}: Invalid object type "${typeof obj}", expected "${type}"`);
    }
}

/**
 * Assert that the passed array has a given length
 * @param prefix Error message prefix
 * @param obj The array in question
 * @param obj.length The array's length
 * @param length The expect array length
 */
export function assertLength(prefix: string, obj: { length: number }, length: number): void {
    if (obj.length !== length) {
        throw new Error(`${prefix}: Invalid object length ${obj.length}, expected ${length}`);
    }
}

/**
 * Helper replacer function for {@link stringify}
 * @param _ The name of the corresponding object key
 * @param v A JavaScript value, usually an object or array, to be converted.
 * @returns The replaced value
 */
function _replacer(_: string, v: unknown): any {
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

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @returns The stringified object
 */
export function stringify(value: unknown): string {
    return JSON.stringify(value, _replacer, 1);
}
