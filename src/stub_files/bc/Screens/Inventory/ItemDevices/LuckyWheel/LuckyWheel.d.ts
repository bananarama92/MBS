/**
 * Helper to generate section labels
 * @param {number} num
 * @returns {string}
 */
declare function ItemDevicesLuckyWheelLabelForNum(num: number): string;
/**
 * Modular item hook to draw the spin button on every subscreeen
 */
declare function InventoryItemDevicesLuckyWheelDrawHook(next: any): void;
/**
 * Modular item hook to handle clicks on the spin button on every subscreeen
 */
declare function InventoryItemDevicesLuckyWheelClickHook(next: any): void;
declare function InventoryItemDevicesLuckyWheelInit(Item: any): void;
/**
 * Lucky Wheel Game subscreen load handler
 */
declare function InventoryItemDevicesLuckyWheelGame0Load(): void;
declare function InventoryItemDevicesLuckyWheelGame0Draw(): void;
declare function InventoryItemDevicesLuckyWheelGame0Click(): void;
declare function InventoryItemDevicesLuckyWheelGame0Exit(): void;
declare function InventoryItemDevicesLuckyWheelUpdate(): void;
declare function InventoryItemDevicesLuckyWheelTrigger(): void;
declare function InventoryItemDevicesLuckyWheelStoppedTurning(C: any, Item: any, Angle: any): void;
/** @type {DynamicScriptDrawCallback} */
declare function AssetsItemDevicesLuckyWheelScriptDraw({ C, PersistentData, Item }: DynamicScriptCallbackData): void;
/** @type {DynamicAfterDrawCallback} */
declare function AssetsItemDevicesLuckyWheelAfterDraw({ C, PersistentData, A, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }: DynamicDrawingData): void;
declare var ItemDevicesLuckyWheelMinTexts: number;
declare var ItemDevicesLuckyWheelMaxTexts: number;
declare var ItemDevicesLuckyWheelMaxTextLength: number;
declare var ItemDevicesLuckyWheelFont: string;
declare var ItemDevicesLuckyWheelAnimationMaxSpeed: number;
declare var ItemDevicesLuckyWheelAnimationMinSpeed: number;
declare var ItemDevicesLuckyWheelAnimationSpeedStep: number;
declare var ItemDevicesLuckyWheelAnimationFrameTime: number;
declare var ItemDevicesLuckyWheelRowTop: number;
declare var ItemDevicesLuckyWheelRowLeft: number;
declare var ItemDevicesLuckyWheelRowHeight: number;
declare var ItemDevicesLuckyWheelRowLength: number;
