/** @type {ExtendedItemScriptHookCallbacks.Load<TypedItemData>} */
declare function InventoryItemArmsTransportJacketLoadHook(Data: TypedItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData>} */
declare function InventoryItemArmsTransportJacketDrawHook(Data: TypedItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemScriptHookCallbacks.PublishAction<TypedItemData, any>} */
declare function InventoryItemArmsTransportJacketPublishActionHook(data: TypedItemData, originalFunction: (C: Character, item: Item, newOption: any, previousOption: any) => void, C: Character, item: Item, newOption: any, previousOption: any): void;
/** @type {ExtendedItemScriptHookCallbacks.Exit<TypedItemData>} */
declare function InventoryItemArmsTransportJacketExitHook(Data: TypedItemData, OriginalFunction: () => void): void;
/** @type {ExtendedItemCallbacks.AfterDraw} */
declare function AssetsItemArmsTransportJacketAfterDraw({ C, A, CA, X, Y, L, drawCanvas, drawCanvasBlink, AlphaMasks, Color }: DynamicDrawingData<Record<string, unknown>>): void;
