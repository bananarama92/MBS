interface AssetGroupDefinition {
    Asset: (AssetDefinition | string)[];
    Group: AssetGroupName;
    ParentGroup?: string;
    Category?: "Appearance" | "Item" | "Script";
    /** Whether the group should have an asset selected at random at character creation. */
    Default?: boolean;
    IsRestraint?: boolean;
    /** Whether the group is allowed to have no asset. Used for body-related characteristics. */
    AllowNone?: boolean;
    AllowColorize?: boolean;
    AllowCustomize?: boolean;
    /** @see {AssetDefinition.Random} */
    Random?: boolean;
    Color?: string[];
    ParentSize?: string;
    ParentColor?: string;
    Clothing?: boolean;
    Underwear?: boolean;
    BodyCosplay?: boolean;
    Hide?: AssetGroupName[];
    Block?: AssetGroupItemName[];
    Zone?: [number, number, number, number][];
    SetPose?: string[];
    AllowPose?: string[];
    AllowExpression?: string[];
    Effect?: EffectName[];
    MirrorGroup?: string;
    RemoveItemOnRemove?: { Group: string, Name: string, Type?: string }[];
    Priority?: number;
    Left?: number;
    Top?: number;
    FullAlpha?: boolean;
    Blink?: boolean;
    InheritColor?: string;
    FreezeActivePose?: string[];
    PreviewZone?: [number, number, number, number];
    DynamicGroupName?: AssetGroupName;
    MirrorActivitiesFrom?: string;
    ColorSuffix?: Record<string, string>;
    ExpressionPrerequisite?: string[];
}

type AssetBonusName = "KidnapDomination" | "KidnapSneakiness" | "KidnapBruteForce";

interface AssetDefinition {
    /** The asset's internal name. */
    Name: string,

    /**
     * Link an asset to another.
     *
     * Used for the random appearance generator, to ensure combined assets match.
     * Eyes, as well as the student tops and bottoms make use of it.
     */
    ParentItem?: string;

    /** The group the asset belongs to. Mainly useful to inherit the body size. */
    ParentGroup?: string | null;

    /**
     * Whether the asset is enabled or not. Defaults to true.
     *
     * A disabled asset cannot be used on a character.
     * They will also never be used as part of a random appearance.
     */
    Enable?: boolean;

    /** Whether the asset appears visually. Defaults to true. */
    Visible?: boolean;

    /** Whether the asset can be worn. Defaults to true. An unwearable asset will not actually end up in the group it's used on. */
    Wear?: boolean;

    /** Applying that asset triggers the following activity */
    Activity?: string;

    /** Activities that wearing this asset enables. */
    AllowActivity?: string[];

    /** Array of sound effects for each one of the item's allowed activities */
    ActivityAudio?: string[];

    /** The expression on the targeted character */
    ActivityExpression?: Record<string, ExpressionTrigger[]>;

    /** A list of groups that should still be allowed to be acted on even though they should be blocked by the asset. */
    AllowActivityOn?: AssetGroupName[];

    /** Identifies a set of assets that's part of the same group for shopping purposes. Buying one will give access to all of them. */
    BuyGroup?: string;

    /** Identifies a BuyGroup that, we bought one item of, will cause that asset to also be owned, without showing it in the shopping list. Only used by the SpankingToys */
    PrerequisiteBuyGroups?: string[];

    /** The list of effects wearing the asset causes on the character */
    Effect?: EffectName[];

    /** Whether wearing the asset gives a bonus in the Kidnap minigame. */
    Bonus?: AssetBonusName;

    /** A list of group names the asset blocks access to. */
    Block?: AssetGroupItemName[];

    /**
     * A list of group names the asset restores access to.
     *
     * Mostly used for clothes, and might be considered a duplicate of AllowActivityOn.
     */
    Expose?: AssetGroupItemName[];

    /** A list of group names that get hidden when the asset is worn. */
    Hide?: AssetGroupName[];

    /** A list of asset names that get hidden when the asset is worn. */
    HideItem?: string[];

    /** A list of asset names that get shown when the asset is worn. Only useful when combined with Hide */
    HideItemExclude?: string[];

    /**
     * A list of body group that becomes required when this asset is worn.
     *
     * Used by the random appearance generator to know that it should also pick a random asset
     * from the required group when that asset is used.
     */
    Require?: AssetGroupBodyName[];

    /** A pose that the character should change to when wearing the asset. */
    SetPose?: AssetPoseName[];

    /**
     * The poses actually that the asset supports.
     *
     * Used when building the file paths for the asset's layers.
     */
    AllowPose?: AssetPoseName[];

    /** A list of poses that hide the asset when they get set. */
    HideForPose?: AssetPoseName[];

    /**
     * A mapping of poses for the purpose of fallbacks.
     *
     * If the current pose appears in the mapping, it will result in the mapped pose name
     * being used when generating the file paths for the asset's layers.
     *
     * Works like DynamicGroupName, but for poses.
     */
    PoseMapping?: { [index: string]: string};

    /** A list of poses that wearing the asset also enables. */
    AllowActivePose?: AssetPoseName[];

    WhitelistActivePose?: AssetPoseName[];

    /**
     * The cost of the asset in the shop. Defaults to 0.
     *
     * A value of -1 makes the asset unavailable, a value of 0 makes it always available.
     */
    Value?: number;

    /** A measure of how hard it is to remove the asset. Defaults to 0. */
    Difficulty?: number;

    SelfBondage?: number;
    SelfUnlock?: boolean;
    ExclusiveUnlock?: boolean;

    /** Whether the asset can be selected for a random appearance. Defaults to true. */
    Random?: boolean;

    /** Whether the asset gets removed automatically when the character log in. Defaults to false. */
    RemoveAtLogin?: boolean;

    Time?: number;
    LayerVisibility?: boolean;
    RemoveTime?: number;
    RemoveTimer?: number;
    MaxTimer?: number;

    /** The drawing priority of the asset. Defaults to the asset's group priority. */
    Priority?: number;
    Left?: number;
    Top?: number;
    Height?: number;
    Zoom?: number;
    Alpha?: AlphaDefinition[];
    Prerequisite?: string | string[];
    Extended?: boolean;
    AlwaysExtend?: boolean;
    AlwaysInteract?: boolean;
    AllowLock?: boolean;
    IsLock?: boolean;
    PickDifficulty?: number | null;

    /** Whether the asset is only available to owners. */
    OwnerOnly?: boolean;

    /** Whether the asset is only available to lovers. */
    LoverOnly?: boolean;

    /** A list of facial expression using the asset causes to the character */
    ExpressionTrigger?: { Name: string, Group: string, Timer: number }[];

    /** A list of assets to also remove when the asset is taken off. */
    RemoveItemOnRemove?: { Name: string, Group: AssetGroupItemName, Type?: string }[];

    AllowEffect?: EffectName[];
    AllowBlock?: AssetGroupItemName[];
    AllowHide?: AssetGroupItemName[];
    AllowHideItem?: string[];
    AllowType?: string[];
    DefaultColor?: ItemColor;
    Opacity?: number;
    MinOpacity?: number;
    MaxOpacity?: number;
    Audio?: string;

    /** A list of categories. Used to prevent the asset to be used, per chatroom settings */
    Category?: string[];

    Fetish?: string[];
    ArousalZone?: string;
    IsRestraint?: boolean;
    BodyCosplay?: boolean;
    OverrideBlinking?: boolean;
    DialogSortOverride?: DialogSortOrder;
    DynamicDescription?: (C: Character) => string;
    DynamicPreviewImage?: (C: Character) => string;
    DynamicAllowInventoryAdd?: (C: Character) => boolean;
    DynamicName?: (C: Character) => string;

    /** The real group name used when building the file paths for the asset's layers */
    DynamicGroupName?: AssetGroupName;

    DynamicActivity?: (C: Character) => string | null | undefined;
    DynamicAudio?: (C: Character) => string;

    /**
     * Whether the asset is restricted to a given character.
     *
     * When the asset is added to a character, the member number of the character using the
     * asset will be stored along in its properties, and all subsequent modifications will
     * only be possible for that character.
     */
    CharacterRestricted?: boolean;
    AllowRemoveExclusive?: boolean;

    /** The group the asset should inherit its color from. */
    InheritColor?: AssetGroupName;

    DynamicBeforeDraw?: boolean;
    DynamicAfterDraw?: boolean;
    DynamicScriptDraw?: boolean;
    HasType?: boolean;
    AllowLockType?: AssetLockType[];

    /** Whether that asset is drawn colorized, or uses the color name in its file asset */
    AllowColorize?: boolean;

    /** Whether the color picker shows a "Whole Item" layer. Defaults to true. */
    AllowColorizeAll?: boolean;

    /** A list of online spaces (eg. Asylum) where the asset is automatically available */
    AvailableLocations?: string[];

    OverrideHeight?: AssetOverrideHeight;
    FreezeActivePose?: string[];

    /** Whether the game should auto-add a Lock layer to the asset. */
    DrawLocks?: boolean;

    AllowExpression?: string[];
    MirrorExpression?: string;

    /** Whether the asset is drawn at an absolute position. */
    FixedPosition?: boolean;

    CustomBlindBackground?: string;

    /** The list of layers for the asset. */
    Layer?: AssetLayerDefinition[];

    Archetype?: string;
    FuturisticRecolor?: boolean;
    FuturisticRecolorDisplay?: boolean;

    /** A list of attributes the asset has */
    Attribute?: AssetAttribute[];

    /** A list of attributes that causes this one to become hidden. */
    HideItemAttribute?: AssetAttribute[];

    /**
     * A list of icons the asset preview should show.
     * Only used by the handheld items, as the game handles the other icons automatically.
     */
    PreviewIcons?: InventoryIcon[];

    Tint?: TintDefinition[];
    DefaultTint?: string;
    Gender?: "F" | "M";

    /**
     * An identifier that marks the asset as being the same for the purpose of crafting.
     *
     * Do note that this expects all the assets in the craft group to have compatible layers, color-wise and type-wise.
     */
    CraftGroup?: string;

    /** A list of prerequisite checks that must pass for the group's expressions to be selectable */
    ExpressionPrerequisite?: string[];

    /** A record with the maximum length for each text-based properties with an input field. */
    TextMaxLength?: null | Partial<Record<PropertyTextNames, number>>;

    /**
     * The font used for dynamically drawing text.
     * Requires {@link AssetDefinition.DynamicAfterDraw} to be set.
     */
    TextFont?: null | string;
}

interface AssetLayerDefinition {
    /** The layer's name */
    Name: string;

    /** Whether that layer is drawn colorized, or uses the color as part of its image file name */
    AllowColorize?: boolean;

    /** Uses the color of the named layer. */
    CopyLayerColor?: string;

    /** The color group that layer is part of. Layers part of the same color group get a selector in the Color Picker UI */
    ColorGroup?: string;

    /** Whether the layer shows up in the Color Picker UI. Defaults to true. */
    HideColoring?: boolean;
    AllowTypes?: string[];
    HasType?: boolean;
    Visibility?: string;

    /** The group the layer belongs to. Mainly useful to inherit the body's size. */
    ParentGroup?: string | null,

    /** A list of poses that layer supports. */
    AllowPose?: string[];

    /** The drawing priority for that layer. Defaults to the asset's priority. */
    Priority?: number;

    /** The name of the group to inherit the color from. */
    InheritColor?: AssetGroupName;

    Alpha?: AlphaDefinition[],
    Left?: number;
    Top?: number;
    HideAs?: { Group: AssetGroupName, Asset?: string };

    /** Whether the layer will be drawn at a fixed position. */
    FixedPosition?: boolean;

    /** Whether the layer uses an image. Defaults to true. */
    HasImage?: boolean;

    Opacity?: number;
    MinOpacity?: number;
    MaxOpacity?: number;

    /** Specify that this is (one of) the asset's lock layer. See DrawsLock at the asset level. */
    LockLayer?: boolean;

    MirrorExpression?: string;
    HideForPose?: string[];
    PoseMapping?: { [index: string]: string };
    AllowModuleTypes?: string[];
    ModuleType?: string[];
    /* Specifies that this layer should not be drawn if the character is wearing any item with the given attributes */
    HideForAttribute?: AssetAttribute[];
    /* Specifies that this layer should not be drawn unless the character is wearing an item with one of the given attributes */
    ShowForAttribute?: AssetAttribute[];
}
