# MBS Changelog

## v0.3.1
* Minor improvements to the README documentation
* Minor `pushMBSSettings` optimizations
* Raise whenever an unsupported BC version is detected
* Always check for `null` when performing `typeof ... "object"` checks

## v0.3.0
* Expand the list of padlocks that MBS can (potentially) remove, including support for BCX's `block_keyuse_self` rule
* Switch from LGPL3 to GPL3
* Up the priority of the `WheelFortuneLoad` and `WheelFortuneExit` hooks
* Try to unequip blocking restraints, even if their group does not intersect with the to-be equiped item set
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
