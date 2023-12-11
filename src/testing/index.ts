"use strict";

import { entries, logger } from "common";
import { settingsMBSLoaded } from "common_bc";
import * as testing_tools from "./testing_tools";
import * as test_common from "./test_common";
import * as test_common_bc from "./test_common_bc";
import * as test_fortune_wheel from "./test_fortune_wheel";

export { testing_tools, test_common, test_common_bc, test_fortune_wheel };

export const runTests: typeof mbs.runTests = function runTests() {
    if (!settingsMBSLoaded()) {
        logger.warn("MBS not fully loaded yet");
        return false;
    }

    const tests = {
        ...test_common,
        ...test_common_bc,
        ...test_fortune_wheel,
    };

    const excDict: Record<string, Error> = {};
    for (const [name, callback] of entries(tests)) {
        try {
            callback();
        } catch (error) {
            excDict[name] = <Error>error;
        }
    }

    const nFailures = Object.values(excDict).length;
    if (nFailures !== 0) {
        logger.warn(excDict);
        return false;
    } else {
        return true;
    }
};
