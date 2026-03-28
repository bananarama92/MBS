/** Main module for managing all crafting-related additions */

import { inRange } from "lodash";

import { MBS_MOD_API, padArray, logger } from "../common";
import { waitForBC } from "../common_bc";
import { pushMBSSettings, SettingsType } from "../settings";

import { openDB, saveCraft, loadAllCraft, saveAllCraft, deleteDB, getSegmentSizes } from "./dexie";
import styles from "./craft.scss";

export { deleteDB };

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

const IDs = Object.freeze({
    header: "mbs-crafting-header-prefix",
    button: "mbs-crafting-info",
    buttonBrowser: "mbs-crafting-info-browser",
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
                        <p style={{ marginBottom: "0.5em" }}>Extra MBS crafting slot stored locally in your Browser.</p>
                        <p style={{ marginTop: "0.5em" }}>These crafts are <em>exclusively</em> available for this specific combination of web browser, BC account and BC URL (<code>{window.location.href}</code>).
                        As such, it will <em>not</em> be shared between the EU, US and Asia servers.</p>
                    </span>,
                ],
                tooltipPosition: "left",
                tooltipRole: "description",
            },
            { button: {
                attributes: { "aria-label": "Show MBS extra crafting slot description", "aria-disabled": "true" },
                children: [<span aria-hidden="true" id={IDs.buttonMBS}>MBS</span>],
            }},
        );
        document.querySelector(`#${CraftingID.root} [role="menubar"]`)?.append(infoButton);
    }

    const { maxBC } = getSegmentSizes();
    if (CraftingSlot < maxBC) {
        headingPrefix.replaceChildren();
        infoButton.hidden = true;
    } else {
        headingPrefix.replaceChildren("MBS (Local): ");
        infoButton.hidden = false;
    }
}

waitForBC("crafting", {
    async afterLoad() {
        logger.log("Initializing crafting hooks");

        const { maxBC, maxMBSLocal } = getSegmentSizes();

        if (GameVersion === "R126") {
            MBS_MOD_API.patchFunction("CraftingClick", {
                [`if (CraftingOffset < 0) CraftingOffset = ${maxBC} - 20;`]:
                    `if (CraftingOffset < 0) CraftingOffset = ${maxBC + maxMBSLocal} - 20;`,
                [`if (CraftingOffset >= ${maxBC}) CraftingOffset = 0;`]:
                    `if (CraftingOffset >= ${maxBC + maxMBSLocal}) CraftingOffset = 0;`,
            });

            MBS_MOD_API.patchFunction("CraftingRun", {
                ["/ ${" + maxBC.toString() + " / 20}."]:
                    `/ ${(maxBC + maxMBSLocal) / 20}.`,
                'TextGet("SelectDestroy")':
                    `(CraftingOffset >= ${maxBC} ? (CraftingOffset >= ${maxBC} ? 'MBS (Browser): ' : 'MBS (Account): ') : '') + TextGet("SelectDestroy")`,
                'TextGet("SelectSlot")':
                    `(CraftingOffset >= ${maxBC} ? (CraftingOffset >= ${maxBC} ? 'MBS (Browser): ' : 'MBS (Account): ') : '') + TextGet("SelectSlot")`,
            });
        } else {
            // @ts-expect-error: Requires R127 types
            const rootID: string = CraftingSlots.ids.root;

            function renamePages(root: null | HTMLElement) {
                const sections = root?.querySelectorAll("fieldset[name='crafting-slot'] > section") ?? [];
                const nMax = sections.length + 1;
                let craftOffset = 0;
                for (const [i, section] of sections.entries()) {
                    if (inRange(craftOffset, maxBC, maxBC + maxMBSLocal)) {
                        section.querySelector("h2")?.replaceChildren(`MBS local page ${i + 1} / ${nMax}`);
                    }
                    craftOffset += section.querySelector("ul")?.children.length ?? 0;
                }
            }

            MBS_MOD_API.hookFunction("CraftingSlots.Load", 0, (args, next) => {
                padArray(Player.Crafting, maxBC + maxMBSLocal, null);
                const ret = next(args);
                renamePages(document.getElementById(rootID));
                return ret;
            });

            MBS_MOD_API.hookFunction("CraftingModeSet", 0, ([newMode, ...args], next) => {
                const ret = next([newMode, ...args]);
                // @ts-expect-error: Requires R127 types
                if (CommonHas(CraftingSlots.modeKeys, newMode)) {
                    renamePages(document.getElementById(rootID));
                }
                return ret;
            });
        }

        MBS_MOD_API.patchFunction("CraftingJSON.encode", {
            [`const max = Math.max(${maxBC}, crafts.length);`]:
                `const max = Math.max(${maxBC + maxMBSLocal}, crafts.length);`,
        });

        MBS_MOD_API.patchFunction("CraftingJSON.eventListeners.changeFile", {
            [`}).slice(0, ${maxBC});`]:
                `}).slice(0, ${maxBC + maxMBSLocal});`,
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
        if (!document.getElementById(IDs.style)) {
            document.body.append(<style id={IDs.style}>{styles.toString()}</style>);
        }

        // Load the extra MBS crafts
        const { maxBC, maxMBSLocal } = getSegmentSizes();
        const db = openDB(Player.MemberNumber);
        padArray(Player.Crafting, maxBC + maxMBSLocal, null);
        for (const [i, craft] of (await loadAllCraft(db)).entries()) {
            Player.Crafting[i + maxBC] = craft;
        }
        db.close({ disableAutoOpen: false });

        // Mirror the extra MBS-specific crafted items to the MBS settings
        MBS_MOD_API.hookFunction("CraftingSaveServer", 0, (args, next) => {
            // Only push a single craft to the local storage when it's certain that one is editing a local craft
            if (inRange(CraftingSlot, maxBC, maxBC + maxMBSLocal)) {
                const index = CraftingSlot - maxBC;
                const craft = Player.Crafting[CraftingSlot];
                saveCraft(db, index, craft);
                return;
            }

            const craftingBackup = Player.Crafting;
            Player.Crafting = craftingBackup?.slice(0, maxBC);
            next(args);
            Player.Crafting = craftingBackup;

            // Crafts are synced from within a place of unknown origin; sync the local crafts just in case
            if (CraftingSlot === 0 && CraftingMode !== "Name") {
                saveAllCraft(db, Player.Crafting.slice(maxBC, maxBC + maxMBSLocal));
            }
        });

        MBS_MOD_API.hookFunction("CraftingExit", 0, (args, next) => {
            if (CraftingMode === "Slot") {
                db.close({ disableAutoOpen: false });
            }
            return next(args);
        });

        if (Player.MBSSettings.CraftingCache != null) {
            migrateCraftingCache(Player, Player.MBSSettings.CraftingCache);
            Player.MBSSettings.CraftingCache = undefined;
            pushMBSSettings([SettingsType.SETTINGS]);
        }
    },
});
