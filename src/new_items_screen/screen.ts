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
    readonly name: "Clothes" | "Underwear" | "Nude",
    /** A callback for equipping all state-appropriate items */
    readonly callback: (C: Character, appearance: Item[]) => void,
}

/** The BC version (well, its numerical part) for which new items should be displayed */
export let NEW_ASSETS_VERSION: number;

/** A record mapping asset names to actual assets for all assets added in {@link NEW_ASSETS_VERSION} */
const NEW_ASSETS: Record<string, Asset[]> = {};
waitFor(() => typeof MainCanvas !== "undefined").then(() => {
    const result = GameVersionFormat.exec(GameVersion);
    if (result == null) {
        logger.error(`Invalid BC version: "${GameVersion}"`);
        return;
    }
    NEW_ASSETS_VERSION = Number.parseInt(result[1]);

    for (const [groupName, assetRecord] of entries(assetVersion)) {
        for (const [assetName, version] of entries(assetRecord)) {
            if (version === `R${NEW_ASSETS_VERSION}`) {
                const asset = AssetGet("Female3DCG", groupName, assetName);
                if (asset == null) {
                    continue;
                }
                NEW_ASSETS[assetName] ??= [];
                NEW_ASSETS[assetName].push(asset);
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
    /** Default preview character appaerance */
    readonly previewAppearanceDefault: Item[];
    /** An iterator for switching between the clothing levels (Clothes, Underwear and Nude) */
    clothes: LoopIterator<ClothesState>;
    /** A record containing the name of the previously equipped set of new items (if any) and a list of the actual item objects */
    previousItems: { name: null | string, items: readonly Item[] };

    constructor(parent: null | MBSScreen) {
        super(parent);
        this.preview = CharacterLoadSimple("MBSNewItemsScreen");
        this.previewAppearanceDefault = Player.Appearance.filter(i => i.Asset.Group.IsAppearance());
        this.previousItems = { name: null, items: [] };
        const newAssets = this.#generateAssetUIElements(NEW_ASSETS);

        this.clothes = new LoopIterator([
            { name: "Clothes", callback: CharacterDress },
            { name: "Underwear", callback: CharacterUnderwear },
            { name: "Nude", callback: CharacterAppearanceNaked },
        ]);
        this.page = 0;
        this.pageCount = Math.ceil(Object.keys(newAssets).length / MAX_ITEMS_PER_PAGE);

        this.elements = {
            DarkFactor: {
                coords: [0, 0, 2000, 1000],
                run: (...coords) => DrawRect(...coords, "rgba(0,0,0,0.5)"),
            },
            Header: {
                coords: [1000, 113, 975, 60],
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
            PagePrev: {
                coords: [1555, 15, 90, 90],
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
                coords: [1665, 15, 90, 90],
                run: (...coords) => {
                    DrawButton(...coords, "", "white", "Icons/Dress.png", this.clothes.value.name);
                },
                click: () => {
                    const { callback } = this.clothes.next();
                    this.preview.Appearance = [...this.previewAppearanceDefault];
                    callback(this.preview, this.previewAppearanceDefault);
                    if (this.previousItems.name !== null) {
                        this.previousItems.items = this.previousItems.items.map(i => {
                            return CharacterAppearanceSetItem(this.preview, i.Asset.Group.Name, i.Asset, i.Color, undefined, undefined, false);
                        }).filter((i): i is Item => i != null);
                        CharacterRefresh(this.preview, false, false);
                    }
                },
            },
            PageNext: {
                coords: [1775, 15, 90, 90],
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
                coords: [1885, 15, 90, 90],
                run: (...coords) => DrawButton(...coords, "", "White", "Icons/Exit.png", "Exit"),
                click: () => this.exit(),
            },
            ...newAssets,
        };
    }

    #generateAssetUIElements(assetRecord: Record<string, Asset[]>): Record<string, UIElement> {
        const coords = generateGrid(Object.keys(assetRecord).length, DialogInventoryGrid, MAX_ITEMS_PER_PAGE);
        return fromEntries(entries(assetRecord).map(([assetName, assets], i): [string, UIElement] => {
            return [
                assetName,
                {
                    page: Math.floor(i / MAX_ITEMS_PER_PAGE),
                    coords: coords[i],
                    run: (x, y, w, h) => {
                        const asset = assets[0];
                        const hover = MouseIn(x, y, w, h) && !CommonIsMobile;
                        let background = "white";
                        if (hover) {
                            background = "cyan";
                        } else if (this.previousItems.name === assetName) {
                            background = "gray";
                        }
                        DrawItemPreview({ Asset: asset }, this.preview, x, y, { Background: background, Width: w, Height: h });
                    },
                    click: () => {
                        this.preview.Appearance = [...this.previewAppearanceDefault];
                        this.clothes.value.callback(this.preview, Player.Appearance);
                        if (this.previousItems.name !== assetName) {
                            this.previousItems = {
                                name: assetName,
                                items: assets.map(a => CharacterAppearanceSetItem(this.preview, a.Group.Name, a, [...a.DefaultColor], undefined, undefined, false)).filter((i): i is Item => i != null),
                            };
                        } else {
                            this.previousItems = { name: null, items: [] };
                        }
                        CharacterRefresh(this.preview, false, false);
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
