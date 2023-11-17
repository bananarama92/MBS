# MBS Changelog

## v1.0.1
* Drop support for BC R98
* Backport one BC R98 hotfix:
    - [BondageProjects/Bondage-College#4597](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4597): Fix a validation loop triggered by the love chastity belt

## v1.0.0
* Add full R98Beta1 support
* Added a button for clearing all MBS data

## v0.6.28
* Add preliminarily R98 support
* Formalize and expand the MBS API with `API_VERSION` and the `wheelOutfits` namespace

## v0.6.27
* Remove more R96 leftovers
* Fix a faulty check for the presence of LSCG

## v0.6.26
* Fix the parsing of outfit codes with extended items sometimes raising
* Refactor and deduplicate elements shared between `Settings` and `OnlineSharedSettings`
* Install BC-stubs via NPM rather than vendoring them
* Drop support for BC R97
* Special case LSCG item-specific keywords, allowing them in wheel of fortune crafted item descriptions

## v0.6.25
* Minor wheel of fortune performance improvement (requires BC R97Beta1 or later)
* Backport two R97Beta2 bug fixes to R97Beta1:
    - [BondageProjects/Bondage-College#4508](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4508): Fix items not being applicable anymore
    - [BondageProjects/Bondage-College#4509](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4509): Fix `CantChangeWhileLocked` stopping player-made changes to the crafting preview character when tied up

## v0.6.24
* Add support for BC R97Beta1
* Add the option to disallow wheel spins while restrained
* Made the wheel of fortune character preview more responsive (requires BC R97Beta1 or later)

## v0.6.23
* Use heavier MBS settings compression

## v0.6.22
* Optimize the amount of stored server-side data
* Crafted items applied by the wheel of fortune no longer have a description in order to save on data

## v0.6.21
* Add the option to forgo any locks when equipping fortune wheel item sets

## v0.6.20
* Drop support for BC R95
* Update the MBS URL's in the bookmark & *.user.js files with a cache bust.
* Backport two R97 bug fixes:
    - [BondageProjects/Bondage-College#4478](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4478): Fix a bunch issues related to the forbidden chastity belt and bra
    - [BondageProjects/Bondage-College#4475](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4475): Fix the crafting validation sometimes looking up the wrong asset

## v0.6.19
* Add support for BC R96Beta1

## v0.6.18
* Update type annotations for BC R95Beta1
* Increase the maximum number of wheel of fortune item sets and commands to 32

## v0.6.17
* Perform stricter validation of wheel of fortune embedded items
* Fix the wheel of fortune preview character failing to equip items if the player is enclosed

## v0.6.16
* Fix `PreferenceExit` not being called when opening the MBS preference screen

## v0.6.15
* Drop support for BC R95
* Fix a double call to `PreferenceLoad` when exiting the MBS settings screen

## v0.6.14
* Update for R94Beta3

## v0.6.13
* More crafting duplication fixes

## v0.6.12
* Add even more safeguards against crafting duplication

## v0.6.10
* Fix a bug that would cause crafting item duplication when upgrading from BC R93 to R94

## v0.6.9
* Adapt to BC R94Beta1 failing to actually increment its version

## v0.6.8
* Add full support for BC R94Beta1
* Increase the number of crafting slots from 100 to 160

## v0.6.7
* Ensure that ModSDK hooks always call `next()`
* Add basic support for BC R94Beta1
* Increase the max number of lines for crafted item descriptions to 7

## v0.6.6
* Fix an incompatibility between MBS settings screen and BCTweaks

## v0.6.5
* Update type annotations for BC R93
* Drop support for BC R92
* Added a basic MBS settings menu to the BC preferences
* Increase the maximum description length of crafted items from 100 to 200

## v0.6.4
* Update type annotations for BC R93Beta1
* Misc GitHub Actions workflow maintenance
* Backport two BC R93Beta2 bug fixes to R93Beta1
    - [BondageProjects/Bondage-College#4289](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4289): Remove the `TapedHands` entry from the `HideForPose` array of handheld items
    - [BondageProjects/Bondage-College#4290](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4290): Fix a hard-coded `IsOwnedByPlayer` check

## v0.6.3
* Add support for storing record-based `Item.OverridePriority` values
* Fix the bookmark loader URL

## v0.6.2
* Misc CI fixes

## v0.6.1
* Drop support for BC R91
* Do not send a version-update beep when installing MBS for the first time
* Overhauled the build artifact storage system
* Demand that at least one wheel of fortune lock flag is enabled
* Add support for saving futuristic training belt properties

## v0.6.0
* Allow the specification of custom timer lock durations for the wheel of fortune
* Reduced the number of exposed functions
* Backport two more BC R92Beta2 bug fixes to R92Beta1
    - [BondageProjects/Bondage-College#4204](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4204): Fix a crash with the color picker when on mobile
    - [BondageProjects/Bondage-College#4207](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4207): Fix subscreens not opening when the respective super-screen option was previously already selected

## v0.5.14
* Backport two BC R92Beta2 bug fixes to R92Beta1
    - [BondageProjects/Bondage-College#4202](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4202): Fix the high-sec and intricate locks not being unlockable
    - [BondageProjects/Bondage-College#4203](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4203): Make the two chastity shields block clit activities

## v0.5.13
* Full R92Beta1 support
* Various misc Github Actions related updates

## v0.5.12
* Preliminary R92Beta1 compatibility changes

## v0.5.11
* Add formal R91 support and drop R90 support
* Fix certain wheel checks being skipped if an item is added without replacement

## v0.5.10
* Update type annotations for R91Beta1
* Add a few minor R91Beta1 fixes

## v0.5.9
* Fix a bug that could cause MBS to crash if zero flags were selected for a particular fortune wheel item set.

## v0.5.8
* Backport even more BC R91 bug fixes
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4049
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4057
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4062

## v0.5.7
* Backport a number of BC R91 bug fixes
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4044
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4046
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4047
    - https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4048

## v0.5.6
* Drop support for R89
* Attach build artifacts whenever creating a new release
* Bump dev dependencies
* Add more conveniently typed variations of a few stdlib functions
* Misc improvements to the player settings parsing

## v0.5.5
* Revert the https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4030 port-forward patch.

## v0.5.4
* Port forward a few more BC R90Beta3 bug fixes to R90Beta2 (xref https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4030, https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4031 and https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4033)

## v0.5.3
* Port forward a BC R90Beta2 crash fix to R90Beta1 (xref https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/4023)
* Remove an unused function

## v0.5.2
* Fix the name of the `MiniGame` module
* Ensure that colors are always copied when creating items
* Update type annotations for BC R90Beta1
* Allow custom item sets to be specified via (serialized) single items in addition to item lists (for real this time...)

## v0.5.1
* Fix the "Missing outfit" error message not showing
* Allow custom item sets to be specified via (serialized) single items in addition to item lists

## v0.5.0
* Add a MBS test suite
* Drop BC R88 support
* Expand the BC .d.ts stub files with those autogenerated from BC
* Add custom classes for managing (sub-)screens
* Add the option to create custom wheel of fortune (RP) commands:
![Command example](docs/spin_command.png)

## v0.4.5
* Fix the `padArray` and `trimArray` logic; make them more lenient

## v0.4.4
* Properly respect items with the `Enclose` effect such as the futuristic create
* Do not attempt to wear clothes if one is wearing a clubsslave collar
* Allow `FortuneWheelOption.Script` to be used on arbitrary player- and simple characters

## v0.4.3
* Fix `Item.Craft` not being properly copied
* Further enforce the immutability of `FortuneWheelItem`

## v0.4.2
* Fixed a crash that could occur when BCX is not installed
* Fixed builtin MBS options not properly saving

## v0.4.1
* Consolidate and expand the BC validation
* Allow custom wheel of fortune item sets to store the `OverrideHeight` property
* Check for the BCX `alt_allow_changing_appearance` rule when determining whether cosplay items can be changed
* Add `lodash` as a dependency; remove `mapsort`
* Fix custom override priorities of the builtin MBS item sets
* Check whether an item is not blocked at the room level before equipping

## v0.4.0
* Place the `ITEM_SET_TYPE_DICT` and `MBSDummy` initialization behind a `waitFor` guard
* Split `common` into two modules
* Fix the previously broken `Version.beta` comparison
* Overhaul the ID assignment of custom item sets; make it more robust
* Add `mapsort` as a dependency
* Ensure that the previous item set is properly unregistered before saving a new one
* Fix a potential issue with the BC version comparison
* Resize the preview character for a better fit
* Up the number of custom item slots from 14 to 16

## v0.3.3
* Ensure that MBS does not throw literals as exceptions
* Fix the vibrator mode not being properly read for custom outfits
* Various fixes and improvements related to the futuristic vibrator
* Update `MBSSelect.currentFortuneWheelSets` when saving/removing wheel of fortune outfits

## v0.3.2
* Minor bugfixes related to interactions with people that lack MBS
* Make the inspection of other people's custom item sets a bit more robust

## v0.3.1
* Minor improvements to the README documentation
* Minor `pushMBSSettings` optimizations
* Raise whenever an unsupported BC version is detected
* Always check for `null` when performing `typeof ... "object"` checks

## v0.3.0
* Expand the list of padlocks that MBS can (potentially) remove, including support for BCX's `block_keyuse_self` rule
* Switch from LGPL3 to GPL3
* Up the priority of the `WheelFortuneLoad` and `WheelFortuneExit` hooks
* Try to unequip blocking restraints, even if their group does not intersect with the to-be equipped item set
* Fix the wheel of fortune item set preview using the incorrect item set list when viewing other players
* Fix the petrifcation wheel of fortune option occasionally failing to properly color the skin

## v0.2.3
* Ensure that crafting ID lists are joined via empty strings rather than commas

## v0.2.2
* Allow the viewing other people's wheel of fortune item set config
* Create a dedicated MBS changelog file
* Report the changelog whenever the MBS version is incremented

## v0.2.1
* Fix the first-time initialization of the MBS wheel of fortune settings

## v0.2.0
* Add the option to create custom wheel of fortune outfits
![Item set example](docs/config.png)

## v0.1.18
* Always disallow the wheel of fortune to remove owner-/lovers locked items,
  even when decoy restraints are used

## v0.1.17
* Add a new petrification-based wheel of fortune option
* Make the first-time initialization of MBS settings more robust

## v0.1.16
* Add bookmark-based installation instructions
* Ensure that the user.js scripts are also pushed to github pages
* Add MBS settings and cache the extra crafting items in the MBS settings
* Minor adjustments to the bondage maid outfit color and boots

## v0.1.15
* Do not set the member number for locks as this will cause the player to see its password
* Do not let the crafting check raise if the user does not own an item
* Only load MBS after BC is properly loaded

## v0.1.14
* Make specifying the strip level mandatory and expand on the available levels
* Add a new mummy outfit for the wheel of fortune
* Add a new bondage maid outfit for the wheel of fortune

## v0.1.13
* Fix the downloadURL of the user.js files
* Lower the priority of the futuristic harness
* Allow the removal of locked decoy restraints

## v0.1.12
* Use the player's member number rather than ID
* Check for the Lock effect rather than the presence of a lock

## v0.1.11
* Log it whenever a wheel of fortune item fails to equip
* Make the dev and normal `user.js` scripts more distinct
* Ensure that `playerNakedNoCosplay` modifies the appearance inplace

## v0.1.10
* Ensure that a assigned Typed item properties are copied

## v0.1.9
* Never strip the character of their cosplay items, regardless of permission settings
* Use the `Puzzling` crafting property with the High security PSO bondage wheel of fortune option

## v0.1.8
* Add additional wheel of fortune options based on the PSO (permanently sealed object) suit.
* Bump the number of available crafting slots from 40 to 100.
