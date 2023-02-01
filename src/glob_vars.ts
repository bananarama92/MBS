/** Structs with MBS-exclusive global variables */

"use strict";

/** Variables related to the `MBSFortuneWheel` screen */
export const MBSCustomize: {
    /** The selected item index within {@link MBSSettings.FortuneWheelSets} */
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
    currentFortuneWheelSets: null | readonly (null | import("common").WheelFortuneItemSet)[];
} = Object.seal({
    currentFortuneWheelSets: null,
});
