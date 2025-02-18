import { MBS_MOD_API, logger } from "../common";
import { waitForBC } from "../common_bc";

import { convertToGagSpeak, GarbleOptions } from "./gag_speak";
import { json as garblingJSON } from "./json";

export { garblingJSON };

waitForBC("garbling", {
    async afterMBS() {
        logger.log("Initializing garbling module");

        // Pass the character along to `SpeechTransformGagGarble` as we need it for detecting ring gags
        MBS_MOD_API.patchFunction("SpeechTransformProcess", {
            "text = SpeechTransformGagGarble(text, intensity, ignoreOOC);":
                "text = SpeechTransformGagGarble(text, intensity, ignoreOOC, C);",
        });

        MBS_MOD_API.hookFunction("SpeechTransformGagGarble", 0, ([words, gagLevel, ignoreOOC, ...args], next) => {
            const character = (args as [C?: Character, ...args: unknown[]])[0];
            if (!gagLevel || !words || !Player.MBSSettings.AlternativeGarbling) {
                return next([words, gagLevel, ignoreOOC, ...args]);
            } else {
                const options: GarbleOptions.Base = {
                    dropChars: Player.MBSSettings.DropTrailing ? {} : undefined,
                    perSyllable: Player.MBSSettings.GarblePerSyllable,
                    fallback: next,
                    ignoreOOC,
                    character,
                };
                return convertToGagSpeak(words, gagLevel, options);
            }
        });
    },
});
