/**
 * @param {Item} Item
 */
declare function InventoryFuturisticChastityBeltCheckPunish(Item: Item): "" | "Struggle" | "Orgasm" | "StruggleOther";
declare function AssetsItemPelvisFuturisticChastityBeltScriptUpdatePlayer(data: any): void;
/**
 * Trigger a shock automatically
 * @param {Character} C
 * @param {Item} Item
 * @param {string} ShockType
 * @param {string} [ReplacementWord]
 * @param {boolean} [NoShock]
 */
declare function AssetsItemPelvisFuturisticChastityBeltScriptTrigger(C: Character, Item: Item, ShockType: string, ReplacementWord?: string, NoShock?: boolean): void;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemPelvisFuturisticChastityBeltScriptDraw(data: {
    C: Character;
    Item: Item;
    PersistentData: <T>() => T;
}): void;
declare var FuturisticChastityBeltShockCooldownOrgasm: number;
declare var FuturisticChastityBeltConfigure: boolean;
declare var FuturisticChastityBeltSwitchModel: boolean;
declare var InventoryItemPelvisFuturisticChastityBeltTamperZones: string[];
