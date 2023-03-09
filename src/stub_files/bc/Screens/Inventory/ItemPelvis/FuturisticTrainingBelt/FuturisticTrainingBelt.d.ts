/** @type {ExtendedItemInitCallback} */
declare function InventoryItemPelvisFuturisticTrainingBeltInit(Item: Item, C: Character, Refresh: boolean): void;
declare function InventoryItemPelvisFuturisticTrainingBeltLoad(): void;
declare function InventoryItemPelvisFuturisticTrainingBeltDraw(): void;
declare function InventoryItemPelvisFuturisticTrainingBeltClick(): void;
declare function InventoryItemPelvisFuturisticTrainingBeltExit(): void;
/**
 * Called by the extended system when setting the type. Not actually used as this is not an extended asset.
 * @param {Character} C
 * @param {ExtendedItemOption} Option
 * @returns
 */
declare function InventoryItemPelvisFuturisticTrainingBeltPublishAction(C: Character, Option: ExtendedItemOption): void;
/**
 * Not called.
 * @param {Character} C
 * @param {string} Setting
 * @param {boolean} Active
 */
declare function InventoryItemPelvisFuturisticTrainingBeltPublishMode(C: Character, Setting: string, Active: boolean): void;
/**
 * Publishes a generic message when the belt gets updated.
 * @param {Character} C
 * @param {string} msg
 */
declare function InventoryItemPelvisFuturisticTrainingBeltPublishGeneric(C: Character, msg: string): void;
/**
 *
 * @param {Character} C
 * @param {Item} Item
 * @returns
 */
declare function InventoryItemPelvisFuturisticTrainingBeltValidate(C: Character, Item: Item): string;
/**
 * Get a vibe mode given a belt state
 * @param {Character} C
 * @param {string} State
 * @param {boolean} First
 * @returns {VibratorMode}
 */
declare function InventoryItemPelvisFuturisticTrainingBeltGetVibeMode(C: Character, State: string, First: boolean): VibratorMode;
/**
 * This function sets the vibration mode, similar to the extended vibrators
 *
 * @param {Character} C
 * @param {any} PersistentData
 * @param {Item} Item
 * @param {boolean} [Force]
 */
declare function InventoryItemPelvisFuturisticTrainingBeltUpdateVibeMode(C: Character, PersistentData: any, Item: Item, Force?: boolean): void;
/**
 * Performs punishment checks on the chat log for the given item and
 * returns an appropriate punishment, if applicable.
 *
 * @param {Item} Item
 * @param {number} LastTime
 * @returns {{ name: "Speech"|"RequiredSpeech"|"ProhibitedSpeech"|"", word?: string }}
 */
declare function InventoryFuturisticTrainingBeltCheckPunishSpeech(Item: Item, LastTime: number): {
    name: "Speech" | "RequiredSpeech" | "ProhibitedSpeech" | "";
    word?: string;
};
/**
 *
 * @param {DynamicScriptCallbackData} data
 * @param {number} LastTime
 */
declare function AssetsItemPelvisFuturisticTrainingBeltScriptUpdatePlayer(data: DynamicScriptCallbackData, LastTime: number): void;
/**
 * Handles the vibrator state machine for the belt
 * @param {DynamicScriptCallbackData} data
 * @returns
 */
declare function AssetsItemPelvisFuturisticTrainingBeltScriptStateMachine(data: DynamicScriptCallbackData): void;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemPelvisFuturisticTrainingBeltScriptDraw(data: DynamicScriptCallbackData): void;
declare var FuturisticTrainingBeltPermissions: string[];
declare var FuturisticTrainingBeltSpeechPunishments: string[];
declare var FuturisticTrainingBeltModes: string[];
declare var FuturisticTrainingBeltStates: string[];
/** @type {ItemPropertiesCustom["PublicModeCurrent"]} */
declare var FuturisticTrainingBeltSetMode: ItemPropertiesCustom["PublicModeCurrent"];
declare var FuturisticTrainingBeltStandUpFlag: boolean;
declare var FuturisticTrainingBeltSpeechCharacterLimit: number;
declare var FuturisticTrainingBeltRandomEdgeCycle: number;
declare var FuturisticTrainingBeltRandomTeaseDurationMin: number;
declare var FuturisticTrainingBeltRandomTeaseDurationMax: number;
declare var FuturisticTrainingBeltRandomTeaseDurationCooldown: number;
declare var FuturisticTrainingBeltRandomTeaseChance: number;
declare var FuturisticTrainingBeltRandomTeaseMaxChance: number;
declare var FuturisticTrainingBeltRandomDenyChance: number;
declare var FuturisticTrainingBeltRandomDenyDuration: number;
declare var FuturisticTrainingBeltRandomOrgasmDurationMin: number;
declare var FuturisticTrainingBeltRandomOrgasmDurationMax: number;
declare var FuturisticTrainingBeltRandomOrgasmDurationCooldown: number;
declare var FuturisticTrainingBeltRandomOrgasmChance: number;
declare var FuturisticTrainingBeltPunishmentEdgeDuration: number;
declare var FuturisticTrainingBeltPunishmentVibeDuration: number;
declare var FuturisticTrainingBeltConfigure: boolean;
declare var FuturisticTrainingBeltPage: number;
declare var FuturisticTrainingBeltMaxPage: number;
