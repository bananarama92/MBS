import { assetVersion } from "bc-data";

import { MBS_MOD_API, logger, entries } from "../common";
import { waitForBC } from "../common_bc";

import styles, { ClassNames } from "./shop.scss";

/** Type representing a concatenation of a group and asset name */
type AssetKey = `${AssetGroupName}${string}`;

/**
 * A record mapping BC versions, to asset names, to the actual assets.
 */
const ASSETS: Record<`R${number}`, Record<AssetKey, Asset>> = {};

const IDs = Object.freeze({
    root: "mbs-shop-root",
    select: "mbs-shop-select",
    style: "mbs-shop-style",
}) satisfies Record<string, "mbs-shop-style" | ClassNames>;

function versionSelectChange(this: HTMLSelectElement) {
    if (!this.value) {
        delete Shop2Vars.Filters.MBS_VersionFilter;
        Shop2.ApplyItemFilters();
    } else {
        const assets = ASSETS[this.value as `R${number}`];
        if (!assets) {
            return;
        }
        Shop2Vars.Filters.MBS_VersionFilter = (item) => assets[`${item.Asset.Group.Name}${item.Asset.Name}`] ? ["Buy", "Sell", "Preview"] : [];
        Shop2.ApplyItemFilters();
    }
}

function getShopItems() {
    const assets = Object.fromEntries(Object.entries(ASSETS).filter(([k]) => k !== "R98").flatMap(([_, v]) => Object.entries(v)));
    return Shop2.ParseAssets(
        Asset.filter(a => {
            return (
                a.Group.Name === a.DynamicGroupName
                && (assets[`${a.Group.Name}${a.Name}`] || ((Shop2Consts.BuyGroups[a.BuyGroup as string]?.Value ?? a.Value) > 0))
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

function loadHook(forceItemReset: boolean) {
    if (!document.getElementById(IDs.style)) {
        document.body.append(<style id={IDs.style}>{styles.toString()}</style>);
    }

    if (Shop2InitVars.Items.length === 0 || forceItemReset) {
        Shop2InitVars.Items = getShopItems();
    }
}

waitForBC("new_items_screen", {
    async afterLoad() {
        logger.log("Initializing new item screen hooks");

        const result = GameVersionFormat.exec(GameVersion);
        if (result == null) {
            logger.error(`Invalid BC version: "${GameVersion}"`);
            return;
        }

        for (const [groupName, assetRecord] of entries(assetVersion)) {
            for (const [assetName, version] of entries(assetRecord)) {
                const asset = AssetGet("Female3DCG", groupName as AssetGroupName, assetName);
                if (asset == null) {
                    continue;
                }
                if (asset.Group.Name === asset.DynamicGroupName) {
                    ASSETS[version] ??= {};
                    ASSETS[version][`${asset.DynamicGroupName}${asset.Name}`] = asset;
                }
            }
        }

        Shop2.Elements.MBS = {
            Coords: [135, 155 + (2 * 160 - 30), 420, 180],
            Mode: new Set(["Preview", "Buy", "Sell"]),
            Draw: () => null,
            Load: () => {
                let root = document.getElementById(IDs.root);
                if (!root) {
                    const versions = Object.keys(ASSETS).filter(version => {
                        return version !== "R98";
                    }).sort((_version1, _version2) => {
                        const version1 = Number.parseInt(_version1.slice(1), 10);
                        const version2 = Number.parseInt(_version2.slice(1), 10);
                        if (version1 > version2) {
                            return -1;
                        } else if (version2 > version1) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                    root = <label id={IDs.root}>
                        <span>Filter by BC version</span>
                        <select id={IDs.select} onChange={versionSelectChange}>
                            <option selected={true}>All versions</option>
                            <hr />
                            {versions.map(value => <option>{value}</option>)}
                        </select>
                    </label> as HTMLLabelElement;
                    root.querySelector("option[selected]")?.setAttribute("value", "");
                    document.body.append(root);
                }
                root.toggleAttribute("hidden", false);
            },
            Resize: () => {
                ElementPositionFix(IDs.root, 36, ...Shop2.Elements.MBS.Coords);
            },
            Unload: () => {
                document.getElementById(IDs.root)?.toggleAttribute("hidden", true);
            },
            Exit: () => {
                ElementRemove(IDs.root);
            },
        };

        MBS_MOD_API.hookFunction("Shop2Load", 0, (args, next) => {
            loadHook(false);
            return next(args);
        });

        if (CurrentScreen === "Shop2") {
            loadHook(true);
            if (Shop2.Elements.MBS.Mode.has(Shop2Vars.Mode)) {
                Shop2.Elements.MBS.Load?.();
                Shop2.Elements.MBS.Resize?.(true);
            }
        }
    },
});
