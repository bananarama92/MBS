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
declare function AssetsItemPelvisFuturisticChastityBeltScriptDraw(data: DynamicScriptCallbackData): void;
declare var FuturisticChastityBeltShockCooldownOrgasm: number;
declare var InventoryItemPelvisFuturisticChastityBeltTamperZones: string[];
