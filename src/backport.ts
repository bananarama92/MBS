/** Backports of R91 bug fixes */

import { waitFor, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";

function inventoryItemMiscOwnerTimerPadlockDraw(
    validator: (C: Character) => boolean = InventoryItemMiscOwnerTimerPadlockValidator,
): void {
    const property = DialogFocusSourceItem?.Property;
    if (!DialogFocusSourceItem || !property || property.RemoveTimer == null || !CurrentCharacter) {
        return;
    }

    if (!DialogFocusItem || property.RemoveTimer < CurrentTime) {
        DialogLeaveFocusItem();
        return;
    }

    const C = CharacterGetCurrent();
    const asset = DialogFocusItem.Asset;
    if (!C) {
        return;
    }

    if (property.ShowTimer) {
        DrawText(DialogFindPlayer("TimerLeft") + " " + TimerToString(property.RemoveTimer - CurrentTime), 1500, 150, "white", "gray");
    } else {
        DrawText(DialogFindPlayer("TimerUnknown"), 1500, 150, "white", "gray");
    }
    DrawAssetPreview(1387, 225, asset);
    DrawText(DialogFindPlayer(asset.Group.Name + asset.Name + "Intro"), 1500, 600, "white", "gray");

    // Draw the settings
    if (Player.CanInteract() && validator(C)) {
        MainCanvas.textAlign = "left";
        DrawButton(1100, 666, 64, 64, "", "White", property.RemoveItem ? "Icons/Checked.png" : "");
        DrawText(DialogFindPlayer("RemoveItemWithTimer"), 1200, 698, "white", "gray");
        DrawButton(1100, 746, 64, 64, "", "White", property.ShowTimer ? "Icons/Checked.png" : "");
        DrawText(DialogFindPlayer("ShowItemWithTimerRemaining"), 1200, 778, "white", "gray");
        DrawButton(1100, 826, 64, 64, "", "White", property.EnableRandomInput ? "Icons/Checked.png" : "");
        DrawText(DialogFindPlayer("EnableRandomInput"), 1200, 858, "white", "gray");
        MainCanvas.textAlign = "center";
    } else {
        if (property.LockMemberNumber != null) {
            DrawText(DialogFindPlayer("LockMemberNumber") + " " + property.LockMemberNumber.toString(), 1500, 700, "white", "gray");
        }

        let msg = DialogFindPlayer(asset.Group.Name + asset.Name + "Detail");
        const subst = ChatRoomPronounSubstitutions(CurrentCharacter, "TargetPronoun", false);
        msg = CommonStringSubstitute(msg, subst);
        DrawText(msg, 1500, 800, "white", "gray");

        DrawText(DialogFindPlayer(property.RemoveItem ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer"), 1500, 868, "white", "gray");
    }

    // Draw buttons to add/remove time if available
    if (Player.CanInteract() && validator(C)) {
        DrawButton(1100, 910, 250, 70, DialogFindPlayer("AddTimerTime"), "White");
        DrawBackNextButton(1400, 910, 250, 70, OwnerTimerChooseList[OwnerTimerChooseIndex] + " " + DialogFindPlayer("Hours"), "White", "",
            () => OwnerTimerChooseList[(OwnerTimerChooseList.length + OwnerTimerChooseIndex - 1) % OwnerTimerChooseList.length] + " " + DialogFindPlayer("Hours"),
            () => OwnerTimerChooseList[(OwnerTimerChooseIndex + 1) % OwnerTimerChooseList.length] + " " + DialogFindPlayer("Hours"),
        );
    } else if (Player.CanInteract() && property.EnableRandomInput && !property.MemberNumberList?.includes(<number>Player.MemberNumber)) {
        DrawButton(1100, 910, 250, 70, "- 2 " + DialogFindPlayer("Hours"), "White");
        DrawButton(1400, 910, 250, 70, DialogFindPlayer("Random"), "White");
        DrawButton(1700, 910, 250, 70, "+ 2 " + DialogFindPlayer("Hours"), "White");
    }
}

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(settingsMBSLoaded).then(() => {
    if (GameVersion === "R93Beta1") {
        backportIDs.add(4289);
        const mug = Asset.find(a => a.Name === "Mug");
        const portalTablet = Asset.find(a => a.Name === "PortalTablet");
        if (mug?.HideForPose) {
            mug.HideForPose = mug.HideForPose.filter(i => i !== "TapedHands");
        }
        if (portalTablet?.HideForPose) {
            portalTablet.HideForPose = portalTablet.HideForPose.filter(i => i !== "TapedHands");
        }
    }

    if (GameVersion === "R93Beta1") {
        backportIDs.add(4290);
        MBS_MOD_API.hookFunction("InventoryItemMiscOwnerTimerPadlockDraw", 11, (args) => {
            return inventoryItemMiscOwnerTimerPadlockDraw(...<Parameters<typeof InventoryItemMiscOwnerTimerPadlockDraw>>args);
        });
    }

    if (backportIDs.size) {
        console.log("MBS: Initializing R93 bug fix backports", backportIDs);
    } else {
        console.log("MBS: No R93 bug fix backports");
    }
});
