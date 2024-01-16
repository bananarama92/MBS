import { MBS_MOD_API, waitFor, logger } from "../common";
import { NEW_ASSETS_VERSION, NewItemsScreen, MainHallProxy } from "./screen";

export { NewItemsScreen, NEW_ASSETS_VERSION };

waitFor(() => typeof MainCanvas !== "undefined").then(() => {
    logger.log("Initializing new item screen hooks");

    const mainHallState = new MainHallProxy();

    MBS_MOD_API.patchFunction("MainHallRun", {
        'DrawText(TextGet("OnlinePlayers") + " " + CurrentOnlinePlayers.toString(), 1740, 950, "White", "Black");':
            'DrawText(TextGet("OnlinePlayers") + " " + CurrentOnlinePlayers.toString(), 1630, 950, "White", "Black");',
    });

    MBS_MOD_API.hookFunction("MainHallRun", 0, (args, next) => {
        next(args);
        if (MainHallStartEventTimer == null && MainHallNextEventTimer == null) {
            DrawButton(1665, 900, 90, 90, "", "White", "Icons/Changelog.png", `MBS: Show new R${NEW_ASSETS_VERSION} items`);
        }
    });

    MBS_MOD_API.hookFunction("MainHallClick", 0, (args, next) => {
        if (MainHallStartEventTimer == null && MainHallNextEventTimer == null && MouseIn(1665, 900, 90, 90)) {
            const subScreen = new NewItemsScreen(mainHallState);
            mainHallState.children.set(subScreen.screen, subScreen);
            subScreen.load();
            return;
        }
        next(args);
    });
});
