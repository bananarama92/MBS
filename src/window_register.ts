/** Module for managing the {@link globalThis} exporting of MBS functions. */

"use strict";

import { waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";
import { FWItemSetScreen } from "fortune_wheel_item_set";
import { FWCommandScreen } from "fortune_wheel_command";
import { FWSelectScreen} from "fortune_wheel_select";
import { MBSPreferenceScreen } from "settings_screen";
import { ResetScreen } from "reset_screen";

waitFor(settingsMBSLoaded).then(() => {
    const backgrounds = {
        [`${FWItemSetScreen.screen}Background`]: FWItemSetScreen.background,
        [`${FWCommandScreen.screen}Background`]: FWCommandScreen.background,
        [`${FWSelectScreen.screen}Background`]: FWSelectScreen.background,
        [`${MBSPreferenceScreen.screen}Background`]: MBSPreferenceScreen.background,
        [`${ResetScreen.screen}Background`]: ResetScreen.background,
    } as const;
    const w = <typeof globalThis & typeof backgrounds>globalThis;
    Object.assign(w, backgrounds);
});
