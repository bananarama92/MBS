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

/**
 * Gets the coordinates of the current event on the canvas
 * @param {MouseEvent|TouchEvent} Event - The touch/mouse event
 * @returns {{X: number, Y: number}} - Coordinates of the click/touch event on the canvas
 */
function colorPickerGetCoordinates(Event: MouseEvent | TouchEvent): {X: number, Y: number} {
    if (isTouchEvent(Event)) {
        if (Event.changedTouches) {
            // Mobile
            TouchMove(Event);
        }
    } else {
        // PC
        MouseMove(Event);
    }
    return { X: MouseX, Y: MouseY };
}

/**
 * Sets an extended item's type and properties to the option provided.
 * @template {ModularItemOption | TypedItemOption | VibratingItemOption} OptionType
 * @param {ModularItemData | TypedItemData | VibratingItemData} data - The extended item data
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose type to set
 * @param {OptionType} newOption - The to-be applied extended item option
 * @param {OptionType} previousOption - The previously applied extended item option
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @returns {string|undefined} - undefined or an empty string if the option was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
function extendedItemSetOption<OptionType extends ModularItemOption | TypedItemOption | VibratingItemOption>(
    data: ModularItemData | TypedItemData | VibratingItemData,
    C: Character,
    item: Item,
    newOption: OptionType,
    previousOption: OptionType,
    push: boolean = false,
): string | undefined {
    // TODO: decouple `...Validate` from `...SetOption`
    if (newOption.Name === previousOption.Name && !newOption.HasSubscreen) {
        return DialogFindPlayer("AlreadySet");
    }

    const requirementMessage = ExtendedItemRequirementCheckMessage(item, C, newOption, previousOption);
    if (requirementMessage) {
        return requirementMessage;
    }

    let previousOptionProperty: ItemProperties;
    let newProperty: ItemProperties;
    switch (newOption.OptionType) {
        case "ModularItemOption": {
            const moduleData = <ModularItemData>data;
            const previousModuleValues = ModularItemParseCurrent(moduleData, item.Property?.Type);
            const moduleIndex = moduleData.modules.findIndex(m => m.Name === newOption.ModuleName);
            const newModuleValues = [...previousModuleValues];
            newModuleValues[moduleIndex] = newOption.Index;

            newProperty = ModularItemMergeModuleValues(moduleData, newModuleValues);
            previousOptionProperty = ModularItemMergeModuleValues(moduleData, previousModuleValues);
            break;
        }
        case "VibratingItemOption":
        case "TypedItemOption":
            newProperty = JSON.parse(JSON.stringify(newOption.Property));
            previousOptionProperty = { ...previousOption.Property };
            break;
        default:
            console.error(`Unsupported archetype: ${data.asset.Archetype}`);
            return undefined;
    }

    if (newOption.HasSubscreen) {
        const args: Parameters<ExtendedItemCallbacks.Init> = [C, item, false];
        CommonCallFunctionByNameWarn(`${data.functionPrefix}${newOption.Name}Init`, ...args);
    }

    const previousProperty = PropertyUnion(
        previousOptionProperty,
        ExtendedItemGatherSubscreenProperty(item, previousOption),
    );
    CommonKeys(data.baselineProperty || {}).forEach(i => delete previousProperty[i]);
    ExtendedItemSetProperty(C, item, previousProperty, newProperty, push);

    if (newOption.Expression) {
        InventoryExpressionTriggerApply(C, newOption.Expression);
    }
    return undefined;
}

waitFor(settingsMBSLoaded).then(() => {
    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4202} */
    if (GameVersion === "R92Beta1") {
        backportIDs.add(4202);
        MBS_MOD_API.hookFunction("DialogHasKey", 11, (args) => {
            return dialogHasKey(...<Parameters<typeof DialogHasKey>>args);
        });
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4203} */
    const chastityClitShield = AssetGet("Female3DCG", "ItemVulvaPiercings", "ChastityClitShield");
    const highSecurityVulvaShield = AssetGet("Female3DCG", "ItemVulvaPiercings", "HighSecurityVulvaShield");
    if (
        GameVersion === "R92Beta1"
        && chastityClitShield?.Block
        && highSecurityVulvaShield?.Block
    ) {
        backportIDs.add(4203);
        chastityClitShield.Block = chastityClitShield.Block.filter(i => i !== "ItemVulvaPiercings");
        highSecurityVulvaShield.Block = highSecurityVulvaShield.Block.filter(i => i !== "ItemVulvaPiercings");
        MBS_MOD_API.hookFunction("ActivityCheckPrerequisite", 11, (args) => {
            return activityCheckPrerequisite(...<Parameters<typeof ActivityCheckPrerequisite>>args);
        });
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4204} */
    if (GameVersion === "R92Beta1") {
        backportIDs.add(4204);
        MBS_MOD_API.hookFunction("ColorPickerGetCoordinates", 11, (args) => {
            return colorPickerGetCoordinates(...<Parameters<typeof ColorPickerGetCoordinates>>args);
        });
    }

    /** Backport of {@link https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4207} */
    if (GameVersion === "R92Beta1") {
        backportIDs.add(4207);
        MBS_MOD_API.hookFunction("ExtendedItemSetOption", 11, (args) => {
            return extendedItemSetOption(...<Parameters<typeof ExtendedItemSetOption>>args);
        });
    }

    if (backportIDs.size) {
        console.log("MBS: Initializing R92 bug fix backports", backportIDs);
    } else {
        console.log("MBS: No R92 bug fix backports");
    }
});
