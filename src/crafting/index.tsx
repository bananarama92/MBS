/** Main module for managing all crafting-related additions */

import { inRange } from "lodash";
import { Dexie } from "dexie";

import { MBS_MOD_API, padArray, logger } from "../common";
import { waitForBC } from "../common_bc";
import { pushMBSSettings, SettingsType } from "../settings";

import { openDB, saveCraft, loadAllCraft, saveAllCraft, deleteDB, BC_SLOT_MAX_ORIGINAL, MBS_SLOT_MAX_LOCAL, MBS_SLOT_MAX_SERVER } from "./dexie";
import styles from "./craft.scss";

export { deleteDB, BC_SLOT_MAX_ORIGINAL, MBS_SLOT_MAX_LOCAL, MBS_SLOT_MAX_SERVER };

/** Serialize the passed crafting items. */
function craftingSerialize(items: null | readonly (null | CraftingItem)[]): string {
    if (items == null) {
        return "";
    }
    return items.map(C => C?.Item ? CraftingSerialize(C) : "").join(CraftingSerializeItemSep);
}

/**
 * Load crafting items from the MBS cache.
 * @param character The character in question
 * @param craftingCache The crafting cache
 */
function loadCraftingCache(character: Character, craftingCache: string): void {
    character.Crafting ??= [];
    padArray(character.Crafting, BC_SLOT_MAX_ORIGINAL, null);
    if (!craftingCache) {
        return;
    }

    const packet = LZString.compressToUTF16(craftingCache);
    const data: (null | CraftingItem)[] = CraftingDecompressServerData(packet);
    let refresh = false;
    for (const [i, item] of data.entries()) {
        if (item == null) {
            continue;
        } else if (i >= BC_SLOT_MAX_ORIGINAL) {
            break;
        }

        // Make sure that the item is a valid craft
        validate: switch (CraftingValidate(item)) {
            case CraftingStatusType.OK:
                break validate;
            case CraftingStatusType.ERROR:
                refresh = true;
                break validate;
            case CraftingStatusType.CRITICAL_ERROR:
                logger.error(`Removing corrupt crafting item ${BC_SLOT_MAX_ORIGINAL + i}: "${item?.Name} (${item?.Item})"`);
                data[i] = null;
                break validate;
        }
    }

    /**
     * One or more validation errors were encountered that were successfully resolved;
     * push the fixed items back to the server
     */
    if (refresh && character.IsPlayer()) {
        CraftingSaveServer();
    }
}

const IDs = Object.freeze({
    header: "mbs-crafting-header-prefix",
    button: "mbs-crafting-info",
    buttonBrowser: "mbs-crafting-info-browser",
    buttonServer: "mbs-crafting-info-account",
    buttonMBS: "mbs-crafting-info-marker",
    style: "mbs-crafting-styles",
});

async function loadCraftingNameDOM() {
    let headingPrefix = document.getElementById(IDs.header);
    if (!headingPrefix) {
        headingPrefix = <span id={IDs.header} /> as HTMLSpanElement;
        const heading = document.querySelector(`#${CraftingID.root} h1`);
        heading?.prepend(headingPrefix);
    }

    let infoButton = document.getElementById(IDs.button);
    if (!infoButton) {
        infoButton = ElementButton.Create(
            IDs.button, 
            () => null,
            { 
                image: "./Icons/Question.png",
                tooltip: [
                    <span id={IDs.buttonBrowser}>
                        Extra MBS crafting slot stored locally in your Browser. 
                        <br />
                        These crafts are <em>exclusively</em> available for this specific combination of web browser, BC account and BC URL (<code>{window.location.href}</code>). 
                        As such, it will <em>not</em> be shared between the EU, US and Asia servers.
                    </span>,
                    <span id={IDs.buttonServer}>
                        Extra MBS crafting slot stored on your BC account (the server).
                        <br />
                        These crafts are linked to your BC account and will, as such, persists across different web browsers and BC servers.
                    </span>,
                ], 
                tooltipPosition: "left",
                tooltipRole: "description",
            },
            { button: { 
                attributes: { "aria-label": "Show MBS extra crafting slot description", "aria-disabled": "true" }, 
                dataAttributes: { type: "account" },
                children: [<span aria-hidden="true" id={IDs.buttonMBS}>MBS</span>],
            }},
        );
        const menubar = document.getElementById(CraftingID.menuBar);
        if (menubar) {
            ElementMenu.AppendButton(menubar, infoButton);
        }
    }

    if (CraftingSlot < BC_SLOT_MAX_ORIGINAL) {
        headingPrefix.replaceChildren();
        infoButton.hidden = true;
    } else if (CraftingSlot < MBS_SLOT_MAX_SERVER) {
        headingPrefix.replaceChildren("MBS (Account): ");
        infoButton.hidden = false;
        infoButton.setAttribute("data-type", "account");
    } else {
        headingPrefix.replaceChildren("MBS (Browser): ");
        infoButton.hidden = false;
        infoButton.setAttribute("data-type", "browser");
    }
}

waitForBC("crafting", {
    async afterLoad() {
        logger.log("Initializing crafting hooks");

        MBS_MOD_API.patchFunction("CraftingClick", {
            "if (CraftingOffset < 0) CraftingOffset = 80 - 20;":
                `if (CraftingOffset < 0) CraftingOffset = ${MBS_SLOT_MAX_LOCAL} - 20;`,
            "if (CraftingOffset >= 80) CraftingOffset = 0;":
                `if (CraftingOffset >= ${MBS_SLOT_MAX_LOCAL}) CraftingOffset = 0;`,
        });

        MBS_MOD_API.patchFunction("CraftingRun", {
            "/ ${80 / 20}.":
                `/ ${MBS_SLOT_MAX_LOCAL / 20}.`,
            'TextGet("SelectDestroy")':
                `(CraftingOffset >= ${BC_SLOT_MAX_ORIGINAL} ? (CraftingOffset >= ${MBS_SLOT_MAX_SERVER} ? 'MBS (Browser): ' : 'MBS (Account): ') : '') + TextGet("SelectDestroy")`,
            'TextGet("SelectSlot")':
                `(CraftingOffset >= ${BC_SLOT_MAX_ORIGINAL} ? (CraftingOffset >= ${MBS_SLOT_MAX_SERVER} ? 'MBS (Browser): ' : 'MBS (Account): ') : '') + TextGet("SelectSlot")`,
        });

        MBS_MOD_API.patchFunction("CraftingJSON.encode", {
            "const max = Math.max(80, crafts.length);":
                `const max = Math.max(${MBS_SLOT_MAX_LOCAL}, crafts.length);`,
        });

        MBS_MOD_API.patchFunction("CraftingJSON.eventListeners.changeFile", {
            "}).slice(0, 80);":
                `}).slice(0, ${MBS_SLOT_MAX_LOCAL});`,
        });

        MBS_MOD_API.hookFunction("CraftingModeSet", 0, ([newMode, ...args], next) => {
            const ret = next([newMode, ...args]);
            if (newMode === "Name") {
                loadCraftingNameDOM();
            }
            return ret;
        });
    },
    async afterMBS() {
        logger.log("Initializing crafting cache");

        let db: Dexie;

        async function loadHook() {
            if (!document.getElementById(IDs.style)) {
                document.body.append(<style id={IDs.style}>{styles.toString()}</style>);
            }

            db = openDB(Player.MemberNumber);
            padArray(Player.Crafting, MBS_SLOT_MAX_LOCAL, null);
            for (const [i, craft] of (await loadAllCraft(db)).entries()) {
                Player.Crafting[i + MBS_SLOT_MAX_SERVER] = craft;
            }
        }

        MBS_MOD_API.hookFunction("CraftingLoad", 0, (args, next) => {
            loadHook();
            return next(args);
        });

        // Mirror the extra MBS-specific crafted items to the MBS settings
        MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
            // Only push a single craft to the local storage when it's certain that one is editing a local craft
            if (inRange(CraftingSlot, MBS_SLOT_MAX_SERVER, MBS_SLOT_MAX_LOCAL)) {
                const index = CraftingSlot - MBS_SLOT_MAX_SERVER;
                const craft = Player.Crafting[CraftingSlot];
                saveCraft(db, index, craft);
                return;
            }

            const craftingBackup = Player.Crafting;
            Player.Crafting = craftingBackup?.slice(0, BC_SLOT_MAX_ORIGINAL);
            next(args);
            Player.Crafting = craftingBackup;

            const cache = craftingSerialize(Player.Crafting.slice(BC_SLOT_MAX_ORIGINAL, MBS_SLOT_MAX_SERVER));
            if (cache != Player.MBSSettings.CraftingCache) {
                Player.MBSSettings.CraftingCache = cache;
                pushMBSSettings([SettingsType.SETTINGS]);
            }
            
            // Crafts are synced from within a place of unknown origin; sync the local crafts just in case
            if (CraftingSlot === 0 && CraftingMode !== "Name") {
                saveAllCraft(db, Player.Crafting.slice(MBS_SLOT_MAX_SERVER, MBS_SLOT_MAX_LOCAL));
            }
        });

        MBS_MOD_API.hookFunction("CraftingExit", 0, (args, next) => {
            if (CraftingMode === "Slot") {
                db.close();
            }
            return next(args);
        });

        loadCraftingCache(Player, Player.MBSSettings.CraftingCache);

        if (CurrentScreen === "Crafting") {
            loadHook();
        }
    },
});
