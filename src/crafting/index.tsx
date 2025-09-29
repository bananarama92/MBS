/** Main module for managing all crafting-related additions */

import { inRange } from "lodash";
import { Dexie } from "../dexie";

import { MBS_MOD_API, padArray, logger, Version } from "../common";
import { waitForBC } from "../common_bc";
import { pushMBSSettings, SettingsType } from "../settings";

import { openDB, saveCraft, loadAllCraft, saveAllCraft, deleteDB, getSegmentSizes } from "./dexie";
import styles from "./craft.scss";

export { deleteDB };

/** Serialize the passed crafting items. */
function craftingSerialize(items: null | readonly (null | CraftingItem)[]): string {
    if (items == null) {
        return "";
    }
    return items.map(C => C?.Item ? CraftingSerialize(C) : "").join(CraftingSerializeItemSep);
}

function migrateCraftingCache(character: Character, craftingCache: string): void {
    const { maxBC } = getSegmentSizes();
    character.Crafting ??= [];
    padArray(character.Crafting, maxBC, null);
    if (!craftingCache) {
        return;
    }

    const packet = LZString.compressToUTF16(craftingCache);
    const data: (null | CraftingItem)[] = CraftingDecompressServerData(packet);
    const crafts = [];
    for (const [i, item] of data.entries()) {
        if (item == null) {
            continue;
        }

        // Make sure that the item is a valid craft
        validate: switch (CraftingValidate(item)) {
            case CraftingStatusType.OK:
                crafts.push(item);
                break validate;
            case CraftingStatusType.ERROR:
                crafts.push(item);
                break validate;
            case CraftingStatusType.CRITICAL_ERROR:
                logger.error(`Removing corrupt crafting item ${maxBC + i}: "${item?.Name} (${item?.Item})"`);
                crafts.push(null);
                break validate;
        }
    }

    if (!crafts.length) {
        return;
    }

    let j = 0;
    for (const [i, slot] of character.Crafting.entries()) {
        if (i < 80) {
            continue;
        }

        const craft = crafts[j];
        if (!craft) {
            break;
        }

        if (slot == null) {
            j++;
            character.Crafting[i] = craft;
        }
    }

    if (crafts[j]) {
        const download = confirm("Failed to move all MBS server crafts to BC.\nWould you like to download them?");
        if (download) {
            const href = URL.createObjectURL(new Blob(
                [JSON.stringify(CraftingJSON.encode(crafts), null, 4)],
                { type: "application/json" },
            ));
            const date = new Date();
            const download = ElementCreate({
                tag: "a",
                parent: document.body,
                attributes: {
                    href,
                    hidden: true,
                    download: `craft${character.MemberNumber}-MBS-${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}.json`,
                },
            });
            download.click();
            download.remove();
            URL.revokeObjectURL(href);
        }
    }

    if (character.IsPlayer()) {
        CraftingSaveServer();
    }
}

/**
 * Load crafting items from the MBS cache.
 * @param character The character in question
 * @param craftingCache The crafting cache
 */
function loadCraftingCache(character: Character, craftingCache: string): void {
    const { maxBC } = getSegmentSizes();
    character.Crafting ??= [];
    padArray(character.Crafting, maxBC, null);
    if (!craftingCache) {
        return;
    }

    const packet = LZString.compressToUTF16(craftingCache);
    const data: (null | CraftingItem)[] = CraftingDecompressServerData(packet);
    let refresh = false;
    for (const [i, item] of data.entries()) {
        if (item == null) {
            character.Crafting.push(null);
            continue;
        } else if (i >= maxBC) {
            break;
        }

        // Make sure that the item is a valid craft
        validate: switch (CraftingValidate(item)) {
            case CraftingStatusType.OK:
                character.Crafting.push(item);
                break validate;
            case CraftingStatusType.ERROR:
                refresh = true;
                character.Crafting.push(item);
                break validate;
            case CraftingStatusType.CRITICAL_ERROR:
                logger.error(`Removing corrupt crafting item ${maxBC + i}: "${item?.Name} (${item?.Item})"`);
                character.Crafting.push(null);
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

    const { maxBC, maxMBSServer } = getSegmentSizes();
    if (CraftingSlot < maxBC) {
        headingPrefix.replaceChildren();
        infoButton.hidden = true;
    } else if (CraftingSlot < (maxBC + maxMBSServer)) {
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

        const { maxBC, maxMBSServer, maxMBSLocal } = getSegmentSizes();

        MBS_MOD_API.patchFunction("CraftingClick", {
            [`if (CraftingOffset < 0) CraftingOffset = ${maxBC} - 20;`]:
                `if (CraftingOffset < 0) CraftingOffset = ${maxBC + maxMBSServer + maxMBSLocal} - 20;`,
            [`if (CraftingOffset >= ${maxBC}) CraftingOffset = 0;`]:
                `if (CraftingOffset >= ${maxBC + maxMBSServer + maxMBSLocal}) CraftingOffset = 0;`,
        });

        MBS_MOD_API.patchFunction("CraftingRun", {
            ["/ ${" + maxBC.toString() + " / 20}."]:
                `/ ${(maxBC + maxMBSServer + maxMBSLocal) / 20}.`,
            'TextGet("SelectDestroy")':
                `(CraftingOffset >= ${maxBC} ? (CraftingOffset >= ${maxBC + maxMBSServer} ? 'MBS (Browser): ' : 'MBS (Account): ') : '') + TextGet("SelectDestroy")`,
            'TextGet("SelectSlot")':
                `(CraftingOffset >= ${maxBC} ? (CraftingOffset >= ${maxBC + maxMBSServer} ? 'MBS (Browser): ' : 'MBS (Account): ') : '') + TextGet("SelectSlot")`,
        });

        MBS_MOD_API.patchFunction("CraftingJSON.encode", {
            [`const max = Math.max(${maxBC}, crafts.length);`]:
                `const max = Math.max(${maxBC + maxMBSServer + maxMBSLocal}, crafts.length);`,
        });

        MBS_MOD_API.patchFunction("CraftingJSON.eventListeners.changeFile", {
            [`}).slice(0, ${maxBC});`]:
                `}).slice(0, ${maxBC + maxMBSServer + maxMBSLocal});`,
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

        const version = Version.fromBCVersion(GameVersion);
        const { maxBC, maxMBSServer, maxMBSLocal } = getSegmentSizes();
        let db: Dexie;

        async function loadHook() {
            if (!document.getElementById(IDs.style)) {
                document.body.append(<style id={IDs.style}>{styles.toString()}</style>);
            }

            db = openDB(Player.MemberNumber);
            padArray(Player.Crafting, maxBC + maxMBSServer + maxMBSLocal, null);
            for (const [i, craft] of (await loadAllCraft(db)).entries()) {
                Player.Crafting[i + maxBC + maxMBSServer] = craft;
            }
        }

        MBS_MOD_API.hookFunction("CraftingLoad", 0, (args, next) => {
            loadHook();
            return next(args);
        });

        // Mirror the extra MBS-specific crafted items to the MBS settings
        MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
            // Only push a single craft to the local storage when it's certain that one is editing a local craft
            if (inRange(CraftingSlot, maxBC + maxMBSServer, maxBC + maxMBSServer + maxMBSLocal)) {
                const index = CraftingSlot - maxBC - maxMBSServer;
                const craft = Player.Crafting[CraftingSlot];
                saveCraft(db, index, craft);
                return;
            }

            const craftingBackup = Player.Crafting;
            Player.Crafting = craftingBackup?.slice(0, maxBC);
            next(args);
            Player.Crafting = craftingBackup;


            if (version.major === 120 || (version.major === 121 && version.beta)) {
                const cache = craftingSerialize(Player.Crafting.slice(maxBC, maxBC + maxMBSServer));
                if (cache != Player.MBSSettings.CraftingCache) {
                    Player.MBSSettings.CraftingCache = cache;
                    pushMBSSettings([SettingsType.SETTINGS]);
                }
            }

            // Crafts are synced from within a place of unknown origin; sync the local crafts just in case
            if (CraftingSlot === 0 && CraftingMode !== "Name") {
                saveAllCraft(db, Player.Crafting.slice(maxBC + maxMBSServer, maxBC + maxMBSServer + maxMBSLocal));
            }
        });

        MBS_MOD_API.hookFunction("CraftingExit", 0, (args, next) => {
            if (CraftingMode === "Slot") {
                db.close();
            }
            return next(args);
        });

        if (version.major > 121 || (version.major === 121 && !version.beta)) {
            migrateCraftingCache(Player, Player.MBSSettings.CraftingCache);
        } else {
            loadCraftingCache(Player, Player.MBSSettings.CraftingCache);
        }

        if (version.major === 121 && version.beta) {
            const nCrafts = Player.Crafting.slice(maxBC, maxBC + maxMBSServer).filter(i => i != null);
            const psa = <div class="chat-room-changelog" id="mbs-craft-psa-r121">
                Starting from the full BC R121 release all <code>{nCrafts.length}</code> <q>MBS (Account)</q> crafted items will be moved to base BC, utilizing its increase in crafting slot (from 80 to 200).
                <br/>
                As a reminder: ensure that enough empty slots remain available for the migration.
            </div> as HTMLDivElement;
            psa.setAttribute("data-sender", Player.MemberNumber.toString());
            psa.setAttribute("data-time", ChatRoomCurrentTime());
            psa.classList.add("ChatMessage");

            if (CurrentScreen === "ChatRoom") {
                ChatRoomAppendChat(psa);
            } else {
                let published = false;
                MBS_MOD_API.hookFunction("ChatRoomCreateElement", 0, (args, next) => {
                    const ret = next(args);
                    if (!published) {
                        published = true;
                        ChatRoomAppendChat(psa);
                    }
                    return ret;
                });
            }
        }

        if (CurrentScreen === "Crafting") {
            loadHook();
        }
    },
});
