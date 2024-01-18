/** Module for managing the {@link globalThis} exporting of MBS functions. */

import { waitFor } from "./common";
import { settingsMBSLoaded } from "./common_bc";
import { FWItemSetScreen, FWCommandScreen, FWSelectScreen, WheelPresetScreen } from "./fortune_wheel";
import { MBSPreferenceScreen, ResetScreen } from "./settings";
import { NewItemsScreen } from "./new_items_screen";

waitFor(settingsMBSLoaded).then(() => {
    const backgrounds = {
        [`${FWItemSetScreen.screen}Background`]: FWItemSetScreen.background,
        [`${FWCommandScreen.screen}Background`]: FWCommandScreen.background,
        [`${FWSelectScreen.screen}Background`]: FWSelectScreen.background,
        [`${MBSPreferenceScreen.screen}Background`]: MBSPreferenceScreen.background,
        [`${ResetScreen.screen}Background`]: ResetScreen.background,
        [`${NewItemsScreen.screen}Background`]: NewItemsScreen.background,
        [`${WheelPresetScreen.screen}Background`]: WheelPresetScreen.background,
    } as const;
    const w = <typeof globalThis & typeof backgrounds>globalThis;
    Object.assign(w, backgrounds);
});
