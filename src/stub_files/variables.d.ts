declare const Character: readonly Character[];
declare const GameVersion: string;
declare let WheelFortuneOption: FortuneWheelOptionBase[];
declare let WheelFortuneDefault: string;
declare const Player: PlayerCharacter & {
    MBSSettings: MBSSettings,
    OnlineSettings: { MBS: string },
    OnlineSharedSettings: {
        WheelFortune: string,
        MBS: {
            Version: string,
            FortuneWheelSets: (null | {
                name: string,
                itemList: readonly FortuneWheelItem[],
                stripLevel: StripLevel,
                equipLevel: StripLevel,
                flags: FortuneWheelFlags[],
                custom: boolean,
                hidden: boolean,
                preRunCallback: FortuneWheelPreRunCallback | null,
            })[],
        },
    },
};

declare function CharacterNaked(C: Character): void;
declare function AssetGet(Family: string, Group: AssetGroupName, Name: string): null | Asset;
declare function InventoryBlockedOrLimited(C: Character, Item: Item, ItemType?: null | string): boolean;
declare function CharacterRefresh(C: Character, Push?: boolean, RefreshDialog?: boolean): void;
declare function ChatRoomCharacterUpdate(C: Character): void;
declare function InventoryWear(
    C: Character,
    AssetName: string,
    AssetGroup: AssetGroupName,
    ItemColor?: string | string[],
    Difficulty?: number,
    MemberNumber?: null | number,
    Craft?: null | CraftingItem,
): void;
declare function InventoryCraft(
    Source: Character,
    Target: Character,
    GroupName: AssetGroupName,
    Craft?: null | CraftingItem,
    Refresh?: boolean,
    ApplyColor?: boolean,
    CraftWarn?: boolean,
): void;
declare function InventoryGet(C: Character, AssetGroup: AssetGroupName): Item | null;
declare function InventoryGetLock(Item: Item): Item | null;
declare function InventoryLock(
    C: Character,
    Item: Item | string,
    Lock: Item | string,
    MemberNumber?: null | number | string,
    Update?: boolean,
): void;
declare function InventoryDoesItemAllowLock(item: Item): boolean;
declare const CurrentTime: number;
declare function CraftingValidate(
    Craft: null | CraftingItem,
    Asset?: Asset | null,
    Warn?: boolean,
): CraftingStatusType;
declare let TextScreenCache: TextCache | null;
declare function SkillGetWithRatio(SkillType: string): number;
declare const WheelFortuneCharacter: null | Character;
declare function InventoryWearCraft(Item: Item, Craft: CraftingItem): void;
declare function CharacterAppearanceSetItem(
    C: Character,
    Group: AssetGroupName,
    ItemAsset?: Asset,
    NewColor?: string | readonly string[],
    DifficultyFactor?: number,
    ItemMemberNumber?: number,
    Refresh?: boolean,
): void;
declare let CraftingSlotMax: number;
declare const ExtendedArchetype: {
	MODULAR: "modular",
	TYPED: "typed",
	VIBRATING: "vibrating",
	VARIABLEHEIGHT: "variableheight",
};
declare const TypedItemDataLookup: Record<string, TypedItemData>;
declare const ModularItemDataLookup: Record<string, ModularItemData>;
declare const VibratingItemDataLookup: Record<string, VibratingItemData>;
declare const VibratorModeOptions: {
    Standard: ExtendedItemOption[],
    Advanced: (ExtendedItemOption | {
        Name: string,
        Property: {
            Mode: VibratorMode,
            Intensity: number | (() => number),
            Effect: EffectName[] | ((Intensity: number) => EffectName[]),
        },
    })[]
};
declare function VibratorModeSetProperty(Item: Item, Property: any): void;
declare const VibratorModeOff: ExtendedItemOption;
declare function ModularItemParseCurrent(data: ModularItemData, type?: null | string): number[];
declare function ModularItemMergeModuleValues(
    data: ModularItemData,
    moduleValues: number[],
    BaselineProperty?: ItemProperties | null,
): ItemProperties;
declare const ItemVulvaFuturisticVibratorTriggers: string[];
declare function InventoryAllow(
    C: Character,
    asset: Asset,
    prerequisites?: string | string[],
    setDialog?: boolean,
): string;
declare function CommonCallFunctionByName(FunctionName: string, ...args: any): any;
declare function InventoryGroupIsBlocked(
    C: Character,
    GroupName?: AssetGroupName,
    Activity?: boolean,
): boolean;
declare const GameVersionFormat: RegExp;
declare function CharacterLoadCanvas(C: Character): void;
declare function InventoryItemHasEffect(Item: Item, Effect: EffectName, CheckProperties?: boolean): boolean;
declare const ServerAccountUpdate: AccountUpdater;
declare function ServerSend(Message: string, Data: object): void;
declare function CraftingLoadServer(Packet: string): void;
declare const CraftingStatusType: { OK: 2, ERROR: 1, CRITICAL_ERROR: 0 };
declare function CraftingDecompressServerData(Data: string | (null | CraftingItem)[]): (null | CraftingItem)[];
declare function CraftingSaveServer(): void;
declare function CharacterLoadSimple(AccName: string): Character;
declare function CharacterReleaseTotal(C: Character): void;
declare function DrawCharacter(C: Character, X: number, Y: number, Zoom: number, IsHeightResizeAllowed?: boolean, DrawCanvas?: boolean): void;
declare let WheelFortuneCustomizeBackground: "Sheet";
declare const Asset: readonly Asset[];
declare function ElementCreateInput(ID: string, Type: string, Value: string, MaxLength?: null | string | number): HTMLInputElement;
declare const DynamicDrawTextInputPattern: string;
declare const DynamicDrawTextRegex: RegExp;
declare function ElementCreateRangeInput(id: string, value: number, min: number, max: number, step: number, thumbIcon?: string, vertical?: boolean): HTMLInputElement;
declare function CommonLimitFunction<FT extends (...args: any) => any>(func: FT, minWait?: number, maxWait?: number): FT;
declare function DrawBackNextButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, BackText?:() => string, NextText?:() => string, Disabled?:boolean, ArrowWidth?: number): void;
declare function MouseIn(Left: number, Top: number, Width: number, Height: number): boolean;
declare let MouseX: number;
declare function DrawButton(Left: number, Top: number, Width: number, Height: number, Label: string, Color: string, Image?: string, HoveringText?: string, Disabled?: boolean): void;
declare function DrawCheckbox(Left: number, Top: number, Width: number, Height: number, Text: string, IsChecked: boolean, Disabled?: boolean, TextColor?: string, CheckImage?: string): void;
declare let MainCanvas: CanvasRenderingContext2D;
declare function DrawText(Text: string, X: number, Y: number, Color: string, BackColor?: string): void;
declare function CharacterDelete(NPCType: string): void;
declare function DialogLeave(): void;
declare function CommonSetScreen(NewModule: "Room" | "Character" | "Online" | "Cutscene" | "Minigame", NewScreen: string): void;
declare let WheelFortuneVelocity: number;
declare function WheelFortuneExit(): void;
declare function ElementRemove(ID: string): void;
declare let CurrentScreenFunctions: ScreenFunctions;
declare let CurrentScreen: string;
declare let ControllerActive: boolean;
declare function ClearButtons(): void;
declare const CommonGetFont: MemoizedFunction<() => void>;
declare const CommonGetFontName: MemoizedFunction<() => void>;
declare let CurrentDarkFactor: number;
declare function CommonMemoize(size: void): string;
declare function ChatRoomStimulationMessage(Action: StimulationAction): void;
declare function ElementPosition(ElementID: string, X: number, Y: number, W: number, H?: number): void;
declare let ItemDevicesLuckyWheelMinTexts: number;
declare let ItemDevicesLuckyWheelMaxTexts: number;
declare let ItemDevicesLuckyWheelMaxTextLength: number;
declare function InventoryRemove(C: Character, AssetGroup: AssetGroupName, Refresh?: boolean): void;
declare function ChatRoomCurrentTime(): string;
declare function ElementIsScrolledToEnd(ID: string): boolean;
declare function ElementScrollToEnd(ID: string): void;
declare function ServerAccountBeep(data: {
	MemberNumber?: number; /* undefined for NPCs */
	MemberName: string;
	ChatRoomName?: string;
	Private: boolean;
	ChatRoomSpace?: string;
	Message?: string;
}): void;
declare function LogQuery(QueryLogName: string, QueryLogGroup: string): boolean;
declare const ItemVulvaFuturisticVibratorAccessModes: readonly string[];
declare const VariableHeightDataLookup: Record<string, VariableHeightData>;
declare const LZString: import("lz-string").LZStringStatic;
declare function InventoryChatRoomAllow(Category: readonly string[]): boolean;
declare const AssetGroup: readonly AssetGroup[];
