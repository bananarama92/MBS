import { MBS_MOD_API, waitFor, logger } from "../common";
import { bcLoaded } from "../common_bc";

import { NEW_ASSETS_VERSION, NewItemsScreen, MainHallProxy, itemScreenDummy, NEW_ASSETS } from "./screen";

export {
    NewItemsScreen,
    NEW_ASSETS_VERSION,
    NEW_ASSETS,
};

const shop2Vars = <typeof Shop2Vars & { readonly MBS_ShowAllVersions: boolean }>Shop2Vars;

waitFor(bcLoaded).then(() => {
    logger.log("Initializing new item screen hooks");

    const mainHallState = new MainHallProxy();

    MBS_MOD_API.patchFunction("MainHallRun", {
        'DrawText(TextGet("OnlinePlayers") + " " + CurrentOnlinePlayers.toString(), 1740, 950, "White", "Black");':
            'DrawText(TextGet("OnlinePlayers") + " " + CurrentOnlinePlayers.toString(), 1630, 950, "White", "Black");',
    });

    MBS_MOD_API.hookFunction("MainHallRun", 0, (args, next) => {
        next(args);
        if (MainHallStartEventTimer == null && MainHallNextEventTimer == null) {
            DrawButton(1665, 900, 90, 90, "", "White", "Icons/Changelog.png", `MBS: Show new R${NEW_ASSETS_VERSION} items`);
        }
    });

    if (typeof Shop2 !== "undefined") {
        Object.defineProperty(Shop2Vars, "MBS_ShowAllVersions", {
            get() {
                return !("MBS_VersionFilter" in Shop2Vars.Filters);
            },
        });

        Shop2.Elements.MBS_VersionHeader = {
            Coords: [345, 155 + (185 - 25), 0, 0],
            Mode: new Set(["Preview", "Buy", "Sell"]),
            Run: (time, x, y) => DrawText("Filter by BC version", x, y, Shop2Vars.DisplayDropdown ? "Gray" : "White"),
        };

        Shop2.Elements.MBS_ShowCurrentVersion = {
            Coords: [135, Shop2Consts.Grid.y + (185 - 25), 200, 90],
            Mode: new Set(["Preview", "Buy", "Sell"]),
            Run: (time, ...coords) => {
                if (Shop2Vars.DisplayDropdown) {
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
            Run: (time, ...coords) => {
                if (Shop2Vars.DisplayDropdown) {
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
            if (Shop2Consts.GroupDescriptions !== undefined) {
                Object.values(NEW_ASSETS).forEach(a => {
                    Shop2Consts.GroupDescriptions[a.Group.Description] ??= [];
                    if (!Shop2Consts.GroupDescriptions[a.Group.Description].includes(a.Group.Name)) {
                        Shop2Consts.GroupDescriptions[a.Group.Description].push(a.Group.Name);
                    }
                });
            }

            if (Shop2InitVars.Items.length === 0) {
                Shop2InitVars.Items = Shop2.ParseAssets(
                    Asset.filter(a => {
                        return (
                            a.Group.Name === a.DynamicGroupName
                            && (NEW_ASSETS[`${a.Group.Name}${a.Name}`] || ((Shop2Consts.BuyGroups[a.BuyGroup as string]?.Value ?? a.Value) > 0))
                            && !ShopHideGenderedAsset(a)
                        );
                    }).sort((a1, a2) => {
                        return a1.Group.Description.localeCompare(a2.Group.Description) || a1.Description.localeCompare(a2.Description);
                    }),
                );
            }
            next(args);
        });
    }

    MBS_MOD_API.hookFunction("MainHallClick", 0, (args, next) => {
        if (MainHallStartEventTimer == null && MainHallNextEventTimer == null && MouseIn(1665, 900, 90, 90)) {
            if (typeof Shop2 === "undefined") {
                const subScreen = new NewItemsScreen(mainHallState);
                mainHallState.children.set(subScreen.screen, subScreen);
                subScreen.load();
            } else {
                Shop2Vars.Mode = "Preview";
                Shop2Vars.Filters.MBS_VersionFilter = (item) => NEW_ASSETS[`${item.Asset.Group.Name}${item.Asset.Name}`] ? ["Buy", "Sell", "Preview"] : [];
                Shop2.Init(undefined, ["Room", "MainHall"]);
            }
            return;
        }
        next(args);
    });

    MBS_MOD_API.hookFunction("DialogLeaveFocusItem", 10, (args, next) => {
        if (
            DialogTightenLoosenItem == null
            && DialogFocusItem != null
            && CurrentScreen === NewItemsScreen.screen
        ) {
            ExtendedItemExit();
            return;
        } else {
            return next(args);
        }
    });

    MBS_MOD_API.hookFunction("CharacterGetCurrent", 0, (args, next) => {
        const ret = next(args);
        return CurrentScreen === NewItemsScreen.screen ? itemScreenDummy : ret;
    });
});
