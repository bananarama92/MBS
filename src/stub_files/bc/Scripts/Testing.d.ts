/**
 * Gather all color-layers and -groups absent from their respective .csv files
 * @returns {[colorLayers: TestingMissingStruct[], colorGroups: TestingMissingStruct[]]}
 */
declare function TestingGetMissingColorLayersGroups(): [colorLayers: TestingMissingStruct[], colorGroups: TestingMissingStruct[]];
/**
 * A module with helper utilities for testing.
 * Note that this file and its content therein should only be executed when running
 * the `AssetCheck` test suit, and should therefore *not* be added to `index.html`.
 *
 * NOTE: Make sure to declare module-level objects as `var` if they should appear in
 * the VM context output.
 */
/** @type {Set<string>} */
declare var TestingColorLayers: Set<string>;
/** @type {Set<string>} */
declare var TestingColorGroups: Set<string>;
declare var TestingMisingColorLayers: TestingMissingStruct[];
declare var TestingMisingColorGroups: TestingMissingStruct[];
