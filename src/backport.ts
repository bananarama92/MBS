/** Backports of R91 bug fixes */

import { isEqual } from "lodash-es";

import { waitFor, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";


/** xref {@link https://github.com/Jomshir98/bondage-club-mod-sdk/blob/f3fb4166200539e6f852c7e6526d5e1ad79a397b/src/utils.ts} */
function getCRC32Hash(callback: (...args: any[]) => any): string {
    const encoder = new TextEncoder();

    const str = callback.toString().replaceAll("\r\n", "\n");
    let crc = 0 ^ -1;
    for (const b of encoder.encode(str)) {
        let c = (crc ^ b) & 0xff;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
        }
        crc = (crc >>> 8) ^ c;
    }

    return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

/**
 * Updates a single character's expression in the chatroom.
 * @param {IChatRoomSyncExpressionMessage} data - Data object containing the new character expression data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncExpression(data: IChatRoomSyncExpressionMessage): void {
    if (
        !CommonIsObject(data)
		|| typeof data.Group !== "string"
		|| (typeof data.Name !== "string" && data.Name != null)
    ) return;

    const character = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
    if (!character) return;

    // Changes the facial expression if the group exists and allows it
    const item = character.Appearance.find(i => (
        i.Asset.Group.Name === data.Group
		&& i.Asset.Group.AllowExpression
		&& (data.Name == null || i.Asset.Group.AllowExpression.includes(data.Name))
    ));
    if (!item) return;

    if (!item.Property) item.Property = {};
    if (item.Property.Expression != data.Name) {
        item.Property.Expression = data.Name;
        CharacterRefresh(character, false);
    }

    // Update the cached copy in the chatroom
    if (!ChatRoomData) {
        return;
    }
    const roomCharacter = ChatRoomData.Character?.find(c => c.MemberNumber === data.MemberNumber);
    if (roomCharacter) {
        roomCharacter.Appearance = character.Appearance;
    }
}

/**
 * Actual action to perform.
 * @param data - The chat message to handle.
 * @param sender - The character that sent the message.
 * @param msg - The formatted string extracted from the message.
 *              If the handler is in "post" mode, all substitutions have been performed.
 * @returns {boolean} true if the message was handled and the processing should stop, false otherwise.
 */
function sensDepMessageHandlerCallback(
    data: IChatRoomMessage,
    sender: Character,
    msg: string,
): boolean {
    const IsPlayerInvolved = ChatRoomMessageInvolvesPlayer(data);

    const IsPlayerInSensoryDep = (
        (Player.ImmersionSettings?.SenseDepMessages ?? false)
        && PreferenceIsPlayerInSensDep()
        && Player.GetDeafLevel() >= 4
        && (!ChatRoomSenseDepBypass || !ChatRoomCharacterDrawlist.includes(sender))
    );

    // When the player is in total sensory deprivation, hide non-whisper messages if the player is not involved
    const IsPlayerMentioned = ChatRoomMessageMentionsCharacter(Player, msg);
    return (IsPlayerInSensoryDep && !IsPlayerInvolved && !IsPlayerMentioned && data.Type !== "Whisper");
}

/** Original values for objects that cannot be patched via ModSDK */
export let originalValues: {
    injectActivityPrerequisite: ActivityPrerequisite[],
    sensDepHandlerCallback: ChatRoomMessageHandler["Callback"],
};

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    originalValues = Object.freeze({
        injectActivityPrerequisite: <ActivityPrerequisite[]>["ZoneAccessible", "UseHands", "Needs-InjectItem"],
        sensDepHandlerCallback: (<ChatRoomMessageHandler>ChatRoomMessageHandlers.find(i => i.Description === "Hide anything per sensory deprivation rules")).Callback,
    });

    /** Port-forward of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4044} */
    if (MBS_MOD_API.getOriginalHash("StruggleLockPickSetup") === "19282793") {
        backportIDs.add(4044);
        MBS_MOD_API.hookFunction("StruggleLockPickSetup", 11, (args, next) => {
            const item: null | Item = args[1];
            const lock = (item == null) ? null : InventoryGetLock(item);
            next(args);
            if (lock !== null) {
                StruggleLockPickProgressMaxTries = Math.max(1, StruggleLockPickProgressMaxTries);
            }
        });
    }

    /** Port-forward of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4046} & {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4049} */
    if (MBS_MOD_API.getOriginalHash("ChatRoomSyncExpression") === "621A7AF9") {
        backportIDs.add(4046);
        backportIDs.add(4049);
        MBS_MOD_API.hookFunction("ChatRoomSyncExpression", 11, (args) => {
            return ChatRoomSyncExpression(...<[IChatRoomSyncExpressionMessage]>args);
        });
    }

    /** Port-forward of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4047} */
    const injectActivity = ActivityFemale3DCG.find(a => a.Name === "Inject");
    if (injectActivity && isEqual(injectActivity.Prerequisite, ["ZoneAccessible", "UseHands", "Needs-InjectItem"])) {
        backportIDs.add(4047);
        injectActivity.Prerequisite = ["ZoneAccessible", "UseHands", "Needs-Inject"];
    }

    /** Port-forward of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4048} */
    const sensDepHandler = ChatRoomMessageHandlers.find(i => i.Description === "Hide anything per sensory deprivation rules");
    if (sensDepHandler && getCRC32Hash(sensDepHandler.Callback) === "815C2377") {
        backportIDs.add(4048);
        sensDepHandler.Callback = sensDepMessageHandlerCallback;
    }

    console.log("MBS: Initializing R91 bug fix backports", backportIDs);
});
