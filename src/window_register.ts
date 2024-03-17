/** Module for managing the {@link globalThis} exporting of MBS functions. */

import { waitFor } from "./common";
import { bcLoaded } from "./common_bc";
import { FWItemSetScreen, FWCommandScreen, FWSelectScreen, WheelPresetScreen } from "./fortune_wheel";
import { MBSPreferenceScreen, ResetScreen } from "./settings";

waitFor(bcLoaded).then(() => {
    const backgrounds = {
        [`${FWItemSetScreen.screen}Background`]: FWItemSetScreen.background,
        [`${FWCommandScreen.screen}Background`]: FWCommandScreen.background,
        [`${FWSelectScreen.screen}Background`]: FWSelectScreen.background,
        [`${MBSPreferenceScreen.screen}Background`]: MBSPreferenceScreen.background,
        [`${ResetScreen.screen}Background`]: ResetScreen.background,
        [`${WheelPresetScreen.screen}Background`]: WheelPresetScreen.background,
    } as const;
    const w = <typeof globalThis & typeof backgrounds>globalThis;
    Object.assign(w, backgrounds);
});
