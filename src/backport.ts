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
 * Applies hooks to a character based on conditions
 * Future hooks go here
 * @param {Character} C - The character to check
 * @param {boolean} IgnoreHooks - Whether to remove some hooks from the player (such as during character dialog).
 * @returns {boolean} - If a hook was applied or removed
 */
function CharacterCheckHooks(C: Character, IgnoreHooks: boolean): boolean {
    let refresh = false;
    if (C && C.DrawAppearance) {
        if (!IgnoreHooks && Player.Effect.includes("VRAvatars") && C.Effect.includes("HideRestraints")) {
            // Then when that character enters the virtual world, register a hook to strip out restraint layers (if needed):
            const hideRestraintsHook = () => {
                C.DrawAppearance = C.DrawAppearance?.filter((Layer) => !(Layer.Asset && Layer.Asset.IsRestraint));
                C.DrawPose = C.DrawPose?.filter((Pose) => (Pose != "TapedHands"));
            };

            if (C.RegisterHook("BeforeSortLayers", "HideRestraints", hideRestraintsHook))
                refresh = true;

        } else if (C.UnregisterHook("BeforeSortLayers", "HideRestraints"))
            refresh = true;


        if (C.DrawAppearance.some(a => a.Asset && a.Asset.NotVisibleOnScreen && a.Asset.NotVisibleOnScreen.length > 0))
            refresh = true;

        // Hook for layer visibility
        // Visibility is a string individual layers have. If an item has any layers with visibility, it should have the LayerVisibility: true property
        // We basically check the player's items and see if any are visible that have the LayerVisibility property.
        const LayerVisibility = C.DrawAppearance.some(a => a.Asset && a.Asset.LayerVisibility);

        if (LayerVisibility) {
            // Fancy logic is to use a different hook for when the character is focused
            const layerVisibilityHook = () => {
                const inDialog = (CurrentCharacter != null);
                C.AppearanceLayers = C.AppearanceLayers?.filter((Layer) => (
                    !Layer.Visibility ||
					(Layer.Visibility == "Player" && C.IsPlayer()) ||
					(Layer.Visibility == "AllExceptPlayerDialog" && !(inDialog && C.IsPlayer())) ||
					(Layer.Visibility == "Others" && !C.IsPlayer()) ||
					(Layer.Visibility == "OthersExceptDialog" && !(inDialog && !C.IsPlayer())) ||
					(Layer.Visibility == "Owner" && C.IsOwnedByPlayer()) ||
					(Layer.Visibility == "Lovers" && C.IsLoverOfPlayer()) ||
					(Layer.Visibility == "Mistresses" && LogQuery("ClubMistress", "Management"))
                ));
            };

            if (C.RegisterHook("AfterLoadCanvas", "LayerVisibilityDialog", layerVisibilityHook)) {
                refresh = true;
            }
        } else if (C.UnregisterHook("AfterLoadCanvas", "LayerVisibility")) {
            refresh = true;
        }
    }

    if (refresh)
        CharacterLoadCanvas(C);

    return refresh;
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

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4044} */
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

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4046} & {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4049} */
    if (MBS_MOD_API.getOriginalHash("ChatRoomSyncExpression") === "621A7AF9") {
        backportIDs.add(4046);
        backportIDs.add(4049);
        MBS_MOD_API.hookFunction("ChatRoomSyncExpression", 11, (args) => {
            return ChatRoomSyncExpression(...<[IChatRoomSyncExpressionMessage]>args);
        });
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4047} */
    const injectActivity = ActivityFemale3DCG.find(a => a.Name === "Inject");
    if (injectActivity && isEqual(injectActivity.Prerequisite, ["ZoneAccessible", "UseHands", "Needs-InjectItem"])) {
        backportIDs.add(4047);
        injectActivity.Prerequisite = ["ZoneAccessible", "UseHands", "Needs-Inject"];
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4048} */
    const sensDepHandler = ChatRoomMessageHandlers.find(i => i.Description === "Hide anything per sensory deprivation rules");
    if (sensDepHandler && getCRC32Hash(sensDepHandler.Callback) === "815C2377") {
        backportIDs.add(4048);
        sensDepHandler.Callback = sensDepMessageHandlerCallback;
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4057} */
    if (MBS_MOD_API.getOriginalHash("CharacterCheckHooks") === "B87E8792") {
        backportIDs.add(4057);
        MBS_MOD_API.hookFunction("CharacterCheckHooks", 11, (args) => {
            return CharacterCheckHooks(...<[Character, boolean]>args);
        });
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4062} */
    if (typeof InventoryItemMiscLoversTimerPadlockInit === "undefined") {
        backportIDs.add(4062);
        const w: typeof window & { InventoryItemMiscLoversTimerPadlockInit?: typeof InventoryItemMiscLoversTimerPadlocInit } = window;
        w["InventoryItemMiscLoversTimerPadlockInit"] = InventoryItemMiscLoversTimerPadlocInit;
    }

    console.log("MBS: Initializing R91 bug fix backports", backportIDs);
});
