/** Module for managing the {@link window} exporting of MBS functions. */

"use strict";

import { waitFor } from "common";
import { settingsMBSLoaded } from "common_bc";

import * as common from "common";
import * as common_bc from "common_bc";
import * as sanity_checks from "sanity_checks";
import * as crafting from "crafting";
import * as equipper from "equipper";
import * as fortune_wheel_item_set from "fortune_wheel_item_set";
import * as fortune_wheel_command from "fortune_wheel_command";
import * as fortune_wheel_select from "fortune_wheel_select";
import * as fortune_wheel from "fortune_wheel";
import * as item_bundle from "item_bundle";
import * as settings from "settings";
import * as screen_abc from "screen_abc";
import * as testing from "testing";

import { FWItemSetScreen } from "fortune_wheel_item_set";
import { FWCommandScreen } from "fortune_wheel_command";
import { FWSelectScreen} from "fortune_wheel_select";

waitFor(settingsMBSLoaded).then(() => {
    const exportMBS = Object.freeze({
        common: Object.freeze(common),
        common_bc: Object.freeze(common_bc),
        crafting: Object.freeze(crafting),
        equipper: Object.freeze(equipper),
        fortune_wheel_item_set: Object.freeze(fortune_wheel_item_set),
        fortune_wheel_command: Object.freeze(fortune_wheel_command),
        fortune_wheel_select: Object.freeze(fortune_wheel_select),
        fortune_wheel: Object.freeze(fortune_wheel),
        item_bundle: Object.freeze(item_bundle),
        settings: Object.freeze(settings),
        screen_abc: Object.freeze(screen_abc),
        sanity_checks: Object.freeze(sanity_checks),
        testing: Object.freeze(testing),
        runTests: testing.runTests,
        MBS_VERSION: common.MBS_VERSION,
    });
    const backgrounds = {
        [`${FWItemSetScreen.screen}Background`]: `${FWItemSetScreen.background}`,
        [`${FWCommandScreen.screen}Background`]: `${FWCommandScreen.background}`,
        [`${FWSelectScreen.screen}Background`]: `${FWSelectScreen.background}`,
    };
    const w = <typeof window & typeof exportMBS & typeof backgrounds>window;
    Object.assign(w, backgrounds, { MBS: exportMBS });
});
