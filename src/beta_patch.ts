// @ts-nocheck

"use strict";

import { MBS_MOD_API, waitFor } from "common";

function CharacterAppearanceSortLayers(C: Character): AssetLayer[] {
    /** @type {Partial<Record<AssetGroupName, AlphaDefinition[]>>} */
    const groupAlphas = {};
    const layers = C.DrawAppearance.reduce((layersAcc, item) => {
        const asset = item.Asset;
        // Only include layers for visible assets
        if (asset.Visible && CharacterAppearanceVisible(C, asset.Name, asset.Group.Name) && InventoryChatRoomAllow(asset.Category)) {
            // Check if we need to draw a different variation (from type property)
            const type = (item.Property && item.Property.Type) || "";
            const layersToDraw = asset.Layer
                .filter(layer => CharacterAppearanceIsLayerVisible(C, layer, asset, type))
                .map(layer => {
                    const drawLayer = Object.assign({}, layer);
                    // Store any group-level alpha mask definitions
                    drawLayer.Alpha.forEach(alphaDef => {
                        if ((alphaDef.Group && alphaDef.Group.length) && (!alphaDef.Type || !Array.isArray(alphaDef.Type) || alphaDef.Type.includes(type))) {
                            alphaDef.Group.forEach(groupName => {
                                groupAlphas[groupName] = groupAlphas[groupName] || [];
                                groupAlphas[groupName].push({Pose: alphaDef.Pose, Masks: alphaDef.Masks});
                            });
                        }
                    });
                    // If the item has an OverridePriority property, it completely overrides the layer priority
                    if (item.Property) {
                        if (typeof item.Property.OverridePriority === "number")
                            drawLayer.Priority = item.Property.OverridePriority;
                        else if (CommonIsObject(item.Property.OverridePriority) && typeof item.Property.OverridePriority[layer.Name] === "number") {
                            drawLayer.Priority = item.Property.OverridePriority[layer.Name];
                        }
                    }
                    return drawLayer;
                });
            Array.prototype.push.apply(layersAcc, layersToDraw);
        }
        return layersAcc;
    }, []);

    // Run back over the layers to apply the group-level alpha mask definitions to the appropriate layers
    layers.forEach(layer => {
        // If the layer has a HideAs proxy group name, apply those alphas rather than the actual group alphas
        const groupName = (layer.HideAs && layer.HideAs.Group) || layer.Asset.Group.Name;
        layer.GroupAlpha = [];
        if (groupAlphas[groupName]) {
            Array.prototype.push.apply(layer.GroupAlpha, groupAlphas[groupName]);
        }
    });

    return AssetLayerSort(layers);
}

function InventoryLock(C, Item, Lock, MemberNumber, Update = true) {
	if (typeof Item === 'string') Item = InventoryGet(C, Item);
	if (typeof Lock === 'string') Lock = { Asset: AssetGet(C.AssetFamily, "ItemMisc", Lock) };
	if (Item && Lock && Lock.Asset && Lock.Asset.IsLock && InventoryDoesItemAllowLock(Item)) {
		if (Item.Property == null) Item.Property = {};
		if (Item.Property.Effect == null) Item.Property.Effect = [];
		if (Item.Property.Effect.indexOf("Lock") < 0) Item.Property.Effect.push("Lock");
		if (!Item.Property.MemberNumberListKeys && Lock.Asset.Name == "HighSecurityPadlock") Item.Property.MemberNumberListKeys = "" + MemberNumber;
		Item.Property.LockedBy = /** @type AssetLockType */(Lock.Asset.Name);
		if (MemberNumber != null) Item.Property.LockMemberNumber = MemberNumber;
		CommonCallFunctionByName(`Inventory${Lock.Asset.Group.Name}${Lock.Asset.Name}Init`, Item, C, false);
		if (Update) {
			if (Lock.Asset.RemoveTimer > 0) TimerInventoryRemoveSet(C, Item.Asset.Group.Name, Lock.Asset.RemoveTimer);
			CharacterRefresh(C, true);
		}
	}
}

function CharacterLoadCanvas(C) {
	// Reset the property that tracks if wearing a hidden item
	C.HasHiddenItems = false;

	// We add a temporary appearance and pose here so that it can be modified by hooks.  We copy the arrays so no hooks can alter the reference accidentally
	C.DrawAppearance = AppearanceItemParse(CharacterAppearanceStringify(C));
	C.DrawPose = C.Pose.slice(); // Deep copy of pose array

	// Run BeforeSortLayers hook
	C.RunHooks("BeforeSortLayers");

	// Generates a layer array from the character's appearance array, sorted by drawing order
	C.AppearanceLayers = CharacterAppearanceSortLayers(C);

	// Run AfterLoadCanvas hooks
	C.RunHooks("AfterLoadCanvas");

	// Sets the total height modifier for that character
	CharacterAppearanceSetHeightModifiers(C);

	// Reload the canvas
	CharacterAppearanceBuildCanvas(C);
}

function DialogMenuButtonClick() {

	// Gets the current character and item
	/** The focused character */
	const C = CharacterGetCurrent();
	/** The focused item */
	const Item = InventoryGet(C, C.FocusGroup.Name);

	// Finds the current icon
	for (let I = 0; I < DialogMenuButton.length; I++) {
		if (MouseIn(1885 - I * 110, 15, 90, 90)) {

			// Exit Icon - Go back to the character dialog
			if (DialogMenuButton[I] == "Exit") {
				if (DialogItemPermissionMode) ChatRoomCharacterUpdate(Player);
				if (StruggleMinigameIsRunning())
					StruggleMinigameStop();
				else if (DialogStruggleSelectMinigame)
					DialogStruggleSelectMinigame = false;
				else
					DialogLeaveItemMenu();
				return true;
			}

			// Next Icon - Shows the next 12 items
			else if (DialogMenuButton[I] == "Next") {
				let contents = DialogActivityMode ? DialogActivity : DialogInventory;
				DialogInventoryOffset = DialogInventoryOffset + 12;
				if (DialogInventoryOffset >= contents.length) DialogInventoryOffset = 0;
				return true;
			}

			// Prev Icon - Shows the previous 12 items
			else if (DialogMenuButton[I] == "Prev") {
				let contents = DialogActivityMode ? DialogActivity : DialogInventory;
				DialogInventoryOffset = DialogInventoryOffset - 12;
				if (DialogInventoryOffset < 0) { DialogInventoryOffset = contents.length - ((contents.length % 12) == 0 ? 12 : contents.length % 12); }
				return true;
			}

			// Use Icon - Pops the item extension for the focused item
			else if ((DialogMenuButton[I] == "Use") && (Item != null)) {
				DialogExtendItem(Item);
				return true;
			}

			// Remote Icon - Pops the item extension
			else if ((DialogMenuButton[I] == "Remote") && DialogCanUseRemoteState(C, Item) === "Available") {
				DialogExtendItem(Item);
				return true;
			}

			// Cycle through the layers of restraints for the mouth
			else if (DialogMenuButton[I] == "ChangeLayersMouth") {
				/** @type {AssetGroupName} */
				var NewLayerName;
				if (C.FocusGroup.Name == "ItemMouth") NewLayerName = "ItemMouth2";
				if (C.FocusGroup.Name == "ItemMouth2") NewLayerName = "ItemMouth3";
				if (C.FocusGroup.Name == "ItemMouth3") NewLayerName = "ItemMouth";

				C.FocusGroup = /** @type {AssetItemGroup} */ (AssetGroupGet(C.AssetFamily, NewLayerName));
				DialogInventoryBuild(C);
				return true;
			}


			// Lock Icon - Rebuilds the inventory list with locking items
			else if ((DialogMenuButton[I] == "Lock") && (Item != null)) {
				if (DialogItemToLock == null) {
					if (InventoryDoesItemAllowLock(Item)) {
						DialogInventoryOffset = 0;
						DialogInventory = [];
						DialogItemToLock = Item;
						for (const item of Player.Inventory) {
							if (item.Asset != null && item.Asset.IsLock) {
								DialogInventoryAdd(C, item, false);
							}
						}
						DialogInventorySort();
						DialogMenuButtonBuild(C);
					}
				} else {
					DialogItemToLock = null;
					DialogInventoryBuild(C);
				}
				return true;
			}

			// Unlock Icon - If the item is padlocked, we immediately unlock.  If not, we start the struggle progress.
			else if ((DialogMenuButton[I] == "Unlock") && (Item != null)) {
				// Check that this is not one of the sticky-locked items
				if (C.FocusGroup.IsItem() && !InventoryItemHasEffect(Item, "Lock", false) && InventoryItemHasEffect(Item, "Lock", true) && (!C.IsPlayer() || C.CanInteract())) {
					InventoryUnlock(C, C.FocusGroup.Name);
					if (ChatRoomPublishAction(C, "ActionUnlock", Item, null)) {
						DialogLeave();
					} else {
						DialogInventoryBuild(C);
					}
				} else
					DialogStruggleStart(C, "ActionUnlock", Item, null);
				return true;
			}

			// Tigthen/Loosen Icon - Opens the sub menu
			else if (((DialogMenuButton[I] == "TightenLoosen")) && (Item != null)) {
				DialogSetTightenLoosenItem(Item);
				return true;
			}

			// Remove/Struggle Icon - Starts the struggling mini-game (can be impossible to complete)
			else if (["Remove", "Struggle", "Dismount", "Escape"].includes(DialogMenuButton[I]) && Item != null) {
				/** @type {DialogStruggleActionType} */
				let action = "ActionRemove";
				if (InventoryItemHasEffect(Item, "Lock"))
					action = "ActionUnlockAndRemove";
				else if (C.IsPlayer())
					action = /** @type {DialogStruggleActionType} */("Action" + DialogMenuButton[I]);
				DialogStruggleStart(C, action, Item, null);
				return true;
			}

			// PickLock Icon - Starts the lockpicking mini-game
			else if (((DialogMenuButton[I] == "PickLock")) && (Item != null)) {
				StruggleMinigameStart(C, "LockPick", Item, null, DialogStruggleStop);
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the player inspects a lock
			else if ((DialogMenuButton[I] == "InspectLock") && (Item != null)) {
				var Lock = InventoryGetLock(Item);
				if (Lock != null) DialogExtendItem(Lock, Item);
				return true;
			}

			// Color picker Icon - Starts the color picking, keeps the original color and shows it at the bottom
			else if (DialogMenuButton[I] == "ColorPick") {
				if (!Item) {
					ElementCreateInput("InputColor", "text", (DialogColorSelect != null) ? DialogColorSelect.toString() : "");
				} else {
					const originalColor = Item.Color;
					ItemColorLoad(C, Item, 1300, 25, 675, 950);
					ItemColorOnExit((save) => {
						DialogColor = null;
						if (save && !CommonColorsEqual(originalColor, Item.Color)) {
							if (C.ID == 0) ServerPlayerAppearanceSync();
							ChatRoomPublishAction(C, "ActionChangeColor", Object.assign({}, Item, { Color: originalColor }), Item);
						}
					});
				}
				DialogColor = "";
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user selects a color, applies it to the item
			else if (!Item && (DialogMenuButton[I] == "ColorSelect") && CommonIsColor(ElementValue("InputColor"))) {
				DialogColor = null;
				DialogColorSelect = ElementValue("InputColor");
				ElementRemove("InputColor");
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user cancels out of color picking, we recall the original color
			else if (!Item && DialogMenuButton[I] == "ColorCancel") {
				DialogColor = null;
				DialogColorSelect = null;
				ElementRemove("InputColor");
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user cancels out of lock menu, we recall the original color
			else if (Item && DialogMenuButton[I] == "LockCancel") {
				if (StruggleMinigameIsRunning())
					StruggleMinigameStop();
				DialogLockMenu = false;
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user selects the lock menu, we enter
			else if (Item && DialogMenuButton[I] == "LockMenu") {
				DialogLockMenu = true;
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user selects the lock menu, we enter
			else if (Item && DialogMenuButton[I] == "Crafting") {
				DialogCraftingMenu = true;
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user cancels out of lock menu, we recall the original color
			else if (Item && DialogMenuButton[I] == "CraftingCancel") {
				DialogCraftingMenu = false;
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the user wants to select a sexual activity to perform
			else if (DialogMenuButton[I] == "Activity") {
				DialogActivityMode = true;
				DialogMenuButton = [];
				DialogInventoryOffset = 0;
				DialogTextDefault = "";
				DialogTextDefaultTimer = 0;
				return true;
			}

			// When we enter item permission mode, we rebuild the inventory to set permissions
			else if (DialogMenuButton[I] == "DialogPermissionMode") {
				DialogItemPermissionMode = true;
				DialogItemToLock = null;
				DialogInventoryBuild(C);
				return true;
			}

			// When we leave item permission mode, we upload the changes for everyone in the room
			else if (DialogMenuButton[I] == "DialogNormalMode") {
				if (CurrentScreen == "ChatRoom") ChatRoomCharacterUpdate(Player);
				DialogItemPermissionMode = false;
				DialogInventoryBuild(C);
				return true;
			}
		}
	}

	return false;
}

function DialogClick() {

	// Gets the current character
	let C = CharacterGetCurrent();

	// If the user clicked the Up button, move the character up to the top of the screen
	if ((CurrentCharacter.HeightModifier < -90 || CurrentCharacter.HeightModifier > 30) && (CurrentCharacter.FocusGroup != null) && MouseIn(510, 50, 90, 90)) {
		CharacterAppearanceForceUpCharacter = CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber ? -1 : CurrentCharacter.MemberNumber;
		return;
	}


	// If the user wants to click on one of icons in the item menu
	if ((Player.FocusGroup || CurrentCharacter.FocusGroup && CurrentCharacter.AllowItem) && DialogIntro() != "") {
		if (DialogMenuButtonClick())
			return;
	}

	// Pass the click to the color panel
	if (DialogColor != null && C.FocusGroup && InventoryGet(C, C.FocusGroup.Name) && MouseIn(1300, 25, 675, 950)) {
		return ItemColorClick(C, C.FocusGroup.Name, 1200, 25, 775, 950, true);
	}

	// If the user clicked on the interaction character or herself, we check to build the item menu
	if ((CurrentCharacter.AllowItem || (MouseX < 500)) && MouseIn(0, 0, 1000, 1000) && ((CurrentCharacter.ID != 0) || (MouseX > 500)) && (DialogIntro() != "") && DialogAllowItemScreenException()) {
		DialogLeaveItemMenu(false);
		DialogLeaveFocusItem();
		if (DialogItemPermissionMode && C.ID !== (MouseX < 500 ? Player.ID : CurrentCharacter.ID)) {
			DialogItemPermissionMode = false;
		}
		C = (MouseX < 500) ? Player : CurrentCharacter;
		let X = MouseX < 500 ? 0 : 500;
		for (const Group of AssetGroup) {
			if (!Group.IsItem()) continue;
			const Zone = Group.Zone.find(Z => DialogClickedInZone(C, Z, 1, X, 0, C.HeightRatio));
			if (Zone) {
				C.FocusGroup = Group;
				DialogItemToLock = null;
				DialogFocusItem = null;
				DialogTightenLoosenItem = null;
				DialogInventoryBuild(C);
				DialogText = DialogTextDefault;
				break;
			}
		}
	}

	// If the user clicked anywhere outside the current character item zones, ensure the position is corrected
	if (CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber && ((MouseX < 500) || (MouseX > 1000) || (CurrentCharacter.FocusGroup == null))) {
		CharacterAppearanceForceUpCharacter = -1;
		CharacterRefresh(CurrentCharacter, false, false);
	}

	// In activity mode, we check if the user clicked on an activity box
	if (DialogActivityMode && (DialogColor == null) && ((Player.FocusGroup != null) || ((CurrentCharacter.FocusGroup != null) && CurrentCharacter.AllowItem))) {
		if ((MouseX >= 1000) && (MouseX <= 1975) && (MouseY >= 125) && (MouseY <= 1000)) {

			// For each activities in the list
			let X = 1000;
			let Y = 125;
			for (let A = DialogInventoryOffset; (A < DialogActivity.length) && (A < DialogInventoryOffset + 12); A++) {
				const act = DialogActivity[A];
				// If this specific activity is clicked, we run it
				if ((MouseX >= X) && (MouseX < X + 225) && (MouseY >= Y) && (MouseY < Y + 275)) {
					const type = (act.Item && act.Item.Property ? act.Item.Property.Type : null);
					if (!act.Blocked || act.Blocked === "limited" && InventoryCheckLimitedPermission(C, act.Item, type)) {
						if (C.IsNpc() && act.Item) {
							let Line = C.FocusGroup.Name + act.Item.Asset.DynamicName(Player);
							let D = DialogFind(C, Line, null, false);
							if (D != "") {
								C.CurrentDialog = D;
							}
						}
						IntroductionJobProgress("SubActivity", act.Activity.MaxProgress.toString(), true);
						if (act.Item && act.Item.Asset.Name === "ShockRemote") {
							let targetItem = InventoryGet(C, C.FocusGroup.Name);
							if (targetItem && targetItem.Property && typeof targetItem.Property.TriggerCount === "number") {
								targetItem.Property.TriggerCount++;
								ChatRoomCharacterItemUpdate(C, C.FocusGroup.Name);
							}
						}
						ActivityRun(C, act);
					}
					return;
				}

				// Change the X and Y position to get the next square
				X = X + 250;
				if (X > 1800) {
					X = 1000;
					Y = Y + 300;
				}

			}

			// Exits and do not validate any more clicks
			return;

		}
	}

	// In item menu mode VS text dialog mode
	if (((Player.FocusGroup != null) || ((CurrentCharacter.FocusGroup != null) && CurrentCharacter.AllowItem)) && (DialogIntro() != "")) {

		// If we must are in the extended menu of the item
		if (DialogTightenLoosenItem != null) {
			TightenLoosenItemClick();
		} else if (DialogFocusItem != null) {
			CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Click()");
		} else {

			// If the user wants to speed up the add / swap / remove progress
			if (MouseIn(1000, 200, 1000, 800) && (DialogStruggleSelectMinigame || StruggleMinigameIsRunning())) {
				if (StruggleMinigameIsRunning()) {
					StruggleMinigameClick();
					// Minigame handled the click
				} else {
					for (const [idx, [game, data]] of StruggleGetMinigames().entries()) {
						if (MouseIn(1387 + 300 * (idx - 1), 600, 225, 275) && data.DisablingCraftedProperty && !InventoryCraftPropertyIs(DialogStrugglePrevItem, data.DisablingCraftedProperty)) {
							StruggleMinigameStart(Player, game, DialogStrugglePrevItem, DialogStruggleNextItem, DialogStruggleStop);
							DialogMenuButtonBuild(C);
						}
					}
				}
				return;
			}

			// If the user clicks on one of the items
			if ((MouseX >= 1000) && (MouseX <= 1975) && (MouseY >= 125) && (MouseY <= 1000) && !DialogCraftingMenu && ((DialogItemPermissionMode && (Player.FocusGroup != null)) || (Player.CanInteract() && !InventoryGroupIsBlocked(C, null, true))) && !StruggleMinigameIsRunning() && (DialogColor == null)) {
				// For each items in the player inventory
				let X = 1000;
				let Y = 125;
				for (let I = DialogInventoryOffset; (I < DialogInventory.length) && (I < DialogInventoryOffset + 12); I++) {

					// If the item is clicked
					if ((MouseX >= X) && (MouseX < X + 225) && (MouseY >= Y) && (MouseY < Y + 275))
						if (DialogInventory[I].Asset.Enable || (DialogInventory[I].Asset.Extended && DialogInventory[I].Asset.OwnerOnly && CurrentCharacter.IsOwnedByPlayer())) {
							DialogItemClick(DialogInventory[I]);
							break;
						}

					// Change the X and Y position to get the next square
					X = X + 250;
					if (X > 1800) {
						X = 1000;
						Y = Y + 300;
					}

				}
			}
		}

	} else {

		// If we need to leave the dialog (only allowed when there's an entry point to the dialog, not in the middle of a conversation)
		if ((DialogIntro() != "") && (DialogIntro() != "NOEXIT") && (MouseX >= 1885) && (MouseX <= 1975) && (MouseY >= 25) && (MouseY <= 110))
			DialogLeave();

		// If the user clicked on a text dialog option, we trigger it
		if ((MouseX >= 1025) && (MouseX <= 1975) && (MouseY >= 100) && (MouseY <= 990) && (CurrentCharacter != null)) {
			var pos = 0;
			for (let D = 0; D < CurrentCharacter.Dialog.length; D++) {
				if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
					if ((MouseX >= 1025) && (MouseX <= 1975) && (MouseY >= 160 + pos * 105) && (MouseY <= 250 + pos * 105)) {
						// If the player is gagged, the answer will always be the same
						if (!Player.CanTalk()) CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PlayerGagged");
						else CurrentCharacter.CurrentDialog = CurrentCharacter.Dialog[D].Result;

						// A dialog option can change the conversation stage, show text or launch a custom function
						if ((Player.CanTalk() && CurrentCharacter.CanTalk()) || SpeechFullEmote(CurrentCharacter.Dialog[D].Option)) {
							CurrentCharacter.CurrentDialog = CurrentCharacter.Dialog[D].Result;
							if (CurrentCharacter.Dialog[D].NextStage != null) CurrentCharacter.Stage = CurrentCharacter.Dialog[D].NextStage;
							if (CurrentCharacter.Dialog[D].Function != null) CommonDynamicFunctionParams(CurrentCharacter.Dialog[D].Function);
						} else if ((CurrentCharacter.Dialog[D].Function != null) && (CurrentCharacter.Dialog[D].Function.trim() == "DialogLeave()"))
							DialogLeave();
						break;
					}
					pos++;
				}
			}
		}
	}

	// If the user clicked in the facial expression menu
	if ((CurrentCharacter != null) && (CurrentCharacter.ID == 0) && (MouseX >= 0) && (MouseX <= 500)) {
		if (MouseIn(420, 50, 90, 90) && DialogSelfMenuOptions.filter(SMO => SMO.IsAvailable()).length > 1) DialogFindNextSubMenu();
		if (!DialogSelfMenuSelected)
			DialogClickExpressionMenu();
		else
			DialogSelfMenuSelected.Click();
	}

}


waitFor(() => typeof GameVersion !== "undefined" && GameVersion !== "R0").then(() => {
    if (GameVersion === "R90Beta1") {
        console.log("MBS: BC R90Beta1 detected; applying R90Beta2 port-forward patches");
        MBS_MOD_API.hookFunction("CharacterAppearanceSortLayers", 11, (args, next) => {
            return CharacterAppearanceSortLayers(...args);
        });
    } else if (GameVersion === "R90Beta2") {
        console.log("MBS: BC R90Beta2 detected; applying R90Beta3 port-forward patch");
        MBS_MOD_API.hookFunction("InventoryLock", 11, (args, next) => {
            return InventoryLock(...args);
        });
        MBS_MOD_API.hookFunction("CharacterLoadCanvas", 11, (args, next) => {
            return CharacterLoadCanvas(...args);
        });
        MBS_MOD_API.hookFunction("DialogMenuButtonClick", 11, (args, next) => {
            return DialogMenuButtonClick(...args);
        });
        MBS_MOD_API.hookFunction("DialogClick", 11, (args, next) => {
            return DialogClick(...args);
        });
    }
});
