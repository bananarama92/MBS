/** Structs with MBS-exclusive global variables */

"use strict";

/** Variables related to the `MBSFortuneWheel` screen */
export const MBSCustomize: {
    /** The selected item index within one of the {@link MBSSelect} sets */
    selectedIndex: number,
    /** The preview character */
    preview: null | Character,
} = Object.seal({
    selectedIndex: 0,
    preview: null,
});

/** Variables related to the `MBSFortuneWheelSelect` screen */
export const MBSSelect: {
    /** The custom MBS fortune wheel item sets of {@link WheelFortuneCharacter} */
    FortuneWheelItemSets: null | (null | import("common_bc").WheelFortuneItemSet)[];
    /** The custom MBS fortune wheel command sets of {@link WheelFortuneCharacter} */
    FortuneWheelCommandSets: null | (null | import("common_bc").WheelFortuneCommandSet)[];
} = Object.seal({
    FortuneWheelItemSets: null,
    FortuneWheelCommandSets: null,
});
