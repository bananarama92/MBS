declare function InventoryItemNeckSlaveCollarLoad(): void;
declare function InventoryItemNeckSlaveCollarDraw(): void;
declare function InventoryItemNeckSlaveCollarClick(): void;
/**
 * Sets the slave collar model
 * @type {TypedItemSetTypeCallback}
 */
declare function InventoryItemNeckSlaveCollarSetType(NewType: string): void;
declare var InventoryItemNeckSlaveCollarColorMode: boolean;
declare var InventoryItemNeckSlaveCollarColor: string;
declare var InventoryItemNeckSlaveCollarOffset: number;
/** @type {(ExtendedItemOption & { Image: string })[]} */
declare var InventoryItemNeckSlaveCollarTypes: (ExtendedItemOption & {
    Image: string;
})[];
