import { assetVersion } from "bc-data";

import { MBS_MOD_API, waitFor, logger, entries } from "../common";
import { bcLoaded } from "../common_bc";

/** Type representing a concatenation of a group and asset name */
type AssetKey = `${AssetGroupName}${string}`;

/** The BC version (well, its numerical part) for which new items should be displayed */
let NEW_ASSETS_VERSION: number;

/** A record mapping asset names to actual assets for all assets added in {@link NEW_ASSETS_VERSION} */
const NEW_ASSETS: Record<AssetKey, Asset> = {};

waitFor(bcLoaded).then(() => {
    logger.log("Initializing new item screen hooks");

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
                if (asset.Group.Name === asset.DynamicGroupName) {
                    NEW_ASSETS[`${asset.Group.Name}${asset.Name}`] = asset;
                }
            }
        }
    }

    const shop2Vars = <typeof Shop2Vars & { readonly MBS_ShowAllVersions: boolean }>Shop2Vars;

    Object.defineProperty(Shop2Vars, "MBS_ShowAllVersions", {
        get() {
            return !("MBS_VersionFilter" in Shop2Vars.Filters);
        },
    });

    Shop2.Elements.MBS_VersionHeader = {
        Coords: [345, 155 + (185 - 25), 0, 0],
        Mode: new Set(["Preview", "Buy", "Sell"]),
        // R103
        Run: (time: number, x?: number, y?: number) => {
            // @ts-expect-error
            DrawText("Filter by BC version", x as number, y as number, Shop2Vars.DisplayDropdown ? "Gray" : "White");
        },
        // R104
        Draw: (x: number, y: number) => {
            DrawText("Filter by BC version", x as number, y as number, Shop2Vars.DropdownState !== "Group" ? "Gray" : "White");
        },
    };

    Shop2.Elements.MBS_ShowCurrentVersion = {
        Coords: [135, Shop2Consts.Grid.y + (185 - 25), 200, 90],
        Mode: new Set(["Preview", "Buy", "Sell"]),
        // R103
        // @ts-expect-error
        Run: (time, ...coords: RectTuple) => {
            if (GameVersion !== "R103") {
                return;
                // @ts-expect-error
            } else if (Shop2Vars.DisplayDropdown) {
                DrawButton(...coords, `Version R${NEW_ASSETS_VERSION}`, "Gray", undefined, undefined, true);
            } else if (!shop2Vars.MBS_ShowAllVersions) {
                DrawButton(...coords, `Version R${NEW_ASSETS_VERSION}`, "Cyan");
            } else {
                DrawButton(...coords, `Version R${NEW_ASSETS_VERSION}`, "White");
            }
        },
        // R104
        Draw: (...coords: RectTuple) => {
            if (Shop2Vars.DropdownState !== "Group") {
                DrawButton(...coords, `Version R${NEW_ASSETS_VERSION}`, "Gray", undefined, undefined, true);
            } else if (!shop2Vars.MBS_ShowAllVersions) {
                DrawButton(...coords, `Version R${NEW_ASSETS_VERSION}`, "Cyan");
            } else {
                DrawButton(...coords, `Version R${NEW_ASSETS_VERSION}`, "White");
            }
        },
        Click: () => {
            if (shop2Vars.MBS_ShowAllVersions) {
                Shop2Vars.Filters.MBS_VersionFilter = (item) => NEW_ASSETS[`${item.Asset.Group.Name}${item.Asset.Name}`] ? ["Buy", "Sell", "Preview"] : [];
                Shop2.ApplyItemFilters();
            }
        },
    };

    Shop2.Elements.MBS_ShowAllVersions = {
        Coords: [355, Shop2Consts.Grid.y + (185 - 25), 200, 90],
        Mode: new Set(["Preview", "Buy", "Sell"]),
        // R103
        // @ts-expect-error
        Run: (time, ...coords: RectTuple) => {
            if (GameVersion !== "R103") {
                return;
            // @ts-expect-error
            } else if (Shop2Vars.DisplayDropdown) {
                DrawButton(...coords, "All versions", "Gray", undefined, undefined, true);
            } else if (shop2Vars.MBS_ShowAllVersions) {
                DrawButton(...coords, "All versions", "Cyan");
            } else {
                DrawButton(...coords, "All versions", "White");
            }
        },
        // R104
        Draw: (...coords: RectTuple) => {
            if (Shop2Vars.DropdownState !== "Group") {
                DrawButton(...coords, "All versions", "Gray", undefined, undefined, true);
            } else if (shop2Vars.MBS_ShowAllVersions) {
                DrawButton(...coords, "All versions", "Cyan");
            } else {
                DrawButton(...coords, "All versions", "White");
            }
        },
        Click: () => {
            if (!shop2Vars.MBS_ShowAllVersions) {
                delete Shop2Vars.Filters.MBS_VersionFilter;
                Shop2.ApplyItemFilters();
            }
        },
    };

    MBS_MOD_API.hookFunction("Shop2Load", 0, (args, next) => {
        if (Shop2InitVars.Items.length === 0) {
            Shop2InitVars.Items = Shop2.ParseAssets(
                Asset.filter(a => {
                    return (
                        a.Group.Name === a.DynamicGroupName
                        && (NEW_ASSETS[`${a.Group.Name}${a.Name}`] || ((Shop2Consts.BuyGroups[a.BuyGroup as string]?.Value ?? a.Value) > 0))
                        && !ShopHideGenderedAsset(a)
                    );
                }).sort((a1, a2) => {
                    return (
                        a1.Group.Category.localeCompare(a2.Group.Category)
                        || a1.Group.Description.localeCompare(a2.Group.Description)
                        || a1.Description.localeCompare(a2.Description)
                    );
                }),
            );
        }
        next(args);
    });
});
