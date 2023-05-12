/** Module for managing the {@link window} exporting of MBS functions. */

"use strict";

import { waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";
import { FWItemSetScreen } from "fortune_wheel_item_set";
import { FWCommandScreen } from "fortune_wheel_command";
import { FWSelectScreen} from "fortune_wheel_select";

waitFor(settingsMBSLoaded).then(() => {
    const backgrounds = {
        [`${FWItemSetScreen.screen}Background`]: FWItemSetScreen.background,
        [`${FWCommandScreen.screen}Background`]: FWCommandScreen.background,
        [`${FWSelectScreen.screen}Background`]: FWSelectScreen.background,
    } as const;
    const w = <typeof window & typeof backgrounds>window;
    Object.assign(w, backgrounds);
});
