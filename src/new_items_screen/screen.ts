import { assetVersion } from "bc-data";
import { inRange, omit } from "lodash-es";

import { keys, entries, fromEntries, LoopIterator, waitFor, logger } from "../common";
import { MBSScreen, ScreenProxy } from "../screen_abc";
import { bcLoaded } from "../common_bc";

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

/** Preview character while in the `MBS_NewItemsScreen` screen */
export let itemScreenDummy: Character;

/** Type representing a concatenation of a group and asset name */
type AssetKey = `${AssetGroupName}${string}`;

/** A record mapping asset names to actual assets for all assets added in {@link NEW_ASSETS_VERSION} */
const NEW_ASSETS: Record<AssetKey, Asset> = {};

/** A record mapping {@link Asset.BuyGroup} names to the (adjusted) cost of each asset plus a list of all minified assets */
const BUY_GROUPS: Record<string, { readonly money: number, readonly assets: ItemBundle[] }> = {};

waitFor(bcLoaded).then(() => {
    const result = GameVersionFormat.exec(GameVersion);
    if (result == null) {
        logger.error(`Invalid BC version: "${GameVersion}"`);
        return;
    }
    NEW_ASSETS_VERSION = Number.parseInt(result[1]);
    itemScreenDummy = CharacterLoadSimple("MBSNewItemsScreen");

    const buyGroups: Record<string, ({ money: number } & ItemBundle)[]> = {};
    for (const [groupName, assetRecord] of entries(assetVersion)) {
        for (const [assetName, version] of entries(assetRecord)) {
            if (version === `R${NEW_ASSETS_VERSION}`) {
                const asset = AssetGet("Female3DCG", groupName, assetName);
                if (asset == null) {
                    continue;
                }
                if (asset.Group.Name === asset.DynamicGroupName) {
                    NEW_ASSETS[`${asset.Group.Name}${asset.Name}`] = asset;
                }

                if (asset.BuyGroup) {
                    buyGroups[asset.BuyGroup] ??= [];
                    buyGroups[asset.BuyGroup].push({ Group: asset.Group.Name, Name: asset.Name, money: asset.Value });
                }
            }
        }
    }

    for (const [buyGroup, members] of entries(buyGroups)) {
        const allMoney = members.map(i => i.money);

        // Find the smallest >0 money value; fall back to -1 | 0 | >0 if it cannot be found
        let money = Math.min(...allMoney.filter(i => i > 0));
        if (!inRange(money, 1, Infinity)) {
            money = (money === 0) ? 0 : -1;
        }
        BUY_GROUPS[buyGroup] = { money, assets: members.map(i => omit(i, "money")) };
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

    /** Whether the shop or preview mode is active */
    mode: "buy" | "preview" = "preview";

    /** The preview character */
    readonly preview: Character;
    /** Default preview character appearance. Must only contain items belonging to the `Appearance` group. */
    readonly previewAppearanceDefault: readonly Item[];
    /** An iterator for switching between the clothing levels (Clothes, Underwear and Nude) */
    readonly clothes: LoopIterator<ClothesState>;
    /** The applied item (if any) while in `preview` mode */
    previousItem: null | Item;

    /**
     * A subset of all {@link NEW_ASSETS} keys + their {@link Asset.BuyGroup} members that the player already owns.
     * Note that due to inclusion of the asset's buygroup members there can be non-intersecting members w.r.t. {@link NEW_ASSETS}.
     */
    readonly inventory: Set<AssetKey>;
    /** Whether there is data that has to be pushed to the server when exiting the screen */
    push: boolean = false;

    constructor(parent: null | MBSScreen) {
        super(parent);
        this.preview = itemScreenDummy;
        this.previewAppearanceDefault = Player.Appearance.filter(i => i.Asset.Group.IsAppearance());
        this.previousItem = null;

        const inventorySet = new Set(Player.Inventory.map(({ Group, Name }): AssetKey => `${Group}${Name}`));
        this.inventory = new Set(keys(NEW_ASSETS).filter(k => inventorySet.has(k)));

        const assets = fromEntries(entries(NEW_ASSETS).filter(([_, asset]) => !ShopHideGenderedAsset(asset)));
        const assetUIElements = this.#generateAssetUIElements(assets);

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
        this.pageCount = Math.ceil(Object.keys(assetUIElements).length / MAX_ITEMS_PER_PAGE);

        let genderHeader: string;
        const hideShopItems = Player.GenderSettings.HideShopItems;
        if (hideShopItems.Male === hideShopItems.Female) {
            genderHeader = "";
        } else if (hideShopItems.Male) {
            genderHeader = " male-only";
        } else if (hideShopItems.Female) {
            genderHeader = " female-only";
        }

        this.elements = {
            DarkFactor: {
                coords: [0, 0, 2000, 1000],
                run: (...coords) => DrawRect(...coords, "rgba(0,0,0,0.5)"),
            },
            Header: {
                coords: [1000, 123, 975, 60],
                run: (...coords) => {
                    const prefix = this.mode === "preview" ? "Preview" : "Buy";
                    DrawTextWrap(
                        `${prefix} new${genderHeader} R${NEW_ASSETS_VERSION} items: Page ${1 + this.page}/${this.pageCount}`,
                        ...coords, "White", undefined, 1,
                    );
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
            Money: {
                coords: [1115, 25, 200, 90],
                run: (x, y, w, h) => {
                    if (this.mode === "buy") {
                        DrawButton(x, y, w, h, "", "White", undefined, "Player money", true);
                        DrawTextFit(`$ ${Player.Money}`, x + (w / 2), y + (h / 2), w * 0.9, Player.Money <= 0 ? "Red" : "Black");
                    }
                },
            },
            BuyMode: {
                coords: [1335, 25, 90, 90],
                run: (...coords) => {
                    switch (this.mode) {
                        case "buy":
                            DrawButton(...coords, "", "Lime", "Icons/Shop.png", "Mode: Shop", true);
                            break;
                        case "preview":
                            DrawButton(...coords, "", "White", "Icons/Shop.png", "Mode: Preview", true);
                            break;
                    }
                },
                click: () => {
                    this.mode = this.mode === "buy" ? "preview" : "buy";
                },
            },
            ExtendedItem: {
                coords: [1445, 25, 90, 90],
                run: (...coords) => {
                    const asset = this.previousItem?.Asset;
                    if (!asset || !asset.Archetype || asset.IsLock || this.mode !== "preview") {
                        DrawButton(...coords, "", "Gray", "Icons/Use.png", "Use item", true);
                    } else {
                        DrawButton(...coords, "", "White", "Icons/Use.png", "Use item");
                    }
                },
                click: () => {
                    const asset = this.previousItem?.Asset;
                    if (!asset || !asset.Archetype || asset.IsLock || this.mode !== "preview") {
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
                    }
                    CharacterRefresh(this.preview, false, false);
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
            ...assetUIElements,
        };
    }

    /** Generate a `run` function for a particular asset. */
    #generateUIElementRun(assetID: AssetKey, asset: Asset): UIElement["run"] {
        const buyGroups = BUY_GROUPS[asset.BuyGroup as string] ?? { money: asset.Value, assets: [{ group: asset.Group.Name, name: asset.Name }] };
        const money = inRange(buyGroups.money, -1, Infinity) ? buyGroups.money : 0;
        return (x, y, w, h) => {
            const options: PreviewDrawOptions = { Width: w, Height: h };
            const hover = MouseIn(x, y, w, h) && !CommonIsMobile;
            switch (this.mode) {
                case "preview": {
                    const item = this.previousItem;
                    if (hover) {
                        options.Background = "cyan";
                    } else if (item && `${item.Asset.Group.Name}${item.Asset.Name}` === assetID) {
                        options.Background = "gray";
                    } else {
                        options.Background = "white";
                    }
                    DrawItemPreview({ Asset: asset }, this.preview, x, y, options);
                    break;
                }
                case "buy": {
                    let label: string;
                    if (this.inventory.has(assetID)) {
                        options.Background = "gray";
                        options.Hover = false;
                        label = "Sold";
                    } else if (money <= 0) {
                        options.Background = "gray";
                        options.Hover = false;
                        label = "N.A.";
                    } else if (money > Player.Money) {
                        options.Background = "gray";
                        options.Hover = false;
                        label = `$${money}`;
                    } else if (hover) {
                        options.Background = "cyan";
                        label = `$${money}`;
                    } else {
                        options.Background = "white";
                        label = `$${money}`;
                    }

                    DrawItemPreview({ Asset: asset }, this.preview, x, y, options);

                    // Draw a ribbon (i.e. triangle with the tip removed)
                    const triangle = 85;
                    const tip = 30;
                    MainCanvas.beginPath();
                    MainCanvas.fillStyle = "Red";
                    MainCanvas.moveTo(x + w - triangle, y);
                    MainCanvas.lineTo(x + w - tip, y);
                    MainCanvas.lineTo(x + w, y + tip);
                    MainCanvas.lineTo(x + w, y + triangle);
                    MainCanvas.closePath();
                    MainCanvas.fill();
                    MainCanvas.strokeStyle = "Black";
                    MainCanvas.lineWidth = 1;
                    MainCanvas.stroke();

                    // Draw 45 degree rotated text inside the triangle
                    const textX = x + w - 30;
                    const textY = y + 30;
                    MainCanvas.save();
                    MainCanvas.translate(textX, textY);
                    MainCanvas.rotate(Math.PI / 4);
                    MainCanvas.translate(-textX, -textY);
                    DrawTextFit(label, textX, textY, triangle * 0.8, "White");
                    MainCanvas.restore();
                    break;
                }
            }
        };
    }

    /** Generate a `click` function for a particular asset. */
    #generateUIElementClick(assetID: AssetKey, asset: Asset): UIElement["click"] {
        const buyGroups = BUY_GROUPS[asset.BuyGroup as string] ?? { money: asset.Value, assets: [{ group: asset.Group.Name, name: asset.Name }] };
        const money = inRange(buyGroups.money, -1, Infinity) ? buyGroups.money : 0;
        return () => {
            switch (this.mode) {
                case "preview": {
                    const prevItem = this.previousItem;
                    this.clothes.value.callback(this.preview, this.previewAppearanceDefault);
                    if (prevItem && `${prevItem.Asset.Group.Name}${prevItem.Asset.Name}` === assetID) {
                        this.previousItem = null;
                        CharacterRefresh(this.preview, false, false);
                    } else {
                        this.previousItem = CharacterAppearanceSetItem(this.preview, asset.Group.Name, asset, [...asset.DefaultColor]) ?? null;
                    }
                    break;
                }
                case "buy": {
                    if (this.inventory.has(assetID) || money <= 0 || money > Player.Money) {
                        return;
                    }

                    this.push = true;
                    for (const { Group, Name } of buyGroups.assets) {
                        InventoryAdd(Player, Name, Group, false);
                        this.inventory.add(`${Group}${Name}`);
                    }
                    Player.Money -= money;
                    break;
                }
            }
        };
    }

    /** Generate UI callbacks for the passed assets. */
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
                    run: this.#generateUIElementRun(assetID, asset),
                    click: this.#generateUIElementClick(assetID, asset),
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

        if (!inRange(Player.Money, 0, Infinity)) {
            Player.Money = 0;
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

        if (this.push) {
            ServerPlayerInventorySync();
            ServerPlayerSync();
        }

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
