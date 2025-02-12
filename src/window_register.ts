/** Module for managing the {@link globalThis} exporting of MBS functions. */

import { waitForBC } from "./common_bc";
import { FWItemSetScreen, FWCommandScreen, FWSelectScreen, WheelPresetScreen } from "./fortune_wheel";
import { MBSPreferenceScreen } from "./settings";

waitForBC("backgrounds", {
    async afterLoad() {
        const backgrounds = {
            [`${FWItemSetScreen.screen}Background`]: FWItemSetScreen.background,
            [`${FWCommandScreen.screen}Background`]: FWCommandScreen.background,
            [`${FWSelectScreen.screen}Background`]: FWSelectScreen.background,
            [`${MBSPreferenceScreen.screen}Background`]: MBSPreferenceScreen.background,
            [`${WheelPresetScreen.screen}Background`]: WheelPresetScreen.background,
        } as const;
        const w = globalThis as typeof globalThis & typeof backgrounds;
        Object.assign(w, backgrounds);
    },
});
