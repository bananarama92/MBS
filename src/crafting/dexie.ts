import { clamp, range } from "lodash";
import { Dexie, Table, PromiseExtended } from "../dexie";

import { Version, logger } from "../common";

// TODO: Update once R121 has been released
export const BC_SLOT_MAX_ORIGINAL = 80;
export const MBS_SLOT_MAX_SERVER = 160;
export const MBS_SLOT_MAX_LOCAL = 320;
const BYTE_CLAMP = 2**8 - 1;
const SHORT_CLAMP = 2**16 - 1;

interface CraftingDBData {
    id: number;
    data: CraftingItem;
}

export function getSegmentSizes() {
    const version = Version.fromBCVersion(GameVersion);
    const maxBC = GameVersion === "R120" ? 80 : 200;
    const maxMBSServer = (version.major === 120 || (version.major === 121 && version.beta)) ? 80 : 0;
    const maxMBSLocal = 600;
    return { maxBC, maxMBSServer, maxMBSLocal };
}

/**
 * Encode the MBS version as a 32-bit unsigned integer
 * @param version
 */
export function encodeVersion(version: Version): number {
    const view = new DataView(new ArrayBuffer(4), 0);
    view.setUint8(0, clamp(version.major, 0, BYTE_CLAMP));
    view.setUint8(1, clamp(version.minor, 0, BYTE_CLAMP));
    view.setUint16(2, clamp(version.micro, 0, SHORT_CLAMP));
    return view.getUint32(0);
}

/**
 * Decode the MBS version from a 32-bit unsigned integer
 * @param version
 */
export function decodeVersion(version: number): Version {
    const view = new DataView(new ArrayBuffer(4), 0);
    view.setUint32(0, version);
    return new Version(view.getUint8(0), view.getUint8(1), view.getUint16(2));
}

export function openDB(playerID: number): Dexie {
    const versionObj = Version.fromVersion(MBS_VERSION);
    const version = encodeVersion(versionObj);
    const db = new Dexie(`mbs_${playerID}`);
    db.version(version).stores({ crafting: "id" });
    return db;
}

export async function deleteDB(playerID: number) {
    logger.debug(`Deleting indexedDB database ${playerID}`);
    return new Dexie(`mbs_${playerID}`).delete();
}

export function saveCraft(db: Dexie, index: number, craft: null): PromiseExtended<void>;
export function saveCraft(db: Dexie, index: number, craft: CraftingItem): PromiseExtended<number>;
export function saveCraft(db: Dexie, index: number, craft: null | CraftingItem): PromiseExtended<void | number>;
export function saveCraft(db: Dexie, index: number, craft: null | CraftingItem): PromiseExtended<void | number> {
    const { maxBC, maxMBSServer } = getSegmentSizes();
    const table: Table<CraftingDBData, number, CraftingDBData> = db.table("crafting");
    if (craft) {
        logger.debug(`Saving craft ${index + maxBC + maxMBSServer} to indexedDB: ${craft.Name} (${craft.Item})`);
        return table.put({ id: index, data: craft });
    } else {
        logger.debug(`Deleting craft ${index + maxBC + maxMBSServer} from indexedDB`);
        return table.delete(index);
    }
}

export async function saveAllCraft(db: Dexie, crafts: readonly (null | CraftingItem)[]) {
    const craftStrings = crafts.map((data, id) => data != null ? { id, data } : data);
    const putIndices = [];
    const deleteIndices = [];
    for (const [i, craftString] of craftStrings.entries()) {
        if (craftString == null) {
            deleteIndices.push(i);
        } else {
            putIndices.push(i);
        }
    }
    logger.debug(`Saving all ${putIndices.length} crafts to indexedDB`);

    const table: Table<CraftingDBData, number, CraftingDBData> = db.table("crafting");
    return Promise.all([
        table.bulkPut(craftStrings.filter(i => i != null)),
        table.bulkDelete(deleteIndices),
    ]);
}

export function deleteCraft(db: Dexie, index: number) {
    const table: Table<CraftingDBData, number, CraftingDBData> = db.table("crafting");
    return table.delete(index);
}

function craftingValidate(craft: unknown, index: number) {
    if (!CommonIsObject(craft)) {
        return null;
    }

    const craftCandidate = craft as unknown as CraftingItem;
    switch (CraftingValidate(craftCandidate)) {
        case CraftingStatusType.OK:
        case CraftingStatusType.ERROR:
            return craftCandidate;
        case CraftingStatusType.CRITICAL_ERROR:
            logger.error(`Removing corrupt crafting item ${index}: "${craftCandidate?.Name} (${craftCandidate?.Item})"`);
            return null;
    }
}

export async function loadCraft(db: Dexie, index: number): Promise<null | CraftingItem> {
    const { maxBC, maxMBSServer } = getSegmentSizes();
    const table: Table<CraftingDBData, number, CraftingDBData> = db.table("crafting");
    const craftObj = await table.get(index);
    const craft = craftingValidate(craftObj?.data, maxBC + maxMBSServer + index);
    if (craft) {
        logger.debug(`Loading craft ${index + maxBC + maxMBSServer} from indexedDB: ${craft.Name} (${craft.Item})`);
    } else {
        logger.debug(`Loading empty craft ${index + maxBC + maxMBSServer} from indexedDB`);
    }
    return craft;
}

export async function loadAllCraft(db: Dexie): Promise<(null | CraftingItem)[]> {
    const { maxBC, maxMBSServer, maxMBSLocal } = getSegmentSizes();
    const table: Table<CraftingDBData, number, CraftingDBData> = db.table("crafting");
    const craftStructs = await table.bulkGet(range(0, maxMBSLocal));
    const crafts = craftStructs.map((obj, i) => craftingValidate(obj?.data, maxBC + maxMBSServer + i));
    const nCrafts = crafts.filter(i => i != null).length;
    logger.debug(`Loading all ${nCrafts} crafts from indexedDB`);
    return crafts;
}
