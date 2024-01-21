import { assetVersion } from "bc-data";

import { entries, fromEntries, LoopIterator, waitFor, logger } from "../common";
import { MBSScreen, ScreenProxy } from "../screen_abc";

/**
 * Adapted from {@link CommonGenerateGridParameters}.
 * Returns *all* grid coordinates rather than directly operating on a callback.
 */
function generateGrid(
    nItems: number,
    grid: CommonGenerateGridParameters,
    itemsPerPage: number,
): RectTuple[] {
    // Calculate horizontal & vertical margins
    const itemCountX = Math.floor(grid.width / grid.itemWidth);
    const marginX = (grid.width - (itemCountX * grid.itemWidth)) / (itemCountX - 1);
    const itemCountY = Math.floor(grid.height / grid.itemHeight);
    const marginY = (grid.height - (itemCountY * grid.itemHeight)) / (itemCountY - 1);

    let i: number;
    let x = grid.x;
    let y = grid.y;
    const ret: RectTuple[] = [];
    for (i = 0; i < nItems; i++) {
        if ((i % itemsPerPage) === 0) {
            x = grid.x;
            y = grid.y;
        }

        ret.push([x, y, grid.itemWidth, grid.itemHeight]);
        x += grid.itemWidth + marginX;
        if (x - grid.x >= grid.width) {
            x = grid.x;
            y += grid.itemHeight + marginY;
        }
    }
    return ret;
}

/** The maximum number of new items to-be displayed per page */
const MAX_ITEMS_PER_PAGE = 12;

interface ClothesState {
    /** The name of the state */
    readonly name: "Clothes" | "Underwear" | "Cosplay" | "Nude",
    /** A callback for equipping all state-appropriate items */
    readonly callback: (character: Character, items: readonly Item[]) => void,
}

/** The BC version (well, its numerical part) for which new items should be displayed */
export let NEW_ASSETS_VERSION: number;

export let itemScreenDummy: Character;

type AssetKey = `${AssetGroupName}${string}`;

/** A record mapping asset names to actual assets for all assets added in {@link NEW_ASSETS_VERSION} */
const NEW_ASSETS: Record<AssetKey, Asset> = {};
waitFor(() => typeof MainCanvas !== "undefined").then(() => {
    const result = GameVersionFormat.exec(GameVersion);
    if (result == null) {
        logger.error(`Invalid BC version: "${GameVersion}"`);
        return;
    }
    NEW_ASSETS_VERSION = Number.parseInt(result[1]);
    itemScreenDummy = CharacterLoadSimple("MBSNewItemsScreen");

    for (const [groupName, assetRecord] of entries(assetVersion)) {
        for (const [assetName, version] of entries(assetRecord)) {
            if (version === `R${NEW_ASSETS_VERSION}`) {
                const asset = AssetGet("Female3DCG", groupName, assetName);
                if (asset == null || asset.Group.Name !== asset.DynamicGroupName) {
                    continue;
                }
                NEW_ASSETS[`${asset.Group.Name}${asset.Name}`] = asset;
            }
        }
    }
});

export class NewItemsScreen extends MBSScreen {
    static readonly background = "MainHall";
    static readonly screen = "MBS_NewItemsScreen";
    readonly screen = NewItemsScreen.screen;

    /** A record containing element names mapped to a set of UI functions */
    readonly elements: Readonly<Record<string, UIElement>>;
    /** The number of pages required for all {@link NEW_ASSETS} */
    readonly pageCount: number;
    /** The current page */
    page: number;

    /** The preview character */
    readonly preview: Character;
    /** Default preview character appearance. Must only contain items belonging to the `Appearance` group. */
    readonly previewAppearanceDefault: readonly Item[];
    /** An iterator for switching between the clothing levels (Clothes, Underwear and Nude) */
    clothes: LoopIterator<ClothesState>;
    /** A record containing the name of the previously equipped set of new items (if any) and a list of the actual item objects */
    previousItem: null | Item;

    constructor(parent: null | MBSScreen) {
        super(parent);
        this.preview = itemScreenDummy;
        this.previewAppearanceDefault = Player.Appearance.filter(i => i.Asset.Group.IsAppearance());
        this.previousItem = null;
        const newAssets = this.#generateAssetUIElements(NEW_ASSETS);

        this.clothes = new LoopIterator([
            {
                name: "Clothes",
                callback: (character, items) => {
                    character.Appearance = [...items];
                },
            },
            {
                name: "Underwear",
                callback: (character, items) => {
                    character.Appearance = items.filter(i => !i.Asset.Group.AllowNone || i.Asset.BodyCosplay || i.Asset.Group.Underwear);
                },
            },
            {
                name: "Cosplay",
                callback: (character, items) => {
                    character.Appearance = items.filter(i => !i.Asset.Group.AllowNone || i.Asset.BodyCosplay);
                },
            },
            {
                name: "Nude",
                callback: (character, items) => {
                    character.Appearance = items.filter(i => !i.Asset.Group.AllowNone);
                },
            },
        ]);
        this.page = 0;
        this.pageCount = Math.ceil(Object.keys(newAssets).length / MAX_ITEMS_PER_PAGE);

        this.elements = {
            DarkFactor: {
                coords: [0, 0, 2000, 1000],
                run: (...coords) => DrawRect(...coords, "rgba(0,0,0,0.5)"),
            },
            Header: {
                coords: [1000, 123, 975, 60],
                run: (...coords) => {
                    DrawTextWrap(`New R${NEW_ASSETS_VERSION} items`, ...coords, "White", undefined, 1);
                },
            },
            Character: {
                coords: [500, 0, 0, 0],
                load: () => {
                    this.preview.Appearance = [...this.previewAppearanceDefault];
                    CharacterRefresh(this.preview, false, false);
                },
                run: (x, y) => DrawCharacter(this.preview, x, y, 1),
                exit: () => CharacterDelete(this.preview.AccountName),
            },
            ExtendedItem: {
                coords: [1445, 25, 90, 90],
                run: (...coords) => {
                    const asset = this.previousItem?.Asset;
                    if (!asset || !asset.Archetype || asset.IsLock) {
                        DrawButton(...coords, "", "Gray", "Icons/Use.png", "Use Item", true);
                    } else {
                        DrawButton(...coords, "", "White", "Icons/Use.png", "Use Item");
                    }
                },
                click: () => {
                    const asset = this.previousItem?.Asset;
                    if (!asset || !asset.Archetype || asset.IsLock) {
                        return;
                    }
                    DialogExtendItem(this.previousItem as Item);
                },
            },
            PagePrev: {
                coords: [1555, 25, 90, 90],
                run: (...coords) => {
                    if (this.pageCount > 1) {
                        DrawButton(...coords, "", "White", "Icons/Prev.png", "View previous items");
                    } else {
                        DrawButton(...coords, "", "Gray", "Icons/Prev.png", "View previous items", true);
                    }
                },
                click: () => {
                    if (this.pageCount > 1) {
                        this.page = (this.page - 1) % this.pageCount;
                    }
                },
            },
            Clothes: {
                coords: [1665, 25, 90, 90],
                run: (...coords) => {
                    DrawButton(...coords, "", "white", "Icons/Dress.png", this.clothes.value.name);
                },
                click: () => {
                    const { callback } = this.clothes.next();
                    callback(this.preview, this.previewAppearanceDefault);
                    if (this.previousItem !== null) {
                        const item = CharacterAppearanceSetItem(
                            this.preview,
                            this.previousItem.Asset.Group.Name,
                            this.previousItem.Asset,
                            this.previousItem.Color,
                            undefined,
                            undefined,
                            false,
                        );
                        if (item) {
                            item.Property = this.previousItem.Property;
                        }
                        this.previousItem = item ?? null;
                        CharacterRefresh(this.preview, false, false);
                    }
                },
            },
            PageNext: {
                coords: [1775, 25, 90, 90],
                run: (...coords) => {
                    if (this.pageCount > 1) {
                        DrawButton(...coords, "", "White", "Icons/Next.png", "View next items");
                    } else {
                        DrawButton(...coords, "", "Gray", "Icons/Next.png", "View next items", true);
                    }
                },
                click: () => {
                    if (this.pageCount > 1) {
                        this.page = (this.page + 1) % this.pageCount;
                    }
                },
            },
            Exit: {
                coords: [1885, 25, 90, 90],
                run: (...coords) => DrawButton(...coords, "", "White", "Icons/Exit.png", "Exit"),
                click: () => this.exit(),
            },
            ...newAssets,
        };
    }

    #generateAssetUIElements(assetRecord: Record<AssetKey, Asset>): Record<string, UIElement> {
        const coords = generateGrid(
            Object.keys(assetRecord).length,
            { ...DialogInventoryGrid, y: 10 + DialogInventoryGrid.y },
            MAX_ITEMS_PER_PAGE,
        );
        return fromEntries(entries(assetRecord).map(([assetID, asset], i) => {
            return [
                assetID,
                {
                    page: Math.floor(i / MAX_ITEMS_PER_PAGE),
                    coords: coords[i],
                    run: (x, y, w, h) => {
                        const item = this.previousItem;
                        const hover = MouseIn(x, y, w, h) && !CommonIsMobile;
                        let background = "white";
                        if (hover) {
                            background = "cyan";
                        } else if (item && `${item.Asset.Group.Name}${item.Asset.Name}` === assetID) {
                            background = "gray";
                        }
                        DrawItemPreview({ Asset: asset }, this.preview, x, y, { Background: background, Width: w, Height: h });
                    },
                    click: () => {
                        const prevItem = this.previousItem;
                        this.preview.Appearance = [...this.previewAppearanceDefault];
                        this.clothes.value.callback(this.preview, Player.Appearance);
                        if (prevItem && `${prevItem.Asset.Group.Name}${prevItem.Asset.Name}` === assetID) {
                            this.previousItem = null;
                        } else {
                            this.previousItem = CharacterAppearanceSetItem(this.preview, asset.Group.Name, asset, [...asset.DefaultColor]) ?? null;
                        }
                    },
                },
            ];
        }));
    }

    load() {
        const customBackground = (
            ServerPlayerIsInChatRoom()
            || (CurrentScreen === "MBSPreferenceScreen" && InformationSheetPreviousScreen === "ChatRoom")
        ) ? ChatRoomData?.Background : undefined;

        super.load();
        Object.values(this.elements).forEach((e) => e.load?.());

        if (customBackground != undefined) {
            const w = <typeof globalThis & Record<string, string>>globalThis;
            w[`${NewItemsScreen.screen}Background`] = customBackground;
        }
    }

    click(event: MouseEvent | TouchEvent) {
        if (DialogFocusItem && DialogMenuMode === "extended") {
            CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Click`);
            return;
        }

        return Object.values(this.elements).some((e) => {
            if (e.click && (e.page ?? this.page) === this.page && MouseIn(...e.coords)) {
                e.click(event);
                return true;
            } else {
                return false;
            }
        });
    }

    run() {
        if (DialogFocusItem && DialogMenuMode === "extended") {
            this.elements.DarkFactor.run?.(...this.elements.DarkFactor.coords);
            this.elements.Exit.run?.(...this.elements.Exit.coords);
            this.elements.Character.run?.(...this.elements.Character.coords);
            CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Draw`);
            return;
        }

        Object.values(this.elements).forEach((e) => {
            if ((e.page ?? this.page) === this.page) {
                e.run(...e.coords);
            }
        });
    }

    exit() {
        Object.values(this.elements).forEach((e) => e.exit?.());
        const w = <typeof globalThis & Record<string, string>>globalThis;
        w[`${NewItemsScreen.screen}Background`] = NewItemsScreen.background;
        this.exitScreens(false);
    }
}

export class MainHallProxy extends ScreenProxy {
    static readonly screen = "MainHall";
    readonly screen = MainHallProxy.screen;

    constructor() {
        super(
            null,
            "MainHall",
            "Room",
            {
                Run: MainHallRun,
                Click: MainHallClick,
                Load: () => CommonSetScreen("Room", "MainHall"),
            },
        );
    }
}
