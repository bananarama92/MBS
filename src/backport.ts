/** Backports of R91 bug fixes */

import { waitFor, MBS_MOD_API } from "common";
import { settingsMBSLoaded } from "common_bc";

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

/** @type {typeof DialogHasKey} */
function dialogHasKey(C: Character, Item: Item): boolean {
    Item.Property ??= {};
    if (InventoryGetItemProperty(Item, "SelfUnlock") == false && (!Player.CanInteract() || C.ID == 0)) return false;
    if (C.IsOwnedByPlayer() && InventoryAvailable(Player, "OwnerPadlockKey", "ItemMisc") && Item.Asset.Enable) return true;
    const lock = InventoryGetLock(Item);
    if (lock && lock.Asset.FamilyOnly && Item.Asset.Enable && LogQuery("BlockFamilyKey", "OwnerRule") && (Player.Ownership != null) && (Player.Ownership.Stage >= 1)) return false;
    if (C.IsLoverOfPlayer() && InventoryAvailable(Player, "LoversPadlockKey", "ItemMisc") && Item.Asset.Enable && Item.Property && Item.Property.LockedBy && !Item.Property.LockedBy.startsWith("Owner")) return true;
    if (lock && lock.Asset.ExclusiveUnlock && ((!Item.Property.MemberNumberListKeys && Item.Property.LockMemberNumber != Player.MemberNumber) || (Item.Property.MemberNumberListKeys && CommonConvertStringToArray("" + Item.Property.MemberNumberListKeys).indexOf(Player.MemberNumber ?? NaN) < 0))) return false;
    if (lock && lock.Asset.ExclusiveUnlock) {
        // Locks with exclusive access (intricate, high-sec)
        const allowedMembers = CommonConvertStringToArray(Item.Property.MemberNumberListKeys ?? "");
        // High-sec, check if we're in the keyholder list
        if (Item.Property.MemberNumberListKeys != null) return allowedMembers.includes(Player.MemberNumber ?? NaN);
        // Intricate, check that we added that lock
        if (Item.Property.LockMemberNumber == Player.MemberNumber) return true;
    }
    if (lock && lock.Asset.FamilyOnly && Item.Asset.Enable && (C.ID != 0) && !C.IsFamilyOfPlayer()) return false;
    let UnlockName = <EffectName>`Unlock-${Item.Asset.Name}`;
    if ((Item.Property != null) && (Item.Property.LockedBy != null))
        UnlockName = <EffectName>`Unlock-${Item.Property.LockedBy}`;
    for (let I = 0; I < Player.Inventory.length; I++)
        if (InventoryItemHasEffect(Player.Inventory[I], UnlockName)) {
            if (lock != null) {
                if (lock.Asset.LoverOnly && !C.IsLoverOfPlayer()) return false;
                if (lock.Asset.OwnerOnly && !C.IsOwnedByPlayer()) return false;
                return true;
            } else return true;
        }
    return false;
}

/**
 * Check that that a given prerequisite is met.
 * @param {ActivityPrerequisite} prereq - The prerequisite to consider
 * @param {Character|PlayerCharacter} acting - The character performing the activity
 * @param {Character|PlayerCharacter} acted - The character being acted on
 * @param {AssetGroup} group - The group being acted on
 * @returns {boolean} whether the given activity's prerequisite are satisfied
 */
function activityCheckPrerequisite(
    prereq: ActivityPrerequisite,
    acting: Character,
    acted: Character,
    group: AssetGroup,
): boolean {
    switch (prereq) {
        case "UseMouth":
            return !acting.IsMouthBlocked() && acting.CanTalk();
        case "UseTongue":
            return !acting.IsMouthBlocked();
        case "TargetMouthBlocked":
            return acted.IsMouthBlocked();
        case "IsGagged":
            return acting.IsGagged();
        case "TargetKneeling":
            return acted.IsKneeling();
        case "UseHands":
            return acting.CanInteract() && !acting.Effect.includes("MergedFingers");
        case "UseArms":
            return acting.CanInteract() || (!InventoryGet(acting, "ItemArms") && !InventoryGroupIsBlocked(acting, "ItemArms"));
        case "UseFeet":
            return acting.CanWalk();
        case "CantUseArms":
            return !acting.CanInteract() && (!!InventoryGet(acting, "ItemArms") || InventoryGroupIsBlocked(acting, "ItemArms"));
        case "CantUseFeet":
            return !acting.CanWalk();
        case "TargetCanUseTongue":
            return !acted.IsMouthBlocked();
        case "TargetMouthOpen":
            if (group.Name === "ItemMouth")
                return !InventoryGet(acted, "ItemMouth") || acted.IsMouthOpen();
            break;
        case "VulvaEmpty":
            if (group.Name === "ItemVulva")
                return acted.HasVagina() && !acted.IsVulvaFull();
            break;
        case "AssEmpty":
            if (group.Name === "ItemButt")
                return !acted.IsPlugged();
            break;
        case "MoveHead":
            if (group.Name === "ItemHead")
                return !acted.IsFixedHead();
            break;
        case "ZoneAccessible":
        case "TargetZoneAccessible": {
            // FIXME: The original ZoneAccessible should have been prefixed with Target, which is why those are reversed
            // TargetZoneAccessible is only used for ReverseSuckItem, which is marked as reverse, adding in to the confusion
            const actor = prereq.startsWith("Target") ? acting : acted;
            return ActivityGetAllMirrorGroups(actor.AssetFamily, group.Name).some((g) => g.IsItem() ? !InventoryGroupIsBlocked(actor, g.Name, true) : true);
        }
        case "ZoneNaked":
        case "TargetZoneNaked": {
            // FIXME: Ditto
            const actor = prereq.startsWith("Target") ? acting : acted;
            if (group.Name === "ItemButt")
                return InventoryPrerequisiteMessage(actor, "AccessButt") === "" && !(actor.IsPlugged() || actor.IsButtChaste());
            else if (group.Name === "ItemVulva")
                return (InventoryPrerequisiteMessage(actor, "AccessVulva") === "") && !actor.IsVulvaChaste();
            else if (group.Name === "ItemVulvaPiercings")
                return (InventoryPrerequisiteMessage(actor, "AccessVulva") === "") && !actor.IsVulvaChaste();
            else if (group.Name === "ItemBreast" || group.Name === "ItemNipples")
                return (InventoryPrerequisiteMessage(actor, "AccessBreast") === "") && !actor.IsBreastChaste();
            else if (group.Name === "ItemBoots")
                return InventoryPrerequisiteMessage(actor, "NakedFeet") === "";
            else if (group.Name === "ItemHands")
                return InventoryPrerequisiteMessage(actor, "NakedHands") === "";
            break;
        }
        case "CanUsePenis":
            if (acting.HasPenis())
                return InventoryPrerequisiteMessage(acting, "AccessVulva") === "";
            break;
        case "Sisters":
            return !acting.HasPenis() && !acted.HasPenis() && (acting.Ownership != null) && (acted.Ownership != null) && (acted.Ownership.MemberNumber == acting.Ownership.MemberNumber);
        case "Brothers":
            return acting.HasPenis() && acted.HasPenis() && (acting.Ownership != null) && (acted.Ownership != null) && (acted.Ownership.MemberNumber == acting.Ownership.MemberNumber);
        case "SiblingsWithDifferentGender":
            return (acting.HasPenis() != acted.HasPenis()) && (acting.Ownership != null) && (acted.Ownership != null) && (acted.Ownership.MemberNumber == acting.Ownership.MemberNumber);
        default:
            break;
    }
    return true;
}

waitFor(settingsMBSLoaded).then(() => {
    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4202} */
    if (GameVersion === "R92Beta1" && MBS_MOD_API.getOriginalHash("DialogHasKey") === "0ED0B69F") {
        backportIDs.add(4202);
        MBS_MOD_API.hookFunction("DialogHasKey", 11, (args) => {
            return dialogHasKey(...<Parameters<typeof DialogHasKey>>args);
        });
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4203} */
    const chastityClitShield = AssetGet("Female3DCG", "ItemVulva", "ChastityClitShield");
    const highSecurityVulvaShield = AssetGet("Female3DCG", "ItemVulva", "ChastityClitShield");
    if (
        GameVersion === "R92Beta1"
        && chastityClitShield?.Block
        && highSecurityVulvaShield?.Block
        && chastityClitShield.Block.includes("ItemVulvaPiercings")
        && highSecurityVulvaShield.Block.includes("ItemVulvaPiercings")
        && MBS_MOD_API.getOriginalHash("ActivityCheckPrerequisite") === "D2DE6250"
    ) {
        backportIDs.add(4203);
        chastityClitShield.Block = chastityClitShield.Block.filter(i => i !== "ItemVulvaPiercings");
        highSecurityVulvaShield.Block = highSecurityVulvaShield.Block.filter(i => i !== "ItemVulvaPiercings");
        MBS_MOD_API.hookFunction("ActivityCheckPrerequisite", 11, (args) => {
            return activityCheckPrerequisite(...<Parameters<typeof ActivityCheckPrerequisite>>args);
        });
    }

    if (backportIDs.size) {
        console.log("MBS: Initializing R92 bug fix backports", backportIDs);
    } else {
        console.log("MBS: No R92 bug fix backports");
    }
});
